import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  title: z.string().min(1).max(300),
  body_md: z.string().min(100).max(20000),
  summary: z.string().max(500).nullable().optional(),
  pillar: z.string().optional(),
});

export async function POST(req: Request) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

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

  const { title, body_md, summary, pillar } = parsed.data;

  try {
    const { data, error } = await supabase.from("blog_submissions").insert({
      member_id: user.id,
      title,
      body_md,
      summary: summary || null,
      pillar: pillar || null,
      status: "pending",
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
