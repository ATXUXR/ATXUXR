import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, content, pillar, fromBlogSubmission } = await req.json();

    const { data: draft, error } = await supabase
      .from("calendar_drafts")
      .insert({
        title,
        content,
        pillar,
        status: "drafting",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { fromBlogSubmission },
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating draft:", error);
      return NextResponse.json({ error: "Failed to create draft" }, { status: 500 });
    }

    return NextResponse.json(draft);
  } catch (err) {
    console.error("Create draft error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
