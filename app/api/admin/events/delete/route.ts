import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: member } = await supabase.from("members").select("admin").eq("id", user.id).maybeSingle();
    if (!member?.admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { eventId } = await req.json();
    if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
