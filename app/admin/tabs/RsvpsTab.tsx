"use client";

import { useState } from "react";
import { Btn } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { formatDate, toneForTag } from "@/lib/utils";
import { downloadCSV } from "@/lib/csv";
import { EmptyState } from "./SubmissionsTab";
import type { EventRow, RsvpRow } from "@/lib/admin";

interface Props {
  rsvps: RsvpRow[];
  events: EventRow[];
}

export function RsvpsTab({ rsvps, events }: Props) {
  const [grouped, setGrouped] = useState(true);

  if (!rsvps.length) {
    return (
      <EmptyState
        icon="calendar-check"
        title="No RSVPs yet"
        body="When people RSVP to an event, their guest list shows up here."
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
          {rsvps.length} RSVP{rsvps.length === 1 ? "" : "s"}
        </span>
        <div style={{ display: "flex", gap: 9 }}>
          <Btn
            variant="secondary"
            size="sm"
            icon={grouped ? "list" : "layers"}
            onClick={() => setGrouped((g) => !g)}
          >
            {grouped ? "Show flat" : "Group by event"}
          </Btn>
          <Btn
            variant="secondary"
            size="sm"
            icon="download"
            onClick={() =>
              downloadCSV("atxuxr-rsvps.csv", [
                ["Name", "Email", "Event", "Guests", "Date"],
                ...rsvps.map((r) => {
                  const ev = events.find((e) => e.id === r.event_id);
                  return [
                    r.name,
                    r.email,
                    ev?.title || r.event_id,
                    r.guests,
                    r.created_at,
                  ];
                }),
              ])
            }
          >
            Export CSV
          </Btn>
        </div>
      </div>
      {grouped ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {events
            .map((ev) => ({
              ev,
              list: rsvps.filter((r) => r.event_id === ev.id),
            }))
            .filter(({ list }) => list.length > 0)
            .map(({ ev, list }) => {
              const total = list.reduce(
                (n, r) => n + (r.guests || 1),
                0,
              );
              return (
                <div
                  key={ev.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "16px 20px",
                      borderBottom: "1px solid var(--border)",
                      background: "var(--bg)",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <Tag
                        tone={toneForTag(ev.kind || "flame")}
                        style={{ fontSize: 9.5 }}
                      >
                        {ev.kind}
                      </Tag>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--fg)",
                        }}
                      >
                        {ev.title}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: "var(--fg-subtle)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {formatDate(ev.starts_at)}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--teal-700)",
                        background: "var(--teal-50)",
                        padding: "4px 10px",
                        borderRadius: 999,
                      }}
                    >
                      {total} going
                    </span>
                  </div>
                  <RsvpTable rsvps={list} />
                </div>
              );
            })}
        </div>
      ) : (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <FlatRsvpTable rsvps={rsvps} events={events} />
        </div>
      )}
    </div>
  );
}

function RsvpTable({ rsvps }: { rsvps: RsvpRow[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}
      >
        <tbody>
          {rsvps.map((r) => (
            <tr
              key={r.id}
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <td
                style={{
                  padding: "12px 20px",
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: "var(--fg)",
                }}
              >
                {r.name || "—"}
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  fontSize: 14,
                  color: "var(--fg-muted)",
                }}
              >
                {r.email}
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  fontSize: 13.5,
                  color: "var(--fg-muted)",
                }}
              >
                {r.guests > 1 ? `${r.guests} guests` : "1 guest"}
              </td>
              <td
                style={{
                  padding: "12px 20px",
                  fontSize: 13.5,
                  color: "var(--fg-subtle)",
                  textAlign: "right",
                }}
              >
                {formatDate(r.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FlatRsvpTable({
  rsvps,
  events,
}: {
  rsvps: RsvpRow[];
  events: EventRow[];
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}
      >
        <thead>
          <tr
            style={{
              background: "var(--bg)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {["Name", "Email", "Event", "Guests", "Date"].map((h) => (
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
          {rsvps.map((r) => {
            const ev = events.find((e) => e.id === r.event_id);
            return (
              <tr
                key={r.id}
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
                  {r.name || "—"}
                </td>
                <td
                  style={{
                    padding: "13px 16px",
                    fontSize: 14,
                    color: "var(--fg-muted)",
                  }}
                >
                  {r.email}
                </td>
                <td
                  style={{
                    padding: "13px 16px",
                    fontSize: 13.5,
                    color: "var(--fg-muted)",
                  }}
                >
                  {ev?.title || "—"}
                </td>
                <td
                  style={{
                    padding: "13px 16px",
                    fontSize: 13.5,
                    color: "var(--fg-muted)",
                  }}
                >
                  {r.guests}
                </td>
                <td
                  style={{
                    padding: "13px 16px",
                    fontSize: 13.5,
                    color: "var(--fg-subtle)",
                  }}
                >
                  {formatDate(r.created_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
