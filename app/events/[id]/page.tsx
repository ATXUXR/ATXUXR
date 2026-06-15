import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EVENTS, KIND_TONE, getEventById } from "@/lib/events";
import { Mark } from "@/components/Mark";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { EventRow } from "@/components/EventRow";
import { RSVPCard } from "./RSVPCard";

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return EVENTS.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const e = getEventById(id);
  if (!e) return { title: "Event" };
  return {
    title: e.title,
    description: e.desc,
    openGraph: { title: e.title, description: e.desc },
  };
}

const GRAD: Record<string, string> = {
  teal: "linear-gradient(150deg,#5FB7A6,#0F7E6C)",
  honey: "linear-gradient(150deg,#F2C879,#E7A33C)",
  flame: "linear-gradient(150deg,#F87545,#EE4A1C)",
};

function Fact({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-pill)",
        padding: "8px 15px",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <span style={{ color: "var(--primary)" }}>
        <Icon name={icon} size={16} />
      </span>
      {label}
    </span>
  );
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const e = getEventById(id);
  if (!e) notFound();

  const tone = KIND_TONE[e.kind];
  const open = e.status === "open";
  const grad = GRAD[tone];
  const related = EVENTS.filter((x) => x.id !== e.id).slice(0, 2);

  return (
    <>
      <section style={{ background: "var(--bg)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "24px 28px 0" }}>
          <Link
            href="/events"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--fg-muted)",
            }}
          >
            <Icon name="arrow-left" size={16} /> All events
          </Link>
        </div>
        <div style={{ maxWidth: 1140, margin: "14px auto 0", padding: "0 28px" }}>
          <div
            style={{
              height: 240,
              borderRadius: "var(--radius-2xl)",
              background: grad,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "flex-end",
              padding: 28,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(120% 90% at 80% 0%, rgba(255,255,255,.30), transparent 55%)",
              }}
            />
            <div style={{ position: "absolute", top: -30, right: 26, opacity: 0.22 }}>
              <Mark variant="white" height={200} />
            </div>
            <div style={{ position: "relative", display: "flex", gap: 8 }}>
              <Tag tone="ink" style={{ fontSize: 11 }}>
                {e.kind}
              </Tag>
              {open ? (
                <Tag
                  tone="flame"
                  style={{
                    fontSize: 11,
                    background: "var(--success)",
                    color: "#fff",
                  }}
                >
                  RSVP OPEN
                </Tag>
              ) : (
                <Tag
                  tone="flame"
                  style={{
                    fontSize: 11,
                    background: "rgba(33,30,34,.55)",
                    color: "#fff",
                  }}
                >
                  RSVP CLOSED
                </Tag>
              )}
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--bg)" }}>
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "40px 28px 80px",
            display: "grid",
            gridTemplateColumns: "1fr 400px",
            gap: 44,
            alignItems: "start",
          }}
          className="detail-grid"
        >
          <div>
            <h1
              style={{
                fontSize: "clamp(2rem, 1.4rem + 2vw, 3rem)",
                margin: "0 0 20px",
                lineHeight: 1.05,
              }}
            >
              {e.title}
            </h1>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                marginBottom: 30,
              }}
            >
              <Fact icon="calendar" label={`${e.day} · ${e.date}, ${e.year}`} />
              <Fact icon="clock" label={e.time} />
              <Fact icon="map-pin" label={e.where} />
            </div>
            <h3 style={{ fontSize: 20, margin: "0 0 10px" }}>About this event</h3>
            <p
              style={{
                fontSize: 16.5,
                color: "var(--fg-muted)",
                lineHeight: 1.65,
                maxWidth: "62ch",
              }}
            >
              {e.desc}
            </p>
            <p
              style={{
                fontSize: 16.5,
                color: "var(--fg-muted)",
                lineHeight: 1.65,
                maxWidth: "62ch",
              }}
            >
              All ATX UXR gatherings are free and open to researchers at every
              level — students, job-seekers, and seasoned practitioners alike.
              Come as you are, bring a question, and meet the people-people of
              ATX.
            </p>

            <h3 style={{ fontSize: 20, margin: "32px 0 12px" }}>Location</h3>
            <div
              style={{
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  height: 150,
                  background:
                    "repeating-linear-gradient(45deg, var(--sand), var(--sand) 14px, var(--neutral-100) 14px, var(--neutral-100) 28px)",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-100%)",
                    color: "var(--primary)",
                  }}
                >
                  <Icon name="map-pin" size={40} />
                </span>
              </div>
              <div
                style={{
                  background: "var(--surface)",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{e.where}</span>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(
                    e.where,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--orange-700)",
                  }}
                >
                  Get directions <Icon name="external-link" size={15} />
                </a>
              </div>
            </div>
          </div>

          <div style={{ position: "sticky", top: 92 }} className="rsvp-card">
            <RSVPCard event={e} open={open} />
          </div>
        </div>
      </section>

      <section
        style={{
          background: "var(--bg-alt)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 28px" }}>
          <Eyebrow style={{ marginBottom: 14 }}>MORE GATHERINGS</Eyebrow>
          <h2 style={{ fontSize: "var(--text-2xl)", margin: "0 0 26px" }}>
            You might also like
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {related.map((r) => (
              <EventRow key={r.id} e={r} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
