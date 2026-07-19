"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "./SubmissionsTab";
import { EventEditor } from "./events/EventEditor";
import { InviteComposer } from "./events/InviteComposer";
import type { AdminMember, EventFull, RsvpRow, SignupRow } from "@/lib/admin";

interface Props {
  events: EventFull[];
  signups: SignupRow[];
  organizers: AdminMember[];
  members: AdminMember[];
  rsvps: RsvpRow[];
}

type Mode =
  | { kind: "list" }
  | { kind: "new" }
  | { kind: "edit"; id: string }
  | { kind: "invite"; id: string };

const KIND_TONE = {
  CONNECT: "teal",
  REFLECT: "honey",
  LEARN: "flame",
} as const;

export function EventsTab({ events, signups, organizers, members, rsvps }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [err, setErr] = useState<string | null>(null);

  const refresh = () => startTransition(() => router.refresh());

  const rsvpsByEvent = new Map<string, RsvpRow[]>();
  for (const r of rsvps) {
    const arr = rsvpsByEvent.get(r.event_id) || [];
    arr.push(r);
    rsvpsByEvent.set(r.event_id, arr);
  }

  const deleteEvent = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This removes all RSVPs too.`)) return;
    setErr(null);
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete");
      }
      refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  if (mode.kind === "new") {
    return (
      <EventEditor
        event={null}
        organizers={organizers}
        onCancel={() => setMode({ kind: "list" })}
        onSaved={(id) => {
          refresh();
          setMode({ kind: "edit", id });
        }}
      />
    );
  }
  if (mode.kind === "edit") {
    const e = events.find((x) => x.id === mode.id);
    if (!e) {
      return (
        <div>
          <p>Event not found.</p>
          <Btn variant="secondary" onClick={() => setMode({ kind: "list" })}>
            Back
          </Btn>
        </div>
      );
    }
    return (
      <EventEditor
        event={e}
        organizers={organizers}
        onCancel={() => {
          setMode({ kind: "list" });
          refresh();
        }}
        onSaved={() => {
          refresh();
        }}
        onCompose={() => setMode({ kind: "invite", id: e.id })}
      />
    );
  }
  if (mode.kind === "invite") {
    const e = events.find((x) => x.id === mode.id);
    if (!e) {
      return (
        <div>
          <p>Event not found.</p>
          <Btn variant="secondary" onClick={() => setMode({ kind: "list" })}>
            Back
          </Btn>
        </div>
      );
    }
    return (
      <InviteComposer
        event={e}
        signups={signups}
        members={members}
        onCancel={() => setMode({ kind: "edit", id: e.id })}
        onSent={() => {
          refresh();
          setMode({ kind: "edit", id: e.id });
        }}
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
          {events.length} event{events.length === 1 ? "" : "s"}
        </span>
        <Btn variant="primary" size="sm" icon="plus" onClick={() => setMode({ kind: "new" })}>
          New event
        </Btn>
      </div>
      {err && (
        <div
          style={{
            marginBottom: 12,
            fontSize: 13.5,
            color: "var(--danger)",
            background: "var(--danger-bg)",
            padding: "9px 12px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {err}
        </div>
      )}
      {events.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No events yet"
          body="Click 'New event' to spin up your first gathering."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {events.map((e) => {
            const tone = KIND_TONE[e.kind];
            return (
              <div
                key={e.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginBottom: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <Tag tone={tone} style={{ fontSize: 10 }}>
                      {e.kind}
                    </Tag>
                    {e.kind_label && (
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10.5,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: "var(--fg-subtle)",
                        }}
                      >
                        {e.kind_label}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        padding: "3px 9px",
                        borderRadius: 999,
                        background:
                          e.status === "open"
                            ? "var(--success-bg)"
                            : "var(--surface-sunk)",
                        color:
                          e.status === "open"
                            ? "var(--success)"
                            : "var(--fg-muted)",
                      }}
                    >
                      {e.status === "open" ? "OPEN" : "CLOSED"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      marginBottom: 4,
                      color: "var(--fg)",
                    }}
                  >
                    {e.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: "var(--fg-muted)",
                      display: "flex",
                      gap: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{formatDate(e.starts_at)}</span>
                    <span>{e.where_ || "—"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href={`/events/${e.id}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                    <Btn variant="secondary" size="sm" icon="external-link">
                      View
                    </Btn>
                  </Link>
                  <Btn
                    variant="secondary"
                    size="sm"
                    icon="edit-2"
                    onClick={() => setMode({ kind: "edit", id: e.id })}
                  >
                    Edit
                  </Btn>
                  <Btn
                    variant="ghost"
                    size="sm"
                    icon="trash-2"
                    onClick={() => deleteEvent(e.id, e.title)}
                  >
                    Delete
                  </Btn>
                </div>

                <EventRsvps rsvps={rsvpsByEvent.get(e.id) || []} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EventRsvps({ rsvps }: { rsvps: RsvpRow[] }) {
  const [open, setOpen] = useState(false);
  const guests = rsvps.reduce((sum, r) => sum + (r.guests || 0), 0);
  const total = rsvps.length + guests;

  return (
    <div
      style={{
        flexBasis: "100%",
        borderTop: "1px solid var(--border)",
        paddingTop: 12,
        marginTop: 4,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={rsvps.length === 0}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "transparent",
          border: "none",
          padding: 0,
          fontSize: 13,
          fontWeight: 600,
          color: rsvps.length ? "var(--primary)" : "var(--fg-muted)",
          cursor: rsvps.length ? "pointer" : "default",
        }}
      >
        <Icon name={open ? "chevron-down" : "chevron-right"} size={16} />
        {rsvps.length} RSVP{rsvps.length === 1 ? "" : "s"}
        {guests > 0 ? ` · ${guests} guest${guests === 1 ? "" : "s"} · ${total} total` : ""}
      </button>

      {open && rsvps.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {rsvps.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                fontSize: 13,
                padding: "6px 10px",
                background: "var(--bg)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <span style={{ fontWeight: 500 }}>
                {r.name}
                {r.guests > 0 ? ` (+${r.guests})` : ""}
              </span>
              <a href={`mailto:${r.email}`} style={{ color: "var(--fg-muted)" }}>
                {r.email}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Re-export icon helper for the editor to use the same Icon component.
export { Icon };
