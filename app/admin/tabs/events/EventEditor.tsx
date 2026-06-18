"use client";

import { useState, type FormEvent } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MapEmbed } from "@/components/MapEmbed";
import { ShareDialog } from "@/components/admin/ShareDialog";
import { uploadImage } from "@/lib/supabase/upload";
import type { EventFull, AdminMember } from "@/lib/admin";
import type { ShareContent } from "@/lib/social";

interface Props {
  event: EventFull | null;
  organizers: AdminMember[];
  onSaved: (id: string) => void;
  onCancel: () => void;
  /** Only available in edit mode — opens the invite composer. */
  onCompose?: () => void;
}

type Kind = "CONNECT" | "REFLECT" | "LEARN";
type Format = "in-person" | "online";
type Status = "open" | "closed" | "cancelled";

const DEFAULT_IMAGES: { url: string; label: string }[] = [
  { url: "/assets/mark-skyline-orange.png", label: "Skyline · Orange" },
  { url: "/assets/mark-skyline-ink.png", label: "Skyline · Ink" },
  { url: "/assets/mark-skyline-gray.png", label: "Skyline · Gray" },
  { url: "/assets/mark-skyline-white.png", label: "Skyline · White" },
];

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

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export function EventEditor({
  event,
  organizers,
  onSaved,
  onCancel,
  onCompose,
}: Props) {
  const isEdit = !!event;
  const initialFormat: Format = event?.online_url ? "online" : "in-person";

  const [title, setTitle] = useState(event?.title ?? "");
  const [kind, setKind] = useState<Kind>(event?.kind ?? "CONNECT");
  const [kindLabel, setKindLabel] = useState(event?.kind_label ?? "");
  const [format, setFormat] = useState<Format>(initialFormat);
  const [startsAt, setStartsAt] = useState<string>(toLocalInput(event?.starts_at));
  const [endsAt, setEndsAt] = useState<string>(toLocalInput(event?.ends_at));
  const [address, setAddress] = useState(event?.address ?? "");
  const [onlineUrl, setOnlineUrl] = useState(event?.online_url ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [image, setImage] = useState<string | null>(event?.image ?? null);
  const [status, setStatus] = useState<Status>(
    (event?.status as Status) ?? "open",
  );
  const [hostId, setHostId] = useState<string>(event?.host_id ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setErr(null);
    try {
      const { url } = await uploadImage({ bucket: "events", file });
      setImage(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (!title.trim()) throw new Error("Title is required");
      if (!startsAt) throw new Error("Start date/time is required");
      const startIso = new Date(startsAt).toISOString();
      const endIso = endsAt ? new Date(endsAt).toISOString() : null;
      const payload = {
        title: title.trim(),
        kind,
        kind_label: kindLabel.trim() || null,
        description,
        where_: format === "online" ? "Online" : address,
        address: format === "in-person" ? address || null : null,
        online_url: format === "online" ? onlineUrl || null : null,
        image: image || null,
        starts_at: startIso,
        ends_at: endIso,
        status,
        host_id: hostId || null,
      };
      const url = isEdit ? `/api/admin/events/${event!.id}` : "/api/admin/events";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Save failed");
      }
      const data = await res.json();
      setSavedAt(Date.now());
      onSaved(isEdit ? event!.id : data.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const isZoom = /zoom\.us|zoom\.com/.test(onlineUrl);
  const publicHref =
    isEdit && event ? `https://atxuxr.com/events/${event.id}` : "";
  const [shareOpen, setShareOpen] = useState(false);

  // Format the start time for the Share caption meta line.
  const shareMeta = (() => {
    if (!startsAt) return undefined;
    try {
      const d = new Date(startsAt);
      const date = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      const time = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      const where = address || (onlineUrl ? "Online" : "");
      return where ? `${date} · ${time} · ${where}` : `${date} · ${time}`;
    } catch {
      return undefined;
    }
  })();

  const shareContent: ShareContent = {
    kind: "event",
    title: title || "Untitled event",
    body: description || "",
    url: publicHref,
    imageUrl: image || undefined,
    meta: shareMeta,
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicHref);
      setSavedAt(Date.now());
    } catch {
      /* swallow */
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
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h3 style={{ fontSize: 20, margin: 0 }}>
          {isEdit ? "Edit event" : "New event"}
        </h3>
        <Btn variant="secondary" size="sm" icon="arrow-left" onClick={onCancel}>
          {isEdit ? "Back to list" : "Cancel"}
        </Btn>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input
            style={fieldStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Networking Happy Hour"
            required
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["CONNECT", "REFLECT", "LEARN"] as Kind[]).map((k) => {
                const on = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    style={{
                      cursor: "pointer",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: 12,
                      letterSpacing: "0.08em",
                      padding: "8px 14px",
                      borderRadius: "var(--radius-pill)",
                      border:
                        "1.5px solid " +
                        (on ? "var(--primary)" : "var(--border-strong)"),
                      background: on ? "var(--primary)" : "var(--surface)",
                      color: on ? "#fff" : "var(--fg-muted)",
                    }}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Display label (optional)</label>
            <input
              style={fieldStyle}
              value={kindLabel}
              onChange={(e) => setKindLabel(e.target.value)}
              placeholder="Happy Hour"
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Format</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(
              [
                ["in-person", "In person"],
                ["online", "Online"],
              ] as const
            ).map(([f, lbl]) => {
              const on = format === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f as Format)}
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
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={labelStyle}>Starts *</label>
            <input
              type="datetime-local"
              style={fieldStyle}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Ends (optional)</label>
            <input
              type="datetime-local"
              style={fieldStyle}
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
        </div>

        {format === "in-person" ? (
          <div>
            <label style={labelStyle}>Address</label>
            <input
              style={fieldStyle}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="2725 Bee Caves Rd, Austin, TX 78746"
            />
            {address && (
              <div style={{ marginTop: 12 }}>
                <MapEmbed address={address} />
              </div>
            )}
          </div>
        ) : (
          <div>
            <label style={labelStyle}>Online URL</label>
            <div style={{ position: "relative" }}>
              <input
                style={{
                  ...fieldStyle,
                  paddingLeft: isZoom ? 38 : fieldStyle.padding,
                }}
                value={onlineUrl}
                onChange={(e) => setOnlineUrl(e.target.value)}
                placeholder="https://zoom.us/j/..."
                type="url"
              />
              {isZoom && (
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--teal-700)",
                  }}
                  aria-hidden
                >
                  <Icon name="video" size={18} />
                </span>
              )}
            </div>
          </div>
        )}

        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{
              ...fieldStyle,
              resize: "vertical",
              minHeight: 110,
              lineHeight: 1.5,
            }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Come get to know your fellow local UXRs! Light appetizers provided."
          />
        </div>

        <div>
          <label style={labelStyle}>Cover image</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {DEFAULT_IMAGES.map((d) => {
              const selected = image === d.url;
              return (
                <button
                  key={d.url}
                  type="button"
                  onClick={() => setImage(d.url)}
                  style={{
                    cursor: "pointer",
                    padding: 0,
                    border:
                      "2px solid " +
                      (selected ? "var(--primary)" : "var(--border)"),
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    background: "var(--surface-sunk)",
                  }}
                  title={d.label}
                  aria-label={d.label}
                >
                  <img
                    src={d.url}
                    alt=""
                    style={{
                      width: "100%",
                      height: 70,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                padding: "8px 13px",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-strong)",
                background: "var(--surface)",
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <Icon name="upload" size={15} />
              {uploading ? "Uploading…" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
            </label>
            {image && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11.5,
                  color: "var(--fg-subtle)",
                  maxWidth: 260,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {image}
              </span>
            )}
            {image && (
              <button
                type="button"
                onClick={() => setImage(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--fg-muted)",
                  cursor: "pointer",
                  fontSize: 13,
                  textDecoration: "underline",
                }}
              >
                clear
              </button>
            )}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Status</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(
              [
                ["open", "RSVP open", "var(--primary)"],
                ["closed", "Closed", "var(--neutral-700)"],
                ["cancelled", "Cancelled", "var(--danger)"],
              ] as const
            ).map(([k, lbl, color]) => {
              const on = status === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStatus(k)}
                  style={{
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "8px 13px",
                    borderRadius: "var(--radius-pill)",
                    border:
                      "1.5px solid " +
                      (on ? color : "var(--border-strong)"),
                    background: on ? color : "var(--surface)",
                    color: on ? "#fff" : "var(--fg-muted)",
                  }}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Host</label>
          <select
            value={hostId}
            onChange={(e) => setHostId(e.target.value)}
            style={{ ...fieldStyle, maxWidth: 380 }}
          >
            <option value="">— No host —</option>
            {organizers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name || o.email}
              </option>
            ))}
          </select>
        </div>

        {err && (
          <div
            style={{
              fontSize: 13.5,
              color: "var(--danger)",
              background: "var(--danger-bg)",
              padding: "9px 12px",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {err}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn variant="primary" type="submit" icon="check" disabled={busy}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Create event"}
          </Btn>
          <Btn variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Btn>
          {savedAt && !busy && (
            <span
              style={{
                alignSelf: "center",
                fontSize: 13,
                color: "var(--success)",
              }}
            >
              Saved.
            </span>
          )}
        </div>
      </form>

      {isEdit && event && (
        <div
          style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--fg-subtle)",
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            Share this event
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn variant="primary" icon="send" onClick={() => onCompose?.()}>
              Send email invite
            </Btn>
            <Btn
              variant="secondary"
              icon="share-2"
              onClick={() => setShareOpen(true)}
            >
              Share to Slack & socials
            </Btn>
            <Btn variant="secondary" icon="link" onClick={copyLink}>
              Copy public link
            </Btn>
            <a
              href={`/events/${event.id}`}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none" }}
            >
              <Btn variant="ghost" icon="external-link">
                View public page
              </Btn>
            </a>
          </div>
        </div>
      )}

      <ShareDialog
        content={shareContent}
        sourceId={event?.id ?? null}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
