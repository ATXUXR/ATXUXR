// Static events data, mirrors the EVENTS / EVENT_TYPES arrays in legacy/site/shared.jsx.
// When events move to Supabase, swap this for a `getEvents()` server function.

export type EventKind = "CONNECT" | "REFLECT" | "LEARN";
export type EventStatus = "open" | "closed" | "cancelled";
export type TagTone = "flame" | "teal" | "honey" | "ink";

export interface AtxEvent {
  id: string; // slug-style id, derived from title/date for routing
  day: string;
  date: string;
  year: string;
  kind: EventKind;
  title: string;
  where: string;
  time: string;
  status: EventStatus;
  desc: string;
}

export interface EventType {
  n: string;
  name: string;
  icon: string;
  tone: TagTone;
  body: string;
}

export const EVENT_TYPES: EventType[] = [
  {
    n: "01",
    name: "Connect",
    icon: "users",
    tone: "teal",
    body: "Get to know like-minded UX, CX, HF, HCI research practitioners in the Austin area.",
  },
  {
    n: "02",
    name: "Reflect",
    icon: "message-circle",
    tone: "honey",
    body: "Shape your own point of view regarding the latest industry concepts and techniques.",
  },
  {
    n: "03",
    name: "Learn",
    icon: "graduation-cap",
    tone: "flame",
    body: "Stay up to date on the latest industry trends and standards.",
  },
];

export const KIND_TONE: Record<EventKind, TagTone> = {
  CONNECT: "teal",
  REFLECT: "honey",
  LEARN: "flame",
};

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const RAW: Omit<AtxEvent, "id">[] = [
  { day: "FRI", date: "JUN 12", year: "2026", kind: "CONNECT", title: "Networking Happy Hour", where: "Bouldin Acres", time: "5:30 – 8:30 PM", status: "open", desc: "Come get to know your fellow local UXRs! Light appetizers provided and pickleball courts available to rent." },
  { day: "FRI", date: "OCT 17", year: "2025", kind: "CONNECT", title: "October Happy Hour", where: "Culinary Dropout, Austin", time: "6:00 – 8:00 PM", status: "closed", desc: "Join us for our next CONNECT event at 6 PM at Culinary Dropout!" },
  { day: "TUE", date: "JUL 15", year: "2025", kind: "REFLECT", title: "What Happened? Turning lessons from the past into wins", where: "Google Meet · Online", time: "8:00 – 9:00 AM", status: "closed", desc: "Grab your coffee and join us to share stories and discuss challenges related to research time-to-value." },
  { day: "FRI", date: "JUN 06", year: "2025", kind: "CONNECT", title: "ATX UXR Anniversary Celebration", where: "Aviator Pizza & Drafthouse", time: "5:30 PM", status: "closed", desc: "We're turning one, y'all!" },
  { day: "THU", date: "APR 24", year: "2025", kind: "LEARN", title: "Back to the Future of UX", where: "Baylor Scott & White Cafe", time: "5:30 – 7:30 PM", status: "closed", desc: "Revisiting Greg Parrott & Dr. Jakob Nielsen on AI and UX in light of the AI revolution. Are our fears coming true?" },
  { day: "TUE", date: "MAR 11", year: "2025", kind: "CONNECT", title: "ATX UXRs at SXSW", where: "Hotel Van Zandt Rooftop", time: "5:00 – 8:00 PM", status: "closed", desc: "Let's get together during SXSW at the Hotel Van Zandt 4th-floor rooftop pool." },
  { day: "FRI", date: "FEB 28", year: "2025", kind: "CONNECT", title: "February Happy Hour", where: "Yard House, The Domain", time: "5:00 – 8:00 PM", status: "closed", desc: "We can't wait to see you at our next happy hour. Keep doing amazing things!" },
];

export const EVENTS: AtxEvent[] = RAW.map((e) => ({
  ...e,
  id: `${e.year}-${slug(e.date)}-${slug(e.title)}`.slice(0, 80),
}));

export function getEventById(id: string): AtxEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

export interface Social {
  label: string;
  icon: string;
  href: string;
}

// Per the spec: NO Meetup, X, or Twitter. LinkedIn, Instagram only.
export const SOCIALS: Social[] = [
  { label: "LinkedIn", icon: "linkedin", href: "https://www.linkedin.com/groups/14475239/" },
  { label: "Instagram", icon: "instagram", href: "https://www.instagram.com/atxuxr/" },
];

// ---- Add-to-calendar (.ics) helper ----
export function buildICS(e: AtxEvent): string {
  const months: Record<string, number> = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
  const [mon, dayStr] = e.date.split(" ");
  const month = months[mon.toUpperCase()] ?? 0;
  const day = parseInt(dayStr, 10);
  const year = parseInt(e.year, 10);
  const endMer = (e.time.match(/(AM|PM)\s*$/i) || [])[0];
  const parse = (t: string, fb?: string): { h: number; min: number } => {
    const m = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!m) return { h: 18, min: 0 };
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const mer = (m[3] || fb || "").toUpperCase();
    if (mer === "PM" && h !== 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return { h, min };
  };
  const parts = e.time.split(/[–-]/).map((s) => s.trim());
  const s = parse(parts[0], endMer);
  const en = parts[1] ? parse(parts[1], endMer) : { h: s.h + 2, min: s.min };
  const sd = new Date(year, month, day, s.h, s.min);
  const ed = new Date(year, month, day, en.h, en.min);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const esc = (t: string) => (t || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ATX UXR//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${e.id}@atxuxr`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(sd)}`,
    `DTEND:${fmt(ed)}`,
    `SUMMARY:${esc("ATX UXR — " + e.title)}`,
    `LOCATION:${esc(e.where)}`,
    `DESCRIPTION:${esc(e.desc)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
