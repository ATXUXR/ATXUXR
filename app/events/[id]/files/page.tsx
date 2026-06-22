import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listPublicEvents } from "@/lib/event-fetch";
import { EventFilesManager } from "./EventFilesManager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventFilesPage({ params }: PageProps) {
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

  // Fetch event files
  const { data: files } = await supabase
    .from("event_files")
    .select("id, file_name, file_size, file_type, file_url, created_at")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  return <EventFilesManager event={event} initialFiles={files || []} />;
}
