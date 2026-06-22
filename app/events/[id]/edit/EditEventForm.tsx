"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { PublicEvent } from "@/lib/event-fetch";

interface Props {
  event: PublicEvent;
}

export function EditEventForm({ event }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [location, setLocation] = useState(event.where || "");
  const [time, setTime] = useState(event.time);
  const [kind, setKind] = useState(event.kind);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setErr(null);
    if (!title.trim()) {
      setErr("Give your event a title.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/events/${event.routeId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description,
          where: location,
          time,
          kind,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update");
      }

      router.push(`/events/${event.routeId}`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ background: "var(--bg)" }}>
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "44px 28px 80px",
        }}
      >
        <Link
          href={`/events/${event.routeId}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontWeight: 600,
            fontSize: 14,
            color: "var(--fg-muted)",
            textDecoration: "none",
            marginBottom: 22,
          }}
        >
          <Icon name="arrow-left" size={16} /> Back to event
        </Link>

        <div style={{ marginBottom: 30 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--primary)",
              marginBottom: 12,
            }}
          >
            EDIT EVENT
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 1.5rem + 1.6vw, 2.7rem)",
              margin: 0,
            }}
          >
            {title || "Untitled"}
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 18,
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-strong)",
                background: "var(--surface)",
                color: "var(--fg)",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </Field>

          <Field label="Event Type">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as any)}
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-strong)",
                background: "var(--surface)",
                color: "var(--fg)",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <option value="CONNECT">Connect</option>
              <option value="REFLECT">Reflect</option>
              <option value="LEARN">Learn</option>
            </select>
          </Field>

          <Field label="Location">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where is this event?"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-strong)",
                background: "var(--surface)",
                color: "var(--fg)",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </Field>

          <Field label="Time">
            <input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g., 6:30 PM"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-strong)",
                background: "var(--surface)",
                color: "var(--fg)",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe the event..."
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-strong)",
                background: "var(--surface)",
                color: "var(--fg)",
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </Field>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
              paddingTop: 8,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13.5,
                color: "var(--fg-muted)",
              }}
            >
              <Icon
                name="shield-check"
                size={17}
                style={{ color: "var(--teal-500)" }}
              />{" "}
              Changes are saved to the event.
            </div>
            <Btn
              variant="primary"
              size="lg"
              icon={submitting ? "loader" : "save"}
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Save changes"}
            </Btn>
          </div>
        </div>

        {/* Error toast at bottom */}
        {err && (
          <div
            style={{
              position: "fixed",
              bottom: 20,
              left: 20,
              right: 20,
              maxWidth: 500,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 14,
              color: "white",
              background: "var(--danger)",
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              zIndex: 1000,
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <Icon name="alert-circle" size={18} style={{ flexShrink: 0 }} />
            <span>{err}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          fontSize: 13.5,
          marginBottom: 6,
          color: "var(--fg)",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
