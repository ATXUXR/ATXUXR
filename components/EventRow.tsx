"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type AtxEvent, KIND_TONE } from "@/lib/events";
import { Tag } from "./ui/Tag";
import { Icon } from "./ui/Icon";
import { Btn } from "./ui/Button";

interface EventRowProps {
  e: AtxEvent;
}

export function EventRow({ e }: EventRowProps) {
  const router = useRouter();
  const tone = KIND_TONE[e.kind];
  const open = e.status === "open";
  const href = `/events/${e.id}`;

  return (
    <article
      onClick={() => router.push(href)}
      style={{
        display: "grid",
        gridTemplateColumns: "108px 1fr auto",
        gap: 24,
        alignItems: "center",
        cursor: "pointer",
        padding: "22px 24px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        transition: "var(--transition)",
      }}
      className="event-row"
      onMouseEnter={(ev) => {
        ev.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(ev) => {
        ev.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      <div
        style={{
          textAlign: "center",
          borderRight: "1px solid var(--border)",
          paddingRight: 16,
        }}
        className="event-date"
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.1em",
            color: "var(--fg-subtle)",
          }}
        >
          {e.day}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 22,
            lineHeight: 1.05,
            color: "var(--neutral-950)",
          }}
        >
          {e.date}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-subtle)",
          }}
        >
          {e.year}
        </div>
      </div>
      <div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Tag tone={tone} style={{ fontSize: 10 }}>
            {e.kind}
          </Tag>
          {open && (
            <Tag
              tone="flame"
              style={{
                fontSize: 10,
                background: "var(--success-bg)",
                color: "var(--success)",
              }}
            >
              RSVP OPEN
            </Tag>
          )}
        </div>
        <h3 style={{ fontSize: 20, margin: "0 0 6px", lineHeight: 1.15 }}>
          {e.title}
        </h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 16px",
            color: "var(--fg-muted)",
            fontSize: 13.5,
            marginBottom: 8,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="map-pin" size={14} />
            {e.where}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="clock" size={14} />
            {e.time}
          </span>
        </div>
        <p
          style={{
            fontSize: 14,
            color: "var(--fg-muted)",
            margin: 0,
            maxWidth: "62ch",
          }}
        >
          {e.desc}
        </p>
      </div>
      <div className="event-cta" onClick={(ev) => ev.stopPropagation()}>
        <Link href={href} style={{ textDecoration: "none" }}>
          {open ? (
            <Btn variant="primary" iconRight="arrow-right">
              RSVP
            </Btn>
          ) : (
            <Btn variant="secondary">Details</Btn>
          )}
        </Link>
      </div>
    </article>
  );
}
