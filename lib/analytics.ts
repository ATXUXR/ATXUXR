// Server-only analytics. Do NOT import this from a client component
// (it transitively loads the service-role Supabase client). Use
// `lib/analytics-types` for types + pure formatters.
import { createServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";
import type { DashboardData } from "@/lib/analytics-types";

export type { DashboardData } from "@/lib/analytics-types";
export { formatDurationMs, prettySource } from "@/lib/analytics-types";

export interface AnalyticsRange {
  from: Date;
  to: Date;
  days: number;
}

// Each row we pull from page_views in the window.
interface PvRow {
  session_id: string;
  path: string;
  source: string | null;
  device: string | null;
  region: string | null;
  country: string | null;
  ip_hash: string | null;
  created_at: string;
}

export function rangeFromDays(days: number): AnalyticsRange {
  const safeDays = Math.max(1, Math.min(365, Math.round(days)));
  const to = new Date();
  const from = new Date(to.getTime() - safeDays * 24 * 60 * 60 * 1000);
  return { from, to, days: safeDays };
}

function dayKey(iso: string): string {
  // YYYY-MM-DD in UTC. Good enough for a small-site dashboard.
  return iso.slice(0, 10);
}

function dayKeyFromDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function emptyDashboard(
  range: AnalyticsRange,
  forms: DashboardData["formSubmissions"],
  signupsFromEmail: number,
): DashboardData {
  return {
    range: {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      days: range.days,
    },
    sessions: 0,
    uniqueVisitors: 0,
    pageviews: 0,
    avgSessionDurationMs: 0,
    avgPagesPerSession: 0,
    bounceRate: 0,
    sessionsOverTime: buildEmptyDays(range),
    topSources: [],
    topPages: [],
    devices: [],
    states: [],
    countries: [],
    insights: [
      "[info] No pageviews recorded yet for this range — the telemetry will fill in once visitors start arriving.",
    ],
    formSubmissions: forms,
    signupsFromEmail,
  };
}

function buildEmptyDays(range: AnalyticsRange): { date: string; sessions: number; visitors: number }[] {
  const out: { date: string; sessions: number; visitors: number }[] = [];
  const start = new Date(range.from);
  start.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < range.days + 1; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    if (d.getTime() > range.to.getTime() + 86400000) break;
    out.push({ date: dayKeyFromDate(d), sessions: 0, visitors: 0 });
  }
  return out;
}

async function fetchFormCounts(
  range: AnalyticsRange,
): Promise<DashboardData["formSubmissions"]> {
  const empty = { rsvps: 0, volunteers: 0, signups: 0, feedback: 0 };
  if (!isServiceClientConfigured()) return empty;
  const supabase = createServiceClient();
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();
  const tables = ["rsvps", "volunteers", "signups", "feedback"] as const;
  const counts = await Promise.all(
    tables.map((t) =>
      supabase
        .from(t)
        .select("id", { count: "exact", head: true })
        .gte("created_at", fromIso)
        .lte("created_at", toIso),
    ),
  );
  return {
    rsvps: counts[0].count ?? 0,
    volunteers: counts[1].count ?? 0,
    signups: counts[2].count ?? 0,
    feedback: counts[3].count ?? 0,
  };
}

// Count distinct UTMs that were both clicked and within the window. Each utm
// corresponds to one personalized email_invite link → one RSVP attribution.
async function fetchSignupsFromEmail(range: AnalyticsRange): Promise<number> {
  if (!isServiceClientConfigured()) return 0;
  const supabase = createServiceClient();
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();
  const { data, error } = await supabase
    .from("email_sends")
    .select("utm, clicked_at")
    .not("clicked_at", "is", null)
    .gte("clicked_at", fromIso)
    .lte("clicked_at", toIso);
  if (error) return 0;
  const seen = new Set<string>();
  (data ?? []).forEach((r: { utm: string | null }) => {
    if (r.utm) seen.add(r.utm);
  });
  return seen.size;
}

export async function getDashboardData(days: number): Promise<DashboardData> {
  const range = rangeFromDays(days);
  const [forms, signupsFromEmail] = await Promise.all([
    fetchFormCounts(range),
    fetchSignupsFromEmail(range),
  ]);

  if (!isServiceClientConfigured()) {
    return emptyDashboard(range, forms, signupsFromEmail);
  }

  const supabase = createServiceClient();
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  // Pull all pageviews in window. We only keep the fields we need to limit payload.
  const { data: pv, error } = await supabase
    .from("page_views")
    .select("session_id, path, source, device, region, country, ip_hash, created_at")
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[analytics] page_views read failed:", error.message);
    return emptyDashboard(range, forms, signupsFromEmail);
  }

  const rows = (pv ?? []) as PvRow[];

  if (rows.length === 0) {
    return emptyDashboard(range, forms, signupsFromEmail);
  }

  // Group by session_id.
  type Sess = {
    pageviews: PvRow[];
    start: number;
    end: number;
    source: string;
    device: string;
    region: string | null;
    country: string | null;
    ip_hash: string | null;
  };
  const sessions = new Map<string, Sess>();
  for (const r of rows) {
    const t = new Date(r.created_at).getTime();
    let s = sessions.get(r.session_id);
    if (!s) {
      s = {
        pageviews: [],
        start: t,
        end: t,
        source: r.source || "direct",
        device: r.device || "desktop",
        region: r.region,
        country: r.country,
        ip_hash: r.ip_hash,
      };
      sessions.set(r.session_id, s);
    }
    s.pageviews.push(r);
    if (t < s.start) s.start = t;
    if (t > s.end) s.end = t;
    // Prefer non-direct source if multiple appear in one session.
    if (s.source === "direct" && r.source && r.source !== "direct") s.source = r.source;
    // Keep the first non-null region/country seen.
    if (!s.region && r.region) s.region = r.region;
    if (!s.country && r.country) s.country = r.country;
  }

  const totalSessions = sessions.size;
  const totalPageviews = rows.length;
  const ipSet = new Set<string>();
  let bounced = 0;
  let durationSum = 0;
  let durationCount = 0;
  const sourceCounts = new Map<string, number>();
  const pathCounts = new Map<string, number>();
  const deviceCounts = new Map<string, number>();
  const regionCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const dayCounts = new Map<string, { sessions: Set<string>; visitors: Set<string> }>();

  for (const [, s] of sessions) {
    if (s.pageviews.length <= 1) bounced++;
    // Session duration = last pageview ts − first pageview ts. With only one
    // pageview, duration is 0. Not perfect (we lose actual reading time on
    // the last page) but consistent with how Wix/Plausible reckon it.
    if (s.pageviews.length > 1) {
      durationSum += s.end - s.start;
      durationCount++;
    }
    if (s.ip_hash) ipSet.add(s.ip_hash);

    sourceCounts.set(s.source, (sourceCounts.get(s.source) || 0) + 1);
    deviceCounts.set(s.device, (deviceCounts.get(s.device) || 0) + 1);
    if (s.region && s.country === "US") {
      regionCounts.set(s.region, (regionCounts.get(s.region) || 0) + 1);
    }
    if (s.country) {
      countryCounts.set(s.country, (countryCounts.get(s.country) || 0) + 1);
    }

    // Day-of-first-view → counts as a session on that day.
    const firstDay = dayKey(new Date(s.start).toISOString());
    let bucket = dayCounts.get(firstDay);
    if (!bucket) {
      bucket = { sessions: new Set(), visitors: new Set() };
      dayCounts.set(firstDay, bucket);
    }
    bucket.sessions.add(s.pageviews[0].session_id);
    if (s.ip_hash) bucket.visitors.add(s.ip_hash);

    for (const r of s.pageviews) {
      pathCounts.set(r.path, (pathCounts.get(r.path) || 0) + 1);
    }
  }

  // Build the date-bucketed series with zero-fill so charts look right.
  const series = buildEmptyDays(range).map((d) => {
    const b = dayCounts.get(d.date);
    return {
      date: d.date,
      sessions: b ? b.sessions.size : 0,
      visitors: b ? b.visitors.size : 0,
    };
  });

  const sortDesc = <T extends { sessions?: number; views?: number }>(arr: T[]): T[] =>
    arr.sort(
      (a, b) =>
        (b.sessions ?? b.views ?? 0) - (a.sessions ?? a.views ?? 0),
    );

  const topSources = sortDesc(
    Array.from(sourceCounts.entries()).map(([source, sessions]) => ({ source, sessions })),
  ).slice(0, 8);

  const topPages = sortDesc(
    Array.from(pathCounts.entries()).map(([path, views]) => ({ path, views })),
  ).slice(0, 10);

  const devices = sortDesc(
    Array.from(deviceCounts.entries()).map(([device, sessions]) => ({ device, sessions })),
  );

  const states = sortDesc(
    Array.from(regionCounts.entries()).map(([region, sessions]) => ({ region, sessions })),
  ).slice(0, 12);

  const countries = sortDesc(
    Array.from(countryCounts.entries()).map(([country, sessions]) => ({ country, sessions })),
  ).slice(0, 10);

  const bounceRate = totalSessions > 0 ? bounced / totalSessions : 0;
  const avgSessionDurationMs = durationCount > 0 ? Math.round(durationSum / durationCount) : 0;
  const avgPagesPerSession = totalSessions > 0 ? totalPageviews / totalSessions : 0;

  const insights = buildInsights({
    sessions: totalSessions,
    uniqueVisitors: ipSet.size,
    topSources,
    topPages,
    devices,
    states,
    bounceRate,
    range,
  });

  return {
    range: {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      days: range.days,
    },
    sessions: totalSessions,
    uniqueVisitors: ipSet.size,
    pageviews: totalPageviews,
    avgSessionDurationMs,
    avgPagesPerSession,
    bounceRate,
    sessionsOverTime: series,
    topSources,
    topPages,
    devices,
    states,
    countries,
    insights,
    formSubmissions: forms,
    signupsFromEmail,
  };
}

interface InsightArgs {
  sessions: number;
  uniqueVisitors: number;
  topSources: { source: string; sessions: number }[];
  topPages: { path: string; views: number }[];
  devices: { device: string; sessions: number }[];
  states: { region: string; sessions: number }[];
  bounceRate: number;
  range: AnalyticsRange;
}

function pct(n: number, d: number): number {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function buildInsights(a: InsightArgs): string[] {
  const out: string[] = [];

  if (a.sessions === 0) {
    return ["[info] No sessions in this range yet."];
  }

  // Top source
  const top = a.topSources[0];
  if (top && top.sessions >= 3) {
    const share = pct(top.sessions, a.sessions);
    if (share >= 40) {
      out.push(
        `[hot] ${share}% of sessions came from ${pretty(top.source)} — your top source by a wide margin.`,
      );
    } else {
      out.push(
        `[trend] ${pretty(top.source)} is your top source with ${top.sessions} sessions (${share}%).`,
      );
    }
  }

  // Mobile share
  const mobile = a.devices.find((d) => d.device === "mobile");
  const desktop = a.devices.find((d) => d.device === "desktop");
  if (mobile && mobile.sessions >= 3) {
    const share = pct(mobile.sessions, a.sessions);
    if (share >= 50) {
      out.push(`[trend] Mobile is ${share}% of sessions — more than half your traffic.`);
    } else if (share >= 30) {
      out.push(`[info] Mobile is ${share}% of sessions — your mobile layout is being used.`);
    } else if (desktop && desktop.sessions > mobile.sessions * 4) {
      out.push(`[info] Mostly desktop visits (${pct(desktop.sessions, a.sessions)}%) — mobile is light at ${share}%.`);
    }
  }

  // Top state
  const topState = a.states[0];
  if (topState && topState.sessions >= 5) {
    out.push(
      `[info] ${topState.region} is your top state (${topState.sessions} sessions).`,
    );
  }

  // High bounce rate
  if (a.sessions >= 10 && a.bounceRate >= 0.75) {
    out.push(
      `[issue] Bounce rate is ${Math.round(a.bounceRate * 100)}% — most visitors leave without a second pageview.`,
    );
  } else if (a.sessions >= 10 && a.bounceRate <= 0.4) {
    out.push(
      `[hot] Bounce rate is just ${Math.round(a.bounceRate * 100)}% — visitors are exploring more than one page.`,
    );
  }

  // Top page
  const topPage = a.topPages[0];
  if (topPage && topPage.views >= 5) {
    out.push(`[trend] ${topPage.path} is your most-viewed page (${topPage.views} views).`);
  }

  // Growth callout if range is long enough — last 7 days vs prior period.
  // (Cheap: count sessions whose start is in last 7 days vs prior 7.)
  // We don't have raw sessions here, so skip — leave for future iteration.

  if (out.length === 0) {
    out.push(`[info] ${a.sessions} sessions, ${a.uniqueVisitors} unique visitors in the last ${a.range.days} days.`);
  }

  return out.slice(0, 5);
}

function pretty(source: string): string {
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

