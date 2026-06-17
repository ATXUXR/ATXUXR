"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const ZELLE_EMAIL = "atxuxr@gmail.com";
const VENMO_URL = "https://www.venmo.com/u/MaralElliott";
const PAYPAL_BUTTON_ID = "3U7W7MHJFCSF4";

// Minimal type for the PayPal Hosted Buttons SDK we render.
interface PayPalHostedButtons {
  HostedButtons: (opts: { hostedButtonId: string }) => {
    render: (selector: string) => void;
  };
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="narrow-card"
      style={{
        maxWidth: 560,
        margin: "0 auto",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-md)",
        padding: "30px 30px 32px",
      }}
    >
      {children}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        margin: "22px 0",
      }}
    >
      <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.12em",
          color: "var(--fg-subtle)",
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function PayPalButton() {
  const ref = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (rendered.current) return;
    const tryRender = () => {
      const pp = (window as unknown as { paypal?: PayPalHostedButtons }).paypal;
      if (pp?.HostedButtons && ref.current) {
        pp.HostedButtons({ hostedButtonId: PAYPAL_BUTTON_ID }).render(
          `#paypal-container-${PAYPAL_BUTTON_ID}`,
        );
        rendered.current = true;
        return true;
      }
      return false;
    };
    if (tryRender()) return;
    const interval = window.setInterval(() => {
      if (tryRender()) window.clearInterval(interval);
    }, 200);
    // Stop polling after ~10s in case SDK fails to load.
    const timeout = window.setTimeout(() => window.clearInterval(interval), 10_000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, []);

  return <div id={`paypal-container-${PAYPAL_BUTTON_ID}`} ref={ref} />;
}

function CopyEmail() {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(ZELLE_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore — user can still select + copy manually
    }
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        border: "1.5px solid var(--border-strong)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          padding: "12px 14px",
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          color: "var(--fg)",
          background: "var(--surface-sunk)",
          alignSelf: "center",
        }}
      >
        {ZELLE_EMAIL}
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy Zelle email"
        style={{
          padding: "0 18px",
          background: "var(--surface)",
          border: "none",
          borderLeft: "1.5px solid var(--border-strong)",
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          fontSize: 14,
          color: "var(--fg)",
          cursor: "pointer",
        }}
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

export function DonateForm() {
  return (
    <Card>
      <h3
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 22,
          margin: "0 0 6px",
        }}
      >
        Choose a way to give
      </h3>
      <p
        style={{
          margin: "0 0 22px",
          color: "var(--fg-muted)",
          fontSize: 14.5,
        }}
      >
        Donations go to <strong style={{ color: "var(--fg)" }}>ATX UXR</strong>.
        Pick whichever payment method you prefer.
      </p>

      {/* Primary: PayPal hosted button. Renders into a real PayPal button —
          includes PayPal balance, debit/credit card, and Venmo (via PayPal
          Checkout) as funding options. */}
      <PayPalButton />

      <Divider label="OR" />

      {/* Standalone Venmo for people who'd rather pay in the Venmo app
          directly. Note this goes to the personal Venmo handle, not the
          ATX UXR business account. */}
      <a
        href={VENMO_URL}
        target="_blank"
        rel="noreferrer"
        style={{ textDecoration: "none", display: "block" }}
      >
        <Btn
          variant="ink"
          size="lg"
          icon="external-link"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Pay on Venmo
        </Btn>
      </a>

      <Divider label="OR" />

      {/* Zelle — no clickable link. Donor opens their own bank's Zelle
          interface and sends to this email. */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--fg-muted)",
            textTransform: "uppercase",
          }}
        >
          <Icon name="banknote" size={14} />
          Send via Zelle from your bank app
        </div>
        <CopyEmail />
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 13,
            color: "var(--fg-subtle)",
          }}
        >
          Most major banks support Zelle in their mobile app. Send to the email
          above — no fees, arrives in minutes.
        </p>
      </div>
    </Card>
  );
}
