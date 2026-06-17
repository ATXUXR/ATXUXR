"use client";

import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { toneForTag } from "@/lib/utils";

interface Props {
  memberCount: number;
  publishedCount: number;
  signupCount: number;
  topTags: Array<{ tag: string; count: number }>;
  topPosts: Array<{ id: string; title: string; reactions: number }>;
}

const PLACEHOLDER_WEEKLY = [
  { label: "Apr 13", v: 0 },
  { label: "Apr 20", v: 0 },
  { label: "Apr 27", v: 0 },
  { label: "May 4", v: 0 },
  { label: "May 11", v: 0 },
  { label: "May 18", v: 0 },
  { label: "May 25", v: 0 },
  { label: "Jun 1", v: 0 },
];

const cardBox: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  padding: "22px 24px",
  boxShadow: "var(--shadow-sm)",
};
const cardTitle: React.CSSProperties = {
  fontSize: 15,
  margin: "0 0 18px",
  fontFamily: "var(--font-mono)",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--fg-subtle)",
};

export function AnalyticsTab({
  memberCount,
  publishedCount,
  signupCount,
  topTags,
  topPosts,
}: Props) {
  const kpis: Array<{
    label: string;
    value: number;
    sub: string;
    icon: string;
    tone: { bg: string; fg: string };
  }> = [
    {
      label: "Members",
      value: memberCount,
      sub: "Community accounts",
      icon: "users",
      tone: { bg: "var(--teal-50)", fg: "var(--teal-700)" },
    },
    {
      label: "Posts",
      value: publishedCount,
      sub: "Published",
      icon: "file-text",
      tone: { bg: "var(--honey-100)", fg: "var(--honey-700)" },
    },
    {
      label: "Mailing list",
      value: signupCount,
      sub: "People on the list",
      icon: "mail",
      tone: { bg: "var(--orange-50)", fg: "var(--orange-700)" },
    },
  ];

  const maxReact = Math.max(...topPosts.map((p) => p.reactions), 1);
  const maxTag = Math.max(...topTags.map((t) => t.count), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {kpis.map((k) => (
          <div key={k.label} style={cardBox}>
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 42,
                height: 42,
                borderRadius: "var(--radius-md)",
                background: k.tone.bg,
                color: k.tone.fg,
              }}
            >
              <Icon name={k.icon} size={20} />
            </span>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 34,
                lineHeight: 1,
                color: "var(--fg)",
                marginTop: 16,
              }}
            >
              {k.value}
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--fg)",
                fontWeight: 600,
                marginTop: 6,
              }}
            >
              {k.label}
            </div>
            <div
              style={{ fontSize: 12.5, color: "var(--fg-subtle)", marginTop: 2 }}
            >
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 22,
        }}
      >
        <div style={cardBox}>
          <h3 style={cardTitle}>Top tags by use</h3>
          {topTags.length === 0 && (
            <p
              style={{
                color: "var(--fg-muted)",
                fontSize: 14,
                margin: 0,
              }}
            >
              No tags in use yet.
            </p>
          )}
          {topTags.map((t) => {
            const pct = Math.round((t.count / maxTag) * 100);
            return (
              <div
                key={t.tag}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 13,
                }}
              >
                <span style={{ width: 110, flex: "none" }}>
                  <Tag tone={toneForTag(t.tag)} style={{ fontSize: 10 }}>
                    {t.tag}
                  </Tag>
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 10,
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
                <span
                  style={{
                    width: 28,
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "var(--fg)",
                  }}
                >
                  {t.count}
                </span>
              </div>
            );
          })}
        </div>

        <div style={cardBox}>
          <h3 style={cardTitle}>Weekly visits</h3>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              height: 150,
            }}
          >
            {PLACEHOLDER_WEEKLY.map((w) => (
              <div
                key={w.label}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                    height: 118,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 4,
                      background:
                        "linear-gradient(180deg, var(--orange-200), var(--orange-300))",
                      borderRadius: "6px 6px 0 0",
                      opacity: 0.4,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    color: "var(--fg-subtle)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {w.label}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12.5,
              color: "var(--fg-subtle)",
              marginTop: 14,
            }}
          >
            <Icon name="info" size={13} /> Real analytics wiring coming with
            Phase 3.
          </div>
        </div>
      </div>

      <div style={cardBox}>
        <h3 style={cardTitle}>Top posts by reaction count</h3>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 480 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 160px",
                gap: 12,
                padding: "0 0 10px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {["Post", "Reactions", "Engagement"].map((h, i) => (
                <span
                  key={h}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--fg-subtle)",
                    fontWeight: 700,
                    textAlign: i === 0 ? "left" : "right",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
            {topPosts.length === 0 && (
              <div
                style={{
                  padding: "20px 0",
                  color: "var(--fg-muted)",
                  fontSize: 14,
                }}
              >
                No reactions yet.
              </div>
            )}
            {topPosts.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 160px",
                  gap: 12,
                  alignItems: "center",
                  padding: "13px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--fg)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.title}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: "var(--fg)",
                  }}
                >
                  {p.reactions}
                </span>
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: "var(--surface-sunk)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width:
                        Math.round((p.reactions / maxReact) * 100) + "%",
                      height: "100%",
                      background: "var(--teal-500)",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
