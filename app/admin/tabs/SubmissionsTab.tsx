"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { PostCover } from "@/components/ui/PostCover";
import { formatDate, toneForTag } from "@/lib/utils";
import type { PostWithAuthor } from "@/lib/posts";

interface Props {
  posts: PostWithAuthor[];
}

export function SubmissionsTab({ posts }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<PostWithAuthor | null>(null);
  const [busy, setBusy] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const act = async (
    ids: string[],
    action: "approve" | "reject" | "delete",
  ) => {
    if (!ids.length) return;
    if (
      (action === "reject" || action === "delete") &&
      !window.confirm(
        action === "delete"
          ? `Delete ${ids.length} submission${ids.length === 1 ? "" : "s"}?`
          : `Reject ${ids.length} submission${ids.length === 1 ? "" : "s"}?`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Action failed");
      }
      setSelected((s) => {
        const next = new Set(s);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      if (preview && ids.includes(preview.id)) setPreview(null);
      startTransition(() => router.refresh());
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (!posts.length) {
    return (
      <EmptyState
        icon="inbox"
        title="Inbox zero"
        body="No submissions waiting for review. New contributions will show up here."
      />
    );
  }

  const selectedIds = Array.from(selected);

  return (
    <>
      {selectedIds.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-md)",
            padding: "12px 16px",
            marginBottom: 16,
            boxShadow: "var(--shadow-sm)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {selectedIds.length} selected
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <Btn
              variant="secondary"
              size="sm"
              icon="x"
              disabled={busy}
              onClick={() => act(selectedIds, "reject")}
            >
              Reject all
            </Btn>
            <Btn
              variant="primary"
              size="sm"
              icon="check"
              disabled={busy}
              onClick={() => act(selectedIds, "approve")}
            >
              Approve all
            </Btn>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {posts.map((p) => (
          <SubmissionRow
            key={p.id}
            post={p}
            checked={selected.has(p.id)}
            onCheck={() => toggleSelect(p.id)}
            onPreview={() => setPreview(p)}
            onApprove={() => act([p.id], "approve")}
            onReject={() => act([p.id], "reject")}
            onDelete={() => act([p.id], "delete")}
            busy={busy}
          />
        ))}
      </div>
      {preview && (
        <PreviewModal
          post={preview}
          onClose={() => setPreview(null)}
          onApprove={() => act([preview.id], "approve")}
          onReject={() => act([preview.id], "reject")}
          busy={busy}
        />
      )}
    </>
  );
}

function SubmissionRow({
  post,
  checked,
  onCheck,
  onPreview,
  onApprove,
  onReject,
  onDelete,
  busy,
}: {
  post: PostWithAuthor;
  checked: boolean;
  onCheck: () => void;
  onPreview: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <div
      className="admin-sub-row"
      style={{
        display: "grid",
        gridTemplateColumns: "auto 120px 1fr auto",
        gap: 16,
        alignItems: "center",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "16px 18px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onCheck}
        style={{ width: 18, height: 18, cursor: "pointer" }}
      />
      <div
        className="admin-sub-cover"
        style={{ borderRadius: "var(--radius-md)", overflow: "hidden" }}
      >
        <PostCover post={post} height={72} radius="var(--radius-md)" flat />
      </div>
      <div className="admin-sub-title" style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            gap: 7,
            marginBottom: 6,
            flexWrap: "wrap",
          }}
        >
          {(post.tags ?? []).slice(0, 3).map((t) => (
            <Tag key={t} tone={toneForTag(t)} style={{ fontSize: 9.5 }}>
              {t}
            </Tag>
          ))}
        </div>
        <h3 style={{ fontSize: 17, margin: "0 0 5px", lineHeight: 1.2 }}>
          {post.title}
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--fg-muted)",
          }}
        >
          <Avatar member={post.author} size={20} /> {post.author?.name || "Unknown"} ·{" "}
          {formatDate(post.created_at)} · {post.read_mins} min
        </div>
      </div>
      <div
        className="admin-sub-actions"
        style={{
          display: "flex",
          gap: 9,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <Btn variant="secondary" size="sm" icon="eye" onClick={onPreview}>
          Preview
        </Btn>
        <Btn
          variant="secondary"
          size="sm"
          icon="trash-2"
          onClick={onDelete}
          disabled={busy}
          style={{ color: "var(--danger)" }}
        >
          Delete
        </Btn>
        <Btn
          variant="secondary"
          size="sm"
          icon="x"
          onClick={onReject}
          disabled={busy}
          style={{ color: "var(--danger)" }}
        >
          Reject
        </Btn>
        <Btn
          variant="primary"
          size="sm"
          icon="check"
          onClick={onApprove}
          disabled={busy}
        >
          Approve
        </Btn>
      </div>
    </div>
  );
}

function PreviewModal({
  post,
  onClose,
  onApprove,
  onReject,
  busy,
}: {
  post: PostWithAuthor;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(33,30,34,0.5)",
        backdropFilter: "blur(4px)",
        overflowY: "auto",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-xl)",
          maxWidth: 720,
          margin: "20px auto",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 2,
            display: "grid",
            placeItems: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: "rgba(255,255,255,0.9)",
            color: "var(--fg)",
          }}
        >
          <Icon name="x" size={18} />
        </button>
        <PostCover post={post} height={200} radius="0" flat />
        <div style={{ padding: "28px 34px 34px" }}>
          <div
            style={{
              display: "flex",
              gap: 7,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            {(post.tags ?? []).map((t) => (
              <Tag key={t} tone={toneForTag(t)} style={{ fontSize: 10 }}>
                {t}
              </Tag>
            ))}
          </div>
          <h1
            style={{
              fontSize: 30,
              margin: "0 0 12px",
              lineHeight: 1.1,
            }}
          >
            {post.title}
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 22,
              color: "var(--fg-muted)",
              fontSize: 14,
            }}
          >
            <Avatar member={post.author} size={32} /> {post.author?.name || "Unknown"} ·{" "}
            {formatDate(post.created_at)}
          </div>
          <div
            className="atx-prose"
            style={{ fontSize: 17 }}
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              marginTop: 28,
              paddingTop: 22,
              borderTop: "1px solid var(--border)",
            }}
          >
            <Btn
              variant="secondary"
              icon="x"
              onClick={onReject}
              disabled={busy}
              style={{ color: "var(--danger)" }}
            >
              Reject
            </Btn>
            <Btn variant="primary" icon="check" onClick={onApprove} disabled={busy}>
              Approve & publish
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "70px 20px",
        color: "var(--fg-muted)",
      }}
    >
      <span
        style={{
          display: "inline-grid",
          placeItems: "center",
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "var(--success-bg)",
          color: "var(--success)",
          marginBottom: 8,
        }}
      >
        <Icon name={icon} size={28} />
      </span>
      <h3 style={{ fontSize: 22, margin: "12px 0 6px", color: "var(--fg)" }}>
        {title}
      </h3>
      <p
        style={{
          margin: "0 auto",
          maxWidth: "40ch",
        }}
      >
        {body}
      </p>
    </div>
  );
}
