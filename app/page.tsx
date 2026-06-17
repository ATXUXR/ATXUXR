import Link from "next/link";
import { Mark } from "@/components/Mark";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EventTypes } from "@/components/EventTypes";
import { EventRow } from "@/components/EventRow";
import { EVENTS } from "@/lib/events";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: -300,
            left: "50%",
            transform: "translateX(-50%)",
            width: 1000,
            height: 640,
            background:
              "radial-gradient(circle at 50% 50%, rgba(238,74,28,0.18), rgba(231,163,60,0.09) 42%, transparent 66%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 920,
            margin: "0 auto",
            padding: "78px 28px 64px",
            position: "relative",
            textAlign: "center",
          }}
        >
          <Mark variant="orange" height={84} style={{ margin: "0 auto 28px" }} />
          <Eyebrow style={{ marginBottom: 18 }}>
            AUSTIN UXR · CXR · HF · HCI
          </Eyebrow>
          <h1
            style={{
              fontSize: "clamp(2.7rem, 1.5rem + 3.6vw, 4.4rem)",
              lineHeight: 1.0,
              margin: 0,
            }}
          >
            The People-
            <span style={{ color: "var(--primary)" }}>People</span> of ATX.
          </h1>
          <p
            className="lead"
            style={{ fontSize: 20, maxWidth: "40ch", margin: "22px auto 0" }}
          >
            A home for Austin&apos;s UXR and CXR professionals to connect,
            learn, and reflect.
          </p>
          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 30,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/events" style={{ textDecoration: "none" }}>
              <Btn variant="primary" size="lg" icon="calendar">
                See upcoming events
              </Btn>
            </Link>
            <a href="#mailing" style={{ textDecoration: "none" }}>
              <Btn variant="secondary" size="lg" iconRight="arrow-right">
                Join the list
              </Btn>
            </a>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "80px 28px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 56,
          }}
          className="mission-grid"
        >
          <div>
            <Eyebrow style={{ marginBottom: 16 }}>WHO WE ARE</Eyebrow>
            <h2 style={{ fontSize: "var(--text-3xl)", margin: "0 0 18px" }}>
              Driven by a deep commitment to people.
            </h2>
            <p
              style={{
                fontSize: 16.5,
                color: "var(--fg-muted)",
                lineHeight: 1.6,
              }}
            >
              We are the People-People. We cultivate experiences that deliver
              exceptional value — grounded in the principles of desirability,
              viability, feasibility, and an unwavering dedication to
              sustainability, inclusivity, and ethical practice.
            </p>
          </div>
          <div
            style={{
              background: "var(--bg-alt)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: "34px 32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: -40, right: -30, opacity: 0.12 }}>
              <Mark variant="orange" height={150} />
            </div>
            <span
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: 48,
                height: 48,
                borderRadius: "var(--radius-md)",
                background: "var(--primary)",
                color: "#fff",
                marginBottom: 18,
              }}
            >
              <Icon name="compass" size={26} />
            </span>
            <h3 style={{ fontSize: 22, margin: "0 0 12px", position: "relative" }}>
              Our goal
            </h3>
            <p
              style={{
                fontSize: 16,
                color: "var(--fg-muted)",
                lineHeight: 1.6,
                margin: 0,
                position: "relative",
              }}
            >
              In a rapidly changing world — particularly with the rise of AI —
              our mission is to equip UXR/CXR professionals to adapt, thrive,
              and lead the evolution of our practice, ensuring its relevance and
              impact for the future.
            </p>
          </div>
        </div>
      </section>

      <EventTypes />

      {/* UPCOMING PREVIEW */}
      <section style={{ background: "var(--bg)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "80px 28px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 14,
              marginBottom: 34,
            }}
          >
            <div>
              <Eyebrow style={{ marginBottom: 12 }}>WHAT&apos;S HAPPENING</Eyebrow>
              <h2 style={{ fontSize: "var(--text-3xl)", margin: 0 }}>
                Past &amp; upcoming events
              </h2>
            </div>
            <Link
              href="/events"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontWeight: 600,
                color: "var(--orange-700)",
              }}
            >
              See all events <Icon name="arrow-right" size={17} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {EVENTS.slice(0, 3).map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
