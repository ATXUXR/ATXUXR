"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { AdminMember, EventFull, SignupRow } from "@/lib/admin";

type Audience = "all" | "members" | "list" | "tags";

interface Props {
  event: EventFull;
  signups: SignupRow[];
  members: AdminMember[];
  onSent: () => void;
  onCancel: () => void;
}

const fieldStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  padding: "11px 14px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--fg)",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: 13.5,
  marginBottom: 6,
  color: "var(--fg)",
};

function defaultBody(event: EventFull): string {
  const lines: string[] = [];
  lines.push(`<p>Hi {{name}},</p>`);
  lines.push(
    `<p>We're hosting <strong>${escapeHtml(event.title)}</strong> and we'd love to see you there.</p>`,
  );
  if (event.description) {
    lines.push(`<p>${escapeHtml(event.description)}</p>`);
  }
  lines.push(
    `<p>Tap the button below to grab a spot — it's free, like every ATX UXR gathering.</p>`,
  );
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function InviteComposer({
  event,
  signups,
  members,
  onSent,
  onCancel,
}: Props) {
  const [subject, setSubject] = useState(`You're invited: ${event.title}`);
  const [body, setBody] = useState(defaultBody(event));
  const [audience, setAudience] = useState<Audience>("list");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // ----- Live preview (server-rendered, debounced on body changes) ---------
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewBusy(true);
      try {
        const res = await fetch("/api/admin/event-invite/preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            eventId: event.id,
            html: body,
            sampleName: "Alex",
          }),
        });
        if (res.ok) setPreviewHtml(await res.text());
      } catch {
        /* ignore — keep previous preview */
      } finally {
        setPreviewBusy(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [body, event.id]);

  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    signups.forEach((s) => {
      if (s.tags?.includes("unsubscribed")) return;
      (s.tags || []).forEach((t) =>
        counts.set(t, (counts.get(t) || 0) + 1),
      );
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [signups]);

  // Per-audience recipient counts so each pill shows how many people it
  // targets. Members come from the `members` table; signups from the mailing
  // list. "all" is the de-duped union (by email).
  const counts = useMemo(() => {
    const isSubscribed = (s: SignupRow) =>
      !(s.tags || []).includes("unsubscribed") && !s.unsubscribed;
    const subscribedSignups = signups.filter(isSubscribed);
    const memberEmails = new Set(
      members.map((m) => m.email?.toLowerCase()).filter(Boolean) as string[],
    );
    const signupEmails = new Set(
      subscribedSignups.map((s) => s.email.toLowerCase()),
    );
    // Union by email
    const allEmails = new Set([...memberEmails, ...signupEmails]);
    return {
      all: allEmails.size,
      members: members.length,
      list: subscribedSignups.length,
    };
  }, [signups, members]);

  // The currently-selected audience's count, used for the inline summary line.
  const liveCount = useMemo(() => {
    if (audience === "all") return counts.all;
    if (audience === "members") return counts.members;
    if (audience === "list") return counts.list;
    if (audience === "tags") {
      if (selectedTags.size === 0) return 0;
      return signups.filter(
        (s) =>
          !(s.tags || []).includes("unsubscribed") &&
          !s.unsubscribed &&
          (s.tags || []).some((t) => selectedTags.has(t)),
      ).length;
    }
    return null;
  }, [audience, counts, signups, selectedTags]);

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const send = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!subject.trim() || !body.trim()) {
      setErr("Subject and body are required.");
      return;
    }
    if (audience === "tags" && selectedTags.size === 0) {
      setErr("Pick at least one tag.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/event-invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          subject,
          html: body,
          audience,
          tags: audience === "tags" ? Array.from(selectedTags) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Send failed");
      }
      const data = await res.json();
      setMsg(
        `Sent to ${data.sent} recipient${data.sent === 1 ? "" : "s"}.${
          data.failed ? ` ${data.failed} failed.` : ""
        }`,
      );
      setTimeout(() => {
        onSent();
      }, 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: 24,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ fontSize: 20, margin: 0 }}>Send event invite</h3>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--fg-muted)",
              margin: "4px 0 0",
            }}
          >
            For <strong>{event.title}</strong> · unsubscribed people are excluded automatically.
          </p>
        </div>
        <Btn variant="secondary" size="sm" icon="arrow-left" onClick={onCancel}>
          Back
        </Btn>
      </div>

      <form onSubmit={send} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Audience</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(
              [
                ["all", "Everyone", counts.all],
                ["members", "Members", counts.members],
                ["list", "Mailing list", counts.list],
                ["tags", "By tag", null],
              ] as const
            ).map(([k, l, n]) => {
              const on = audience === k;
              return (
                <button
                  type="button"
                  key={k}
                  onClick={() => setAudience(k)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "8px 13px",
                    borderRadius: "var(--radius-pill)",
                    border:
                      "1.5px solid " +
                      (on ? "var(--primary)" : "var(--border-strong)"),
                    background: on ? "var(--primary)" : "var(--surface)",
                    color: on ? "#fff" : "var(--fg-muted)",
                  }}
                >
                  {l}
                  {n !== null && (
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: "1px 7px",
                        borderRadius: 999,
                        background: on
                          ? "rgba(255,255,255,0.22)"
                          : "var(--surface-sunk)",
                        color: on ? "#fff" : "var(--fg-subtle)",
                      }}
                    >
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {audience === "tags" && (
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                background: "var(--surface-sunk)",
                border: "1px dashed var(--border-strong)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--fg-muted)",
                  marginBottom: 8,
                }}
              >
                Pick one or more tags — anyone with any selected tag receives the invite.
                {selectedTags.size > 0 && (
                  <strong style={{ color: "var(--fg)", marginLeft: 6 }}>
                    ~{liveCount} {liveCount === 1 ? "person" : "people"}
                  </strong>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tagOptions.length === 0 && (
                  <span
                    style={{ fontSize: 12, color: "var(--fg-subtle)" }}
                  >
                    No tags on any signups yet.
                  </span>
                )}
                {tagOptions.map(([t, n]) => {
                  const on = selectedTags.has(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      style={{
                        cursor: "pointer",
                        fontFamily: "var(--font-mono)",
                        fontSize: 10.5,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        padding: "4px 9px",
                        borderRadius: "var(--radius-pill)",
                        border:
                          "1.5px solid " +
                          (on ? "var(--primary)" : "var(--border-strong)"),
                        background: on ? "var(--primary)" : "var(--surface)",
                        color: on ? "#fff" : "var(--fg-muted)",
                      }}
                    >
                      {t} <span style={{ opacity: 0.7 }}>{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {liveCount !== null && audience !== "tags" && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--fg-subtle)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
              }}
            >
              ~{liveCount} subscribed {liveCount === 1 ? "person" : "people"} in this audience
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Subject</label>
          <input
            style={fieldStyle}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
              gap: 8,
            }}
          >
            <label style={{ ...labelStyle, marginBottom: 0 }}>
              Body (HTML)
            </label>
            <span
              style={{
                fontSize: 11.5,
                color: "var(--fg-subtle)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {previewBusy ? "Updating preview…" : "Live preview →"}
            </span>
          </div>
          <div
            className="invite-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              alignItems: "stretch",
            }}
          >
            <textarea
              style={{
                ...fieldStyle,
                resize: "vertical",
                minHeight: 380,
                fontFamily: "var(--font-mono)",
                fontSize: 13.5,
                lineHeight: 1.55,
              }}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            <div
              style={{
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-strong)",
                background: "#F7F2EC",
                minHeight: 380,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {previewHtml ? (
                <iframe
                  title="Email preview"
                  srcDoc={previewHtml}
                  sandbox=""
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: 380,
                    border: 0,
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: 20,
                    color: "var(--fg-muted)",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  Generating preview…
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "var(--fg-subtle)",
            }}
          >
            Use <code>{`{{name}}`}</code> as a placeholder for each recipient&apos;s
            first name. The RSVP CTA, event facts, and unsubscribe footer are
            added automatically — the preview on the right shows the final
            rendered email a recipient will see (sample name: <em>Alex</em>).
          </div>
          <style>{`
            @media (max-width: 800px) {
              .invite-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </div>

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13.5,
            color: "var(--fg-muted)",
          }}
        >
          <input type="checkbox" checked disabled />
          Exclude unsubscribed recipients (always on)
        </label>

        {msg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13.5,
              color: "var(--success)",
              background: "var(--success-bg)",
              padding: "10px 13px",
              borderRadius: "var(--radius-md)",
            }}
          >
            <Icon name="check-circle" size={16} />
            {msg}
          </div>
        )}
        {err && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13.5,
              color: "var(--danger)",
              background: "var(--danger-bg)",
              padding: "10px 13px",
              borderRadius: "var(--radius-md)",
            }}
          >
            <Icon name="alert-circle" size={16} />
            {err}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn variant="primary" type="submit" icon="send" disabled={busy}>
            {busy ? "Sending…" : "Send invite"}
          </Btn>
          <Btn variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Btn>
        </div>
      </form>
    </div>
  );
}
