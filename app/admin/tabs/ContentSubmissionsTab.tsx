"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import type { PostWithAuthor } from "@/lib/posts";

export interface BlogSubmission {
  id: string;
  member_id: string;
  title: string;
  body_md: string;
  summary: string | null;
  pillar: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  formSubmissions: PostWithAuthor[];
  blogSubmissions: BlogSubmission[];
  members: any[];
}

type SubmissionType = "form" | "blog";
type FilterStatus = "all" | "pending" | "approved" | "rejected";

const STATUS_TONES: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "var(--orange-50)", fg: "var(--orange-700)" },
  approved: { bg: "var(--success-bg)", fg: "var(--success)" },
  rejected: { bg: "var(--danger-bg)", fg: "var(--danger)" },
};

export function ContentSubmissionsTab({
  formSubmissions,
  blogSubmissions,
  members,
}: Props) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [open, setOpen] = useState<{ id: string; type: SubmissionType } | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const allSubmissions = [
    ...formSubmissions.map((s) => ({
      id: s.id,
      type: "form" as SubmissionType,
      title: s.title,
      created_at: s.created_at,
      member: s.author,
      status: "pending" as const,
    })),
    ...blogSubmissions.map((s) => ({
      id: s.id,
      type: "blog" as SubmissionType,
      title: s.title,
      created_at: s.submitted_at,
      member: members.find((m) => m.id === s.member_id),
      status: s.status as "pending" | "approved" | "rejected",
    })),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const filtered = allSubmissions.filter((s) => {
    if (filterStatus === "all") return true;
    return s.status === filterStatus;
  });

  const pendingCount = allSubmissions.filter((s) => s.status === "pending").length;
  const approvedCount = allSubmissions.filter((s) => s.status === "approved").length;
  const rejectedCount = allSubmissions.filter((s) => s.status === "rejected").length;

  const handleReview = async (
    id: string,
    type: SubmissionType,
    action: "approve" | "reject",
    reason?: string
  ) => {
    setActionLoading(id);
    try {
      if (type === "blog") {
        const res = await fetch("/api/admin/blog-submissions/review", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id, action, reason }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error || "Review failed");
        }
      } else {
        const res = await fetch("/api/admin/posts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ids: [id],
            action: action === "approve" ? "approve" : "reject",
          }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d?.error || "Review failed");
        }
      }
      router.refresh();
      setOpen(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddToCalendar = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/blog-submissions/add-to-calendar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Add to calendar failed");
      }
      router.refresh();
      setOpen(null);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <StatCard
          label="Total"
          count={allSubmissions.length}
          tone="default"
        />
        <StatCard label="Pending" count={pendingCount} tone="pending" />
        <StatCard label="Approved" count={approvedCount} tone="approved" />
        <StatCard label="Rejected" count={rejectedCount} tone="rejected" />
      </div>

      {/* Filter */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          paddingBottom: 12,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {(["all", "pending", "approved", "rejected"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: filterStatus === status ? 700 : 500,
              border:
                filterStatus === status
                  ? "1px solid var(--primary)"
                  : "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              background:
                filterStatus === status
                  ? "var(--orange-50)"
                  : "transparent",
              color:
                filterStatus === status
                  ? "var(--primary)"
                  : "var(--fg-muted)",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Submissions */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "var(--fg-muted)",
          }}
        >
          <Icon name="inbox" size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
          <p style={{ margin: 0 }}>No submissions found</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.map((sub) => (
            <SubmissionRow
              key={sub.id}
              sub={sub}
              onOpen={() => setOpen({ id: sub.id, type: sub.type })}
            />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {open && (
        <SubmissionDrawer
          open={open}
          submissions={{
            form: formSubmissions,
            blog: blogSubmissions,
          }}
          members={members}
          onClose={() => setOpen(null)}
          onReview={handleReview}
          onAddToCalendar={handleAddToCalendar}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "default" | "pending" | "approved" | "rejected";
}) {
  const toneMap = {
    default: { bg: "var(--surface)", fg: "var(--fg-muted)" },
    pending: { bg: "var(--orange-50)", fg: "var(--orange-700)" },
    approved: { bg: "var(--success-bg)", fg: "var(--success)" },
    rejected: { bg: "var(--danger-bg)", fg: "var(--danger)" },
  };
  const colors = toneMap[tone];
  return (
    <div
      style={{
        background: colors.bg,
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: 12,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 700, color: colors.fg, marginBottom: 4 }}>
        {count}
      </div>
      <div style={{ fontSize: 12, color: "var(--fg-muted)" }}>{label}</div>
    </div>
  );
}

function SubmissionRow({
  sub,
  onOpen,
}: {
  sub: any;
  onOpen: () => void;
}) {
  const statusTone = STATUS_TONES[sub.status];
  return (
    <button
      onClick={onOpen}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 16,
        alignItems: "center",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "16px 18px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 200ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 4,
              background: statusTone.bg,
              color: statusTone.fg,
              textTransform: "capitalize",
            }}
          >
            {sub.status}
          </span>
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 4,
              background: "var(--surface-sunk)",
              color: "var(--fg-subtle)",
            }}
          >
            {sub.type === "blog" ? "Blog Post" : "Form Submission"}
          </span>
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>
          {sub.title}
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
          <Avatar member={sub.member} size={16} />
          {sub.member?.name || "Unknown"} ·{" "}
          {new Date(sub.created_at).toLocaleDateString()}
        </div>
      </div>
      <Icon name="chevron-right" size={20} style={{ color: "var(--fg-muted)" }} />
    </button>
  );
}

function SubmissionDrawer({
  open,
  submissions,
  members,
  onClose,
  onReview,
  onAddToCalendar,
  actionLoading,
}: {
  open: { id: string; type: SubmissionType };
  submissions: { form: PostWithAuthor[]; blog: BlogSubmission[] };
  members: any[];
  onClose: () => void;
  onReview: (id: string, type: SubmissionType, action: "approve" | "reject", reason?: string) => Promise<void>;
  onAddToCalendar: (id: string) => Promise<void>;
  actionLoading: string | null;
}) {
  const submission =
    open.type === "blog"
      ? submissions.blog.find((s) => s.id === open.id)
      : submissions.form.find((s) => s.id === open.id);

  if (!submission) return null;

  const isBlog = open.type === "blog";
  const member = isBlog
    ? members.find((m) => m.id === (submission as BlogSubmission).member_id)
    : (submission as PostWithAuthor).author;
  const status = isBlog ? (submission as BlogSubmission).status : "pending";
  const rejectionReason = isBlog ? (submission as BlogSubmission).rejection_reason : null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "grid",
        placeItems: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "var(--radius-lg)",
          padding: 32,
          maxWidth: 600,
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "var(--shadow-lg)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 600 }}>{submission.title}</h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              color: "var(--fg-muted)",
            }}
          >
            <Avatar member={member} size={24} />
            {member?.name || "Unknown"} · {new Date(submission.created_at).toLocaleDateString()}
            {isBlog && (submission as BlogSubmission).pillar && (
              <>
                · <Tag>{(submission as BlogSubmission).pillar}</Tag>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            background: "var(--bg)",
            padding: 16,
            borderRadius: "var(--radius-md)",
            marginBottom: 24,
            maxHeight: 300,
            overflowY: "auto",
            fontSize: 14,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {isBlog ? (submission as BlogSubmission).body_md : (submission as PostWithAuthor).body}
        </div>

        {rejectionReason && (
          <div
            style={{
              background: "var(--danger-bg)",
              border: "1px solid var(--danger)",
              borderRadius: "var(--radius-md)",
              padding: 12,
              marginBottom: 24,
              fontSize: 13,
              color: "var(--danger)",
            }}
          >
            <strong>Rejection reason:</strong> {rejectionReason}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {status === "pending" && (
            <>
              <Btn
                onClick={() => onReview(open.id, open.type, "reject")}
                variant="secondary"
                disabled={actionLoading === open.id}
              >
                <Icon name="x" size={14} style={{ marginRight: 4 }} />
                Reject
              </Btn>
              <Btn
                onClick={() => onReview(open.id, open.type, "approve")}
                disabled={actionLoading === open.id}
              >
                <Icon name="check" size={14} style={{ marginRight: 4 }} />
                Approve for Review
              </Btn>
              {isBlog && (
                <Btn
                  onClick={() => onAddToCalendar(open.id)}
                  variant="secondary"
                  disabled={actionLoading === open.id}
                >
                  <Icon name="calendar" size={14} style={{ marginRight: 4 }} />
                  Add to Calendar
                </Btn>
              )}
            </>
          )}
          <Btn
            onClick={onClose}
            variant="secondary"
            style={{ marginLeft: "auto" }}
          >
            Close
          </Btn>
        </div>
      </div>
    </div>
  );
}
