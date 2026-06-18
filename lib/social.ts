// Social sharing helpers: caption builders for events / posts / ad-hoc
// announcements, plus URL builders for the platforms that support web share
// dialogs (LinkedIn) and clipboard fallbacks for the ones that don't
// (Instagram, LinkedIn groups).

export type ShareKind = "event" | "blog" | "announcement";

export interface ShareContent {
  kind: ShareKind;
  /** Headline / event title / post title — used as the first line of caption. */
  title: string;
  /** Plain-text body. The dialog renders this in a textarea so the admin can edit. */
  body: string;
  /** Public URL to link to. */
  url: string;
  /** Optional image URL (e.g. event banner, blog cover). Pasted into IG/LI manually. */
  imageUrl?: string | null;
  /** Optional metadata line shown above the body (date/time for events, author for posts). */
  meta?: string;
}

const TRUNCATE = (s: string, n: number) =>
  s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";

/** Caption for the public-feed platforms (LinkedIn, Instagram, generic Slack). */
export function defaultCaption(c: ShareContent): string {
  const parts: string[] = [];
  if (c.kind === "event") {
    parts.push(c.title);
    if (c.meta) parts.push(c.meta);
    parts.push("");
    parts.push(TRUNCATE(c.body, 600));
    parts.push("");
    parts.push(`RSVP → ${c.url}`);
    parts.push("");
    parts.push("#UXResearch #Austin #ATXUXR");
  } else if (c.kind === "blog") {
    parts.push(`New from ATX UXR: ${c.title}`);
    if (c.meta) parts.push(c.meta);
    parts.push("");
    parts.push(TRUNCATE(c.body, 600));
    parts.push("");
    parts.push(`Read → ${c.url}`);
    parts.push("");
    parts.push("#UXResearch #ATXUXR");
  } else {
    parts.push(c.title);
    parts.push("");
    parts.push(TRUNCATE(c.body, 800));
    if (c.url) {
      parts.push("");
      parts.push(c.url);
    }
  }
  return parts.join("\n").trim();
}

/** Slack Block Kit blocks for nicer in-channel rendering. */
export function slackBlocks(c: ShareContent, caption: string): unknown[] {
  const blocks: unknown[] = [];
  blocks.push({
    type: "header",
    text: { type: "plain_text", text: c.title.slice(0, 150) },
  });
  if (c.meta) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: c.meta }],
    });
  }
  // Use the edited caption body so it's the same text on all platforms.
  // Slack mrkdwn doesn't support hashtags specially; they're harmless.
  blocks.push({
    type: "section",
    text: { type: "mrkdwn", text: caption.slice(0, 2900) },
  });
  if (c.imageUrl) {
    blocks.push({
      type: "image",
      image_url: c.imageUrl,
      alt_text: c.title,
    });
  }
  if (c.url) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: c.kind === "event" ? "RSVP" : "Open",
          },
          url: c.url,
          style: "primary",
        },
      ],
    });
  }
  return blocks;
}

// ---------- Web share URLs ---------------------------------------------------

/** LinkedIn share dialog. Opens prefilled; user can switch the "Post as"
 * dropdown to the company page after the dialog opens. There's no documented
 * way to force company-page selection via URL parameters. */
export function linkedInShareUrl(url: string): string {
  // The Sharing API URL only accepts `url`; LinkedIn fetches the OG tags from
  // the target page for title/summary/image. So make sure the URL has OG meta.
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

/** Generic LinkedIn group page — no share API. The dialog copies the caption
 * to clipboard before opening this URL so the admin can paste into the group. */
export const LINKEDIN_GROUP_URL =
  "https://www.linkedin.com/groups/14475239/";

/** Instagram has no web share. The dialog copies the caption to clipboard and
 * opens the profile so the admin can use the IG composer. */
export const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/atxuxr/";

// ---------- Channel registry ------------------------------------------------

export type ShareChannel =
  | "slack-events"
  | "slack-blog"
  | "slack-general"
  | "linkedin"
  | "linkedin-group"
  | "instagram";

export const CHANNEL_LABELS: Record<ShareChannel, string> = {
  "slack-events": "Slack #events",
  "slack-blog": "Slack #blog",
  "slack-general": "Slack #general",
  linkedin: "LinkedIn page",
  "linkedin-group": "LinkedIn group",
  instagram: "Instagram",
};
