import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { postId, newDate } = await req.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("calendar_drafts")
      .update({ scheduled_date: newDate, updated_at: new Date().toISOString() })
      .eq("id", postId);

    if (error) {
      console.error("Reschedule error:", error);
      return NextResponse.json({ error: "Failed to reschedule" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reschedule error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
