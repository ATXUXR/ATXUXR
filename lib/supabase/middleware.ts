import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Skip auth refresh entirely if env vars are missing — keeps local
  // `next dev` working before Supabase is wired up.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({ request });
  }

  // Use Edge-compatible middleware client (safe for Edge runtime)
  let response = NextResponse.next({ request });
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Touching the user refreshes the session cookie if needed.
  await supabase.auth.getUser();

  return response;
}
