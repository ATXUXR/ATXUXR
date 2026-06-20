import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Publish the post (move from under_consideration to published)
    const { data: post, error } = await supabase
      .from("posts")
      .update({ status: "published" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Publish error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to publish post" },
        { status: 500 }
      );
    }

    return NextResponse.json(post);
  } catch (err) {
    console.error("Publish endpoint error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
