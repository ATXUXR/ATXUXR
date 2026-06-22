import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, excerpt, body: content, tags, cover, status } = body;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: member } = await supabase
      .from("members")
      .select("admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!member?.admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update object, only include provided fields
    const updateObj: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateObj.title = title;
    if (excerpt !== undefined) updateObj.excerpt = excerpt;
    if (content !== undefined) updateObj.body = content;
    if (cover !== undefined) updateObj.cover = cover;
    if (tags !== undefined) updateObj.tags = tags || [];
    if (status !== undefined) updateObj.status = status;

    // Update the post
    const { data: post, error } = await supabase
      .from("posts")
      .update(updateObj)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Post update error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update post" },
        { status: 500 }
      );
    }

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post, { status: 200 });
  } catch (err) {
    console.error("Post update error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
