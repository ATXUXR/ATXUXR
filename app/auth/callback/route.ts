import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the OAuth callback (Google) — exchanges the auth code for a session,
// then sends the user to onboarding if their member row is `fresh`, otherwise home.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? null;

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=signin`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/?auth=signin&error=${encodeURIComponent(error.message)}`,
    );
  }

  // Look up the freshly-signed-in user's member row.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let redirectTo = next ?? "/";
  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("fresh")
      .eq("id", user.id)
      .maybeSingle();
    if (!member || member.fresh) {
      redirectTo = "/onboarding";
    }
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
