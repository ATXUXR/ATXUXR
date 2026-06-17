import type { Metadata } from "next";
import Script from "next/script";
import { PageHero } from "@/components/PageHero";
import { DonateForm } from "./DonateForm";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Leave a one-time donation to keep ATX UXR free and accessible.",
};

// PayPal SDK with Venmo + card funding enabled. Loaded only on the donate page.
const PAYPAL_SDK =
  "https://www.paypal.com/sdk/js" +
  "?client-id=BAA8eO3zMDT9cZ-WXcUn4fpZg8JoLMN4uAKcva9p5c-UK50GNlDUQlq_vEHoYpK21ktW0R2jefaIJSNYIQ" +
  "&components=hosted-buttons" +
  "&enable-funding=venmo" +
  "&currency=USD";

export default function DonatePage() {
  return (
    <>
      <Script src={PAYPAL_SDK} strategy="afterInteractive" />
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
