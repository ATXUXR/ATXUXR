import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { id, action, reason } = await request.json();
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update post status based on action
    let newStatus = "pending";
    if (action === "approve") {
      newStatus = "under_consideration"; // Move to backlog, not published
    } else if (action === "reject") {
      newStatus = "rejected";
    }

    const { data: post, error } = await supabase
      .from("posts")
      .update({ 
        status: newStatus,
        ...(action === "reject" && { rejection_reason: reason })
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Review error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to review post" },
        { status: 500 }
      );
    }

    return NextResponse.json(post);
  } catch (err) {
    console.error("Review endpoint error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
