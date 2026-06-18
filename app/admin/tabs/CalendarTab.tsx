"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { ShareDialog } from "@/components/admin/ShareDialog";
import {
  CHANNEL_LABELS,
  POST_TYPE_LABELS,
  type CalendarDraft,
  type CalendarPost,
  type CalendarRow,
  type CalendarStatus,
  type Channel,
  type DraftStatus,
  type Pillar,
  type PostType,
} from "@/lib/content-calendar";
import type { ShareContent } from "@/lib/social";

interface Props {
  rows: CalendarRow[];
}

const PILLAR_TONES: Record<Pillar, string> = {
  "Probabilistic User Research": "teal",
  "Trust, Verification, and Safe Reliance": "flame",
  "Agentic and Anticipatory UX": "honey",
  "AI Economics and Value": "ink",
  "Research Craft in the AI Era": "teal",
};

const STATUS_TONES: Record<CalendarStatus, { bg: string; fg: string }> = {
  planned: { bg: "var(--surface-sunk)", fg: "var(--fg-subtle)" },
  drafting: { bg: "var(--honey-100)", fg: "var(--honey-700)" },
  "public-safe-review": { bg: "var(--orange-50)", fg: "var(--orange-700)" },
  scheduled: { bg: "var(--teal-50)", fg: "var(--teal-700)" },
  published: { bg: "var(--success-bg)", fg: "var(--success)" },
};

const DRAFT_DOT: Record<DraftStatus, string> = {
  todo: "var(--border-strong)",
  drafting: "var(--honey-700)",
  ready: "var(--success)",
  published: "var(--primary)",
};

export function CalendarTab({ rows }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [shareContent, setShareContent] = useState<ShareContent | null>(null);

  const grouped = useMemo(() => {
    const out = new Map<string, CalendarRow[]>();
    rows.forEach((r) => {
      const key = r.post.pillar;
      out.set(key, [...(out.get(key) || []), r]);
    });
    return Array.from(out.entries());
  }, [rows]);

  return (
    <div>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "16px 18px",
          marginBottom: 22,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 13.5, color: "var(--fg-muted)", flex: 1 }}>
          <strong style={{ color: "var(--fg)" }}>Editorial calendar.</strong>{" "}
          {rows.length} planned posts across {grouped.length} pillars.
          Regular posts target atxuxr.com + LinkedIn + Slack. Marquee posts
          (series openers / closers / pillar opens) also publish to Medium +
          Instagram.
        </div>
      </div>

      {grouped.map(([pillar, items]) => (
        <section key={pillar} style={{ marginBottom: 32 }}>
          <h3
            style={{
              fontSize: 16,
              margin: "0 0 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Tag tone={PILLAR_TONES[pillar as Pillar] as "teal"}>{pillar}</Tag>
            <span style={{ color: "var(--fg-subtle)", fontWeight: 500 }}>
              {items.length} posts
            </span>
          </h3>
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((r) => (
              <Row
                key={r.post.id}
                row={r}
                onOpen={() => setOpen(r.post.id)}
                onShare={(content) => setShareContent(content)}
              />
            ))}
          </div>
        </section>
      ))}

      {open && (
        <PostDrawer
          row={rows.find((r) => r.post.id === open)!}
          onClose={() => setOpen(null)}
        />
      )}

      <ShareDialog
        content={
          shareContent ?? { kind: "blog", title: "", body: "", url: "" }
        }
        open={shareContent !== null}
        onClose={() => setShareContent(null)}
      />
    </div>
  );
}

function Row({
  row,
  onOpen,
  onShare,
}: {
  row: CalendarRow;
  onOpen: () => void;
  onShare: (c: ShareContent) => void;
}) {
  const p = row.post;
  const tone = STATUS_TONES[p.status];
  const date = p.scheduled_date
    ? new Date(p.scheduled_date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "—";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "13px 16px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <div
        style={{
          minWidth: 88,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--fg-muted)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {date}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 14.5,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {p.anchor_title}
          {p.marquee && (
            <Tag tone="flame" style={{ fontSize: 9.5 }}>
              MARQUEE
            </Tag>
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: 4,
            fontSize: 12,
            color: "var(--fg-muted)",
          }}
        >
          <span>{POST_TYPE_LABELS[p.post_type as PostType]}</span>
          <span>·</span>
          <ChannelDots drafts={row.drafts} />
        </div>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: "4px 9px",
          borderRadius: 999,
          background: tone.bg,
          color: tone.fg,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontFamily: "var(--font-mono)",
        }}
      >
        {p.status}
      </span>
      <Btn variant="ghost" size="sm" icon="edit-3" onClick={onOpen}>
        Edit
      </Btn>
      <Btn
        variant="ghost"
        size="sm"
        icon="share-2"
        onClick={() =>
          onShare({
            kind: "blog",
            title: p.anchor_title,
            body:
              row.drafts.find((d) => d.channel === "slack")?.body_md ||
              p.notes ||
              "",
            url: `https://atxuxr.com/blog`,
            meta: date !== "—" ? date : undefined,
          })
        }
      >
        Share
      </Btn>
    </div>
  );
}

function ChannelDots({ drafts }: { drafts: CalendarDraft[] }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {drafts.map((d) => (
        <span
          key={d.channel}
          title={`${CHANNEL_LABELS[d.channel as Channel]} — ${d.status}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 10.5,
            color: "var(--fg-subtle)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: DRAFT_DOT[d.status as DraftStatus],
              border:
                d.status === "todo" ? "1.5px solid var(--border-strong)" : "0",
            }}
          />
          {d.channel}
        </span>
      ))}
    </span>
  );
}

// =========================================================================
// Post drawer — full editor: meta + per-channel drafts
// =========================================================================

function PostDrawer({
  row,
  onClose,
}: {
  row: CalendarRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [post, setPost] = useState<CalendarPost>(row.post);
  const [drafts, setDrafts] = useState<CalendarDraft[]>(row.drafts);
  const [activeChannel, setActiveChannel] = useState<Channel>(
    (drafts[0]?.channel as Channel) || "atxuxr",
  );
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const savePost = async (patch: Partial<CalendarPost>) => {
    setSaving(true);
    setErr(null);
    setPost({ ...post, ...patch });
    try {
      const res = await fetch(`/api/admin/calendar/${post.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Save failed");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async (draftId: string, patch: Partial<CalendarDraft>) => {
    setSaving(true);
    setErr(null);
    setDrafts((ds) =>
      ds.map((d) => (d.id === draftId ? { ...d, ...patch } : d)),
    );
    try {
      const res = await fetch(`/api/admin/calendar/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Save failed");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const closeAndRefresh = () => {
    router.refresh();
    onClose();
  };

  const draft = drafts.find((d) => d.channel === activeChannel);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={closeAndRefresh}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(33,30,34,0.5)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg)",
          width: "min(960px, 100%)",
          height: "100%",
          overflowY: "auto",
          boxShadow: "-24px 0 64px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            background: "var(--bg)",
            borderBottom: "1px solid var(--border)",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 2,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--fg-subtle)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {post.pillar} · {POST_TYPE_LABELS[post.post_type as PostType]}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>
              {post.anchor_title}
            </div>
          </div>
          <Btn variant="ghost" icon="x" onClick={closeAndRefresh}>
            Close
          </Btn>
        </div>

        <div style={{ padding: 24 }}>
          {err && (
            <div
              style={{
                background: "var(--danger-bg)",
                color: "var(--danger)",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                fontSize: 13.5,
                marginBottom: 14,
              }}
            >
              {err}
            </div>
          )}

          <Section title="Post meta">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <Field label="Title">
                <input
                  style={inputStyle}
                  value={post.anchor_title}
                  onChange={(e) =>
                    setPost({ ...post, anchor_title: e.target.value })
                  }
                  onBlur={() =>
                    savePost({ anchor_title: post.anchor_title })
                  }
                />
              </Field>
              <Field label="Scheduled date">
                <input
                  type="date"
                  style={inputStyle}
                  value={post.scheduled_date || ""}
                  onChange={(e) =>
                    savePost({ scheduled_date: e.target.value || null })
                  }
                />
              </Field>
              <Field label="Pillar">
                <select
                  style={inputStyle}
                  value={post.pillar}
                  onChange={(e) =>
                    savePost({ pillar: e.target.value as Pillar })
                  }
                >
                  {[
                    "Probabilistic User Research",
                    "Trust, Verification, and Safe Reliance",
                    "Agentic and Anticipatory UX",
                    "AI Economics and Value",
                    "Research Craft in the AI Era",
                  ].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <Field label="Post type">
                <select
                  style={inputStyle}
                  value={post.post_type}
                  onChange={(e) =>
                    savePost({ post_type: e.target.value as PostType })
                  }
                >
                  {Object.entries(POST_TYPE_LABELS).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  style={inputStyle}
                  value={post.status}
                  onChange={(e) =>
                    savePost({ status: e.target.value as CalendarStatus })
                  }
                >
                  {[
                    "planned",
                    "drafting",
                    "public-safe-review",
                    "scheduled",
                    "published",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Marquee (unlocks Medium + Instagram)">
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    paddingTop: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={post.marquee}
                    onChange={(e) => savePost({ marquee: e.target.checked })}
                  />
                  Marquee piece
                </label>
              </Field>
              <Field label="Notes" full>
                <textarea
                  rows={3}
                  style={inputStyle}
                  value={post.notes || ""}
                  onChange={(e) => setPost({ ...post, notes: e.target.value })}
                  onBlur={() => savePost({ notes: post.notes })}
                />
              </Field>
              <Field label="Source files" full>
                <textarea
                  rows={2}
                  style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: 12.5 }}
                  value={(post.source_files || []).join("\n")}
                  onChange={(e) =>
                    setPost({
                      ...post,
                      source_files: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  onBlur={() =>
                    savePost({ source_files: post.source_files })
                  }
                />
              </Field>
            </div>
          </Section>

          <Section title="Channel drafts">
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              {drafts.map((d) => {
                const on = activeChannel === d.channel;
                return (
                  <button
                    key={d.channel}
                    type="button"
                    onClick={() => setActiveChannel(d.channel as Channel)}
                    style={{
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
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
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background:
                          on
                            ? "#fff"
                            : DRAFT_DOT[d.status as DraftStatus],
                      }}
                    />
                    {CHANNEL_LABELS[d.channel as Channel]}
                  </button>
                );
              })}
            </div>

            {draft && (
              <DraftEditor
                draft={draft}
                onChange={(patch) => saveDraft(draft.id, patch)}
              />
            )}
          </Section>

          <div
            style={{
              fontSize: 12,
              color: "var(--fg-subtle)",
              textAlign: "right",
              marginTop: 14,
            }}
          >
            {saving ? "Saving…" : "All changes saved on blur."}
          </div>
        </div>
      </div>
    </div>
  );
}

function DraftEditor({
  draft,
  onChange,
}: {
  draft: CalendarDraft;
  onChange: (patch: Partial<CalendarDraft>) => void;
}) {
  const [body, setBody] = useState(draft.body_md || "");
  const [prompt, setPrompt] = useState(draft.image_prompt || "");
  const [imgUrl, setImgUrl] = useState(draft.image_url || "");
  const [notes, setNotes] = useState(draft.notes || "");

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Field label="Draft status">
        <select
          style={{ ...inputStyle, maxWidth: 220 }}
          value={draft.status}
          onChange={(e) =>
            onChange({ status: e.target.value as DraftStatus })
          }
        >
          {["todo", "drafting", "ready", "published"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Body (markdown — channel-specific copy)" full>
        <textarea
          rows={12}
          style={{
            ...inputStyle,
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            lineHeight: 1.55,
          }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={() => onChange({ body_md: body })}
        />
      </Field>
      <Field label="Image prompt (paste into AI image generator)" full>
        <textarea
          rows={5}
          style={{
            ...inputStyle,
            fontFamily: "var(--font-mono)",
            fontSize: 12.5,
            lineHeight: 1.5,
          }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onBlur={() => onChange({ image_prompt: prompt })}
        />
      </Field>
      <Field label="Image URL (once you've generated/uploaded the visual)" full>
        <input
          style={inputStyle}
          value={imgUrl}
          onChange={(e) => setImgUrl(e.target.value)}
          onBlur={() => onChange({ image_url: imgUrl })}
          placeholder="https://…"
        />
      </Field>
      <Field label="Notes for this channel" full>
        <textarea
          rows={2}
          style={inputStyle}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => onChange({ notes })}
        />
      </Field>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: 18,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--fg-subtle)",
          fontFamily: "var(--font-mono)",
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--fg-muted)",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  padding: "9px 12px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-strong)",
  background: "var(--bg)",
  color: "var(--fg)",
  width: "100%",
  boxSizing: "border-box",
};
