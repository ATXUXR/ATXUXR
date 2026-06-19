import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createServiceClient,
  isServiceClientConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  id: z.string().uuid(),
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
  return { ok: true as const, supabase };
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ error: gate.error }, { status: gate.status });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { id } = parsed.data;

  if (!isServiceClientConfigured()) {
    return NextResponse.json(
      { error: "Service role not configured" },
      { status: 503 }
    );
  }
  const service = createServiceClient();

  try {
    // Fetch the blog submission
    const { data: submission, error: fetchErr } = await service
      .from("blog_submissions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !submission || submission.status !== "approved") {
      throw new Error("Submission not found or not approved");
    }

    // Create calendar post
    const { data: calendarPost, error: insertErr } = await service
      .from("content_calendar")
      .insert({
        pillar: submission.pillar || "Probabilistic User Research",
        post_type: "original",
        anchor_title: submission.title,
        status: "drafting",
        marquee: false,
      })
      .select("id")
      .single();

    if (insertErr || !calendarPost) {
      throw new Error(insertErr?.message || "Failed to create calendar post");
    }

    // Create empty drafts for regular channels (atxuxr, linkedin, slack)
    await service.from("content_drafts").insert([
      { calendar_id: calendarPost.id, channel: "atxuxr", status: "drafting", body_md: submission.body_md },
      { calendar_id: calendarPost.id, channel: "linkedin", status: "todo" },
      { calendar_id: calendarPost.id, channel: "slack", status: "todo" },
    ]);

    return NextResponse.json({ ok: true, calendarPostId: calendarPost.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
