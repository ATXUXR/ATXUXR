import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function initials(name: string | null | undefined): string {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0] || "")
    .join("")
    .toUpperCase();
}

type AvatarTone = { bg: string; fg: string };

const AVATAR_TONES: AvatarTone[] = [
  { bg: "var(--orange-50)", fg: "var(--orange-700)" },
  { bg: "var(--teal-50)", fg: "var(--teal-700)" },
  { bg: "var(--honey-100)", fg: "var(--honey-700)" },
  { bg: "var(--neutral-100)", fg: "var(--neutral-700)" },
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function toneForName(name: string): AvatarTone {
  return AVATAR_TONES[hash(name) % AVATAR_TONES.length];
}

export type TagTone = "flame" | "teal" | "honey" | "ink";
const TAG_TONES: TagTone[] = ["flame", "teal", "honey", "ink"];

export function toneForTag(tag: string): TagTone {
  return TAG_TONES[hash(tag) % TAG_TONES.length];
}

export function readMinutes(html: string): number {
  const words = (html || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** Words in stripped HTML — used by the contribute editor for live word count. */
export function wordCount(html: string): number {
  const stripped = (html || "").replace(/<[^>]+>/g, " ").trim();
  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(Boolean).length;
}

/** "May 28, 2026"-style date from an ISO date or YYYY-MM-DD string. */
export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  try {
    const date =
      typeof d === "string"
        ? new Date(d.length === 10 ? d + "T00:00:00" : d)
        : d;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(d);
  }
}

/** "2m ago" / "3h ago" / "5d ago" / formatted date — for comment timestamps. */
export function relativeTime(iso: string | Date): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const now = Date.now();
  const s = Math.max(1, Math.round((now - then) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatDate(typeof iso === "string" ? iso : iso.toISOString());
}
