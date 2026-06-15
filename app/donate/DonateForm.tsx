"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const PRESETS = [10, 25, 50, 100] as const;

const fieldStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  padding: "12px 14px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--fg)",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: 13.5,
  marginBottom: 6,
  color: "var(--fg)",
};

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
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

export function DonateForm() {
  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom] = useState("");
  const [done, setDone] = useState(false);

  const value = custom || amount;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Stub. Real money flow goes through Venmo for now.
    console.log("donate (stub)", { amount: value });
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Card>
      {done ? (
        <div style={{ textAlign: "center", padding: "12px 4px" }}>
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "var(--success-bg)",
              color: "var(--success)",
              marginBottom: 16,
            }}
          >
            <Icon name="heart" size={30} />
          </span>
          <h3 style={{ fontSize: 22, margin: "0 0 8px" }}>
            Thank you for helping us make a difference!
          </h3>
          <p style={{ fontSize: 15, color: "var(--fg-muted)", margin: "0 0 20px" }}>
            Your ${value} donation keeps ATX UXR free and open for everyone.
          </p>
          <Link href="/events" style={{ textDecoration: "none" }}>
            <Btn variant="secondary">Browse events</Btn>
          </Link>
        </div>
      ) : (
        <>
          <form
            onSubmit={submit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <div>
                <label style={labelStyle}>First name</label>
                <input style={fieldStyle} name="firstName" />
              </div>
              <div>
                <label style={labelStyle}>Last name</label>
                <input style={fieldStyle} name="lastName" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                style={fieldStyle}
                type="email"
                name="email"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label style={labelStyle}>Amount</label>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                {PRESETS.map((p) => {
                  const on = !custom && amount === p;
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => {
                        setAmount(p);
                        setCustom("");
                      }}
                      style={{
                        cursor: "pointer",
                        flex: "1 1 0",
                        minWidth: 64,
                        padding: "11px 0",
                        borderRadius: "var(--radius-md)",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: 17,
                        border:
                          "1.5px solid " +
                          (on ? "var(--primary)" : "var(--border-strong)"),
                        background: on ? "var(--primary)" : "var(--surface)",
                        color: on ? "#fff" : "var(--fg)",
                        transition: "var(--transition)",
                      }}
                    >
                      ${p}
                    </button>
                  );
                })}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  border: "1.5px solid var(--border-strong)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    padding: "12px 16px",
                    background: "var(--surface-sunk)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    color: "var(--fg-muted)",
                  }}
                >
                  $
                </span>
                <input
                  value={custom}
                  onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Other amount"
                  style={{ ...fieldStyle, border: "none", borderRadius: 0 }}
                  inputMode="numeric"
                />
              </div>
            </div>
            <Btn
              variant="primary"
              size="lg"
              type="submit"
              icon="heart"
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            >
              {`Donate $${value}`}
            </Btn>
          </form>
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
              OR
            </span>
            <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <a
            href="https://www.venmo.com/u/MaralElliott"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            <Btn
              variant="ink"
              size="lg"
              icon="external-link"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Donate on Venmo
            </Btn>
          </a>
        </>
      )}
    </Card>
  );
}
