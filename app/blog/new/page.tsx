import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ContributeForm } from "./ContributeForm";

export const metadata = { title: "Contribute" };

export default async function ContributePage() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    redirect("/blog");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?auth=signin&next=/blog/new");

  const { data: member } = await supabase
    .from("members")
    .select("id, name, photo")
    .eq("id", user.id)
    .maybeSingle();

  const me = {
    id: user.id,
    name: member?.name || (user.user_metadata?.name as string) || user.email || "Member",
    photo: member?.photo ?? null,
  };

  return <ContributeForm me={me} />;
}
