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
  marquee: z.boolean(),
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok)
    return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
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
  const { marquee } = parsed.data;

  if (!isServiceClientConfigured()) {
    return NextResponse.json(
      { error: "Service role not configured" },
      { status: 503 }
    );
  }
  const service = createServiceClient();

  try {
    if (marquee) {
      // Adding medium and instagram
      const { data: existing } = await service
        .from("content_drafts")
        .select("channel")
        .eq("calendar_id", id);
      const existingChannels = (existing || []).map((e: any) => e.channel);

      const toAdd = ["medium", "instagram"].filter(
        (ch) => !existingChannels.includes(ch)
      );

      if (toAdd.length > 0) {
        await service.from("content_drafts").insert(
          toAdd.map((channel) => ({
            calendar_id: id,
            channel,
            status: "todo",
          }))
        );
      }
    } else {
      // Removing medium and instagram
      await service
        .from("content_drafts")
        .delete()
        .eq("calendar_id", id)
        .in("channel", ["medium", "instagram"]);
    }

    // Fetch updated drafts
    const { data: drafts } = await service
      .from("content_drafts")
      .select("*")
      .eq("calendar_id", id);

    return NextResponse.json({ ok: true, drafts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
