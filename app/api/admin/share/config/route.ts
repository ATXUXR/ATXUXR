import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { configuredSlackChannels } from "@/lib/slack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json({ slackChannels: [] });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in" }, { status: 401 });
  }
  const { data: member } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!member?.admin) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  return NextResponse.json({ slackChannels: configuredSlackChannels() });
}
