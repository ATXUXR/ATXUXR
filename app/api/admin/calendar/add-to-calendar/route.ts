import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { draftId, pillar, scheduledDate } = await req.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!draftId || !pillar || !scheduledDate) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { error: updateError } = await supabase
      .from("calendar_drafts")
      .update({ pillar, scheduled_date: scheduledDate, status: "scheduled" })
      .eq("id", draftId);

    if (updateError) {
      console.error("Error updating draft:", updateError);
      return NextResponse.json({ error: "Failed to schedule" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Add to calendar error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
