import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EventPatch = z.object({
  title: z.string().min(1).max(200).optional(),
  kind: z.enum(["CONNECT", "REFLECT", "LEARN"]).optional(),
  kind_label: z.string().max(80).optional().nullable(),
  description: z.string().max(8000).optional(),
  where_: z.string().max(280).optional(),
  address: z.string().max(280).optional().nullable(),
  online_url: z.string().url().max(500).optional().nullable(),
  image: z.string().url().max(500).optional().nullable(),
  starts_at: z
    .string()
    .datetime({ offset: true })
    .or(z.string().min(1))
    .optional(),
  ends_at: z
    .string()
    .datetime({ offset: true })
    .or(z.string().min(1))
    .optional()
    .nullable(),
  status: z.enum(["open", "closed"]).optional(),
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
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { supabase } = gate;
  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = EventPatch.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const patch: Record<string, unknown> = { ...parsed.data };
  if (patch.starts_at) {
    patch.starts_at = new Date(patch.starts_at as string).toISOString();
  }
  if (patch.ends_at) {
    patch.ends_at = new Date(patch.ends_at as string).toISOString();
  }
  // If only address changed, mirror into where_ so the EventRow still has
  // something to show.
  if (
    typeof patch.address === "string" &&
    patch.address &&
    patch.where_ === undefined
  ) {
    patch.where_ = patch.address;
  }
  const { error } = await supabase.from("events").update(patch).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { supabase } = gate;
  const { id } = await ctx.params;
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
