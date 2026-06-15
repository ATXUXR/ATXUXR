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
