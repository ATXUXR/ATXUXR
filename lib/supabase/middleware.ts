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

  // In Edge runtime, we can't use Node.js Supabase helpers.
  // Auth refresh happens client-side via auth state listeners.
  // Just pass the request through with cookies intact.
  const response = NextResponse.next({ request });
  return response;
}
