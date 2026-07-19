import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fields an admin may set/update on a calendar_draft. Only provided keys are
// written, so this one route handles editing content, tagging, moving through
// the status chips (drafting/ready/scheduled/published), and scheduling a date.
const FIELDS = [
  "title",
  "main_content",
  "pillar",
  "post_type",
  "notes",
  "scheduled_date",
  "scheduled_time",
  "cover_image_url",
  "topics",
  "status",
] as const;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .single();
  if (!member?.admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const payload: Record<string, unknown> = {};
  for (const f of FIELDS) {
    if (f in body && body[f] !== undefined) payload[f] = body[f];
  }

  // Update existing draft.
  if (body.id) {
    payload.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("calendar_drafts")
      .update(payload)
      .eq("id", body.id)
      .select()
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  // Create new draft (defaults to the 'drafting' chip).
  const { data, error } = await supabase
    .from("calendar_drafts")
    .insert({ status: "drafting", ...payload })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
