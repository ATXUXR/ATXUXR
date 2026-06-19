import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateImage } from "@/lib/image-generation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  prompt: z.string().min(10).max(2000),
  draftId: z.string().uuid(),
});

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

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { prompt, draftId } = parsed.data;

  try {
    // Generate image
    console.log(`Generating image from prompt: ${prompt.slice(0, 50)}...`);
    const { url: generatedUrl } = await generateImage(prompt);

    // Download the generated image
    const imageResponse = await fetch(generatedUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download generated image");
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const filename = `calendar/${draftId}/${timestamp}-generated.jpg`;

    const { error: uploadErr } = await gate.supabase.storage
      .from("content")
      .upload(filename, Buffer.from(imageBuffer), {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadErr) {
      throw new Error(`Upload failed: ${uploadErr.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = gate.supabase.storage.from("content").getPublicUrl(filename);

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Image generation error:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
