// Short, editable blurbs that point back to the canonical atxuxr.com blog post.
// Seeded when a draft is published; the admin can edit them afterward. No AI —
// just a per-channel fill-in template. The channel versions of a post exist ONLY
// after it's published, and they always link to the live post rather than
// re-hosting the full article.

import { SITE_URL } from "./resend";

export type BlurbChannel = "linkedin" | "instagram" | "slack";

export const BLURB_CHANNELS: BlurbChannel[] = ["linkedin", "instagram", "slack"];

/** Absolute URL of a published blog post. */
export function postUrl(postId: string): string {
  return `${SITE_URL}/blog/${postId}`;
}

/** A brief, editable starter blurb for a channel, linking to the published post. */
export function channelBlurb(
  channel: BlurbChannel,
  title: string,
  postId: string,
): string {
  const url = postUrl(postId);
  const t = (title || "New post").trim();
  switch (channel) {
    case "linkedin":
      return `New on the ATX UXR blog: ${t} — ${url}\n\nA short read on where AI is taking UX research. Would love your take in the comments.`;
    case "instagram":
      return `New on the ATX UXR blog: ${t}. Full piece linked in bio: ${url}`;
    case "slack":
      return `New on the blog — ${t}: ${url}`;
  }
}
