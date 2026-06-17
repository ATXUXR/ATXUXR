import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileSetupForm, type ProfileSeed } from "./ProfileSetupForm";

export const metadata = { title: "Welcome — set up your profile" };

export default async function OnboardingPage() {
  // Tolerate unconfigured Supabase locally — render an empty seed so the UI works.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return <ProfileSetupForm seed={emptySeed()} isSetup />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?auth=signin");

  const { data: member } = await supabase
    .from("members")
    .select("name, role, company, location, bio, linkedin, website, expertise, photo")
    .eq("id", user.id)
    .maybeSingle();

  const seed: ProfileSeed = {
    name:
      member?.name ??
      (user.user_metadata?.name as string | undefined) ??
      "",
    role: member?.role ?? "",
    company: member?.company ?? "",
    location: member?.location ?? "",
    bio: member?.bio ?? "",
    linkedin: member?.linkedin ?? "",
    website: member?.website ?? "",
    expertise: member?.expertise ?? [],
    photo: member?.photo ?? null,
  };

  return <ProfileSetupForm seed={seed} isSetup />;
}

function emptySeed(): ProfileSeed {
  return {
    name: "",
    role: "",
    company: "",
    location: "",
    bio: "",
    linkedin: "",
    website: "",
    expertise: [],
    photo: null,
  };
}
