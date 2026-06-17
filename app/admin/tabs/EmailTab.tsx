"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { formatDate } from "@/lib/utils";
import type { EmailRow, SignupRow } from "@/lib/admin";

interface Props {
  emails: EmailRow[];
  signups?: SignupRow[];
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

export function EmailTab({ emails, signups = [] }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    signups.forEach((s) =>
      (s.tags || []).forEach((t) =>
        counts.set(t, (counts.get(t) || 0) + 1),
      ),
    );
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [signups]);

  // Estimate how many people will be hit by the current tag selection.
  const tagEstimate = useMemo(() => {
    if (audience !== "tags" || selectedTags.size === 0) return 0;
    return signups.filter((s) =>
      (s.tags || []).some((t) => selectedTags.has(t)),
    ).length;
  }, [signups, audience, selectedTags]);

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
        throw new Error(data?.error || "Failed to queue email");
      }
      const data = await res.json();
      setMsg(
        `Queued for ${data.recipientCount} recipient${
          data.recipientCount === 1 ? "" : "s"
        } (delivery not wired up yet).`,
      );
      setSubject("");
      setBody("");
      setTimeout(() => setMsg(null), 6000);
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to queue email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 22,
        alignItems: "start",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h3 style={{ fontSize: 18, margin: "0 0 4px" }}>
          Compose an email blast
        </h3>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--fg-muted)",
            margin: "0 0 18px",
          }}
        >
          Write a message — it&apos;s queued in the outbox. Delivery wiring lands
          in Phase 3.
        </p>
        <form
          onSubmit={send}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                fontSize: 13.5,
                marginBottom: 6,
              }}
            >
              Audience
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(
                [
                  ["all", "Everyone"],
                  ["members", "Members"],
                  ["list", "Mailing list"],
                  ["tags", "By tag"],
                ] as const
              ).map(([k, l]) => {
                const on = audience === k;
                return (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setAudience(k)}
                    style={{
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
                  Pick one or more tags — anyone with{" "}
                  <em>any</em> selected tag receives the blast.
                  {selectedTags.size > 0 && (
                    <strong style={{ color: "var(--fg)", marginLeft: 6 }}>
                      ~{tagEstimate} {tagEstimate === 1 ? "person" : "people"}
                    </strong>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {tagOptions.length === 0 && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--fg-subtle)",
                      }}
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
                          background: on
                            ? "var(--primary)"
                            : "var(--surface)",
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
          />
          <textarea
            style={{
              ...fieldStyle,
              resize: "vertical",
              minHeight: 130,
              lineHeight: 1.5,
            }}
            placeholder="Write your message…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
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
          <Btn
            variant="primary"
            size="lg"
            type="submit"
            icon="send"
            disabled={submitting}
          >
            {submitting ? "Queueing…" : "Queue email"}
          </Btn>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 12,
              color: "var(--fg-subtle)",
            }}
          >
            <Icon name="info" size={13} /> Delivery to recipients wires up in
            Phase 3 (Resend / Postmark).
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {emails.length === 0 && (
            <p style={{ color: "var(--fg-muted)", fontSize: 14 }}>
              No emails queued yet.
            </p>
          )}
          {emails.map((em) => {
            const statusTone =
              em.status === "sent"
                ? { fg: "var(--success)", bg: "var(--success-bg)", icon: "check" }
                : em.status === "failed"
                  ? { fg: "var(--danger)", bg: "var(--danger-bg)", icon: "x" }
                  : { fg: "var(--honey-700)", bg: "var(--honey-100)", icon: "clock" };
            return (
              <div
                key={em.id}
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
                    Blast
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
                    {em.status.charAt(0).toUpperCase() + em.status.slice(1)}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11.5,
                      color: "var(--fg-subtle)",
                    }}
                  >
                    {em.to_address} · {formatDate(em.created_at)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--fg)",
                    marginBottom: 4,
                  }}
                >
                  {em.subject}
                </div>
                <p
                  style={{
                    fontSize: 13.5,
                    color: "var(--fg-muted)",
                    lineHeight: 1.5,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {em.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
