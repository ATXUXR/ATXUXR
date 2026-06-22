import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listPublicEvents } from "@/lib/event-fetch";
import { EditEventForm } from "./EditEventForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/events");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/?auth=signin&next=/events");

  // Check admin status
  const { data: member } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!member?.admin) {
    redirect("/events");
  }

  // Fetch the event
  const events = await listPublicEvents();
  const event = events.find((e) => e.routeId === id);

  if (!event) notFound();

  return <EditEventForm event={event} />;
}
