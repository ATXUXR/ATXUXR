"use client";

import { useMemo, useState } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { ShareDialog } from "@/components/admin/ShareDialog";
import { formatDate } from "@/lib/utils";
import {
  CHANNEL_LABELS,
  type ShareChannel,
  type ShareContent,
} from "@/lib/social";
import type { PostWithAuthor } from "@/lib/posts";
import type { EventFull, SocialPostRow } from "@/lib/admin";

interface Props {
  publishedPosts: PostWithAuthor[];
  upcomingEvents: EventFull[];
  socialPosts: SocialPostRow[];
  members?: any[];
}

const SITE_URL = "https://atxuxr.com";

export function ShareTab({ publishedPosts, upcomingEvents, socialPosts, members = [] }: Props) {
  const [content, setContent] = useState<ShareContent | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);

  // Ad-hoc composer state
  const [adTitle, setAdTitle] = useState("");
  const [adBody, setAdBody] = useState("");
  const [adUrl, setAdUrl] = useState("");

  const openAdHoc = () => {
    if (!adTitle.trim() && !adBody.trim()) return;
    setContent({
      kind: "announcement",
      title: adTitle.trim() || "Announcement",
      body: adBody.trim(),
      url: adUrl.trim() || SITE_URL,
    });
    setSourceId(null);
  };

  const openEvent = (e: EventFull) => {
    let meta: string | undefined;
    try {
      const d = new Date(e.starts_at);
      const date = d.toLocaleDateString("en-US", {
        timeZone: "America/Chicago",
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      const time = d.toLocaleTimeString("en-US", {
        timeZone: "America/Chicago",
        hour: "numeric",
        minute: "2-digit",
      });
      const where = e.address || e.where_ || (e.online_url ? "Online" : "");
      meta = where ? `${date} · ${time} · ${where}` : `${date} · ${time}`;
    } catch {
      /* ignore */
    }
    setContent({
      kind: "event",
      title: e.title,
      body: e.description || "",
      url: `${SITE_URL}/events/${e.id}`,
      imageUrl: e.image,
      meta,
    });
    setSourceId(e.id);
  };

  const openPost = (p: PostWithAuthor) => {
    setContent({
      kind: "blog",
      title: p.title,
      body: p.excerpt || "",
      url: `${SITE_URL}/blog/${p.id}`,
      imageUrl: p.cover,
      meta: p.author?.name ? `By ${p.author.name}` : undefined,
    });
    setSourceId(p.id);
  };

  const openMemberMention = (m: any) => {
    const announcement = `Shout out to ${m.name} for their contributions to the community!`;
    setContent({
      kind: "announcement",
      title: `Spotlight: ${m.name}`,
      body: announcement,
      url: SITE_URL,
      meta: m.email ? `${m.email}` : undefined,
    });
    setSourceId(m.id);
  };

  const upcoming = useMemo(
    () =>
      upcomingEvents
        .filter((e) => new Date(e.starts_at).getTime() > Date.now() - 86400000)
        .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))
        .slice(0, 6),
    [upcomingEvents],
  );

  return (
    <div>
      <section style={sectionStyle}>
        <SectionHeader title="Compose announcement" />
        <p style={hintStyle}>
          Free-text message to push to any channel — Slack, LinkedIn, Instagram.
          Useful for off-cycle news that isn&apos;t tied to an event or post.
        </p>
        <div style={{ display: "grid", gap: 10, maxWidth: 620 }}>
          <input
            value={adTitle}
            onChange={(e) => setAdTitle(e.target.value)}
            placeholder="Headline (one line)"
            style={inputStyle}
          />
          <textarea
            value={adBody}
            onChange={(e) => setAdBody(e.target.value)}
            placeholder="Body — the gist of the announcement."
            rows={4}
            style={{ ...inputStyle, fontFamily: "var(--font-sans)" }}
          />
          <input
            value={adUrl}
            onChange={(e) => setAdUrl(e.target.value)}
            placeholder="Link (optional) — e.g. https://atxuxr.com/donate"
            style={inputStyle}
          />
          <div>
            <Btn
              variant="primary"
              icon="share-2"
              onClick={openAdHoc}
              disabled={!adTitle.trim() && !adBody.trim()}
            >
              Open Share dialog
            </Btn>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <SectionHeader title="Share an upcoming event" />
        {upcoming.length === 0 ? (
          <p style={hintStyle}>No upcoming events.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {upcoming.map((e) => (
              <Row
                key={e.id}
                title={e.title}
                meta={formatDate(e.starts_at)}
                tag={e.kind}
                onShare={() => openEvent(e)}
              />
            ))}
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <SectionHeader title="Share a published post" />
        {publishedPosts.length === 0 ? (
          <p style={hintStyle}>No published posts yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {publishedPosts.slice(0, 8).map((p) => (
              <Row
                key={p.id}
                title={p.title}
                meta={p.author?.name ? `by ${p.author.name}` : ""}
                tag={p.tags?.[0]}
                onShare={() => openPost(p)}
              />
            ))}
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <SectionHeader title="Mention a community member" />
        <p style={hintStyle}>
          Spotlight a member with a quick shout-out announcement to the community.
        </p>
        {members.length === 0 ? (
          <p style={hintStyle}>No members yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {members.slice(0, 8).map((m) => (
              <Row
                key={m.id}
                title={m.name}
                meta={m.email}
                tag={m.admin ? "Admin" : undefined}
                onShare={() => openMemberMention(m)}
              />
            ))}
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <SectionHeader title="Announcement history" />
        {socialPosts.length === 0 ? (
          <p style={hintStyle}>Nothing shared yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {socialPosts.slice(0, 25).map((s) => (
              <HistoryRow key={s.id} row={s} />
            ))}
          </div>
        )}
      </section>

      <ShareDialog
        content={content ?? { kind: "announcement", title: "", body: "", url: "" }}
        sourceId={sourceId}
        open={content !== null}
        onClose={() => setContent(null)}
      />
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h3 style={{ fontSize: 17, margin: "0 0 10px" }}>{title}</h3>;
}

function Row({
  title,
  meta,
  tag,
  onShare,
}: {
  title: string;
  meta?: string;
  tag?: string;
  onShare: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{title}</div>
        {(meta || tag) && (
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginTop: 3,
              fontSize: 12.5,
              color: "var(--fg-muted)",
            }}
          >
            {tag && (
              <Tag tone="ink" style={{ fontSize: 10 }}>
                {tag}
              </Tag>
            )}
            {meta}
          </div>
        )}
      </div>
      <Btn variant="secondary" icon="share-2" onClick={onShare}>
        Share
      </Btn>
    </div>
  );
}

function HistoryRow({ row }: { row: SocialPostRow }) {
  const channel = CHANNEL_LABELS[row.channel as ShareChannel] || row.channel;
  const color =
    row.status === "sent"
      ? "var(--success, #1B7A4E)"
      : row.status === "failed"
        ? "var(--danger, #C8442B)"
        : "var(--fg-muted)";
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "8px 12px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        fontSize: 13,
      }}
    >
      <div style={{ minWidth: 110, color, fontWeight: 600 }}>
        {row.status} · {channel}
      </div>
      <div style={{ flex: 1, color: "var(--fg-muted)" }}>
        {row.caption?.split("\n")[0] || "(no caption)"}
        {row.error && (
          <div style={{ color: "var(--danger, #C8442B)", marginTop: 4, fontSize: 12 }}>
            {row.error}
          </div>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>
        {formatDate(row.created_at)}
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 32,
};

const hintStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--fg-muted)",
  marginTop: 0,
  marginBottom: 14,
};

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 14.5,
  padding: "11px 14px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--fg)",
  width: "100%",
  boxSizing: "border-box",
};
