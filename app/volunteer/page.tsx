import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { VolunteerForm } from "./VolunteerForm";

export const metadata: Metadata = {
  title: "Volunteer",
  description:
    "Sign up to volunteer with ATX UXR — help us grow the community.",
};

export default function VolunteerPage() {
  return (
    <>
      <PageHero
        icon="hand-heart"
        eyebrow="JOIN THE FUN"
        title="Sign up to volunteer for future events"
        sub="We're looking for volunteers to help us grow and expand our reach. Let us know if you'd like to join the fun."
      />
      <section style={{ background: "var(--bg)" }}>
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "36px 28px 80px",
          }}
        >
          <VolunteerForm />
        </div>
      </section>
    </>
  );
}
