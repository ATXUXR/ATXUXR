import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  status: z.enum(["todo", "drafting", "ready", "published"]).optional(),
  body_md: z.string().nullable().optional(),
  image_prompt: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
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

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { error } = await gate.supabase
    .from("content_drafts")
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
