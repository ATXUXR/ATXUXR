"use client";

import { useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { Modal } from "./Modal";
import { Btn } from "./ui/Button";
import { Icon } from "./ui/Icon";

const field: React.CSSProperties = {
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

export function Feedback() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const reset = () => {
    setRating(0);
    setHover(0);
    setMessage("");
    setEmail("");
    setDone(false);
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 220);
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim() && !rating) return;
    // TODO: POST to /api/feedback once Supabase is wired.
    console.log("feedback", {
      rating,
      message: message.trim(),
      email: email.trim(),
      page: pathname,
    });
    setDone(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        style={{
          position: "fixed",
          right: 22,
          bottom: 22,
          zIndex: 90,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 18px",
          borderRadius: "var(--radius-pill)",
          border: "none",
          cursor: "pointer",
          background: "var(--neutral-950)",
          color: "#F7F2EC",
          boxShadow: "var(--shadow-lg)",
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          fontSize: 14.5,
        }}
      >
        <Icon name="message-square" size={17} /> Feedback
      </button>

      <Modal open={open} onClose={close} width={440}>
        <div style={{ padding: "34px 34px 32px" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "8px 4px" }}>
              <span
                style={{
                  display: "inline-grid",
                  placeItems: "center",
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "var(--success-bg)",
                  color: "var(--success)",
                  marginBottom: 16,
                }}
              >
                <Icon name="heart" size={30} />
              </span>
              <h2 style={{ fontSize: 24, margin: "0 0 10px" }}>Thank you!</h2>
              <p
                style={{
                  fontSize: 15.5,
                  color: "var(--fg-muted)",
                  margin: "0 0 22px",
                  lineHeight: 1.55,
                }}
              >
                Your feedback helps us make ATX UXR better for everyone. We read
                every note.
              </p>
              <Btn variant="secondary" onClick={close}>
                Close
              </Btn>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--primary)",
                    marginBottom: 10,
                  }}
                >
                  YOUR FEEDBACK
                </div>
                <h2 style={{ fontSize: 24, margin: "0 0 6px" }}>
                  How are we doing?
                </h2>
                <p
                  style={{
                    fontSize: 14.5,
                    color: "var(--fg-muted)",
                    margin: 0,
                  }}
                >
                  Tell us what you love or what we could improve.
                </p>
              </div>
              <form
                onSubmit={submit}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = (hover || rating) >= n;
                    return (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 2,
                          color: active
                            ? "var(--honey-500)"
                            : "var(--border-strong)",
                          display: "inline-flex",
                          transition: "var(--transition)",
                        }}
                      >
                        <Icon
                          name="star"
                          size={30}
                          strokeWidth={active ? 1.5 : 2}
                          style={{
                            fill: active ? "var(--honey-500)" : "transparent",
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
                <textarea
                  style={{ ...field, resize: "vertical", minHeight: 96, lineHeight: 1.5 }}
                  placeholder="What's on your mind?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                <input
                  style={field}
                  type="email"
                  placeholder="Email (optional, if you'd like a reply)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Btn
                  variant="primary"
                  size="lg"
                  type="submit"
                  icon="send"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Send feedback
                </Btn>
              </form>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
