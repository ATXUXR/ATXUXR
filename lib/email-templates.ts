// Plain HTML email templates. We don't use react-email — most clients ignore
// stylesheets, so inline styles + a single 580-ish-pixel container is the safe
// path. All templates take a per-recipient `unsubscribeUrl`.

import {
  googleCalendarUrl,
  outlookCalendarUrl,
  type CalendarEvent,
} from "./calendar";
import { SITE_URL } from "./resend";

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtml(s: string): string {
  return (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Format "Friday, Jun 12 · 5:30 PM" from an ISO string. */
function formatDateTime(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${date} · ${time}`;
  } catch {
    return iso;
  }
}

interface EmailEvent extends CalendarEvent {
  /** Absolute event URL on atxuxr.com. */
  url: string;
  /** Optional online URL — shown as a "Join online" button when present. */
  onlineUrl?: string | null;
}

const SHELL_OPEN = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F7F2EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#211E22;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F2EC;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid #E8E1D9;">
`;

function shellClose(unsubscribeUrl: string): string {
  return `
<tr><td style="padding:22px 32px 28px;background:#F2EAE0;font-size:12.5px;line-height:1.55;color:#6E6770;text-align:center;border-top:1px solid #E8E1D9;">
  <div style="margin-bottom:8px;">
    ATX UXR · Austin UX Researchers · the people-people of ATX
  </div>
  <div>
    Want fewer emails? <a href="${esc(unsubscribeUrl)}" style="color:#EE4A1C;text-decoration:underline;">Unsubscribe</a>
    or update your preferences on <a href="${SITE_URL}" style="color:#EE4A1C;text-decoration:underline;">atxuxr.com</a>.
  </div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function headerBlock(title: string, eyebrow: string): string {
  return `<tr><td style="padding:28px 32px 4px;">
  <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#EE4A1C;font-weight:700;">${esc(eyebrow)}</div>
  <h1 style="font-size:24px;line-height:1.2;margin:8px 0 0;font-weight:800;color:#211E22;">${esc(title)}</h1>
</td></tr>`;
}

function eventFactsBlock(event: EmailEvent): string {
  const dt = formatDateTime(event.startsAt);
  const where = event.location || (event.onlineUrl ? "Online" : "");
  return `<tr><td style="padding:16px 32px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF7F1;border:1px solid #E8E1D9;border-radius:10px;">
      <tr><td style="padding:14px 18px;font-size:14px;color:#211E22;">
        <div style="margin-bottom:6px;"><strong>When:</strong> ${esc(dt)}</div>
        ${where ? `<div><strong>Where:</strong> ${esc(where)}</div>` : ""}
      </td></tr>
    </table>
  </td></tr>`;
}

function ctaButton(href: string, label: string, primary = true): string {
  const bg = primary ? "#EE4A1C" : "#FFFFFF";
  const color = primary ? "#FFFFFF" : "#211E22";
  const border = primary ? "#EE4A1C" : "#211E22";
  return `<a href="${esc(href)}" style="display:inline-block;padding:11px 20px;border-radius:8px;background:${bg};color:${color};border:1.5px solid ${border};font-weight:600;font-size:14.5px;text-decoration:none;margin:0 6px 8px 0;">${esc(label)}</a>`;
}

function calendarButtonsBlock(event: EmailEvent, icsUrl: string): string {
  return `<tr><td style="padding:8px 32px 8px;">
    <div style="font-family:'Courier New',monospace;font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:#8A8390;font-weight:700;margin-bottom:8px;">Add to calendar</div>
    <div>
      ${ctaButton(googleCalendarUrl(event), "Google", false)}
      ${ctaButton(icsUrl, "Apple / iCal", false)}
      ${ctaButton(outlookCalendarUrl(event), "Outlook", false)}
    </div>
  </td></tr>`;
}

/** RSVP confirmation — "You're in for {title}". */
export function rsvpConfirmationHtml(
  event: EmailEvent,
  recipientName: string,
  unsubscribeUrl: string,
): string {
  const icsUrl = `${SITE_URL}/events/${event.id}/event.ics`;
  const greet = recipientName ? `Hi ${esc(recipientName.split(" ")[0])},` : "Hi,";
  const desc = stripHtml(event.description);
  return (
    SHELL_OPEN +
    headerBlock(`You're in for ${event.title}`, "RSVP CONFIRMED") +
    `<tr><td style="padding:14px 32px 4px;font-size:15.5px;line-height:1.6;color:#3B363D;">
      ${greet} We've got you on the list — looking forward to seeing you.
    </td></tr>` +
    eventFactsBlock(event) +
    (desc
      ? `<tr><td style="padding:8px 32px 4px;font-size:14.5px;line-height:1.6;color:#3B363D;">${esc(desc)}</td></tr>`
      : "") +
    `<tr><td style="padding:14px 32px 4px;">
      ${ctaButton(event.url, "Event details", true)}
      ${event.onlineUrl ? ctaButton(event.onlineUrl, "Join online", false) : ""}
    </td></tr>` +
    calendarButtonsBlock(event, icsUrl) +
    `<tr><td style="padding:8px 32px 20px;font-size:13.5px;line-height:1.6;color:#6E6770;">
      Plans change — no worries. Just reply to this email and we'll update your RSVP.
    </td></tr>` +
    shellClose(unsubscribeUrl)
  );
}

/** Event invite — "You're invited: {title}". */
export function eventInviteHtml(
  event: EmailEvent,
  recipientName: string,
  unsubscribeUrl: string,
  rsvpUrl: string,
  /** Optional admin-authored HTML body — replaces the default intro copy. */
  customBodyHtml?: string,
): string {
  const greet = recipientName ? `Hi ${esc(recipientName.split(" ")[0])},` : "Hi,";
  const desc = stripHtml(event.description);
  const introBlock = customBodyHtml
    ? `<tr><td style="padding:14px 32px 4px;font-size:15.5px;line-height:1.6;color:#3B363D;">
        ${customBodyHtml}
      </td></tr>`
    : `<tr><td style="padding:14px 32px 4px;font-size:15.5px;line-height:1.6;color:#3B363D;">
        ${greet} we're gathering and we'd love to see you there.
      </td></tr>`;
  const showDesc = !customBodyHtml && desc;
  return (
    SHELL_OPEN +
    headerBlock(`You're invited: ${event.title}`, "EVENT INVITE") +
    introBlock +
    eventFactsBlock(event) +
    (showDesc
      ? `<tr><td style="padding:8px 32px 4px;font-size:14.5px;line-height:1.6;color:#3B363D;">${esc(desc)}</td></tr>`
      : "") +
    `<tr><td style="padding:14px 32px 20px;">
      ${ctaButton(rsvpUrl, "RSVP — it's free", true)}
      ${event.onlineUrl ? ctaButton(event.onlineUrl, "Join online", false) : ""}
    </td></tr>` +
    shellClose(unsubscribeUrl)
  );
}

/** Generic blast — admin-authored HTML body wrapped in the shell. */
export function blastHtml(
  subject: string,
  bodyHtml: string,
  unsubscribeUrl: string,
): string {
  return (
    SHELL_OPEN +
    headerBlock(subject, "FROM THE ORGANIZERS") +
    `<tr><td style="padding:18px 32px 24px;font-size:15.5px;line-height:1.65;color:#3B363D;">
      ${bodyHtml}
    </td></tr>` +
    shellClose(unsubscribeUrl)
  );
}
