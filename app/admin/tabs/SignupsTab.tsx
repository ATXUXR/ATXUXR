"use client";

import { useMemo, useState } from "react";
import { Btn } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { formatDate } from "@/lib/utils";
import { downloadCSV } from "@/lib/csv";
import { EmptyState } from "./SubmissionsTab";
import type { SignupRow } from "@/lib/admin";

interface Props {
  signups: SignupRow[];
}

export function SignupsTab({ signups }: Props) {
  const [source, setSource] = useState<string>("all");
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());

  const sources = useMemo(() => {
    const set = new Set<string>();
    signups.forEach((s) => set.add(s.source || "site"));
    return Array.from(set);
  }, [signups]);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    signups.forEach((s) =>
      (s.tags || []).forEach((t) =>
        counts.set(t, (counts.get(t) || 0) + 1),
      ),
    );
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [signups]);

  const filtered = signups.filter((s) => {
    if (source !== "all" && s.source !== source) return false;
    if (activeTags.size === 0) return true;
    const tags = s.tags || [];
    for (const t of activeTags) if (!tags.includes(t)) return false;
    return true;
  });

  const toggleTag = (t: string) =>
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  if (!signups.length) {
    return (
      <EmptyState
        icon="mail"
        title="No sign-ups yet"
        body="Mailing-list sign-ups from across the site will show up here."
      />
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 14, color: "var(--fg-muted)" }}>
            {filtered.length}{" "}
            {filtered.length === 1 ? "person" : "people"} on the mailing list
          </span>
          {sources.length > 1 && (
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1.5px solid var(--border-strong)",
                background: "var(--surface)",
                color: "var(--fg)",
              }}
            >
              <option value="all">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
        <Btn
          variant="secondary"
          size="sm"
          icon="download"
          onClick={() =>
            downloadCSV("atxuxr-mailing-list.csv", [
              ["Name", "Email", "Source", "Tags", "Date"],
              ...filtered.map((s) => [
                s.name,
                s.email,
                s.source,
                (s.tags || []).join(" | "),
                s.created_at,
              ]),
            ])
          }
        >
          Export CSV
        </Btn>
      </div>
      {allTags.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 16,
            padding: "10px 12px",
            background: "var(--surface-sunk)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--fg-subtle)",
              alignSelf: "center",
              marginRight: 4,
            }}
          >
            Filter by tag:
          </span>
          {allTags.map(([t, n]) => {
            const on = activeTags.has(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                style={{
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  padding: "4px 9px",
                  borderRadius: "var(--radius-pill)",
                  border:
                    "1.5px solid " +
                    (on ? "var(--primary)" : "var(--border-strong)"),
                  background: on ? "var(--primary)" : "var(--surface)",
                  color: on ? "#fff" : "var(--fg-muted)",
                }}
              >
                {t} <span style={{ opacity: 0.7 }}>{n}</span>
              </button>
            );
          })}
          {activeTags.size > 0 && (
            <button
              type="button"
              onClick={() => setActiveTags(new Set())}
              style={{
                cursor: "pointer",
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: "var(--radius-pill)",
                border: "1.5px solid var(--border-strong)",
                background: "transparent",
                color: "var(--fg-muted)",
                marginLeft: 4,
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 560,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--bg)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {["Name", "Email", "Source", "Tags", "Joined"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "13px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--fg-subtle)",
                      fontWeight: 700,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td
                    style={{
                      padding: "13px 16px",
                      fontSize: 14.5,
                      fontWeight: 600,
                      color: "var(--fg)",
                    }}
                  >
                    {s.name || "—"}
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      fontSize: 14,
                      color: "var(--fg-muted)",
                    }}
                  >
                    {s.email}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <Tag tone="teal" style={{ fontSize: 9.5 }}>
                      {s.source}
                    </Tag>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: 4 }}
                    >
                      {(s.tags || []).slice(0, 4).map((t) => (
                        <span
                          key={t}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            padding: "2px 7px",
                            borderRadius: "var(--radius-pill)",
                            background: "var(--surface-sunk)",
                            color: "var(--fg-muted)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                      {(s.tags || []).length > 4 && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--fg-subtle)",
                          }}
                        >
                          +{s.tags.length - 4}
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      fontSize: 13.5,
                      color: "var(--fg-subtle)",
                    }}
                  >
                    {formatDate(s.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
