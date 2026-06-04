/* global React */
// ATX UXR site recreation — shared primitives, real content & icon helper.

const ASSET = 'assets/';

function Icon({ name, size = 20, strokeWidth = 2, style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const host = ref.current;
    if (!host || !window.lucide) return;
    host.innerHTML = '';
    const tmp = document.createElement('i');
    tmp.setAttribute('data-lucide', name);
    host.appendChild(tmp);
    try { window.lucide.createIcons(); } catch (e) {}
    const svg = host.querySelector('svg');
    if (svg) { svg.setAttribute('width', size); svg.setAttribute('height', size); svg.style.strokeWidth = strokeWidth; }
  }, [name, size, strokeWidth]);
  return <span ref={ref} aria-hidden="true" style={{ display: 'inline-flex', width: size, height: size, ...style }} />;
}

function Mark({ variant = 'orange', height = 30, style }) {
  return <img src={`${ASSET}mark-skyline-${variant}.png`} alt="" style={{ height, width: 'auto', display: 'block', ...style }} />;
}

function Wordmark({ height = 28, dark = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: height * 0.34 }}>
      <Mark variant={dark ? 'white' : 'orange'} height={height} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: height * 0.92, letterSpacing: '-0.02em', lineHeight: 1 }}>
        <span style={{ color: dark ? '#fff' : 'var(--neutral-700)' }}>ATX</span><span style={{ color: 'var(--primary)' }}>UXR</span>
      </span>
    </span>
  );
}

function Btn({ children, variant = 'primary', size = 'md', icon, iconRight, onClick, type = 'button', style }) {
  const [h, setH] = React.useState(false);
  const pad = { sm: '8px 15px', md: '12px 22px', lg: '15px 28px' }[size];
  const fs = { sm: 13, md: 15, lg: 17 }[size];
  const v = {
    primary: { background: h ? 'var(--orange-600)' : 'var(--primary)', color: '#fff', boxShadow: h ? 'var(--shadow-flame)' : 'none' },
    secondary: { background: h ? 'var(--surface-sunk)' : 'var(--surface)', color: 'var(--fg)', boxShadow: 'inset 0 0 0 1.5px var(--border-strong)' },
    ghost: { background: h ? 'var(--orange-50)' : 'transparent', color: 'var(--orange-700)' },
    ink: { background: h ? '#000' : 'var(--neutral-950)', color: '#F7F2EC' },
  }[variant];
  return (
    <button type={type} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: fs, cursor: 'pointer', border: 'none',
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: pad, borderRadius: 'var(--radius-md)',
        transition: 'var(--transition)', whiteSpace: 'nowrap', lineHeight: 1.2, ...v, ...style }}>
      {icon && <Icon name={icon} size={fs + 2} />}{children}{iconRight && <Icon name={iconRight} size={fs + 2} />}
    </button>
  );
}

function Tag({ children, tone = 'flame', style }) {
  const tones = {
    flame: { background: 'var(--orange-50)', color: 'var(--orange-700)' },
    ink: { background: 'var(--neutral-950)', color: '#F7F2EC' },
    teal: { background: 'var(--teal-50)', color: 'var(--teal-700)' },
    honey: { background: 'var(--honey-100)', color: 'var(--honey-700)' },
  }[tone];
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
      padding: '4px 10px', borderRadius: 'var(--radius-pill)', display: 'inline-block', ...tones, ...style }}>{children}</span>
  );
}

function Eyebrow({ children, style }) {
  return <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--primary)', ...style }}>{children}</div>;
}

// ---- REAL CONTENT ----
const EVENT_TYPES = [
  { n: '01', name: 'Connect', icon: 'users', tone: 'teal', body: 'Get to know like-minded UX, CX, HF, HCI research practitioners in the Austin area.' },
  { n: '02', name: 'Reflect', icon: 'message-circle', tone: 'honey', body: 'Shape your own point of view regarding the latest industry concepts and techniques.' },
  { n: '03', name: 'Learn', icon: 'graduation-cap', tone: 'flame', body: 'Stay up to date on the latest industry trends and standards.' },
];

const KIND_TONE = { CONNECT: 'teal', REFLECT: 'honey', LEARN: 'flame' };

const EVENTS = [
  { day: 'FRI', date: 'JUN 12', year: '2026', kind: 'CONNECT', title: 'Networking Happy Hour', where: 'Bouldin Acres', time: '5:30 – 8:30 PM', status: 'open', desc: 'Come get to know your fellow local UXRs! Light appetizers provided and pickleball courts available to rent.' },
  { day: 'FRI', date: 'OCT 17', year: '2025', kind: 'CONNECT', title: 'October Happy Hour', where: 'Culinary Dropout, Austin', time: '6:00 – 8:00 PM', status: 'closed', desc: 'Join us for our next CONNECT event at 6 PM at Culinary Dropout!' },
  { day: 'TUE', date: 'JUL 15', year: '2025', kind: 'REFLECT', title: 'What Happened? Turning lessons from the past into wins', where: 'Google Meet · Online', time: '8:00 – 9:00 AM', status: 'closed', desc: 'Grab your coffee and join us to share stories and discuss challenges related to research time-to-value.' },
  { day: 'FRI', date: 'JUN 06', year: '2025', kind: 'CONNECT', title: 'ATX UXR Anniversary Celebration', where: 'Aviator Pizza & Drafthouse', time: '5:30 PM', status: 'closed', desc: "We're turning one, y'all!" },
  { day: 'THU', date: 'APR 24', year: '2025', kind: 'LEARN', title: 'Back to the Future of UX', where: 'Baylor Scott & White Cafe', time: '5:30 – 7:30 PM', status: 'closed', desc: 'Revisiting Greg Parrott & Dr. Jakob Nielsen on AI and UX in light of the AI revolution. Are our fears coming true?' },
  { day: 'TUE', date: 'MAR 11', year: '2025', kind: 'CONNECT', title: 'ATX UXRs at SXSW', where: 'Hotel Van Zandt Rooftop', time: '5:00 – 8:00 PM', status: 'closed', desc: "Let's get together during SXSW at the Hotel Van Zandt 4th-floor rooftop pool." },
  { day: 'FRI', date: 'FEB 28', year: '2025', kind: 'CONNECT', title: 'February Happy Hour', where: 'Yard House, The Domain', time: '5:00 – 8:00 PM', status: 'closed', desc: "We can't wait to see you at our next happy hour. Keep doing amazing things!" },
];

const SOCIALS = [
  { label: 'Meetup', icon: 'calendar-heart', href: 'https://www.meetup.com/atxuxr/' },
  { label: 'LinkedIn', icon: 'briefcase', href: 'https://www.linkedin.com/groups/14475239/' },
  { label: 'WhatsApp', icon: 'message-circle', href: '#' },
  { label: 'Bluesky', icon: 'cloud', href: 'https://bsky.app/profile/atx-uxrs.bsky.social' },
];

Object.assign(window, { Icon, Mark, Wordmark, Btn, Tag, Eyebrow, EVENT_TYPES, EVENTS, KIND_TONE, SOCIALS });

// ---- Add-to-calendar (.ics) ----
function buildICS(e) {
  const months = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
  const [mon, dayStr] = e.date.split(' ');
  const month = months[mon.toUpperCase()] ?? 0;
  const day = parseInt(dayStr, 10);
  const year = parseInt(e.year, 10);
  const endMer = (e.time.match(/(AM|PM)\s*$/i) || [])[0];
  const parse = (t, fb) => {
    const m = t.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!m) return { h: 18, min: 0 };
    let h = parseInt(m[1], 10); const min = parseInt(m[2], 10);
    const mer = (m[3] || fb || '').toUpperCase();
    if (mer === 'PM' && h !== 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return { h, min };
  };
  const parts = e.time.split(/[–-]/).map((s) => s.trim());
  const s = parse(parts[0], endMer);
  const en = parts[1] ? parse(parts[1], endMer) : { h: s.h + 2, min: s.min };
  const sd = new Date(year, month, day, s.h, s.min);
  const ed = new Date(year, month, day, en.h, en.min);
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const esc = (t) => (t || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ATX UXR//Events//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${Date.now()}@atxuxr`, `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(sd)}`, `DTEND:${fmt(ed)}`,
    `SUMMARY:${esc('ATX UXR — ' + e.title)}`, `LOCATION:${esc(e.where)}`, `DESCRIPTION:${esc(e.desc)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}
function downloadICS(e) {
  const blob = new Blob([buildICS(e)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (e.title || 'event').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
window.downloadICS = downloadICS;
