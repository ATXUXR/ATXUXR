// Server-only fetcher for the content calendar. Kept separate from
// content-calendar.ts so client components can import the types without
// pulling next/headers into the client bundle.

import { createClient } from "@/lib/supabase/server";
import type {
  CalendarDraft,
  CalendarPost,
  CalendarRow,
} from "@/lib/content-calendar";

export async function getCalendar(): Promise<CalendarRow[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [];
  }
  const supabase = await createClient();
  const [{ data: posts }, { data: drafts }] = await Promise.all([
    supabase
      .from("content_calendar")
      .select("*")
      .order("scheduled_date", { ascending: true, nullsFirst: false }),
    supabase.from("content_drafts").select("*"),
  ]);
  const byCalendar = new Map<string, CalendarDraft[]>();
  (drafts ?? []).forEach((d) => {
    const k = (d as CalendarDraft).calendar_id;
    const arr = byCalendar.get(k) || [];
    arr.push(d as CalendarDraft);
    byCalendar.set(k, arr);
  });
  return ((posts ?? []) as CalendarPost[]).map((p) => ({
    post: p,
    drafts: byCalendar.get(p.id) || [],
  }));
}
