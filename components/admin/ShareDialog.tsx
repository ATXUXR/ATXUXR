"use client";

import { useEffect, useState } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  CHANNEL_LABELS,
  INSTAGRAM_PROFILE_URL,
  LINKEDIN_GROUP_URL,
  defaultCaption,
  linkedInShareUrl,
  type ShareChannel,
  type ShareContent,
} from "@/lib/social";

interface Props {
  content: ShareContent;
  sourceId?: string | null;
  open: boolean;
  onClose: () => void;
}

interface Status {
  msg: string;
  kind: "ok" | "err" | "info";
}

export function ShareDialog({ content, sourceId, open, onClose }: Props) {
  const [caption, setCaption] = useState(() => defaultCaption(content));
  const [slackChannels, setSlackChannels] = useState<ShareChannel[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<ShareChannel | null>(null);

  // Reset caption whenever the content changes (e.g. user opens dialog for a
  // different event without unmounting the parent).
  useEffect(() => {
    setCaption(defaultCaption(content));
    setStatus(null);
  }, [content.kind, content.title, content.url]);

  // Fetch which Slack channels actually have a webhook configured so we hide
  // dead buttons.
  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/share/config")
      .then((r) => r.json())
      .then((d) => setSlackChannels(d.slackChannels ?? []))
      .catch(() => setSlackChannels([]));
  }, [open]);

  if (!open) return null;

  const slackEnabled = slackChannels.length > 0;

  const post = async (channel: ShareChannel) => {
    setBusy(channel);
    setStatus({ msg: "Sending…", kind: "info" });
    try {
      const res = await fetch("/api/admin/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content,
          channel,
          caption,
          sourceId: sourceId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed");
      }
      setStatus({
        msg: `Posted to ${CHANNEL_LABELS[channel]}.`,
        kind: "ok",
      });
    } catch (err) {
      setStatus({
        msg: err instanceof Error ? err.message : "Failed",
        kind: "err",
      });
    } finally {
      setBusy(null);
    }
  };

  const copyAndOpen = async (channel: ShareChannel, url: string) => {
    setBusy(channel);
    setStatus({ msg: "Copying caption…", kind: "info" });
    try {
      await navigator.clipboard.writeText(caption);
      // Log the "opened" event so it shows in Share History.
      await fetch("/api/admin/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          content,
          channel,
          caption,
          sourceId: sourceId || null,
        }),
      }).catch(() => {});
      window.open(url, "_blank", "noopener,noreferrer");
      setStatus({
        msg: `Caption copied. ${CHANNEL_LABELS[channel]} opened in a new tab — paste and post.`,
        kind: "ok",
      });
    } catch (err) {
      setStatus({
        msg: err instanceof Error ? err.message : "Failed",
        kind: "err",
      });
    } finally {
      setBusy(null);
    }
  };

  const openLinkedInShare = (channel: ShareChannel) => {
    setBusy(channel);
    setStatus({ msg: "Opening LinkedIn…", kind: "info" });
    fetch("/api/admin/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content,
        channel,
        caption,
        sourceId: sourceId || null,
      }),
    }).catch(() => {});
    window.open(linkedInShareUrl(content.url), "_blank", "noopener,noreferrer");
    setStatus({
      msg: "LinkedIn share dialog opened — switch the 'Post as' dropdown to ATX UXR if needed.",
      kind: "ok",
    });
    setBusy(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(33,30,34,0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "60px 16px 16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-xl)",
          maxWidth: 640,
          width: "100%",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 17 }}>Share</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--fg-muted)",
              padding: 4,
            }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div style={{ padding: 22 }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: 13.5,
              marginBottom: 6,
            }}
          >
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={10}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 14.5,
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              border: "1.5px solid var(--border-strong)",
              background: "var(--bg)",
              color: "var(--fg)",
              width: "100%",
              boxSizing: "border-box",
              lineHeight: 1.5,
              resize: "vertical",
            }}
          />
          <div
            style={{
              fontSize: 12,
              color: "var(--fg-muted)",
              marginTop: 6,
            }}
          >
            {caption.length} characters · LinkedIn caps around 3000, Instagram
            2200. Edits here apply to whichever destination you pick next.
          </div>

          {status && (
            <div
              role="status"
              style={{
                marginTop: 14,
                padding: "10px 13px",
                borderRadius: "var(--radius-md)",
                fontSize: 13.5,
                background:
                  status.kind === "ok"
                    ? "var(--success-bg, #DDF3E8)"
                    : status.kind === "err"
                      ? "var(--danger-bg, #FBE2DA)"
                      : "var(--surface-sunk)",
                color:
                  status.kind === "ok"
                    ? "var(--success, #1B7A4E)"
                    : status.kind === "err"
                      ? "var(--danger, #C8442B)"
                      : "var(--fg-muted)",
              }}
            >
              {status.msg}
            </div>
          )}

          <Section title="Slack" hint={slackEnabled ? null : "No Slack webhooks configured. Set SLACK_WEBHOOK_EVENTS, SLACK_WEBHOOK_BLOG, or SLACK_WEBHOOK_GENERAL on Netlify."}>
            {slackChannels.map((ch) => (
              <ShareBtn
                key={ch}
                label={CHANNEL_LABELS[ch]}
                icon="send"
                busy={busy === ch}
                onClick={() => post(ch)}
              />
            ))}
          </Section>

          <Section title="LinkedIn" hint="Page: opens prefilled share dialog. Group: copies caption + opens the group (paste & post).">
            <ShareBtn
              label="LinkedIn page"
              icon="external-link"
              busy={busy === "linkedin"}
              onClick={() => openLinkedInShare("linkedin")}
            />
            <ShareBtn
              label="LinkedIn group"
              icon="copy"
              busy={busy === "linkedin-group"}
              onClick={() => copyAndOpen("linkedin-group", LINKEDIN_GROUP_URL)}
            />
          </Section>

          <Section title="Instagram" hint="No web posting — copies caption to clipboard and opens the profile. Compose on mobile or atxuxr's IG.">
            <ShareBtn
              label="Copy caption + open Instagram"
              icon="copy"
              busy={busy === "instagram"}
              onClick={() => copyAndOpen("instagram", INSTAGRAM_PROFILE_URL)}
            />
          </Section>
        </div>

        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Btn variant="secondary" onClick={onClose}>
            Done
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
        {title}
      </div>
      {hint && (
        <div
          style={{
            fontSize: 12,
            color: "var(--fg-muted)",
            marginBottom: 10,
            lineHeight: 1.45,
          }}
        >
          {hint}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

function ShareBtn({
  label,
  icon,
  busy,
  onClick,
}: {
  label: string;
  icon: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 14px",
        borderRadius: "var(--radius-pill)",
        border: "1.5px solid var(--border-strong)",
        background: busy ? "var(--surface-sunk)" : "var(--bg)",
        color: "var(--fg)",
        fontWeight: 600,
        fontSize: 13.5,
        cursor: busy ? "wait" : "pointer",
      }}
    >
      <Icon name={icon} size={15} />
      {label}
    </button>
  );
}
