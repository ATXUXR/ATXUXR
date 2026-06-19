"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { formatDate } from "@/lib/utils";
import type { AdminMember, EmailRow, SignupRow } from "@/lib/admin";

interface Props {
  emails: EmailRow[];
  signups?: SignupRow[];
  members?: AdminMember[];
}

type Audience = "all" | "members" | "list" | "tags";

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

export function EmailTab({ emails, signups = [], members = [] }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewBusy, setPreviewBusy] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    signups.forEach((s) => {
      if ((s.tags || []).includes("unsubscribed") || s.unsubscribed) return;
      (s.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [signups]);

  // Per-audience counts (deduped by email for 'all').
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
    const allEmails = new Set([...memberEmails, ...signupEmails]);
    return {
      all: allEmails.size,
      members: members.length,
      list: subscribedSignups.length,
    };
  }, [signups, members]);

  const tagEstimate = useMemo(() => {
    if (audience !== "tags" || selectedTags.size === 0) return 0;
    return signups.filter(
      (s) =>
        !(s.tags || []).includes("unsubscribed") &&
        !s.unsubscribed &&
        (s.tags || []).some((t) => selectedTags.has(t)),
    ).length;
  }, [signups, audience, selectedTags]);

  const audienceCount =
    audience === "all"
      ? counts.all
      : audience === "members"
        ? counts.members
        : audience === "list"
          ? counts.list
          : tagEstimate;

  // Live preview (server-rendered, debounced).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewBusy(true);
      try {
        const res = await fetch("/api/admin/emails/preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ subject, body }),
        });
        if (res.ok) setPreviewHtml(await res.text());
      } catch {
        /* keep previous */
      } finally {
        setPreviewBusy(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [subject, body]);

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const send = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    if (audience === "tags" && selectedTags.size === 0) {
      setErr("Pick at least one tag");
      return;
    }
    if (
      !confirm(
        `Send to ${audienceCount} recipient${audienceCount === 1 ? "" : "s"}? This sends real email.`,
      )
    ) {
      return;
    }
    setErr(null);
    setMsg(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          audience,
          tags: audience === "tags" ? Array.from(selectedTags) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to send");
      }
      const data = await res.json();
      const failedStr = data.failed ? ` · ${data.failed} failed` : "";
      setMsg(`Sent to ${data.sent} of ${data.recipientCount}${failedStr}.`);
      setSubject("");
      setBody("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h3 style={{ fontSize: 18, margin: "0 0 4px" }}>Compose an email blast</h3>
        <p style={{ fontSize: 13.5, color: "var(--fg-muted)", margin: "0 0 18px" }}>
          Renders through the ATX UXR email shell + List-Unsubscribe headers.
          Sends via Resend immediately on submit — no queue.
        </p>
        <form onSubmit={send} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>
              Audience
            </label>
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
                <div style={{ fontSize: 11.5, color: "var(--fg-muted)", marginBottom: 8 }}>
                  Pick one or more tags — anyone with <em>any</em> selected tag receives the blast.
                  {selectedTags.size > 0 && (
                    <strong style={{ color: "var(--fg)", marginLeft: 6 }}>
                      ~{tagEstimate} {tagEstimate === 1 ? "person" : "people"}
                    </strong>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {tagOptions.length === 0 && (
                    <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
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
          </div>

          <input
            style={fieldStyle}
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />

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
              <label style={{ fontWeight: 600, fontSize: 13.5 }}>Body (HTML)</label>
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
              className="email-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <textarea
                style={{
                  ...fieldStyle,
                  resize: "vertical",
                  minHeight: 320,
                  fontFamily: "var(--font-mono)",
                  fontSize: 13.5,
                  lineHeight: 1.55,
                }}
                placeholder="<p>Hey friends — quick update…</p>"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
              <div
                style={{
                  borderRadius: "var(--radius-md)",
                  border: "1.5px solid var(--border-strong)",
                  background: "#F7F2EC",
                  minHeight: 320,
                  overflow: "hidden",
                }}
              >
                {previewHtml ? (
                  <iframe
                    title="Email preview"
                    srcDoc={previewHtml}
                    sandbox=""
                    style={{ width: "100%", height: "100%", minHeight: 320, border: 0, display: "block" }}
                  />
                ) : (
                  <div style={{ padding: 20, color: "var(--fg-muted)", fontSize: 13, textAlign: "center" }}>
                    Generating preview…
                  </div>
                )}
              </div>
            </div>
            <style>{`
              @media (max-width: 800px) {
                .email-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
          </div>

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
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Btn
              variant="primary"
              size="lg"
              type="submit"
              icon="send"
              disabled={submitting || audienceCount === 0}
            >
              {submitting ? "Sending…" : `Send to ${audienceCount}`}
            </Btn>
            <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
              <Icon name="info" size={12} /> Unsubscribes & dedupes are handled
              automatically.
            </span>
          </div>
        </form>
      </div>

      <div>
        <h3
          style={{
            fontSize: 15,
            margin: "0 0 14px",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--fg-subtle)",
          }}
        >
          Outbox &amp; log
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {emails.length === 0 && (
            <p style={{ color: "var(--fg-muted)", fontSize: 14 }}>
              No emails sent yet.
            </p>
          )}
          {emails.map((em) => (
            <LogRow key={em.id} email={em} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LogRow({ email }: { email: EmailRow }) {
  const [open, setOpen] = useState(false);
  const statusTone =
    email.status === "sent"
      ? { fg: "var(--success)", bg: "var(--success-bg)", icon: "check" }
      : email.status === "failed"
        ? { fg: "var(--danger)", bg: "var(--danger-bg)", icon: "x" }
        : { fg: "var(--honey-700)", bg: "var(--honey-100)", icon: "clock" };
  const isHtml = /^<!doctype|<html|<table|<div|<p\s/i.test(email.body || "");
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "16px 18px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <Tag tone="teal" style={{ fontSize: 9.5 }}>
          {email.subject.startsWith("[BLAST]") ? "Blast" : "Transactional"}
        </Tag>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 700,
            color: statusTone.fg,
            background: statusTone.bg,
            padding: "3px 9px",
            borderRadius: 999,
          }}
        >
          <Icon name={statusTone.icon} size={12} />
          {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            color: "var(--fg-subtle)",
          }}
        >
          {email.to_address} · {formatDate(email.created_at)}
        </span>
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--fg)",
          marginBottom: 8,
        }}
      >
        {email.subject}
      </div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          color: "var(--primary)",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {open ? "Hide preview ▴" : "Show preview ▾"}
      </button>
      {open && (
        <div
          style={{
            marginTop: 10,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "#F7F2EC",
            overflow: "hidden",
          }}
        >
          {isHtml ? (
            <iframe
              title={`Preview: ${email.subject}`}
              srcDoc={email.body}
              sandbox=""
              style={{ width: "100%", height: 420, border: 0, display: "block" }}
            />
          ) : (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                padding: 14,
                margin: 0,
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--fg-muted)",
              }}
            >
              {email.body}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
