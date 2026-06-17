import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sanitizeBody } from "@/lib/sanitize";
import { readMinutes, wordCount } from "@/lib/utils";

const PostInput = z.object({
  title: z.string().min(1, "Title is required").max(200),
  excerpt: z.string().min(1, "Summary is required").max(400),
  body: z.string().min(1, "Body is required"),
  tags: z.array(z.string().min(1).max(60)).max(8).default([]),
  cover: z.string().url().nullable().optional(),
});

export async function POST(req: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = PostInput.safeParse(json);
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
  if (!user) {
    return NextResponse.json({ error: "Sign in to contribute" }, { status: 401 });
  }

  const cleanBody = sanitizeBody(parsed.data.body);
  if (wordCount(cleanBody) < 20) {
    return NextResponse.json(
      { error: "Write a bit more before submitting (at least ~20 words)." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      title: parsed.data.title.trim(),
      excerpt: parsed.data.excerpt.trim(),
      body: cleanBody,
      tags: parsed.data.tags,
      cover: parsed.data.cover ?? null,
      read_mins: readMinutes(cleanBody),
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ post: data });
}
