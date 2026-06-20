import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all drafts with their versions
    const { data: drafts, error } = await supabase
      .from("calendar_drafts")
      .select(
        `
        *,
        versions:calendar_draft_versions(*)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching drafts:", error);
      return NextResponse.json(
        { error: "Failed to fetch drafts" },
        { status: 500 }
      );
    }

    return NextResponse.json(drafts);
  } catch (err) {
    console.error("Drafts fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
