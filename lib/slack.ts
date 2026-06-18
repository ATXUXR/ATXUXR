// Slack Incoming Webhooks sender. Each channel ID maps to its own webhook env
// var so the admin can route messages to different channels. Returns true on
// 200 from Slack, throws otherwise so the caller can log the reason.

import type { ShareChannel } from "./social";

const WEBHOOK_ENV: Record<string, string | undefined> = {
  "slack-events": process.env.SLACK_WEBHOOK_EVENTS,
  "slack-blog": process.env.SLACK_WEBHOOK_BLOG,
  "slack-general": process.env.SLACK_WEBHOOK_GENERAL,
};

export function slackWebhookConfigured(channel: ShareChannel): boolean {
  return Boolean(WEBHOOK_ENV[channel]);
}

export function configuredSlackChannels(): ShareChannel[] {
  return (Object.keys(WEBHOOK_ENV) as ShareChannel[]).filter((c) =>
    slackWebhookConfigured(c),
  );
}

interface SlackPayload {
  text: string; // fallback for clients without Block Kit support
  blocks?: unknown[];
  unfurl_links?: boolean;
}

/** POST a payload to the channel's webhook URL. Throws on non-2xx with the
 * Slack error string in the message. */
export async function postToSlack(
  channel: ShareChannel,
  payload: SlackPayload,
): Promise<void> {
  const url = WEBHOOK_ENV[channel];
  if (!url) {
    throw new Error(`No webhook configured for ${channel}`);
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Slack returned ${res.status}: ${body || res.statusText}`);
  }
}
