// Pure types + formatting helpers shared between client and server.
// Importing this from a client component is safe.

export interface DashboardData {
  range: { from: string; to: string; days: number };
  sessions: number;
  uniqueVisitors: number;
  pageviews: number;
  avgSessionDurationMs: number;
  avgPagesPerSession: number;
  bounceRate: number;
  sessionsOverTime: { date: string; sessions: number; visitors: number }[];
  topSources: { source: string; sessions: number }[];
  topPages: { path: string; views: number }[];
  devices: { device: string; sessions: number }[];
  states: { region: string; sessions: number }[];
  countries: { country: string; sessions: number }[];
  insights: string[];
  formSubmissions: {
    rsvps: number;
    volunteers: number;
    signups: number;
    feedback: number;
  };
  signupsFromEmail: number;
}

export function formatDurationMs(ms: number): string {
  if (!ms || ms <= 0) return "0s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return `${m}m ${r}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function prettySource(source: string): string {
  if (!source) return "direct";
  if (source === "direct") return "direct/typed";
  if (source === "linkedin") return "LinkedIn";
  if (source === "google") return "Google";
  if (source === "twitter") return "Twitter/X";
  if (source === "instagram") return "Instagram";
  if (source === "facebook") return "Facebook";
  if (source === "bing") return "Bing";
  if (source === "reddit") return "Reddit";
  return source;
}
