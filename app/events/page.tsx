import type { Metadata } from "next";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { EventTypes } from "@/components/EventTypes";
import { EventsList } from "./EventsList";
import { listPublicEvents } from "@/lib/event-fetch";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Events",
  description: "Past & upcoming ATX UXR gatherings.",
};

// Always re-read on request — events are admin-editable in the DB.
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await listPublicEvents();
  // Adapt to the legacy AtxEvent shape EventsList expects.
  const legacy = events.map((e) => ({
    id: e.routeId,
    day: e.day,
    date: e.date,
    year: e.year,
    kind: e.kind,
    title: e.title,
    where: e.where || "TBA",
    time: e.time,
    status: e.status,
    desc: e.description,
  }));

  // Check admin status.
  let isAdmin = false;
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: member } = await supabase
        .from("members")
        .select("admin")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = Boolean(member?.admin);
    }
  }
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

      <EventsList events={legacy} isAdmin={isAdmin} />
    </>
  );
}
