"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import type { PublicEvent } from "@/lib/event-fetch";
import {
  googleCalendarUrl,
  outlookCalendarUrl,
  type CalendarEvent,
} from "@/lib/calendar";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Mark } from "@/components/Mark";

const Schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
});

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  padding: "11px 14px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--fg)",
  width: "100%",
  boxSizing: "border-box",
};

function toCalendarEvent(e: PublicEvent): CalendarEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.address || e.where || (e.onlineUrl ? "Online" : ""),
    startsAt: e.startsAt,
    endsAt: e.endsAt,
  };
}

interface Props {
  event: PublicEvent;
  open: boolean;
}

export function RSVPCard({ event, open }: Props) {
  const searchParams = useSearchParams();
  const [done, setDone] = useState(false);
  const [guests, setGuests] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [utm, setUtm] = useState<string | null>(null);

  useEffect(() => {
    const u = searchParams.get("utm");
    if (u) setUtm(u);
  }, [searchParams]);

  const submit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setError(null);
    const parsed = Schema.safeParse({ name, email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          name: parsed.data.name,
          email: parsed.data.email,
          guests,
          utm: utm ?? undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to RSVP");
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to RSVP");
    } finally {
      setBusy(false);
    }
  };

  const cal = toCalendarEvent(event);
  const icsUrl = `/events/${event.routeId}/event.ics`;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-md)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "var(--neutral-950)",
          color: "#fff",
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.1em",
              color: "var(--orange-300)",
            }}
          >
            {event.day} · {event.date}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              whiteSpace: "nowrap",
            }}
          >
            {event.time}
          </div>
        </div>
        <span
          style={{
            width: 42,
            height: 42,
            borderRadius: "999px 999px 0 0",
            background: "rgba(255,255,255,.08)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Mark variant="white" height={22} />
        </span>
      </div>

      <div style={{ padding: 22 }}>
        {!open ? (
          <div style={{ textAlign: "center", padding: "14px 6px" }}>
            <span
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--surface-sunk)",
                color: "var(--fg-muted)",
                marginBottom: 14,
              }}
            >
              <Icon name="calendar-x" size={26} />
            </span>
            <h4 style={{ fontSize: 19, margin: "0 0 6px" }}>RSVP is closed</h4>
            <p
              style={{
                fontSize: 14,
                color: "var(--fg-muted)",
                margin: "0 0 18px",
              }}
            >
              This event has already happened — but more are on the way.
            </p>
          </div>
        ) : done ? (
          <div style={{ textAlign: "center", padding: "14px 6px" }}>
            <span
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--success-bg)",
                color: "var(--success)",
                marginBottom: 14,
              }}
            >
              <Icon name="check" size={30} />
            </span>
            <h4 style={{ fontSize: 20, margin: "0 0 6px" }}>You&apos;re going!</h4>
            <p
              style={{
                fontSize: 14,
                color: "var(--fg-muted)",
                margin: "0 0 16px",
              }}
            >
              We sent the details to your inbox.{" "}
              {guests > 1 ? `Saved ${guests} spots.` : "See you there."}
            </p>

            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--fg-subtle)",
                fontWeight: 700,
                marginBottom: 10,
                textAlign: "left",
              }}
            >
              Add to calendar
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <a
                href={googleCalendarUrl(cal)}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none" }}
              >
                <Btn
                  variant="secondary"
                  icon="calendar-plus"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Google Calendar
                </Btn>
              </a>
              <a href={icsUrl} style={{ textDecoration: "none" }}>
                <Btn
                  variant="secondary"
                  icon="apple"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Apple / iCal
                </Btn>
              </a>
              <a
                href={outlookCalendarUrl(cal)}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none" }}
              >
                <Btn
                  variant="secondary"
                  icon="calendar"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Outlook
                </Btn>
              </a>
              {event.onlineUrl && (
                <a
                  href={event.onlineUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <Btn
                    variant="primary"
                    icon="video"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Join online
                  </Btn>
                </a>
              )}
            </div>
          </div>
        ) : (
          <form
            onSubmit={submit}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              Save your spot
            </div>
            <input
              style={inputStyle}
              placeholder="Full name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              style={inputStyle}
              type="email"
              placeholder="Email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--fg-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Guests
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  border: "1.5px solid var(--border-strong)",
                  borderRadius: "var(--radius-md)",
                  width: "fit-content",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  style={{
                    border: "none",
                    background: "var(--surface-sunk)",
                    cursor: "pointer",
                    width: 40,
                    height: 40,
                    fontSize: 20,
                    color: "var(--fg)",
                  }}
                >
                  –
                </button>
                <span
                  style={{
                    width: 48,
                    textAlign: "center",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {guests}
                </span>
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.min(9, g + 1))}
                  style={{
                    border: "none",
                    background: "var(--surface-sunk)",
                    cursor: "pointer",
                    width: 40,
                    height: 40,
                    fontSize: 20,
                    color: "var(--fg)",
                  }}
                >
                  +
                </button>
              </div>
            </div>
            {error && (
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--danger)",
                  background: "var(--danger-bg)",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {error}
              </div>
            )}
            <Btn
              variant="primary"
              size="lg"
              type="submit"
              icon="calendar-check"
              disabled={busy}
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            >
              {busy ? "Saving…" : "RSVP — it's free"}
            </Btn>
            <p
              style={{
                fontSize: 12,
                color: "var(--fg-subtle)",
                textAlign: "center",
                margin: 0,
              }}
            >
              Free for everyone · cancel anytime
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
