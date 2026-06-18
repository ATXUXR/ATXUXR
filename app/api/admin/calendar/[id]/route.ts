import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  pillar: z
    .enum([
      "Probabilistic User Research",
      "Trust, Verification, and Safe Reliance",
      "Agentic and Anticipatory UX",
      "AI Economics and Value",
      "Research Craft in the AI Era",
    ])
    .optional(),
  post_type: z
    .enum(["original", "reflection", "industry", "academic"])
    .optional(),
  anchor_title: z.string().min(1).max(300).optional(),
  scheduled_date: z.string().nullable().optional(),
  marquee: z.boolean().optional(),
  status: z
    .enum([
      "planned",
      "drafting",
      "public-safe-review",
      "scheduled",
      "published",
    ])
    .optional(),
  source_files: z.array(z.string()).nullable().optional(),
  notes: z.string().nullable().optional(),
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
    .from("content_calendar")
    .update(parsed.data)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  const { id } = await ctx.params;
  const { error } = await gate.supabase
    .from("content_calendar")
    .delete()
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
