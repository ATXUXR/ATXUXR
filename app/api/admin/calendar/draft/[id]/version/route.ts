import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Check admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .single();

  if (!member?.admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    channel,
    enabled,
    content,
    image_url,
    image_prompt,
    generated_from_main,
    notes,
  } = body;

  // Get or create version
  const { data: existing } = await supabase
    .from("calendar_draft_versions")
    .select("id")
    .eq("draft_id", id)
    .eq("channel", channel)
    .single();

  let result;
  if (existing) {
    // Update existing version
    const { data, error } = await supabase
      .from("calendar_draft_versions")
      .update({
        enabled,
        content,
        image_url,
        image_prompt,
        generated_from_main,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("draft_id", id)
      .eq("channel", channel)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    result = data;
  } else {
    // Create new version
    const { data, error } = await supabase
      .from("calendar_draft_versions")
      .insert({
        draft_id: id,
        channel,
        enabled,
        content,
        image_url,
        image_prompt,
        generated_from_main: generated_from_main || false,
        notes,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    result = data;
  }

  return NextResponse.json(result);
}
