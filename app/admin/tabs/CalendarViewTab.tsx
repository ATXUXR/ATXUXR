"use client";

// Display-only calendar: scheduled content, published posts, and events across
// the month, past and upcoming. No editing here — scheduling happens in the
// Content Schedule tab.

import { useEffect, useState } from "react";
import { Btn } from "@/components/ui/Button";

interface Item {
  id: string;
  title: string;
  date: string;
  type: "scheduled" | "published" | "event";
}

const TONE: Record<Item["type"], { bg: string; fg: string; label: string }> = {
  scheduled: { bg: "var(--blue-50)", fg: "var(--blue-700)", label: "Scheduled" },
  published: { bg: "var(--success-bg)", fg: "var(--success)", label: "Published" },
  event: { bg: "var(--orange-50)", fg: "var(--orange-700)", label: "Event" },
};

export function CalendarViewTab() {
  const [month, setMonth] = useState(new Date());
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    (async () => {
      const [sch, pub, ev] = await Promise.all([
        fetch("/api/admin/calendar/scheduled")
          .then((r) => (r.ok ? r.json() : { posts: [] }))
          .catch(() => ({ posts: [] })),
        fetch("/api/admin/calendar/published")
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        fetch("/api/admin/calendar/events")
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
      ]);
      const all: Item[] = [];
      (sch.posts || []).forEach(
        (p: any) =>
          p.scheduled_date &&
          all.push({
            id: p.id,
            title: p.title || "Untitled",
            date: p.scheduled_date,
            type: "scheduled",
          }),
      );
      (Array.isArray(pub) ? pub : []).forEach((p: any) =>
        all.push({
          id: p.id,
          title: p.title || "Untitled",
          date: p.created_at,
          type: "published",
        }),
      );
      (Array.isArray(ev) ? ev : []).forEach((e: any) =>
        all.push({
          id: e.id,
          title: e.title || "Event",
          date: e.starts_at,
          type: "event",
        }),
      );
      setItems(all);
    })();
  }, []);

  const y = month.getFullYear();
  const m = month.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstDay = new Date(y, m, 1).getDay();
  const monthName = month.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const empty = Array.from({ length: firstDay }, (_, i) => i);

  const forDay = (d: number) => {
    const ds = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return items.filter((it) => (it.date || "").startsWith(ds));
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{monthName}</h2>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {(["scheduled", "published", "event"] as const).map((t) => (
              <span
                key={t}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--fg-muted)",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: TONE[t].fg,
                  }}
                />
                {TONE[t].label}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" size="sm" onClick={() => setMonth(new Date(y, m - 1))}>
              Prev
            </Btn>
            <Btn variant="secondary" size="sm" onClick={() => setMonth(new Date(y, m + 1))}>
              Next
            </Btn>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 1,
          marginBottom: 8,
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontWeight: 600,
              fontSize: 12,
              color: "var(--fg-muted)",
              padding: "6px 4px",
            }}
          >
            {d}
          </div>
        ))}
      </div>

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
        {empty.map((i) => (
          <div
            key={`e${i}`}
            style={{
              background: "var(--bg)",
              minHeight: 96,
              borderRight: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
            }}
          />
        ))}
        {days.map((d) => {
          const its = forDay(d);
          return (
            <div
              key={d}
              style={{
                background: "var(--surface)",
                minHeight: 96,
                padding: 6,
                borderRight: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
                overflow: "hidden",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{d}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {its.map((it) => {
                  const t = TONE[it.type];
                  return (
                    <div
                      key={it.id + it.type}
                      title={`${t.label}: ${it.title}`}
                      style={{
                        background: t.bg,
                        color: t.fg,
                        borderLeft: `2px solid ${t.fg}`,
                        padding: "2px 5px",
                        borderRadius: 3,
                        fontSize: 10,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {it.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
