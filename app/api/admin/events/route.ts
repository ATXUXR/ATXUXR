import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EventInput = z.object({
  title: z.string().min(1).max(200),
  kind: z.enum(["CONNECT", "REFLECT", "LEARN"]),
  kind_label: z.string().max(80).optional().nullable(),
  description: z.string().max(8000).optional().default(""),
  where_: z.string().max(280).optional().default(""),
  address: z.string().max(280).optional().nullable(),
  online_url: z.string().url().max(500).optional().nullable(),
  image: z.string().url().max(500).optional().nullable(),
  starts_at: z.string().datetime({ offset: true }).or(z.string().min(1)),
  ends_at: z
    .string()
    .datetime({ offset: true })
    .or(z.string().min(1))
    .optional()
    .nullable(),
  status: z.enum(["open", "closed", "cancelled"]).default("open"),
  host_id: z.string().uuid().optional().nullable(),
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

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { supabase } = gate;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = EventInput.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const startsIso = new Date(data.starts_at).toISOString();
  const endsIso = data.ends_at ? new Date(data.ends_at).toISOString() : null;
  const slugBase = slugify(`${data.title}-${startsIso.slice(0, 10)}`);
  const where = data.address || (data.online_url ? "Online" : data.where_ || "");

  const { data: inserted, error } = await supabase
    .from("events")
    .insert({
      title: data.title,
      kind: data.kind,
      kind_label: data.kind_label || null,
      description: data.description || "",
      where_: where,
      address: data.address || null,
      online_url: data.online_url || null,
      image: data.image || null,
      starts_at: startsIso,
      ends_at: endsIso,
      status: data.status,
      host_id: data.host_id || null,
      slug: slugBase || null,
    })
    .select("id, slug")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: inserted.id, slug: inserted.slug });
}
