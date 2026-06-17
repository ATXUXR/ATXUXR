import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Input = z.object({
  text: z.string().min(1, "Write something").max(2000),
  name: z.string().min(1, "Add a name").max(120).optional(),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Input.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let memberName = parsed.data.name?.trim() || "Anonymous";
  if (user) {
    const { data: m } = await supabase
      .from("members")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    if (m?.name) memberName = m.name;
  } else if (!parsed.data.name?.trim()) {
    return NextResponse.json(
      { error: "Add a name to post as a guest." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: id,
      author_id: user?.id ?? null,
      name: memberName,
      text: parsed.data.text.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ comment: data });
}
