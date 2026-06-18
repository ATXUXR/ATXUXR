import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import {
  createServiceClient,
  isServiceClientConfigured,
} from "@/lib/supabase/service";
import { getResend, EMAIL_FROM, SITE_URL } from "@/lib/resend";
import { eventInviteHtml } from "@/lib/email-templates";
import type { CalendarEvent } from "@/lib/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_RECIPIENTS = 200;

const Input = z.object({
  eventId: z.string().min(1),
  subject: z.string().min(1).max(200),
  html: z.string().min(1).max(20_000),
  audience: z.enum(["all", "members", "list", "tags"]),
  tags: z.array(z.string().min(1)).optional(),
});

interface Recipient {
  email: string;
  name: string;
  signupId: string | null;
  memberId: string | null;
  unsubscribeToken: string | null;
}

interface DbEvent {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  where_: string;
  address: string | null;
  online_url: string | null;
  starts_at: string;
  ends_at: string | null;
}

async function requireAdmin() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { ok: false as const, status: 503, error: "Not configured" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in" };
  const { data: member } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!member?.admin)
    return { ok: false as const, status: 403, error: "Admins only" };
  return { ok: true as const };
}

function firstName(name: string | null | undefined, email: string): string {
  const n = (name || "").trim().split(/\s+/)[0];
  if (n) return n;
  const local = email.split("@")[0];
  return local.replace(/[._-]+.*/, "");
}

function backfillToken(): string {
  return crypto.randomBytes(18).toString("hex");
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  if (!isServiceClientConfigured()) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 503 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Input.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { eventId, subject, html, audience, tags } = parsed.data;

  const supabase = createServiceClient();

  // Load the event.
  const { data: ev } = await supabase
    .from("events")
    .select(
      "id, slug, title, description, where_, address, online_url, starts_at, ends_at",
    )
    .eq("id", eventId)
    .maybeSingle();
  if (!ev) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  const event = ev as DbEvent;

  // Build recipient list per audience, always excluding unsubscribed.
  const recipients: Recipient[] = [];
  const seen = new Set<string>();

  async function addSignups(filter: (q: ReturnType<typeof signupQuery>) => ReturnType<typeof signupQuery>) {
    const { data } = await filter(signupQuery());
    (data ?? []).forEach((s) => {
      const email = (s.email || "").toLowerCase().trim();
      if (!email || seen.has(email)) return;
      seen.add(email);
      recipients.push({
        email,
        name: s.name || s.first_name || "",
        signupId: s.id,
        memberId: null,
        unsubscribeToken: s.unsubscribe_token,
      });
    });
  }

  function signupQuery() {
    return supabase
      .from("signups")
      .select("id, name, first_name, email, unsubscribe_token, unsubscribed")
      .eq("unsubscribed", false);
  }

  if (audience === "list" || audience === "all") {
    await addSignups((q) => q);
  }
  if (audience === "tags") {
    if (!tags || tags.length === 0) {
      return NextResponse.json({ error: "Pick at least one tag" }, { status: 400 });
    }
    await addSignups((q) => q.overlaps("tags", tags));
  }
  if (audience === "members" || audience === "all") {
    const { data: members } = await supabase
      .from("members")
      .select("id, name, email");
    (members ?? []).forEach((m) => {
      const email = (m.email || "").toLowerCase().trim();
      if (!email || seen.has(email)) return;
      seen.add(email);
      recipients.push({
        email,
        name: m.name || "",
        signupId: null,
        memberId: m.id,
        unsubscribeToken: null,
      });
    });
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: "No recipients in that audience" }, { status: 400 });
  }
  if (recipients.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      {
        error: `Audience is ${recipients.length} people — capped at ${MAX_RECIPIENTS}. Narrow the tags first.`,
      },
      { status: 400 },
    );
  }

  // Create the parent emails row so we can attach all per-recipient sends.
  const { data: parentEmail } = await supabase
    .from("emails")
    .insert({
      to_address: `audience:${audience}${tags && tags.length ? `:[${tags.join(", ")}]` : ""} (~${recipients.length} recipients)`,
      subject,
      body: html,
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const resend = getResend();
  const calEvent: CalendarEvent & { url: string; onlineUrl: string | null } = {
    id: event.id,
    title: event.title,
    description: event.description || "",
    location: event.address || event.where_ || (event.online_url ? "Online" : ""),
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    url: `${SITE_URL}/events/${event.id}`,
    onlineUrl: event.online_url,
  };

  let sent = 0;
  let failed = 0;
  const sendRows: Array<Record<string, unknown>> = [];

  const tasks = recipients.map(async (r) => {
    const utm = crypto.randomBytes(6).toString("hex");
    let token = r.unsubscribeToken;
    if (!token && r.signupId) {
      token = backfillToken();
      await supabase
        .from("signups")
        .update({ unsubscribe_token: token })
        .eq("id", r.signupId);
    }
    const unsubscribeUrl = token
      ? `${SITE_URL}/unsubscribe?token=${encodeURIComponent(token)}`
      : `${SITE_URL}/unsubscribe`;
    const rsvpUrl = `${calEvent.url}?utm=${encodeURIComponent(utm)}`;
    const name = firstName(r.name, r.email);
    const personalizedHtml = html.replace(/\{\{\s*name\s*\}\}/gi, name);
    const finalHtml = eventInviteHtml(
      calEvent,
      r.name || "",
      unsubscribeUrl,
      rsvpUrl,
      personalizedHtml,
    );
    try {
      if (resend) {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: r.email,
          replyTo: "hello@atxuxr.com",
          subject,
          html: finalHtml,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
      } else {
        console.log("[event-invite] (no resend key) would send", { to: r.email, subject });
      }
      sent++;
      sendRows.push({
        email_id: parentEmail?.id ?? null,
        signup_id: r.signupId,
        member_id: r.memberId,
        to_address: r.email,
        campaign: "event-invite",
        utm,
      });
    } catch (e) {
      failed++;
      console.warn("[event-invite] send failed:", r.email, e);
    }
  });
  await Promise.allSettled(tasks);

  if (sendRows.length > 0) {
    await supabase.from("email_sends").insert(sendRows);
  }

  return NextResponse.json({ ok: true, sent, failed, recipientCount: recipients.length });
}
