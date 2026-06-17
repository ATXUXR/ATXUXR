import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import {
  createServiceClient,
  isServiceClientConfigured,
} from "@/lib/supabase/service";
import { getResend, EMAIL_FROM, SITE_URL } from "@/lib/resend";
import { rsvpConfirmationHtml } from "@/lib/email-templates";
import type { CalendarEvent } from "@/lib/calendar";
import { getEventById as getLegacyEvent } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  guests: z.number().int().min(1).max(9),
  utm: z.string().min(1).max(80).optional(),
});

interface DbEvent {
  id: string;
  slug: string | null;
  kind: string;
  title: string;
  description: string;
  where_: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  address: string | null;
  online_url: string | null;
}

function buildCalendarEvent(e: DbEvent): CalendarEvent & {
  url: string;
  onlineUrl: string | null;
} {
  const location = e.address || e.where_ || (e.online_url ? "Online" : "");
  return {
    id: e.id,
    title: e.title,
    description: e.description || "",
    location,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    url: `${SITE_URL}/events/${e.id}`,
    onlineUrl: e.online_url,
  };
}

// Look up event by id (uuid) or slug (legacy hardcoded id). Falls back to the
// hardcoded `lib/events.ts` data so existing seeded events still RSVP.
async function fetchEvent(
  eventId: string,
): Promise<{ db: DbEvent | null; legacy: ReturnType<typeof getLegacyEvent> }> {
  const legacy = getLegacyEvent(eventId);
  if (!isServiceClientConfigured()) return { db: null, legacy };
  const supabase = createServiceClient();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      eventId,
    );
  const q = supabase
    .from("events")
    .select(
      "id, slug, kind, title, description, where_, starts_at, ends_at, status, address, online_url",
    );
  const { data } = await (isUuid ? q.eq("id", eventId) : q.eq("slug", eventId))
    .maybeSingle();
  return { db: (data as DbEvent | null) ?? null, legacy };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { eventId, name, email, guests, utm } = parsed.data;

  // If Supabase isn't configured at all, return success so the form doesn't
  // brick — RSVP is best-effort during local dev without env vars.
  if (!isServiceClientConfigured()) {
    console.log("[rsvp] (no supabase)", parsed.data);
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceClient();
  const { db, legacy } = await fetchEvent(eventId);

  // The DB row is what we save the RSVP against. If the event lives only in
  // `lib/events.ts`, fall through with a null event_id (allowed by schema?
  // event_id is NOT NULL — so we must short-circuit and only persist if we
  // have a DB row).
  if (!db) {
    if (!legacy) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    // Legacy seeded event — no DB row exists. We log the RSVP intent so it's
    // not lost, but skip the rsvps insert (event_id is required).
    console.log("[rsvp] legacy event, not persisting:", parsed.data);
    return NextResponse.json({ ok: true });
  }

  // Insert the RSVP.
  const { error: rsvpErr } = await supabase.from("rsvps").insert({
    event_id: db.id,
    name,
    email,
    guests,
  });
  if (rsvpErr) {
    return NextResponse.json({ error: rsvpErr.message }, { status: 400 });
  }

  // Upsert into signups so the RSVPer is on the mailing list. Add an `rsvp`
  // tag plus a per-event tag for future targeting.
  const slugForTag = db.slug || db.id;
  const tagBase = `rsvp-${slugForTag}`;
  const token = crypto.randomBytes(18).toString("hex");
  // First find an existing row to merge tags into.
  const { data: existing } = await supabase
    .from("signups")
    .select("id, tags, unsubscribe_token")
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    const existingTags = new Set<string>(existing.tags ?? []);
    existingTags.add("rsvp");
    existingTags.add(tagBase);
    await supabase
      .from("signups")
      .update({
        name,
        tags: Array.from(existingTags),
        unsubscribe_token: existing.unsubscribe_token ?? token,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("signups").insert({
      name,
      email,
      source: "rsvp",
      tags: ["rsvp", tagBase],
      unsubscribe_token: token,
    });
  }

  // Re-read the signup so we have the right token for the unsubscribe link.
  const { data: signup } = await supabase
    .from("signups")
    .select("id, unsubscribe_token")
    .eq("email", email)
    .maybeSingle();

  // If we got an utm (event invite click → RSVP), mark that send row as
  // clicked. This is how the "RSVPs via email" insight tile is computed.
  if (utm) {
    await supabase
      .from("email_sends")
      .update({ clicked_at: new Date().toISOString() })
      .eq("utm", utm);
  }

  // Send confirmation via Resend. Best-effort — failure doesn't fail the RSVP.
  const resend = getResend();
  if (resend) {
    try {
      const unsubscribeUrl = signup?.unsubscribe_token
        ? `${SITE_URL}/unsubscribe?token=${encodeURIComponent(signup.unsubscribe_token)}`
        : `${SITE_URL}/unsubscribe`;
      const calEvent = buildCalendarEvent(db);
      const html = rsvpConfirmationHtml(calEvent, name, unsubscribeUrl);
      const subject = `You're in for ${db.title}`;
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject,
        html,
      });
      // Log the send so it shows up in the admin email log.
      const { data: emailRow } = await supabase
        .from("emails")
        .insert({
          to_address: email,
          subject,
          body: html,
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      await supabase.from("email_sends").insert({
        email_id: emailRow?.id ?? null,
        signup_id: signup?.id ?? null,
        to_address: email,
        campaign: "rsvp-confirmation",
      });
    } catch (err) {
      console.warn("[rsvp] email send failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
