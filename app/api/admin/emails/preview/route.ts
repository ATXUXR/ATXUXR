import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { blastHtml } from "@/lib/email-templates";
import { SITE_URL } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  subject: z.string().max(200).default(""),
  body: z.string().max(20_000).default(""),
});

export async function POST(req: Request) {
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
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { subject, body } = parsed.data;
  const html = blastHtml(
    subject || "(no subject)",
    body || "<p style=\"color:#888\">Write your message…</p>",
    `${SITE_URL}/unsubscribe?token=PREVIEW`,
  );
  return new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
