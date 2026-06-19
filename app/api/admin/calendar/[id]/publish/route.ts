import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createServiceClient,
  isServiceClientConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

// Generate a URL-safe slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces to dashes
    .replace(/-+/g, "-") // collapse multiple dashes
    .slice(0, 100);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;

  if (!isServiceClientConfigured()) {
    return NextResponse.json(
      { error: "Service role not configured" },
      { status: 503 }
    );
  }
  const service = createServiceClient();

  try {
    // Fetch the calendar post
    const { data: calPost, error: fetchErr } = await service
      .from("content_calendar")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr || !calPost) {
      throw new Error("Calendar post not found");
    }

    // Fetch the canonical draft (atxuxr channel)
    const { data: drafts } = await service
      .from("content_drafts")
      .select("*")
      .eq("calendar_id", id)
      .eq("channel", "atxuxr");

    const canonicalDraft = drafts?.[0];
    if (!canonicalDraft?.body_md) {
      throw new Error("No content in canonical draft");
    }

    // Create blog post
    const slug = generateSlug(calPost.anchor_title);
    const { data: blogPost, error: insertErr } = await service
      .from("blog_posts")
      .insert({
        calendar_id: id,
        title: calPost.anchor_title,
        slug,
        body_md: canonicalDraft.body_md,
        summary: canonicalDraft.notes || null,
        author_id: gate.userId,
        featured_image_url: canonicalDraft.image_url || null,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertErr || !blogPost) {
      throw new Error(insertErr?.message || "Failed to create blog post");
    }

    // Mark calendar post as published
    await service
      .from("content_calendar")
      .update({
        status: "published",
        published_post_id: blogPost.id,
      })
      .eq("id", id);

    // Mark all drafts as published
    await service
      .from("content_drafts")
      .update({ status: "published" })
      .eq("calendar_id", id);

    return NextResponse.json({
      ok: true,
      blogPostId: blogPost.id,
      url: `/blog/${slug}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
