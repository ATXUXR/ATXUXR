import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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
    id,
    title,
    main_content,
    pillar,
    post_type,
    notes,
    scheduled_date,
  } = body;

  // If updating existing draft
  if (id) {
    const { data, error } = await supabase
      .from("calendar_drafts")
      .update({
        title,
        main_content,
        pillar,
        post_type,
        notes,
        scheduled_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  }

  // Create new draft
  const { data, error } = await supabase
    .from("calendar_drafts")
    .insert({
      title,
      main_content,
      pillar,
      post_type,
      notes,
      scheduled_date,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
