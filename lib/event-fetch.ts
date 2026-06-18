// Server-only helper to resolve a public event either from the `events` table
// or — when the DB has no matching row — the hardcoded `lib/events.ts` legacy
// list (so the seeded events keep rendering during the migration). Returns a
// unified shape the public event page can render.

import {
  createServiceClient,
  isServiceClientConfigured,
} from "@/lib/supabase/service";
import { getEventById as getLegacyEvent, type AtxEvent } from "@/lib/events";

export interface PublicEvent {
  id: string;
  /** Stable id used for URLs — always the row's `id` when from DB, the legacy slug otherwise. */
  routeId: string;
  kind: "CONNECT" | "REFLECT" | "LEARN";
  kindLabel: string | null;
  title: string;
  description: string;
  where: string;
  address: string | null;
  onlineUrl: string | null;
  image: string | null;
  startsAt: string; // ISO
  endsAt: string | null;
  status: "open" | "closed" | "cancelled";
  // Display strings derived from startsAt; the date-banner block uses these.
  day: string;
  date: string;
  year: string;
  time: string;
  /** True if this came from the hardcoded legacy array (no DB row exists). */
  legacy: boolean;
  /** Member who's hosting this event, when set. */
  host: { id: string; name: string; photo: string | null } | null;
}

// ATX UXR is Austin-based — render every event in Central Time regardless of
// where the server (Netlify Functions = UTC) or the visitor sits. Override via
// EVENT_TIMEZONE env if the community ever travels.
const EVENT_TZ = process.env.EVENT_TIMEZONE || "America/Chicago";

function formatDisplay(iso: string): {
  day: string;
  date: string;
  year: string;
  time: string;
} {
  try {
    const d = new Date(iso);
    // Pull the calendar parts in the event timezone via Intl, then map them
    // back to the display strings the EventRow expects.
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: EVENT_TZ,
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).formatToParts(d);
    const get = (t: string) =>
      parts.find((p) => p.type === t)?.value || "";
    return {
      day: get("weekday").toUpperCase(),
      date: `${get("month").toUpperCase()} ${get("day")}`,
      year: get("year"),
      time: d.toLocaleTimeString("en-US", {
        timeZone: EVENT_TZ,
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  } catch {
    return { day: "", date: "", year: "", time: "" };
  }
}

function fromLegacy(e: AtxEvent): PublicEvent {
  // Legacy events have free-text day/date/year/time — keep the original
  // display strings, but synthesize a usable ISO startsAt for calendar links.
  const months: Record<string, number> = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };
  const [mon, dayStr] = (e.date || "").split(" ");
  const m = months[mon?.toUpperCase()] ?? 0;
  const day = parseInt(dayStr || "1", 10);
  const year = parseInt(e.year, 10) || new Date().getFullYear();
  const tParse = (t: string): { h: number; min: number } => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return { h: 18, min: 0 };
    let h = parseInt(match[1], 10);
    const min = parseInt(match[2], 10);
    const mer = (match[3] || "PM").toUpperCase();
    if (mer === "PM" && h !== 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return { h, min };
  };
  const parts = (e.time || "").split(/[–-]/).map((s) => s.trim());
  const s = tParse(parts[0] || "6:00 PM");
  const ends = parts[1]
    ? tParse(parts[1])
    : { h: s.h + 2, min: s.min };
  const start = new Date(year, m, day, s.h, s.min);
  const end = new Date(year, m, day, ends.h, ends.min);
  return {
    id: e.id,
    routeId: e.id,
    kind: e.kind,
    kindLabel: null,
    title: e.title,
    description: e.desc,
    where: e.where,
    address: e.where,
    onlineUrl: null,
    image: null,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    status: e.status,
    day: e.day,
    date: e.date,
    year: e.year,
    time: e.time,
    legacy: true,
    host: null,
  };
}

interface DbEvent {
  id: string;
  slug: string | null;
  kind: "CONNECT" | "REFLECT" | "LEARN";
  kind_label: string | null;
  title: string;
  description: string;
  where_: string;
  address: string | null;
  online_url: string | null;
  image: string | null;
  starts_at: string;
  ends_at: string | null;
  status: "open" | "closed" | "cancelled";
  host?:
    | { id: string; name: string; photo: string | null }
    | { id: string; name: string; photo: string | null }[]
    | null;
}

function fromDb(e: DbEvent): PublicEvent {
  const disp = formatDisplay(e.starts_at);
  let timeStr = disp.time;
  if (e.ends_at) {
    try {
      const end = new Date(e.ends_at);
      timeStr = `${disp.time} – ${end.toLocaleTimeString("en-US", {
        timeZone: EVENT_TZ,
        hour: "numeric",
        minute: "2-digit",
      })}`;
    } catch {
      /* ignore */
    }
  }
  return {
    id: e.id,
    routeId: e.id,
    kind: e.kind,
    kindLabel: e.kind_label,
    title: e.title,
    description: e.description || "",
    where: e.address || e.where_ || (e.online_url ? "Online" : ""),
    address: e.address,
    onlineUrl: e.online_url,
    image: e.image,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    status: e.status,
    day: disp.day,
    date: disp.date,
    year: disp.year,
    time: timeStr,
    legacy: false,
    host: Array.isArray(e.host) ? (e.host[0] ?? null) : (e.host ?? null),
  };
}

/** Lookup by uuid or slug; falls back to the hardcoded legacy events array. */
export async function getPublicEvent(idOrSlug: string): Promise<PublicEvent | null> {
  if (isServiceClientConfigured()) {
    const supabase = createServiceClient();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );
    const q = supabase
      .from("events")
      .select(
        "id, slug, kind, kind_label, title, description, where_, address, online_url, image, starts_at, ends_at, status, host:members!events_host_id_fkey(id, name, photo)",
      );
    const { data } = await (isUuid ? q.eq("id", idOrSlug) : q.eq("slug", idOrSlug))
      .maybeSingle();
    if (data) return fromDb(data as DbEvent);
  }
  const legacy = getLegacyEvent(idOrSlug);
  return legacy ? fromLegacy(legacy) : null;
}

/** All events for the listing page: DB rows first, legacy as fallback. */
export async function listPublicEvents(): Promise<PublicEvent[]> {
  if (isServiceClientConfigured()) {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("events")
      .select(
        "id, slug, kind, kind_label, title, description, where_, address, online_url, image, starts_at, ends_at, status, host:members!events_host_id_fkey(id, name, photo)",
      )
      .order("starts_at", { ascending: false });
    if (data && data.length > 0) {
      return (data as DbEvent[]).map(fromDb);
    }
  }
  // Fall back to legacy seeded list when DB is empty.
  const { EVENTS } = await import("@/lib/events");
  return EVENTS.map(fromLegacy);
}
