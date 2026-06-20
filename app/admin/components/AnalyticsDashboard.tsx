"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  totalScheduledPosts: number;
  averagePostsPerMonth: number;
  pillarDistribution: Record<string, number>;
  contentGaps: string[];
  lastPublishedDate: string | null;
  nextPublishDate: string | null;
  healthScore: number;
}

const PILLAR_COLORS: Record<string, string> = {
  "Probabilistic User Research": "var(--blue-600)",
  "Agentic and Anticipatory UX": "var(--purple-600)",
  "Research Craft in the AI Era": "var(--orange-600)",
  "Trust, Verification, and Safe Reliance": "var(--green-600)",
  "AI Economics and Value": "var(--red-600)",
};

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/calendar/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!analytics) {
    return (
      <div
        style={{
          padding: 16,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          textAlign: "center",
          color: "var(--fg-muted)",
        }}
      >
        {loading ? "Loading analytics..." : "No data available"}
      </div>
    );
  }

  const healthColor =
    analytics.healthScore >= 80
      ? "var(--green-600)"
      : analytics.healthScore >= 60
      ? "var(--warning)"
      : "var(--danger)";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <div
          style={{
            padding: 16,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 700, marginBottom: 4 }}>
            SCHEDULED POSTS (6M)
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--fg)" }}>
            {analytics.totalScheduledPosts}
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 4 }}>
            {analytics.averagePostsPerMonth}/month avg
          </div>
        </div>

        <div
          style={{
            padding: 16,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 700, marginBottom: 4 }}>
            HEALTH SCORE
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: healthColor }}>
            {analytics.healthScore}%
          </div>
          <div
            style={{
              height: 4,
              background: "var(--border)",
              borderRadius: 2,
              marginTop: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: healthColor,
                width: `${analytics.healthScore}%`,
                transition: "width 300ms",
              }}
            />
          </div>
        </div>
      </div>

      {/* Pillar Distribution */}
      <div
        style={{
          padding: 16,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12, color: "var(--fg)" }}>
          Pillar Distribution
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(analytics.pillarDistribution).map(([pillar, count]) => {
            const total = analytics.totalScheduledPosts;
            const percentage = Math.round((count / total) * 100);
            const color = PILLAR_COLORS[pillar] || "var(--fg-muted)";

            return (
              <div key={pillar}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: "var(--fg)" }}>{pillar}</span>
                  <span style={{ color: "var(--fg-muted)", fontWeight: 700 }}>
                    {count} ({percentage}%)
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: "var(--bg)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: color,
                      width: `${percentage}%`,
                      transition: "width 300ms",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Gaps & Warnings */}
      {analytics.contentGaps.length > 0 && (
        <div
          style={{
            padding: 12,
            background: "var(--warning-bg)",
            border: "1px solid var(--warning)",
            borderRadius: "var(--radius-lg)",
            fontSize: 12,
            color: "var(--warning)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Content Gaps</div>
          <div style={{ fontSize: 11 }}>
            {analytics.contentGaps.join(", ")} — consider prioritizing these pillars.
          </div>
        </div>
      )}

      {/* Upcoming Schedule */}
      {analytics.nextPublishDate && (
        <div
          style={{
            padding: 12,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            fontSize: 11,
          }}
        >
          <div style={{ color: "var(--fg-muted)", marginBottom: 4 }}>Next publish date</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)" }}>
            {new Date(analytics.nextPublishDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      )}
    </div>
  );
}
