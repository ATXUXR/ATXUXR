"use client";

import { useState } from "react";
import { EventRow } from "@/components/EventRow";
import type { AtxEvent, EventKind } from "@/lib/events";

type Filter = "ALL" | EventKind;
const KINDS: Filter[] = ["ALL", "CONNECT", "REFLECT", "LEARN"];

export function EventsList({ events, isAdmin = false }: { events: AtxEvent[]; isAdmin?: boolean }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const list =
    filter === "ALL" ? events : events.filter((e) => e.kind === filter);

  return (
    <section style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 28px 80px" }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              style={{
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.1em",
                padding: "8px 16px",
                borderRadius: "var(--radius-pill)",
                border:
                  "1.5px solid " +
                  (filter === k ? "var(--primary)" : "var(--border-strong)"),
                background: filter === k ? "var(--primary)" : "transparent",
                color: filter === k ? "#fff" : "var(--fg-muted)",
                transition: "var(--transition)",
              }}
            >
              {k}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {list.map((e) => (
            <EventRow key={e.id} e={e} isAdmin={isAdmin} />
          ))}
        </div>
      </div>
    </section>
  );
}
