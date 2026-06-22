import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { KIND_TONE } from "@/lib/events";
import { getPublicEvent, listPublicEvents } from "@/lib/event-fetch";
import { Mark } from "@/components/Mark";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { EventRowFromPublic } from "@/components/EventRow";
import { MapEmbed } from "@/components/MapEmbed";
import { RSVPCard } from "./RSVPCard";
import { AdminEventsToolbar } from "@/components/AdminEventsToolbar";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const e = await getPublicEvent(id);
  if (!e) return { title: "Event" };
  return {
    title: e.title,
    description: e.description,
    openGraph: { title: e.title, description: e.description },
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
  const e = await getPublicEvent(id);
  if (!e) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: member } = await supabase.from("members").select("admin").eq("id", user.id).maybeSingle();
    isAdmin = Boolean(member?.admin);
  }

  // Fetch event files
  const { data: eventFiles } = await supabase
    .from("event_files")
    .select("id, file_name, file_size, file_type, file_url, created_at")
    .eq("event_id", e.id)
    .order("created_at", { ascending: false });

  const tone = KIND_TONE[e.kind];
  const open = e.status === "open";
  const cancelled = e.status === "cancelled";
  const grad = GRAD[tone];
  const all = await listPublicEvents();
  const related = all.filter((x) => x.routeId !== e.routeId).slice(0, 2);
  const isZoom = !!(e.onlineUrl && /zoom\./.test(e.onlineUrl));

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
              background: e.image
                ? `center / cover no-repeat url(${e.image}), ${grad}`
                : grad,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "flex-end",
              padding: 28,
            }}
          >
            {!e.image && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(120% 90% at 80% 0%, rgba(255,255,255,.30), transparent 55%)",
                }}
              />
            )}
            {!e.image && (
              <div style={{ position: "absolute", top: -30, right: 26, opacity: 0.22 }}>
                <Mark variant="white" height={200} />
              </div>
            )}
            <div style={{ position: "relative", display: "flex", gap: 8 }}>
              <Tag tone="ink" style={{ fontSize: 11 }}>
                {e.kindLabel || e.kind}
              </Tag>
              {cancelled ? (
                <Tag
                  tone="flame"
                  style={{
                    fontSize: 11,
                    background: "var(--danger, #C8442B)",
                    color: "#fff",
                  }}
                >
                  CANCELLED
                </Tag>
              ) : open ? (
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
              <Fact icon="map-pin" label={e.where || "TBA"} />
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
              {e.description}
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

            {e.host && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ fontSize: 20, margin: "0 0 12px" }}>Hosted by</h3>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 12,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-xl)",
                    padding: "10px 16px 10px 10px",
                  }}
                >
                  {e.host.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={e.host.photo}
                      alt={e.host.name}
                      width={40}
                      height={40}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "var(--primary)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                      }}
                    >
                      {e.host.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <span style={{ fontWeight: 600 }}>{e.host.name}</span>
                </div>
              </div>
            )}

            {e.onlineUrl && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ fontSize: 20, margin: "0 0 12px" }}>Join online</h3>
                <a
                  href={e.onlineUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "11px 20px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--primary)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14.5,
                    textDecoration: "none",
                  }}
                >
                  <Icon name={isZoom ? "video" : "external-link"} size={17} />
                  {isZoom ? "Join on Zoom" : "Join online"}
                </a>
              </div>
            )}

            {e.address && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ fontSize: 20, margin: "0 0 12px" }}>Location</h3>
                <MapEmbed address={e.address} />
              </div>
            )}

            {eventFiles && eventFiles.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h3 style={{ fontSize: 20, margin: "0 0 16px" }}>Event files</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {eventFiles.map((file) => {
                    const isImage = file.file_type.startsWith("image/");
                    return (
                      <a
                        key={file.id}
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        {isImage ? (
                          <div
                            style={{
                              width: "100%",
                              aspectRatio: "1",
                              borderRadius: "var(--radius-lg)",
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              backgroundImage: `url(${file.file_url})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              aspectRatio: "1",
                              borderRadius: "var(--radius-lg)",
                              background: "var(--surface)",
                              border: "1px solid var(--border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--fg-muted)",
                            }}
                          >
                            <Icon name="file" size={32} />
                          </div>
                        )}
                        <div>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 500,
                              color: "var(--primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {file.file_name}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
                            {(file.file_size / 1024).toFixed(0)} KB
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ position: "sticky", top: 92 }} className="rsvp-card">
            <RSVPCard event={e} open={open} />
          </div>
        </div>
      </section>

      {related.length > 0 && (
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
                <EventRowFromPublic key={r.routeId} e={r} />
              ))}
            </div>
          </div>
        <AdminEventsToolbar eventId={e.id} isAdmin={isAdmin} />

        </section>
      )}
    </>
  );
}
