import { createClient } from "@/lib/supabase/server";
import { Nav } from "./Nav";

// Server wrapper: fetches the current user on the server (preserving SSR)
// and forwards it to the client Nav so the menu renders without a flash.
export async function NavServer() {
  // Tolerate missing env vars so `next dev` still works pre-setup.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return <Nav initialUser={null} isAdmin={false} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = Boolean(member?.admin);
  }

  return <Nav initialUser={user} isAdmin={isAdmin} />;
}
