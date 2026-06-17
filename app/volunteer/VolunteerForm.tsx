"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { z } from "zod";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const ROLES = [
  "Volunteering as a mentor / educator",
  "Volunteering my time for event organization",
  "Volunteering to facilitate connections & resources",
  "Other",
];

const Schema = z.object({
  email: z.string().email("Enter a valid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  position: z.string().optional(),
  role: z.string().min(1, "Pick how you'd like to help"),
});

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

export function VolunteerForm() {
  const [role, setRole] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const parsed = Schema.safeParse({
      email: form.get("email"),
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      company: form.get("company") || undefined,
      position: form.get("position") || undefined,
      role,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }
    // TODO: POST to /api/volunteers
    console.log("volunteer", parsed.data);
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
            <Icon name="check" size={32} />
          </span>
          <h3 style={{ fontSize: 22, margin: "0 0 8px" }}>
            Thank you for stepping up!
          </h3>
          <p style={{ fontSize: 15, color: "var(--fg-muted)", margin: "0 0 20px" }}>
            We&apos;ll be in touch about how you can help. The community is
            better with you in it.
          </p>
          <Link href="/events" style={{ textDecoration: "none" }}>
            <Btn variant="secondary">Browse events</Btn>
          </Link>
        </div>
      ) : (
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label style={labelStyle}>Email</label>
            <input
              style={fieldStyle}
              type="email"
              name="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <div>
              <label style={labelStyle}>First name *</label>
              <input style={fieldStyle} name="firstName" required />
            </div>
            <div>
              <label style={labelStyle}>Last name *</label>
              <input style={fieldStyle} name="lastName" required />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <div>
              <label style={labelStyle}>
                Company{" "}
                <span style={{ color: "var(--fg-subtle)", fontWeight: 400 }}>
                  (most recent)
                </span>
              </label>
              <input style={fieldStyle} name="company" />
            </div>
            <div>
              <label style={labelStyle}>
                Position{" "}
                <span style={{ color: "var(--fg-subtle)", fontWeight: 400 }}>
                  (most recent)
                </span>
              </label>
              <input style={fieldStyle} name="position" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>How would you like to join the fun? *</label>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 9,
                marginTop: 4,
              }}
            >
              {ROLES.map((r) => {
                const on = role === r;
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    style={{
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: "var(--radius-md)",
                      border:
                        "1.5px solid " +
                        (on ? "var(--primary)" : "var(--border-strong)"),
                      background: on ? "var(--orange-50)" : "var(--surface)",
                      transition: "var(--transition)",
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        flex: "none",
                        border:
                          "2px solid " +
                          (on ? "var(--primary)" : "var(--border-strong)"),
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      {on && (
                        <span
                          style={{
                            width: 9,
                            height: 9,
                            borderRadius: "50%",
                            background: "var(--primary)",
                          }}
                        />
                      )}
                    </span>
                    <span
                      style={{
                        fontSize: 14.5,
                        fontWeight: on ? 600 : 400,
                        color: "var(--fg)",
                      }}
                    >
                      {r}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {error && (
            <div
              style={{
                fontSize: 13.5,
                color: "var(--danger)",
                background: "var(--danger-bg)",
                padding: "9px 12px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {error}
            </div>
          )}
          <Btn
            variant="primary"
            size="lg"
            type="submit"
            icon="send"
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
          >
            Submit
          </Btn>
        </form>
      )}
    </Card>
  );
}
