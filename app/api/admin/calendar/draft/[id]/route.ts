import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

  // Fetch draft with versions
  const { data: draft, error: draftError } = await supabase
    .from("calendar_drafts")
    .select("*")
    .eq("id", id)
    .single();

  if (draftError) {
    return NextResponse.json(
      { error: draftError.message },
      { status: 404 }
    );
  }

  const { data: versions, error: versionsError } = await supabase
    .from("calendar_draft_versions")
    .select("*")
    .eq("draft_id", id)
    .order("channel");

  if (versionsError) {
    return NextResponse.json(
      { error: versionsError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ...draft,
    versions: versions || [],
  });
}

export async function DELETE(
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

  const { error } = await supabase
    .from("calendar_drafts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
