import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accept a pending `posts` submission into the content queue as an editable
// draft (status 'drafting'). Does NOT publish. The original pending post is
// removed once its content has been copied into the draft.
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
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (postErr || !post)
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  const { data: draft, error: draftErr } = await supabase
    .from("calendar_drafts")
    .insert({
      title: post.title,
      main_content: post.body || "",
      notes: post.excerpt || null,
      pillar: post.pillar ? [post.pillar] : null,
      topics: Array.isArray(post.tags) ? post.tags : [],
      cover_image_url: post.cover || null,
      status: "drafting",
    })
    .select("id")
    .single();
  if (draftErr || !draft)
    return NextResponse.json(
      { error: draftErr?.message || "Failed to create draft" },
      { status: 400 },
    );

  // The submission's content now lives in the draft — remove the pending post.
  await supabase.from("posts").delete().eq("id", id);

  return NextResponse.json({ ok: true, draftId: draft.id });
}
