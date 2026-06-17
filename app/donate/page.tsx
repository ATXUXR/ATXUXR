import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { DonateForm } from "./DonateForm";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Leave a one-time donation to keep ATX UXR free and accessible.",
};

export default function DonatePage() {
  return (
    <>
      <PageHero
        icon="heart-handshake"
        eyebrow="SUPPORT OUR COMMUNITY"
        title="Leave a one-time donation"
        sub="We keep our events free and accessible. Your gift covers venues, food, accessibility, and the tools that bring Austin's researchers together."
      />
      <section style={{ background: "var(--bg)" }}>
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "36px 28px 80px",
          }}
        >
          <DonateForm />
        </div>
      </section>
    </>
  );
}
