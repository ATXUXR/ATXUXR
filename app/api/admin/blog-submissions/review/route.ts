import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createServiceClient,
  isServiceClientConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
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
  return { ok: true as const, supabase, userId: user.id };
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
  const { id, action, reason } = parsed.data;

  if (!isServiceClientConfigured()) {
    return NextResponse.json(
      { error: "Service role not configured" },
      { status: 503 }
    );
  }
  const service = createServiceClient();

  try {
    const update = {
      status: action === "approve" ? "approved" : "rejected",
      rejection_reason: action === "reject" ? reason || null : null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: gate.userId,
    };

    const { error } = await service
      .from("blog_submissions")
      .update(update)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
