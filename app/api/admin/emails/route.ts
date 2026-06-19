import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createServiceClient,
  isServiceClientConfigured,
} from "@/lib/supabase/service";
import { getResend, EMAIL_FROM, SITE_URL } from "@/lib/resend";
import { blastHtml } from "@/lib/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Input = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(20_000),
  audience: z.enum(["all", "members", "list", "tags"]),
  tags: z.array(z.string().min(1)).optional(),
  /** When true, render but don't actually send — useful for preview / dry-run. */
  dryRun: z.boolean().optional().default(false),
});

interface Recipient {
  email: string;
  name: string | null;
  signupId: string | null;
  unsubscribeToken: string | null;
}

export async function POST(req: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { data: me } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.admin) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Input.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { subject, body, audience, tags, dryRun } = parsed.data;

  // Resolve the recipient list using the service-role client so we can read
  // unsubscribe tokens (RLS would block the anon client).
  if (!isServiceClientConfigured()) {
    return NextResponse.json(
      { error: "Supabase service role not configured — set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }
  const service = createServiceClient();

  const recipients = new Map<string, Recipient>();
  const addSignup = (r: {
    email: string;
    name: string | null;
    id: string;
    unsubscribe_token: string | null;
    unsubscribed: boolean;
    tags: string[] | null;
  }) => {
    if (!r.email) return;
    if (r.unsubscribed) return;
    if ((r.tags || []).includes("unsubscribed")) return;
    const k = r.email.toLowerCase();
    if (recipients.has(k)) return;
    recipients.set(k, {
      email: r.email,
      name: r.name,
      signupId: r.id,
      unsubscribeToken: r.unsubscribe_token,
    });
  };
  const addMember = (m: { email: string; name: string | null }) => {
    if (!m.email) return;
    const k = m.email.toLowerCase();
    if (recipients.has(k)) return;
    recipients.set(k, {
      email: m.email,
      name: m.name,
      signupId: null,
      unsubscribeToken: null,
    });
  };

  if (audience === "all") {
    const [{ data: members }, { data: signups }] = await Promise.all([
      service.from("members").select("email, name"),
      service
        .from("signups")
        .select("id, email, name, unsubscribe_token, unsubscribed, tags"),
    ]);
    (members ?? []).forEach((m) => addMember(m as { email: string; name: string | null }));
    (signups ?? []).forEach((s) =>
      addSignup(s as Parameters<typeof addSignup>[0]),
    );
  } else if (audience === "members") {
    const { data } = await service.from("members").select("email, name");
    (data ?? []).forEach((m) => addMember(m as { email: string; name: string | null }));
  } else if (audience === "list") {
    const { data } = await service
      .from("signups")
      .select("id, email, name, unsubscribe_token, unsubscribed, tags");
    (data ?? []).forEach((s) => addSignup(s as Parameters<typeof addSignup>[0]));
  } else if (audience === "tags") {
    if (!tags || tags.length === 0) {
      return NextResponse.json(
        { error: "Pick at least one tag" },
        { status: 400 },
      );
    }
    const { data } = await service
      .from("signups")
      .select("id, email, name, unsubscribe_token, unsubscribed, tags")
      .overlaps("tags", tags);
    (data ?? []).forEach((s) => addSignup(s as Parameters<typeof addSignup>[0]));
  }

  const recipientCount = recipients.size;

  // Dry-run: don't actually send. Just return the count + a sample of who we'd send to.
  if (dryRun) {
    return NextResponse.json({
      ok: true,
      mode: "dry-run",
      recipientCount,
      sample: Array.from(recipients.values()).slice(0, 5).map((r) => r.email),
    });
  }

  if (recipientCount === 0) {
    return NextResponse.json(
      { error: "No recipients matched that audience." },
      { status: 400 },
    );
  }

  // Send via Resend. Best-effort per recipient — failures are logged as
  // individual rows in the emails table with the reason.
  const resend = getResend();
  if (!resend) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not set on the server." },
      { status: 503 },
    );
  }

  let sent = 0;
  let failed = 0;
  const audienceLabel =
    audience === "tags" ? `tags:[${(tags || []).join(", ")}]` : audience;

  for (const r of recipients.values()) {
    const unsubscribeUrl = r.unsubscribeToken
      ? `${SITE_URL}/unsubscribe?token=${encodeURIComponent(r.unsubscribeToken)}`
      : `${SITE_URL}/unsubscribe`;
    const html = blastHtml(subject, body, unsubscribeUrl);
    try {
      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: r.email,
        replyTo: "hello@atxuxr.com",
        subject,
        html,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      if (result.error) {
        failed++;
        await service.from("emails").insert({
          to_address: r.email,
          subject,
          body: `Resend error: ${result.error.message || JSON.stringify(result.error)}`,
          status: "failed",
        });
      } else {
        sent++;
        await service.from("emails").insert({
          to_address: r.email,
          subject,
          body: html,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      await service.from("emails").insert({
        to_address: r.email,
        subject,
        body: `Send threw: ${msg}`,
        status: "failed",
      });
    }
  }

  // One summary row so the admin sees the blast at a glance in the log.
  await service.from("emails").insert({
    to_address: `audience:${audienceLabel} (${recipientCount} recipients)`,
    subject: `[BLAST] ${subject}`,
    body: blastHtml(subject, body, `${SITE_URL}/unsubscribe`),
    status: failed === 0 ? "sent" : failed === recipientCount ? "failed" : "sent",
    sent_at: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    recipientCount,
    sent,
    failed,
  });
}
