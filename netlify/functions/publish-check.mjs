// Netlify Scheduled Function — runs once a day and pings the app's cron
// endpoint, which publishes any drafts whose scheduled date has arrived.
// Set CRON_SECRET in the Netlify environment (same value the endpoint checks).
export default async function handler() {
  const base =
    process.env.URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://atxuxr.com";
  const secret = process.env.CRON_SECRET || "";
  const res = await fetch(`${base}/api/cron/publish-check`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
  return new Response(await res.text(), { status: res.status });
}

// 13:00 UTC ≈ 8:00 AM Central. Adjust the cron as you like.
export const config = { schedule: "0 13 * * *" };
