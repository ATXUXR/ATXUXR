"use client";

// The merged content workspace: one queue for drafting, tagging, scheduling,
// and publishing. Replaces the old separate "Content Drafts" and "Calendar"
// (schedule) tabs. Smart-scheduling cadence + suggestions ride along the top.
// No AI generation — content is written and edited by hand. Channel blurbs
// (LinkedIn/Instagram/Slack) appear only after a post is published.

import { useEffect, useMemo, useRef, useState } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RichTextEditor } from "./components/RichTextEditor";
import { PILLARS, type CalendarDraftWithVersions } from "@/lib/content-calendar";
import {
  generateSmartSuggestions,
  type CadenceMetric,
  type SmartSuggestion,
} from "@/lib/smart-scheduling";

type Status = "drafting" | "ready" | "scheduled" | "published";
const STATUSES: Status[] = ["drafting", "ready", "scheduled", "published"];

const STATUS_TONE: Record<Status, { bg: string; fg: string }> = {
  drafting: { bg: "var(--surface-sunk)", fg: "var(--fg-muted)" },
  ready: { bg: "var(--honey-100)", fg: "var(--honey-700)" },
  scheduled: { bg: "var(--blue-50)", fg: "var(--blue-700)" },
  published: { bg: "var(--success-bg)", fg: "var(--success)" },
};

const STATUS_LABEL: Record<Status, string> = {
  drafting: "Drafting",
  ready: "Ready",
  scheduled: "Scheduled",
  published: "Published",
};

interface Draft extends CalendarDraftWithVersions {
  scheduled_time?: string | null;
  cover_image_url?: string | null;
  topics?: string[] | null;
  published_post_id?: string | null;
}

const CANONICAL_PILLARS: string[] = [...PILLARS];

/** Existing pillar[] + topics[] merged into one tag list for display. */
function draftTopics(d: Draft): string[] {
  const pillars = Array.isArray(d.pillar) ? d.pillar.filter(Boolean) : [];
  const topics = Array.isArray(d.topics) ? d.topics.filter(Boolean) : [];
  return Array.from(new Set([...(pillars as string[]), ...topics]));
}

function StatusChip({ status }: { status: Status }) {
  const t = STATUS_TONE[status] || STATUS_TONE.drafting;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 999,
        background: t.bg,
        color: t.fg,
      }}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export function ContentScheduleTab({ initialDrafts }: { initialDrafts: Draft[] }) {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialDrafts[0]?.id ?? null,
  );
  const [filter, setFilter] = useState<Status | "all">("all");
  const [cadence, setCadence] = useState<CadenceMetric[]>([]);

  useEffect(() => {
    fetch("/api/admin/calendar/cadence")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setCadence(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const suggestions: SmartSuggestion[] = useMemo(
    () => (cadence.length ? generateSmartSuggestions(cadence) : []),
    [cadence],
  );

  const selected = drafts.find((d) => d.id === selectedId) || null;
  const filtered = drafts.filter((d) =>
    filter === "all" ? true : (d.status as Status) === filter,
  );

  async function refresh(keepId?: string) {
    const r = await fetch("/api/admin/calendar/drafts");
    if (!r.ok) return;
    const data: Draft[] = await r.json();
    setDrafts(data);
    if (keepId) setSelectedId(keepId);
  }

  async function newDraft() {
    const r = await fetch("/api/admin/calendar/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", main_content: "" }),
    });
    if (r.ok) {
      const d = await r.json();
      await refresh(d.id);
    }
  }

  return (
    <div>
      <SmartStrip cadence={cadence} suggestions={suggestions} />

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
        {/* Queue */}
        <div>
          <Btn onClick={newDraft} style={{ width: "100%", marginBottom: 12 }}>
            <Icon name="plus" size={14} style={{ marginRight: 6 }} />
            New draft
          </Btn>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {(["all", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "4px 10px",
                  fontSize: 12,
                  fontWeight: filter === s ? 700 : 500,
                  borderRadius: 999,
                  border:
                    filter === s
                      ? "1px solid var(--primary)"
                      : "1px solid var(--border)",
                  background: filter === s ? "var(--orange-50)" : "transparent",
                  color: filter === s ? "var(--primary)" : "var(--fg-muted)",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {s === "all" ? "All" : STATUS_LABEL[s as Status]}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--fg-muted)", padding: 8 }}>
                Nothing here yet.
              </p>
            )}
            {filtered.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                style={{
                  padding: 12,
                  textAlign: "left",
                  border:
                    selectedId === d.id
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                  background:
                    selectedId === d.id ? "var(--orange-50)" : "var(--surface)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    marginBottom: 6,
                    color: "var(--fg)",
                  }}
                >
                  {d.title || "(Untitled)"}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <StatusChip status={(d.status as Status) || "drafting"} />
                  {d.scheduled_date && (
                    <span style={{ fontSize: 11, color: "var(--fg-subtle)" }}>
                      {new Date(d.scheduled_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div>
          {selected ? (
            <DraftPane
              key={selected.id}
              draft={selected}
              onChanged={(id) => refresh(id)}
              onDeleted={() => {
                setSelectedId(null);
                refresh();
              }}
            />
          ) : (
            <div
              style={{
                minHeight: "50vh",
                display: "grid",
                placeItems: "center",
                color: "var(--fg-muted)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Icon name="file-text" size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                <p style={{ margin: 0 }}>Select a draft, or create a new one.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Smart scheduling strip: cadence + top suggestions                   */
/* ------------------------------------------------------------------ */

function SmartStrip({
  cadence,
  suggestions,
}: {
  cadence: CadenceMetric[];
  suggestions: SmartSuggestion[];
}) {
  if (!cadence.length && !suggestions.length) return null;
  const top = suggestions.slice(0, 3);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginBottom: 20,
        padding: 16,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--fg-muted)" }}>
          Cadence
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {cadence.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
              No published history yet.
            </span>
          )}
          {cadence.map((m) => (
            <span
              key={m.pillar}
              title={`${m.pillar} — avg ${m.averageDaysBetweenPosts}d`}
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 999,
                background: m.isOverdue ? "var(--danger-bg)" : "var(--surface-sunk)",
                color: m.isOverdue ? "var(--danger)" : "var(--fg-muted)",
              }}
            >
              {m.pillar.split(" ").slice(0, 2).join(" ")}
              {m.daysSinceLastPost != null ? ` · ${m.daysSinceLastPost}d` : ""}
              {m.isOverdue ? " ⚠" : ""}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--fg-muted)" }}>
          Suggested next
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {top.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
              Nothing pressing.
            </span>
          )}
          {top.map((s) => (
            <div key={s.pillar} style={{ fontSize: 12, color: "var(--fg)" }}>
              <strong style={{ color: s.priority === "critical" ? "var(--danger)" : "var(--fg)" }}>
                {s.priority.toUpperCase()}
              </strong>{" "}
              — {s.pillar}: <span style={{ color: "var(--fg-muted)" }}>{s.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Draft editor pane                                                   */
/* ------------------------------------------------------------------ */

function DraftPane({
  draft,
  onChanged,
  onDeleted,
}: {
  draft: Draft;
  onChanged: (id: string) => void;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(draft.title || "");
  const [body, setBody] = useState(draft.main_content || "");
  const [notes, setNotes] = useState(draft.notes || "");
  const [topics, setTopics] = useState<string[]>(draftTopics(draft));
  const [customTopic, setCustomTopic] = useState("");
  const [cover, setCover] = useState<string | null>(draft.cover_image_url ?? null);
  const [scheduledDate, setScheduledDate] = useState(draft.scheduled_date || "");
  const [scheduledTime, setScheduledTime] = useState(draft.scheduled_time || "");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const status = (draft.status as Status) || "drafting";
  const published = status === "published";

  function toggleTopic(t: string) {
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }
  function addCustomTopic() {
    const t = customTopic.trim();
    if (t && !topics.includes(t)) setTopics((prev) => [...prev, t]);
    setCustomTopic("");
  }

  async function save(extra: Record<string, unknown> = {}, label = "Saved") {
    setBusy(label);
    setMsg(null);
    try {
      // Pillars used for cadence = the canonical pillars among the topics.
      const pillar = topics.filter((t) => CANONICAL_PILLARS.includes(t));
      const res = await fetch("/api/admin/calendar/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draft.id,
          title,
          main_content: body,
          notes,
          topics,
          pillar: pillar.length ? pillar : null,
          cover_image_url: cover,
          scheduled_date: scheduledDate || null,
          scheduled_time: scheduledTime || null,
          ...extra,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Save failed");
      }
      setMsg(label);
      onChanged(draft.id);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function uploadCover(file: File) {
    setBusy("Uploading");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("draftId", draft.id);
      const res = await fetch("/api/admin/calendar/upload-image", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Upload failed");
      setCover(d.url);
      await save({ cover_image_url: d.url }, "Cover saved");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function schedule() {
    if (!scheduledDate) {
      setMsg("Pick a date to schedule.");
      return;
    }
    await save({ status: "scheduled" }, "Scheduled");
  }

  async function publishNow() {
    setBusy("Publishing");
    setMsg(null);
    try {
      await save({}, "Saved"); // persist latest edits first
      const res = await fetch(`/api/admin/calendar/drafts/${draft.id}/publish`, {
        method: "POST",
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error || "Publish failed");
      setMsg("Published");
      onChanged(draft.id);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("Delete this draft? This can't be undone.")) return;
    setBusy("Deleting");
    try {
      const res = await fetch(`/api/admin/calendar/draft/${draft.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onDeleted();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Delete failed");
      setBusy(null);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--fg-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 8,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 10,
    fontSize: 14,
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <StatusChip status={status} />
        {published && draft.published_post_id && (
          <a
            href={`/blog/${draft.published_post_id}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 13, color: "var(--primary)" }}
          >
            View live post ↗
          </a>
        )}
        {msg && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--fg-muted)" }}>{msg}</span>
        )}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title..."
        style={{ ...inputStyle, fontSize: 18, fontWeight: 600, marginBottom: 16 }}
      />

      {/* Topics */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Topics</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {Array.from(new Set([...CANONICAL_PILLARS, ...topics])).map((t) => {
            const on = topics.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleTopic(t)}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: on ? "1px solid var(--primary)" : "1px solid var(--border)",
                  background: on ? "var(--orange-50)" : "transparent",
                  color: on ? "var(--primary)" : "var(--fg-muted)",
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTopic();
              }
            }}
            placeholder="Add a topic…"
            style={{ ...inputStyle, fontSize: 13 }}
          />
          <Btn variant="secondary" onClick={addCustomTopic}>
            Add
          </Btn>
        </div>
      </div>

      {/* Cover */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Cover image</label>
        {cover && (
          <img
            src={cover}
            alt="cover"
            style={{ maxWidth: "100%", borderRadius: "var(--radius-md)", marginBottom: 8 }}
          />
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadCover(f);
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="secondary" onClick={() => fileRef.current?.click()}>
            <Icon name="image" size={14} style={{ marginRight: 4 }} />
            {cover ? "Replace" : "Upload"}
          </Btn>
          {cover && (
            <Btn variant="secondary" onClick={() => setCover(null)}>
              Remove
            </Btn>
          )}
        </div>
      </div>

      {/* Body */}
      <label style={labelStyle}>Content</label>
      <div style={{ marginBottom: 16 }}>
        <RichTextEditor value={body} onChange={setBody} placeholder="Write the post…" />
      </div>

      {/* Notes */}
      <label style={labelStyle}>Admin notes (private)</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Internal notes…"
        style={{ ...inputStyle, minHeight: 80, marginBottom: 16, resize: "vertical", lineHeight: 1.5 }}
      />

      {/* Schedule */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Schedule (auto-publishes on this date)</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            style={{ ...inputStyle, width: "auto" }}
          />
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            style={{ ...inputStyle, width: "auto" }}
          />
          <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>CT</span>
        </div>
      </div>

      {/* Published channel blurbs */}
      {published && (
        <ChannelBlurbs draftId={draft.id} versions={draft.versions || []} />
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 8,
          paddingTop: 20,
          borderTop: "1px solid var(--border)",
        }}
      >
        <Btn onClick={() => save()} disabled={!!busy}>
          <Icon name="save" size={14} style={{ marginRight: 4 }} />
          {busy === "Saved" ? "Saving…" : "Save"}
        </Btn>
        {!published && (
          <>
            {status !== "ready" && (
              <Btn variant="secondary" onClick={() => save({ status: "ready" }, "Marked ready")} disabled={!!busy}>
                Mark ready
              </Btn>
            )}
            <Btn variant="secondary" onClick={schedule} disabled={!!busy}>
              <Icon name="calendar" size={14} style={{ marginRight: 4 }} />
              Schedule
            </Btn>
            <Btn onClick={publishNow} disabled={!!busy}>
              <Icon name="send" size={14} style={{ marginRight: 4 }} />
              {busy === "Publishing" ? "Publishing…" : "Publish now"}
            </Btn>
          </>
        )}
        <Btn variant="secondary" onClick={remove} disabled={!!busy} style={{ marginLeft: "auto" }}>
          <Icon name="trash-2" size={14} style={{ marginRight: 4 }} />
          Delete
        </Btn>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Channel blurbs (post-publish only)                                  */
/* ------------------------------------------------------------------ */

interface Version {
  channel: string;
  content: string | null;
}

function ChannelBlurbs({
  draftId,
  versions,
}: {
  draftId: string;
  versions: Version[];
}) {
  const channels = ["linkedin", "instagram", "slack"];
  const initial: Record<string, string> = {};
  for (const c of channels) {
    initial[c] = versions.find((v) => v.channel === c)?.content || "";
  }
  const [vals, setVals] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState<string | null>(null);

  async function saveChannel(channel: string) {
    setSaving(channel);
    try {
      await fetch(`/api/admin/calendar/draft/${draftId}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, content: vals[channel], enabled: true }),
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <h3
        style={{
          margin: "0 0 12px",
          fontSize: 12,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--fg-muted)",
        }}
      >
        Channel blurbs
      </h3>
      <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: "0 0 12px" }}>
        Short posts that link back to the live article. Edit and copy into each channel.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {channels.map((c) => (
          <div key={c}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 4,
                textTransform: "capitalize",
              }}
            >
              {c}
            </div>
            <textarea
              value={vals[c]}
              onChange={(e) => setVals((prev) => ({ ...prev, [c]: e.target.value }))}
              style={{
                width: "100%",
                minHeight: 64,
                padding: 10,
                fontSize: 13,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
            <div style={{ marginTop: 4 }}>
              <Btn variant="secondary" onClick={() => saveChannel(c)} disabled={saving === c}>
                {saving === c ? "Saving…" : "Save"}
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
