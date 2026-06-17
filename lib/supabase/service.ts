import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. NEVER import this from a client component.
 * It bypasses RLS, so it should only be used in server-only files
 * (API route handlers, server actions, or `app/.../route.ts`).
 *
 * Falls back to anon key if SUPABASE_SERVICE_ROLE_KEY isn't set — that
 * keeps `npm run build` green pre-Supabase-setup, but at runtime the
 * caller's RLS will apply (which is fine for telemetry inserts since we
 * left those policies open in migration 006).
 */
export function createServiceClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key";
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isServiceClientConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}
