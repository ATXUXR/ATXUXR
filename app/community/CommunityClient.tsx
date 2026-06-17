"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { MemberCard } from "@/components/MemberCard";
import type { DirectoryMember } from "@/lib/members";

interface Props {
  members: DirectoryMember[];
}

export function CommunityClient({ members }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");

  const expertise = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => (m.expertise ?? []).forEach((t) => t && set.add(t)));
    return Array.from(set).sort();
  }, [members]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const hay = [
        m.name,
        m.role,
        m.company,
        m.location,
        (m.expertise ?? []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchQ = !q.trim() || hay.includes(q.trim().toLowerCase());
      const matchF = !filter || (m.expertise ?? []).includes(filter);
      return matchQ && matchF;
    });
  }, [members, q, filter]);

  return (
    <>
      <section
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 73,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "18px 28px",
            display: "flex",
            alignItems: "center",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 240px",
              maxWidth: 340,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--fg-subtle)",
                display: "inline-flex",
              }}
            >
              <Icon name="search" size={18} />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, company, expertise…"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14.5,
                padding: "11px 14px 11px 42px",
                borderRadius: "var(--radius-pill)",
                border: "1.5px solid var(--border-strong)",
                background: "var(--bg)",
                color: "var(--fg)",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div
            style={{
              flex: "1 1 auto",
              overflowX: "auto",
              display: "flex",
              gap: 7,
            }}
          >
            {expertise.slice(0, 10).map((t) => {
              const on = filter === t;
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => setFilter(on ? "" : t)}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: 10.5,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    padding: "5px 11px",
                    borderRadius: "var(--radius-pill)",
                    transition: "var(--transition)",
                    border:
                      "1.5px solid " +
                      (on ? "var(--teal-500)" : "var(--border-strong)"),
                    background: on ? "var(--teal-500)" : "var(--surface)",
                    color: on ? "#fff" : "var(--fg-muted)",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
          {(filter || q) && (
            <button
              type="button"
              onClick={() => {
                setFilter("");
                setQ("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--fg-muted)",
                background: "none",
                border: "none",
              }}
            >
              <Icon name="x" size={15} /> Clear
            </button>
          )}
        </div>
      </section>

      <section style={{ background: "var(--bg)", minHeight: "40vh" }}>
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "40px 28px 80px",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "70px 20px",
                color: "var(--fg-muted)",
              }}
            >
              <Icon
                name="users"
                size={40}
                style={{ color: "var(--fg-subtle)" }}
              />
              <h3 style={{ fontSize: 22, margin: "14px 0 6px", color: "var(--fg)" }}>
                No members match
              </h3>
              <p style={{ margin: 0 }}>Try a different search or clear the filter.</p>
            </div>
          ) : (
            <div
              className="community-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 22,
              }}
            >
              {filtered.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
