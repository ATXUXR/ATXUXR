import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

/**
 * Returns a configured Resend client, or null when RESEND_API_KEY is absent.
 * Callers MUST handle the null case — email is best-effort, never a hard
 * dependency. The build must pass without the key set.
 */
export function getResend(): Resend | null {
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export const EMAIL_FROM =
  process.env.EMAIL_FROM || "ATX UXR <hello@atxuxr.com>";

/** Public site URL — used to build absolute links in email bodies. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://atxuxr.com";
