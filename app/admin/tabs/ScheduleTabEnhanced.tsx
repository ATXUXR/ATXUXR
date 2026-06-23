"use client";

import { useState, useEffect } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { AddToCalendarModal } from "@/app/admin/components/AddToCalendarModal";
import { generateSmartSuggestions, type SmartSuggestion } from "@/lib/smart-scheduling";

interface ScheduledPost {
  id: string;
  title: string;
  pillar?: string;
  postType?: string;
  scheduledDate: string;
  channelsCount: number;
  status: string;
}

interface PublishedPost {
  id: string;
  title: string;
  created_at: string;
  status: "published" | "pending" | "rejected";
}

interface CalendarEvent {
  id: string;
  title: string;
  starts_at: string;
  kind: "CONNECT" | "REFLECT" | "LEARN";
}

interface CalendarItem {
  id: string;
  title: string;
  date: string;
  type: "scheduled" | "published" | "event";
  pillar?: string;
  kind?: string;
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

export function ScheduleTabEnhanced() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [cadence, setCadence] = useState<CadenceMetric[]>([]);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (cadence.length > 0) {
      const smartSuggestions = generateSmartSuggestions(cadence);
      setSuggestions(smartSuggestions);
    }
  }, [cadence]);

  const fetchData = async () => {
    try {
      const [scheduledRes, publishedRes, eventsRes, cadenceRes] = await Promise.all([
        fetch("/api/admin/calendar/scheduled"),
        fetch("/api/admin/calendar/published"),
        fetch("/api/admin/calendar/events"),
        fetch("/api/admin/calendar/cadence"),
      ]);

      const allItems: CalendarItem[] = [];

      if (scheduledRes.ok) {
        const data = await scheduledRes.json();
        (data.posts || []).forEach((post: ScheduledPost) => {
          allItems.push({
            id: post.id,
            title: post.title,
            date: post.scheduledDate,
            type: "scheduled",
            pillar: post.pillar,
          });
        });
      }

      if (publishedRes.ok) {
        const data = await publishedRes.json();
        (data || []).forEach((post: PublishedPost) => {
          allItems.push({
            id: post.id,
            title: post.title,
            date: post.created_at,
            type: "published",
          });
        });
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        (data || []).forEach((event: CalendarEvent) => {
          allItems.push({
            id: event.id,
            title: event.title,
            date: event.starts_at,
            type: "event",
            kind: event.kind,
          });
        });
      }

      setItems(allItems);

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

  const getItemsForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return items.filter((item) => item.date?.startsWith(dateStr));
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{monthName}</h2>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: 12 }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} style={{ textAlign: "center", fontWeight: 600, fontSize: 12, color: "var(--fg-muted)", padding: "8px 4px" }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {emptyDays.map((i) => (
            <div key={`empty-${i}`} style={{ background: "var(--bg)", minHeight: 100, borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }} />
          ))}
          {days.map((day) => {
            const dayItems = getItemsForDate(day);
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
                  position: "relative",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{day}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {dayItems.map((item) => {
                    let itemStyle: React.CSSProperties;
                    let badge = "";

                    if (item.type === "scheduled") {
                      const colors = PILLAR_COLORS[item.pillar || ""] || {
                        bg: "var(--orange-50)",
                        fg: "var(--orange-700)",
                        dot: "var(--orange-600)",
                      };
                      itemStyle = {
                        background: colors.bg,
                        color: colors.fg,
                        borderLeft: `2px solid ${colors.dot}`,
                      };
                      badge = "📅";
                    } else if (item.type === "published") {
                      itemStyle = {
                        background: "var(--success-bg)",
                        color: "var(--success)",
                        borderLeft: "2px solid var(--success)",
                      };
                      badge = "✓";
                    } else {
                      itemStyle = {
                        background: "var(--blue-50)",
                        color: "var(--blue-700)",
                        borderLeft: "2px solid var(--blue-600)",
                      };
                      badge = "🎯";
                    }

                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setHoveredPost(item.id)}
                        onMouseLeave={() => setHoveredPost(null)}
                        style={{
                          ...itemStyle,
                          padding: "3px 6px",
                          borderRadius: 3,
                          fontSize: 10,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          cursor: "default",
                          opacity: hoveredPost === item.id ? 0.85 : 1,
                          transition: "opacity 200ms",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        } as React.CSSProperties}
                        title={`${badge} ${item.title} (${item.type})`}
                      >
                        <span style={{ fontSize: 8 }}>{badge}</span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Suggestions Sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Cadence Sidebar */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700 }}>Cadence</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 400, overflowY: "auto" }}>
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
                  <div style={{ fontSize: 11, fontWeight: 600, color: colors.fg, marginBottom: 4 }}>
                    {metric.pillar}
                  </div>
                  <div style={{ fontSize: 10, color: colors.fg, lineHeight: 1.4 }}>
                    {metric.lastPostDate ? (
                      <>
                        <div>
                          Last: {metric.daysSinceLastPost}d ago
                          {metric.isOverdue && (
                            <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                              {" "}
                              ⚠️
                            </span>
                          )}
                        </div>
                        <div>Cadence: {metric.averageDaysBetweenPosts}d</div>
                      </>
                    ) : (
                      <div>No posts yet</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Smart Suggestions */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700 }}>✨ Next Steps</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
            {suggestions.slice(0, 3).map((sug) => {
              const colors = PILLAR_COLORS[sug.pillar] || {
                bg: "var(--orange-50)",
                fg: "var(--orange-700)",
                dot: "var(--orange-600)",
              };
              const priorityColor =
                sug.priority === "critical"
                  ? "var(--danger)"
                  : sug.priority === "high"
                  ? "var(--warning)"
                  : "var(--fg-muted)";

              return (
                <div
                  key={sug.pillar}
                  style={{
                    padding: 10,
                    borderRadius: "var(--radius-md)",
                    background: colors.bg,
                    borderLeft: `3px solid ${priorityColor}`,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: priorityColor, marginBottom: 3 }}>
                    {sug.priority.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: colors.fg, marginBottom: 4 }}>
                    {sug.pillar}
                  </div>
                  <div style={{ fontSize: 9, color: colors.fg }}>
                    {sug.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Btn style={{ width: "100%" }} onClick={() => setShowAddModal(true)}>
          <Icon name="plus" size={14} style={{ marginRight: 4 }} />
          Schedule Content
        </Btn>
      </div>

      <AddToCalendarModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSchedule={async (pillar, date) => {
          // This would schedule a draft; for now just close
          setShowAddModal(false);
          await fetchData();
        }}
        availablePillars={cadence.map((c) => c.pillar)}
      />
    </div>
  );
}
