import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { postToSlack, slackWebhookConfigured } from "@/lib/slack";
import {
  defaultCaption,
  slackBlocks,
  type ShareChannel,
} from "@/lib/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ContentSchema = z.object({
  kind: z.enum(["event", "blog", "announcement"]),
  title: z.string().min(1).max(300),
  body: z.string().max(8000).optional().default(""),
  url: z.string().min(1).max(800),
  imageUrl: z.string().url().max(800).optional().nullable(),
  meta: z.string().max(300).optional(),
});

const PostSchema = z.object({
  content: ContentSchema,
  channel: z.enum([
    "slack-events",
    "slack-blog",
    "slack-general",
    "linkedin",
    "linkedin-group",
    "instagram",
  ]),
  caption: z.string().min(1).max(8000),
  /** Optional source id for logging (event id / post id). */
  sourceId: z.string().uuid().optional().nullable(),
});

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
  return { ok: true as const, supabase, userId: user.id };
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { supabase, userId } = gate;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { content, channel, caption, sourceId } = parsed.data;

  const isSlack = channel.startsWith("slack-");

  // For LinkedIn / Instagram, we don't actually post — the client opens the
  // share dialog or copies the caption. Just log the intent so the admin Share
  // History tab shows what they sent where.
  if (!isSlack) {
    await supabase.from("social_posts").insert({
      kind: content.kind,
      source_id: sourceId || null,
      channel,
      caption,
      status: "opened",
      created_by: userId,
    });
    return NextResponse.json({ ok: true, mode: "opened" });
  }

  // Slack: real send.
  if (!slackWebhookConfigured(channel as ShareChannel)) {
    await supabase.from("social_posts").insert({
      kind: content.kind,
      source_id: sourceId || null,
      channel,
      caption,
      status: "failed",
      error: `${channel} webhook is not configured (set the env var on Netlify)`,
      created_by: userId,
    });
    return NextResponse.json(
      { error: `${channel} webhook is not configured` },
      { status: 400 },
    );
  }

  try {
    const blocks = slackBlocks(content, caption || defaultCaption(content));
    await postToSlack(channel as ShareChannel, {
      text: caption,
      blocks,
      unfurl_links: false,
    });
    await supabase.from("social_posts").insert({
      kind: content.kind,
      source_id: sourceId || null,
      channel,
      caption,
      status: "sent",
      created_by: userId,
    });
    return NextResponse.json({ ok: true, mode: "sent" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase.from("social_posts").insert({
      kind: content.kind,
      source_id: sourceId || null,
      channel,
      caption,
      status: "failed",
      error: msg,
      created_by: userId,
    });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
