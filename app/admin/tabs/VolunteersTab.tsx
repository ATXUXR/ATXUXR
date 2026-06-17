"use client";

import { Btn } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { downloadCSV } from "@/lib/csv";
import { EmptyState } from "./SubmissionsTab";
import type { VolunteerRow } from "@/lib/admin";

interface Props {
  volunteers: VolunteerRow[];
}

export function VolunteersTab({ volunteers }: Props) {
  if (!volunteers.length) {
    return (
      <EmptyState
        icon="hand-heart"
        title="No volunteers yet"
        body="When people sign up to volunteer, they'll show up here."
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
        <span style={{ fontSize: 14, color: "var(--fg-muted)" }}>
          {volunteers.length}{" "}
          {volunteers.length === 1 ? "volunteer" : "volunteers"} signed up
        </span>
        <Btn
          variant="secondary"
          size="sm"
          icon="download"
          onClick={() =>
            downloadCSV("atxuxr-volunteers.csv", [
              ["Name", "Email", "Company", "Position", "Interest", "Date"],
              ...volunteers.map((v) => [
                `${v.first_name} ${v.last_name}`.trim(),
                v.email,
                v.company || "",
                v.position || "",
                v.role,
                v.created_at,
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
              minWidth: 680,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--bg)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {[
                  "Name",
                  "Email",
                  "Company / role",
                  "How they want to help",
                  "Date",
                ].map((h) => (
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
              {volunteers.map((v) => (
                <tr
                  key={v.id}
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
                    {`${v.first_name} ${v.last_name}`.trim() || "—"}
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      fontSize: 14,
                      color: "var(--fg-muted)",
                    }}
                  >
                    {v.email}
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      fontSize: 13.5,
                      color: "var(--fg-muted)",
                    }}
                  >
                    {[v.position, v.company].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      fontSize: 13.5,
                      color: "var(--fg)",
                    }}
                  >
                    {v.role || "—"}
                  </td>
                  <td
                    style={{
                      padding: "13px 16px",
                      fontSize: 13.5,
                      color: "var(--fg-subtle)",
                    }}
                  >
                    {formatDate(v.created_at)}
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
