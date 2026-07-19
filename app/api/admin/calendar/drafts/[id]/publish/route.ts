import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publishCalendarDraft } from "@/lib/publish-draft";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in" }, { status: 401 });

  const { data: member } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!member?.admin)
    return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { id } = await params;
  try {
    const result = await publishCalendarDraft(supabase, id, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
