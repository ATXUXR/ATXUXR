"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Mark } from "./Mark";
import { Btn } from "./ui/Button";
import { Icon } from "./ui/Icon";

const Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Enter a valid email"),
});

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  padding: "13px 15px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid rgba(255,255,255,.25)",
  background: "rgba(255,255,255,.95)",
  color: "var(--neutral-950)",
  width: "100%",
  boxSizing: "border-box",
};

export function Mailing() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const parsed = Schema.safeParse({
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      email: form.get("email"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    // TODO: POST to /api/mailing-list once Supabase is wired.
    console.log("mailing-list signup", parsed.data);
    setDone(true);
  };

  return (
    <section
      id="mailing"
      style={{
        background: "var(--neutral-950)",
        color: "var(--fg-on-dark)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: -320,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1000,
          height: 620,
          background:
            "radial-gradient(circle at 50% 50%, rgba(238,74,28,0.30), rgba(231,163,60,0.12) 42%, transparent 68%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "88px 28px",
          position: "relative",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-grid",
            placeItems: "center",
            width: 70,
            height: 70,
            borderRadius: "999px 999px 16px 16px",
            background: "rgba(255,255,255,.06)",
            marginBottom: 22,
          }}
        >
          <Mark variant="orange" height={38} />
        </div>
        <h2 style={{ fontSize: "var(--text-3xl)", color: "#fff", margin: "0 0 14px" }}>
          Don&apos;t miss out! Join our mailing list.
        </h2>
        <p
          style={{
            fontSize: 17,
            color: "rgba(247,242,236,.72)",
            maxWidth: "46ch",
            margin: "0 auto 30px",
          }}
        >
          Be the first to know about future events, and receive educational content
          from our ATX UXR community.
        </p>
        {done ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(47,158,106,.16)",
              color: "#7fe0ab",
              border: "1px solid rgba(47,158,106,.4)",
              padding: "15px 24px",
              borderRadius: "var(--radius-pill)",
              fontWeight: 600,
            }}
          >
            <Icon name="check-circle" size={22} /> You&apos;re on the list — welcome to the community.
          </div>
        ) : (
          <form
            onSubmit={submit}
            style={{ maxWidth: 480, margin: "0 auto", textAlign: "left" }}
          >
            <div
              className="mailing-name-row"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <input
                name="firstName"
                style={inputStyle}
                placeholder="First name *"
                required
              />
              <input
                name="lastName"
                style={inputStyle}
                placeholder="Last name"
              />
            </div>
            <input
              name="email"
              style={{ ...inputStyle, marginBottom: 14 }}
              type="email"
              placeholder="Email *"
              required
            />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                color: "rgba(247,242,236,.8)",
                marginBottom: 18,
              }}
            >
              <input
                type="checkbox"
                defaultChecked
                style={{ width: 18, height: 18, accentColor: "var(--primary)" }}
              />
              I want to subscribe to your mailing list.
            </label>
            {error && (
              <div
                style={{
                  marginBottom: 14,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(179,38,30,.22)",
                  color: "#ffb4ad",
                  fontSize: 14,
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
              style={{ width: "100%", justifyContent: "center" }}
            >
              Join
            </Btn>
          </form>
        )}
      </div>
    </section>
  );
}
