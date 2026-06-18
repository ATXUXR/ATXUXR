import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PostSchema = z.object({
  pillar: z.enum([
    "Probabilistic User Research",
    "Trust, Verification, and Safe Reliance",
    "Agentic and Anticipatory UX",
    "AI Economics and Value",
    "Research Craft in the AI Era",
  ]),
  post_type: z.enum(["original", "reflection", "industry", "academic"]),
  anchor_title: z.string().min(1).max(300),
  scheduled_date: z.string().nullable().optional(),
  marquee: z.boolean().default(false),
  source_files: z.array(z.string()).optional(),
  notes: z.string().optional(),
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
  const parsed = PostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const { data: inserted, error } = await gate.supabase
    .from("content_calendar")
    .insert({
      pillar: data.pillar,
      post_type: data.post_type,
      anchor_title: data.anchor_title,
      scheduled_date: data.scheduled_date || null,
      marquee: data.marquee,
      source_files: data.source_files || null,
      notes: data.notes || null,
    })
    .select("id, marquee")
    .single();
  if (error || !inserted) {
    return NextResponse.json(
      { error: error?.message || "Insert failed" },
      { status: 400 },
    );
  }
  // Create empty drafts for the right channel set.
  const channels = inserted.marquee
    ? ["atxuxr", "linkedin", "medium", "slack", "instagram"]
    : ["atxuxr", "linkedin", "slack"];
  await gate.supabase
    .from("content_drafts")
    .insert(
      channels.map((channel) => ({
        calendar_id: inserted.id,
        channel,
        status: "todo",
      })),
    );
  return NextResponse.json({ ok: true, id: inserted.id });
}
