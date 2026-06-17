import { createClient } from "@/lib/supabase/server";

export interface DirectoryMember {
  id: string;
  name: string;
  photo: string | null;
  role: string;
  company: string;
  location: string;
  expertise: string[];
  admin: boolean;
  joined: string;
}

function emptyClient() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getAllMembers(): Promise<DirectoryMember[]> {
  if (emptyClient()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("id, name, photo, role, company, location, expertise, admin, joined")
    .order("admin", { ascending: false })
    .order("joined", { ascending: false });
  if (error) {
    console.error("getAllMembers", error);
    return [];
  }
  return (data ?? []) as DirectoryMember[];
}
