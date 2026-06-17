import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Input = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10_000),
  audience: z.enum(["all", "members", "list", "tags"]),
  tags: z.array(z.string().min(1)).optional(),
});

export async function POST(req: NextRequest) {
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
  if (!user) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { data: me } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.admin) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Input.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { audience, tags } = parsed.data;

  // Resolve the recipient list.
  let recipientCount = 0;
  let audienceLabel = audience as string;
  if (audience === "members") {
    const { count } = await supabase
      .from("members")
      .select("id", { count: "exact", head: true });
    recipientCount = count ?? 0;
  } else if (audience === "list") {
    const { count } = await supabase
      .from("signups")
      .select("id", { count: "exact", head: true });
    recipientCount = count ?? 0;
  } else if (audience === "tags") {
    if (!tags || tags.length === 0) {
      return NextResponse.json(
        { error: "Pick at least one tag" },
        { status: 400 },
      );
    }
    // Anyone with ANY of the selected tags (logical OR).
    const { count } = await supabase
      .from("signups")
      .select("id", { count: "exact", head: true })
      .overlaps("tags", tags);
    recipientCount = count ?? 0;
    audienceLabel = `tags:[${tags.join(", ")}]`;
  } else {
    const [members, signups] = await Promise.all([
      supabase.from("members").select("id", { count: "exact", head: true }),
      supabase.from("signups").select("id", { count: "exact", head: true }),
    ]);
    recipientCount = (members.count ?? 0) + (signups.count ?? 0);
  }

  // No real delivery yet — write a queued row so the admin sees it in the outbox.
  // `to_address` carries the audience label since this is a blast, not a single recipient.
  const { error } = await supabase.from("emails").insert({
    to_address: `audience:${audienceLabel} (~${recipientCount} recipients)`,
    subject: parsed.data.subject.trim(),
    body: parsed.data.body.trim(),
    status: "queued",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, recipientCount });
}
