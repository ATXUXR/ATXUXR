import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostById } from "@/lib/posts";
import { EditPostForm } from "./EditPostForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/blog");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/?auth=signin&next=/blog");

  // Check admin status
  const { data: member } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!member?.admin) {
    redirect("/blog");
  }

  // Fetch the post
  const post = await getPostById(id);
  if (!post) notFound();

  return <EditPostForm post={post} />;
}
