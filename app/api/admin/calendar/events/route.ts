import { createClient } from "@/lib/supabase/server";
import { EVENTS } from "@/lib/events";

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch events from database
    const { data: dbEvents, error } = await supabase
      .from("events")
      .select("id, title, starts_at, kind")
      .order("starts_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch events from database:", error);
      // Fall back to legacy events
      return Response.json(
        EVENTS.map((e) => ({
          id: e.id,
          title: e.title,
          starts_at: new Date(parseInt(e.year), 0, 1).toISOString(), // Approximate
          kind: e.kind,
        }))
      );
    }

    // Combine DB events with legacy events
    const legacyEvents = EVENTS.map((e) => ({
      id: e.id,
      title: e.title,
      starts_at: new Date(parseInt(e.year), 0, 1).toISOString(), // Approximate
      kind: e.kind,
    }));

    const allEvents = [...(dbEvents || []), ...legacyEvents];

    // Sort by date
    allEvents.sort(
      (a, b) =>
        new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
    );

    return Response.json(allEvents);
  } catch (err) {
    console.error("API error:", err);
    return Response.json([], { status: 500 });
  }
}
