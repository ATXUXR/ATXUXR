import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { ok: false as const, status: 503, error: "Not configured" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in" };
  const { data: member } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!member?.admin)
    return { ok: false as const, status: 403, error: "Admins only" };
  return { ok: true as const, supabase };
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ error: gate.error }, { status: gate.status });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const draftId = formData.get("draftId") as string;

    if (!file || !draftId) {
      return NextResponse.json(
        { error: "Missing file or draftId" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `calendar/${draftId}/${timestamp}.${ext}`;

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer();
    const { error: uploadErr } = await gate.supabase.storage
      .from("content")
      .upload(filename, Buffer.from(bytes), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      throw new Error(uploadErr.message);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = gate.supabase.storage.from("content").getPublicUrl(filename);

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
