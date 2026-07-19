import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accept a blog submission into the content queue as an editable draft.
// Does NOT publish — it creates a calendar_draft in 'drafting' seeded with the
// submitted content, and marks the submission approved so it leaves the queue.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in" }, { status: 401 });

  const { data: member } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!member?.admin)
    return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id } = await req.json();
  if (!id)
    return NextResponse.json({ error: "Missing submission id" }, { status: 400 });

  const { data: sub, error: subErr } = await supabase
    .from("blog_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (subErr || !sub)
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  const topics = sub.pillar ? [sub.pillar] : [];
  const { data: draft, error: draftErr } = await supabase
    .from("calendar_drafts")
    .insert({
      title: sub.title,
      main_content: sub.body_md || "",
      notes: sub.summary || null,
      pillar: sub.pillar ? [sub.pillar] : null,
      topics,
      status: "drafting",
    })
    .select("id")
    .single();
  if (draftErr || !draft)
    return NextResponse.json(
      { error: draftErr?.message || "Failed to create draft" },
      { status: 400 },
    );

  await supabase
    .from("blog_submissions")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ ok: true, draftId: draft.id });
}
