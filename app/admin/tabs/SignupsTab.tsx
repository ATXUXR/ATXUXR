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

  const sources = useMemo(() => {
    const set = new Set<string>();
    signups.forEach((s) => set.add(s.source || "site"));
    return Array.from(set);
  }, [signups]);

  const filtered =
    source === "all" ? signups : signups.filter((s) => s.source === source);

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
              ["Name", "Email", "Source", "Date"],
              ...filtered.map((s) => [
                s.name,
                s.email,
                s.source,
                s.created_at,
              ]),
            ])
          }
        >
          Export CSV
        </Btn>
      </div>
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
                {["Name", "Email", "Source", "Joined"].map((h) => (
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
