import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { EventTypes } from "@/components/EventTypes";
import { EventsList } from "./EventsList";
import { EVENTS } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events",
  description: "Past & upcoming ATX UXR gatherings.",
};

export default function EventsPage() {
  return (
    <>
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -280,
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 560,
            background:
              "radial-gradient(circle at 50% 50%, rgba(238,74,28,0.16), transparent 64%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "64px 28px 40px",
            position: "relative",
          }}
        >
          <Eyebrow style={{ marginBottom: 14 }}>GATHER WITH US</Eyebrow>
          <h1
            style={{
              fontSize: "clamp(2.2rem, 1.4rem + 2.4vw, 3.4rem)",
              margin: 0,
            }}
          >
            Past &amp; upcoming events
          </h1>
        </div>
      </section>

      <EventTypes />

      <EventsList events={EVENTS} />
    </>
  );
}
