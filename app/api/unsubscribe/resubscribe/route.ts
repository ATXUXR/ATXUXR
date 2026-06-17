import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createServiceClient,
  isServiceClientConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Input = z.object({
  token: z.string().min(8).max(120),
});

export async function POST(request: Request) {
  if (!isServiceClientConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: signup } = await supabase
    .from("signups")
    .select("id, tags")
    .eq("unsubscribe_token", parsed.data.token)
    .maybeSingle();
  if (!signup) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }
  const nextTags = (signup.tags ?? []).filter(
    (t: string) => t !== "unsubscribed",
  );
  const { error } = await supabase
    .from("signups")
    .update({
      unsubscribed: false,
      unsubscribed_at: null,
      tags: nextTags,
    })
    .eq("id", signup.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
