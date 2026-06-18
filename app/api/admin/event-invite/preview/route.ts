import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { eventInviteHtml } from "@/lib/email-templates";
import { SITE_URL } from "@/lib/resend";
import type { CalendarEvent } from "@/lib/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  eventId: z.string().min(1),
  html: z.string().max(20000).default(""),
  /** Optional sample name for {{name}} substitution in the preview. */
  sampleName: z.string().max(80).optional(),
});

async function requireAdmin() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { ok: false as const, status: 503, error: "Not configured" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in" };
  const { data: member } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!member?.admin)
    return { ok: false as const, status: 403, error: "Admins only" };
  return { ok: true as const, supabase };
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { supabase } = gate;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { eventId, html, sampleName } = parsed.data;

  // Load the event so the preview uses real title/time/location.
  const { data: event } = await supabase
    .from("events")
    .select(
      "id, slug, title, description, where_, address, online_url, starts_at, ends_at",
    )
    .eq("id", eventId)
    .maybeSingle();
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const calEvent: CalendarEvent & { url: string; onlineUrl: string | null } = {
    id: event.id,
    title: event.title,
    description: event.description || "",
    location: event.address || event.where_ || (event.online_url ? "Online" : ""),
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    url: `${SITE_URL}/events/${event.id}`,
    onlineUrl: event.online_url,
  };

  // Replace {{name}} in the admin's body with the sample so the preview looks
  // like a real recipient view.
  const name = sampleName || "Alex";
  const personalized = html.replace(/\{\{\s*name\s*\}\}/gi, name);

  const rendered = eventInviteHtml(
    calEvent,
    name,
    `${SITE_URL}/unsubscribe?token=PREVIEW`,
    `${calEvent.url}?utm=preview`,
    personalized,
  );

  return new NextResponse(rendered, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
