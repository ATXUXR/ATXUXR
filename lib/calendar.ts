// Calendar helpers — Google, Outlook, and iCal URLs / .ics text for an event.
// Keeps the date-formatting / escaping logic in one place so the public event
// page, the RSVP confirmation email, and the .ics route handler all agree.

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string; // ISO
  endsAt?: string | null; // ISO; defaults to startsAt + 2h
}

/** YYYYMMDDTHHMMSSZ — Google / iCalendar UTC format. */
function fmtUtc(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function defaultEnd(start: Date): Date {
  return new Date(start.getTime() + 2 * 60 * 60 * 1000);
}

/** Strip HTML for plain-text calendar fields. */
function stripHtml(s: string): string {
  return (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Escape commas, semicolons, backslashes, and newlines per RFC 5545. */
function icsEscape(s: string): string {
  return (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const start = new Date(e.startsAt);
  const end = e.endsAt ? new Date(e.endsAt) : defaultEnd(start);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${fmtUtc(start)}/${fmtUtc(end)}`,
    details: stripHtml(e.description),
    location: e.location || "",
    sf: "true",
    output: "xml",
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(e: CalendarEvent): string {
  const start = new Date(e.startsAt);
  const end = e.endsAt ? new Date(e.endsAt) : defaultEnd(start);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: e.title,
    body: stripHtml(e.description),
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    location: e.location || "",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** RFC 5545 .ics text for the event. */
export function icsForEvent(e: CalendarEvent): string {
  const start = new Date(e.startsAt);
  const end = e.endsAt ? new Date(e.endsAt) : defaultEnd(start);
  const now = new Date();
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ATX UXR//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@atxuxr`,
    `DTSTAMP:${fmtUtc(now)}`,
    `DTSTART:${fmtUtc(start)}`,
    `DTEND:${fmtUtc(end)}`,
    `SUMMARY:${icsEscape("ATX UXR — " + e.title)}`,
    `LOCATION:${icsEscape(e.location || "")}`,
    `DESCRIPTION:${icsEscape(stripHtml(e.description))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
