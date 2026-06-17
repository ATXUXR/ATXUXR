import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";

// Always run on Node (we need node:crypto + the service role key in env).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TrackBody {
  kind?: "pageview" | "event";
  session_id?: string;
  path?: string;
  referrer?: string | null;
  device?: string | null;
  label?: string | null;
  meta?: Record<string, unknown> | null;
  duration_ms?: number | null;
  event_kind?: string | null; // for kind === 'event'
}

const BOT_RE = /bot|crawler|spider|preview|monitor|lighthouse|headless|fetch|node|axios|insomnia|postman|curl/i;
const MOBILE_RE = /(iphone|android.+mobile|windows phone|ipod|blackberry|opera mini|opera mobi|webos)/i;
const TABLET_RE = /(ipad|android(?!.*mobile)|tablet|kindle|silk|playbook)/i;

function detectDevice(ua: string | null | undefined): "desktop" | "mobile" | "tablet" {
  if (!ua) return "desktop";
  if (TABLET_RE.test(ua)) return "tablet";
  if (MOBILE_RE.test(ua)) return "mobile";
  return "desktop";
}

function bucketSource(referrer: string | null | undefined, host: string | null): string {
  if (!referrer) return "direct";
  let h = "";
  try {
    h = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "direct";
  }
  if (!h) return "direct";
  if (host && (h === host || h.endsWith("." + host) || host.endsWith("." + h))) {
    return "direct";
  }
  if (h.includes("linkedin")) return "linkedin";
  if (/^(www\.)?google\./.test(h) || h.endsWith(".google.com")) return "google";
  if (h === "twitter.com" || h === "x.com" || h === "t.co" || h.endsWith(".twitter.com") || h.endsWith(".x.com")) return "twitter";
  if (h.includes("instagram")) return "instagram";
  if (h.includes("facebook") || h === "l.facebook.com" || h === "lm.facebook.com") return "facebook";
  if (h.includes("bing")) return "bing";
  if (h.includes("duckduckgo")) return "duckduckgo";
  if (h.includes("reddit")) return "reddit";
  if (h.includes("github")) return "github";
  if (h.startsWith("www.")) h = h.slice(4);
  return h;
}

function parseNetlifyGeo(header: string | null): { country: string | null; region: string | null } {
  if (!header) return { country: null, region: null };
  try {
    // x-nf-geo is base64-encoded JSON in production; in some environments it's raw JSON.
    let raw = header;
    if (!header.trim().startsWith("{")) {
      try {
        raw = Buffer.from(header, "base64").toString("utf8");
      } catch {
        raw = header;
      }
    }
    const json = JSON.parse(raw);
    const country: string | null =
      (json?.country?.code as string) ||
      (json?.country?.iso_code as string) ||
      (typeof json?.country === "string" ? json.country : null) ||
      null;
    const region: string | null =
      (json?.subdivision?.code as string) ||
      (json?.subdivision?.iso_code as string) ||
      (typeof json?.subdivision === "string" ? json.subdivision : null) ||
      null;
    return {
      country: country ? country.toUpperCase().slice(0, 2) : null,
      region: region ? region.toUpperCase().slice(0, 6) : null,
    };
  } catch {
    return { country: null, region: null };
  }
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  // NOTE: ideally TELEMETRY_SALT is set as an env var. If it isn't, we
  // derive a stable-but-discoverable fallback so prod still works without
  // extra config — a real salt is safer though.
  const salt =
    process.env.TELEMETRY_SALT ||
    `unsalted-${process.env.NEXT_PUBLIC_SUPABASE_URL || "atxuxr"}`;
  return crypto.createHash("sha256").update(salt + ip).digest("hex");
}

function clientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

function noStore<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "cache-control": "no-store, no-cache, must-revalidate",
      "x-robots-tag": "noindex",
    },
  });
}

export async function POST(req: NextRequest) {
  let body: TrackBody = {};
  try {
    body = (await req.json()) as TrackBody;
  } catch {
    // sendBeacon can deliver text/plain; try text fallback
    try {
      const txt = await req.text();
      if (txt) body = JSON.parse(txt) as TrackBody;
    } catch {
      // ignore
    }
  }

  const ua = req.headers.get("user-agent");
  // Bot filter — answer cheerfully so the client doesn't retry.
  if (ua && BOT_RE.test(ua)) {
    return noStore({ ok: true, skipped: "bot" });
  }

  if (!body || !body.session_id || !body.path) {
    return noStore({ ok: true, skipped: "invalid" });
  }
  if (body.path.startsWith("/api/")) {
    return noStore({ ok: true, skipped: "api" });
  }

  if (!isServiceClientConfigured()) {
    // No Supabase configured — silently accept so the client never sees an error.
    return noStore({ ok: true, skipped: "no-db" });
  }

  const supabase = createServiceClient();
  const host = req.headers.get("host") || null;
  const device = body.device || detectDevice(ua);
  const ip = clientIp(req);
  const ip_hash = hashIp(ip);
  const { country, region } = parseNetlifyGeo(req.headers.get("x-nf-geo"));

  try {
    if ((body.kind ?? "pageview") === "pageview") {
      const source = bucketSource(body.referrer, host);
      const { error } = await supabase.from("page_views").insert({
        session_id: body.session_id,
        path: body.path.slice(0, 500),
        referrer: body.referrer ? body.referrer.slice(0, 500) : null,
        source,
        device,
        country,
        region,
        ip_hash,
        duration_ms: typeof body.duration_ms === "number" ? body.duration_ms : null,
      });
      if (error) {
        console.warn("[track] page_views insert failed:", error.message);
      }
    } else {
      const { error } = await supabase.from("behavior_events").insert({
        session_id: body.session_id,
        kind: (body.event_kind || body.label || "event").toString().slice(0, 60),
        label: body.label ? body.label.slice(0, 200) : null,
        path: body.path.slice(0, 500),
        meta: body.meta ?? null,
      });
      if (error) {
        console.warn("[track] behavior_events insert failed:", error.message);
      }
    }
  } catch (err) {
    console.warn("[track] unexpected error:", err);
  }

  return noStore({ ok: true });
}

export async function GET() {
  return noStore({ ok: true, hint: "POST telemetry payloads here." });
}
