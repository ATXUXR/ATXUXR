"use client";

import { useState, useEffect } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

interface ScheduledPost {
  id: string;
  title: string;
  pillar?: string;
  postType?: string;
  scheduledDate: string;
  channelsCount: number;
  status: string;
}

interface CadenceMetric {
  pillar: string;
  lastPostDate: string | null;
  daysSinceLastPost: number | null;
  averageDaysBetweenPosts: number;
  totalPostsInPeriod: number;
  suggestedNextSlots: string[];
  isOverdue: boolean;
}

const PILLAR_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  "Probabilistic User Research": { bg: "var(--blue-50)", fg: "var(--blue-700)", dot: "var(--blue-600)" },
  "Agentic and Anticipatory UX": { bg: "var(--purple-50)", fg: "var(--purple-700)", dot: "var(--purple-600)" },
  "Research Craft in the AI Era": { bg: "var(--orange-50)", fg: "var(--orange-700)", dot: "var(--orange-600)" },
  "Trust, Verification, and Safe Reliance": { bg: "var(--green-50)", fg: "var(--green-700)", dot: "var(--green-600)" },
  "AI Economics and Value": { bg: "var(--red-50)", fg: "var(--red-700)", dot: "var(--red-600)" },
};

export function ScheduleTab() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [cadence, setCadence] = useState<CadenceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, cadenceRes] = await Promise.all([
        fetch("/api/admin/calendar/scheduled"),
        fetch("/api/admin/calendar/cadence"),
      ]);

      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts || []);
      }

      if (cadenceRes.ok) {
        const data = await cadenceRes.json();
        setCadence(data);
      }
    } catch (err) {
      console.error("Failed to fetch schedule data:", err);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPostsForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return posts.filter(
      (p) => p.scheduledDate?.startsWith(dateStr)
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const days = Array.from({ length: daysInMonth(currentMonth) }, (_, i) => i + 1);
  const firstDay = firstDayOfMonth(currentMonth);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
      {/* Main Calendar */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            {monthName}
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" size="sm" onClick={handlePrevMonth} icon="arrow-left">
              Prev
            </Btn>
            <Btn variant="secondary" size="sm" onClick={handleNextMonth} icon="arrow-right">
              Next
            </Btn>
          </div>
        </div>

        {/* Day headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 1,
            marginBottom: 12,
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              style={{
                textAlign: "center",
                fontWeight: 600,
                fontSize: 12,
                color: "var(--fg-muted)",
                padding: "8px 4px",
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 1,
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          {emptyDays.map((i) => (
            <div
              key={`empty-${i}`}
              style={{
                background: "var(--bg)",
                minHeight: 100,
                borderRight: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
              }}
            />
          ))}
          {days.map((day) => {
            const dayPosts = getPostsForDate(day);
            return (
              <div
                key={day}
                style={{
                  background: "var(--surface)",
                  minHeight: 100,
                  padding: 8,
                  borderRight: "1px solid var(--border)",
                  borderBottom: "1px solid var(--border)",
                  overflow: "hidden",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                  {day}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {dayPosts.map((post) => {
                    const colors = PILLAR_COLORS[post.pillar || ""] || {
                      bg: "var(--orange-50)",
                      fg: "var(--orange-700)",
                      dot: "var(--orange-600)",
                    };
                    return (
                      <div
                        key={post.id}
                        style={{
                          background: colors.bg,
                          padding: "3px 6px",
                          borderRadius: 3,
                          fontSize: 10,
                          color: colors.fg,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                        }}
                        title={post.title}
                      >
                        {post.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cadence Sidebar */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: 16,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700 }}>
          Cadence
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cadence.map((metric) => {
            const colors = PILLAR_COLORS[metric.pillar] || {
              bg: "var(--orange-50)",
              fg: "var(--orange-700)",
              dot: "var(--orange-600)",
            };
            return (
              <div
                key={metric.pillar}
                style={{
                  padding: 10,
                  borderRadius: "var(--radius-md)",
                  background: colors.bg,
                  borderLeft: `3px solid ${colors.dot}`,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: colors.fg,
                    marginBottom: 4,
                  }}
                >
                  {metric.pillar}
                </div>
                <div style={{ fontSize: 11, color: colors.fg, lineHeight: 1.4 }}>
                  {metric.lastPostDate ? (
                    <>
                      <div>
                        Last: {metric.daysSinceLastPost}d ago
                        {metric.isOverdue && (
                          <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                            {" "}
                            ⚠️ OVERDUE
                          </span>
                        )}
                      </div>
                      <div>Cadence: {metric.averageDaysBetweenPosts}d</div>
                      <div style={{ marginTop: 4, fontSize: 10 }}>
                        {metric.suggestedNextSlots.map((slot) => (
                          <div key={slot}>{slot}</div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div>No posts yet</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Btn
          style={{ width: "100%", marginTop: 16 }}
          onClick={() => setSelectedPillar(selectedPillar ? null : cadence[0]?.pillar || null)}
        >
          <Icon name="plus" size={14} style={{ marginRight: 4 }} />
          Add Content
        </Btn>
      </div>
    </div>
  );
}
