import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, excerpt, body: content, tags, cover } = body;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Insert the post
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        title,
        excerpt,
        body: content,
        cover,
        tags: tags || [],
        author_id: user.id,
        status: "pending", // Posts are pending until approved by admin
      })
      .select()
      .single();

    if (error) {
      console.error("Post creation error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create post" },
        { status: 500 }
      );
    }

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("Post submission error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
