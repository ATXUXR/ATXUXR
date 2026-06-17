import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { DateRangeSwitcher } from "./analytics/DateRangeSwitcher";
import { formatDurationMs, prettySource, type DashboardData } from "@/lib/analytics-types";

interface Props {
  data: DashboardData;
  days: number;
}

const cardBox: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  padding: "22px 24px",
  boxShadow: "var(--shadow-sm)",
};

const cardTitle: React.CSSProperties = {
  fontSize: 13,
  margin: "0 0 16px",
  fontFamily: "var(--font-mono)",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--fg-subtle)",
};

const stateNames: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

function deviceLabel(d: string): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

export function AnalyticsTab({ data, days }: Props) {
  const noData = data.sessions === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--fg-subtle)",
            }}
          >
            Insights · last {days} days
          </div>
          <h2 style={{ fontSize: 22, margin: "4px 0 0", color: "var(--fg)" }}>
            Traffic overview
          </h2>
        </div>
        <DateRangeSwitcher current={days} />
      </div>

      {/* Row 1 — KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <Kpi
          icon="activity"
          label="Sessions"
          value={data.sessions.toLocaleString()}
          tone={{ bg: "var(--orange-50)", fg: "var(--orange-700)" }}
        />
        <Kpi
          icon="users"
          label="Unique visitors"
          value={data.uniqueVisitors.toLocaleString()}
          tone={{ bg: "var(--teal-50)", fg: "var(--teal-700)" }}
        />
        <Kpi
          icon="clock"
          label="Avg session"
          value={formatDurationMs(data.avgSessionDurationMs)}
          tone={{ bg: "var(--honey-100)", fg: "var(--honey-700)" }}
        />
        <Kpi
          icon="log-out"
          label="Bounce rate"
          value={`${Math.round(data.bounceRate * 100)}%`}
          tone={{ bg: "var(--neutral-100)", fg: "var(--neutral-700)" }}
        />
      </div>

      {/* Row 2 — Sessions over time + Top sources */}
      <div
        className="analytics-row-2"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: 22,
        }}
      >
        <div style={cardBox}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h3 style={{ ...cardTitle, margin: 0 }}>Sessions over time</h3>
            <div
              style={{
                display: "flex",
                gap: 14,
                fontSize: 11.5,
                color: "var(--fg-subtle)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
              }}
            >
              <LegendDot color="var(--primary)" /> Sessions
              <LegendDot color="var(--teal-500)" /> Visitors
            </div>
          </div>
          <SessionsChart series={data.sessionsOverTime} />
          <div
            style={{
              marginTop: 14,
              display: "flex",
              gap: 28,
              fontSize: 13,
              color: "var(--fg-muted)",
            }}
          >
            <span>
              <strong style={{ color: "var(--fg)" }}>{data.pageviews.toLocaleString()}</strong> pageviews
            </span>
            <span>
              <strong style={{ color: "var(--fg)" }}>{data.avgPagesPerSession.toFixed(1)}</strong> pages / session
            </span>
          </div>
        </div>

        <div style={cardBox}>
          <h3 style={cardTitle}>Top sources</h3>
          <BarList
            rows={data.topSources.map((s) => ({ label: prettySource(s.source), value: s.sessions }))}
            emptyText={noData ? "No traffic yet." : "All visits look direct."}
          />
        </div>
      </div>

      {/* Row 3 — Top pages + Devices + States */}
      <div
        className="analytics-row-3"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 22,
        }}
      >
        <div style={cardBox}>
          <h3 style={cardTitle}>Top pages</h3>
          <BarList
            rows={data.topPages.map((p) => ({ label: p.path, value: p.views, mono: true }))}
            emptyText="No page views yet."
          />
        </div>

        <div style={cardBox}>
          <h3 style={cardTitle}>Devices</h3>
          <BarList
            rows={data.devices.map((d) => ({ label: deviceLabel(d.device), value: d.sessions }))}
            emptyText="No device data."
          />
        </div>

        <div style={cardBox}>
          <h3 style={cardTitle}>Top US states</h3>
          <BarList
            rows={data.states.map((s) => ({
              label: stateNames[s.region] || s.region,
              value: s.sessions,
              badge: s.region,
            }))}
            emptyText="No US state data yet."
          />
        </div>
      </div>

      {/* Row 4 — Insights */}
      <div style={cardBox}>
        <h3 style={cardTitle}>Insights</h3>
        {data.insights.length === 0 ? (
          <p style={{ color: "var(--fg-muted)", fontSize: 14, margin: 0 }}>
            Nothing notable yet. Check back as the data grows.
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {data.insights.map((line, i) => (
              <InsightRow key={i} raw={line} />
            ))}
          </ul>
        )}
      </div>

      {/* Row 5 — Form submissions */}
      <div style={cardBox}>
        <h3 style={cardTitle}>Form submissions · last {days} days</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
          }}
        >
          <FormStat label="RSVPs" count={data.formSubmissions.rsvps} href="/admin?tab=rsvps" icon="calendar-check" />
          <FormStat label="Volunteers" count={data.formSubmissions.volunteers} href="/admin?tab=volunteers" icon="hand-heart" />
          <FormStat label="Sign-ups" count={data.formSubmissions.signups} href="/admin?tab=signups" icon="mail" />
          <FormStat label="Feedback" count={data.formSubmissions.feedback} href="/admin?tab=feedback" icon="message-circle" />
          <EmailRsvpStat
            count={data.signupsFromEmail}
            ofTotal={data.formSubmissions.rsvps}
          />
        </div>
      </div>
    </div>
  );
}

function EmailRsvpStat({ count, ofTotal }: { count: number; ofTotal: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        background: "var(--orange-50)",
        color: "var(--fg)",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 34,
          height: 34,
          borderRadius: "var(--radius-sm)",
          background: "var(--orange-100, #FFE2D4)",
          color: "var(--orange-700)",
          flex: "none",
        }}
      >
        <Icon name="send" size={16} />
      </span>
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 22,
            lineHeight: 1,
            color: "var(--fg)",
          }}
        >
          {count}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginTop: 4 }}>
          RSVPs via email
          {ofTotal > 0 && (
            <span style={{ color: "var(--fg-subtle)" }}>
              {" "}· of {ofTotal} total
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  tone: { bg: string; fg: string };
}) {
  return (
    <div style={cardBox}>
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 38,
          height: 38,
          borderRadius: "var(--radius-md)",
          background: tone.bg,
          color: tone.fg,
        }}
      >
        <Icon name={icon} size={18} />
      </span>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 32,
          lineHeight: 1,
          color: "var(--fg)",
          marginTop: 14,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 6 }}>{label}</div>
    </div>
  );
}

function LegendDot({ color }: { color: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: color,
          display: "inline-block",
        }}
      />
    </span>
  );
}

function BarList({
  rows,
  emptyText,
}: {
  rows: { label: string; value: number; mono?: boolean; badge?: string }[];
  emptyText: string;
}) {
  if (rows.length === 0) {
    return (
      <p style={{ color: "var(--fg-muted)", fontSize: 14, margin: 0 }}>{emptyText}</p>
    );
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {rows.map((r, i) => {
        const pct = Math.max(2, Math.round((r.value / max) * 100));
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                fontSize: 13.5,
              }}
            >
              <span
                style={{
                  color: "var(--fg)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  flex: 1,
                  fontFamily: r.mono ? "var(--font-mono)" : undefined,
                  fontSize: r.mono ? 12.5 : 13.5,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {r.badge && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "var(--surface-sunk)",
                      color: "var(--fg-subtle)",
                      flex: "none",
                    }}
                  >
                    {r.badge}
                  </span>
                )}
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.label}
                </span>
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "var(--fg)",
                  flex: "none",
                }}
              >
                {r.value}
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: "var(--surface-sunk)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: pct + "%",
                  height: "100%",
                  background: "var(--primary)",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SessionsChart({
  series,
}: {
  series: { date: string; sessions: number; visitors: number }[];
}) {
  const W = 720;
  const H = 200;
  const padding = { top: 16, right: 12, bottom: 26, left: 32 };
  const innerW = W - padding.left - padding.right;
  const innerH = H - padding.top - padding.bottom;
  const n = series.length;

  if (n === 0) {
    return (
      <div style={{ color: "var(--fg-muted)", fontSize: 14, padding: "30px 0" }}>
        No data in range.
      </div>
    );
  }
  const maxValRaw = Math.max(
    ...series.map((s) => Math.max(s.sessions, s.visitors)),
    1,
  );
  // Round max up so the Y-axis looks nice.
  const maxVal = niceCeiling(maxValRaw);

  function x(i: number): number {
    if (n === 1) return padding.left + innerW / 2;
    return padding.left + (i / (n - 1)) * innerW;
  }
  function y(v: number): number {
    return padding.top + innerH - (v / maxVal) * innerH;
  }

  // Build smooth-ish path strings (straight lines but rounded corners feel fine here).
  function buildPath(get: (s: { sessions: number; visitors: number }) => number, close: boolean): string {
    let d = "";
    series.forEach((s, i) => {
      d += (i === 0 ? "M" : "L") + x(i).toFixed(1) + " " + y(get(s)).toFixed(1) + " ";
    });
    if (close) {
      d += "L" + x(n - 1).toFixed(1) + " " + (padding.top + innerH).toFixed(1) + " ";
      d += "L" + x(0).toFixed(1) + " " + (padding.top + innerH).toFixed(1) + " Z";
    }
    return d.trim();
  }
  const sessionsArea = buildPath((s) => s.sessions, true);
  const sessionsLine = buildPath((s) => s.sessions, false);
  const visitorsLine = buildPath((s) => s.visitors, false);

  // X-axis labels: at most ~6, evenly spaced.
  const labelStep = Math.max(1, Math.ceil(n / 6));
  const xLabels = series
    .map((s, i) => (i % labelStep === 0 || i === n - 1 ? i : -1))
    .filter((i) => i >= 0);

  // Y-axis ticks.
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxVal * f));

  return (
    <div style={{ width: "100%" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: 200, display: "block" }}
        aria-label="Sessions and visitors over time"
        role="img"
      >
        <defs>
          <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y-axis grid + labels */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              x2={padding.left + innerW}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--border)"
              strokeDasharray={i === 0 ? "0" : "2 4"}
              strokeWidth={i === 0 ? 1 : 0.75}
            />
            <text
              x={padding.left - 6}
              y={y(t) + 3.5}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fill="var(--fg-subtle)"
            >
              {t}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--fg-subtle)"
          >
            {shortDate(series[i].date)}
          </text>
        ))}

        {/* Sessions area + line */}
        <path d={sessionsArea} fill="url(#sessionsFill)" stroke="none" />
        <path
          d={sessionsLine}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Visitors line */}
        <path
          d={visitorsLine}
          fill="none"
          stroke="var(--teal-500)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Endpoint dots */}
        {n > 0 && (
          <>
            <circle
              cx={x(n - 1)}
              cy={y(series[n - 1].sessions)}
              r="3.5"
              fill="var(--primary)"
            />
            <circle
              cx={x(n - 1)}
              cy={y(series[n - 1].visitors)}
              r="3"
              fill="var(--teal-500)"
            />
          </>
        )}
      </svg>
    </div>
  );
}

function niceCeiling(n: number): number {
  if (n <= 4) return 4;
  if (n <= 10) return Math.ceil(n);
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  const top = Math.ceil(n / mag) * mag;
  // Make it nicer — round to next 5x or 2x multiple of mag.
  const steps = [1, 2, 2.5, 5, 10];
  for (const s of steps) {
    const cand = s * mag;
    if (cand >= n) return Math.round(cand);
  }
  return top;
}

function shortDate(iso: string): string {
  if (!iso || iso.length < 10) return iso;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const idx = parseInt(m, 10) - 1;
  return `${months[idx] || m} ${parseInt(d, 10)}`;
}

function InsightRow({ raw }: { raw: string }) {
  const m = /^\[(hot|trend|issue|info)\]\s*(.*)$/i.exec(raw);
  const tag = (m?.[1] || "info").toLowerCase();
  const text = m?.[2] || raw;
  const glyph = tag === "hot" ? "🔥" : tag === "trend" ? "📈" : tag === "issue" ? "⚠️" : "💡";
  const tone =
    tag === "hot"
      ? { bg: "var(--orange-50)", fg: "var(--orange-700)" }
      : tag === "trend"
      ? { bg: "var(--teal-50)", fg: "var(--teal-700)" }
      : tag === "issue"
      ? { bg: "var(--danger-bg)", fg: "var(--danger)" }
      : { bg: "var(--honey-100)", fg: "var(--honey-700)" };
  return (
    <li
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "10px 12px",
        background: tone.bg,
        borderRadius: "var(--radius-md)",
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1.2, flex: "none" }} aria-hidden>
        {glyph}
      </span>
      <span
        style={{
          fontSize: 14,
          color: "var(--fg)",
          lineHeight: 1.5,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: tone.fg,
            marginRight: 8,
          }}
        >
          {tag}
        </span>
        {text}
      </span>
    </li>
  );
}

function FormStat({
  label,
  count,
  href,
  icon,
}: {
  label: string;
  count: number;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        background: "var(--bg)",
        textDecoration: "none",
        color: "var(--fg)",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 34,
          height: 34,
          borderRadius: "var(--radius-sm)",
          background: "var(--surface-sunk)",
          color: "var(--fg-muted)",
          flex: "none",
        }}
      >
        <Icon name={icon} size={16} />
      </span>
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 22,
            lineHeight: 1,
            color: "var(--fg)",
          }}
        >
          {count}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--fg-muted)", marginTop: 4 }}>{label}</div>
      </div>
    </Link>
  );
}
