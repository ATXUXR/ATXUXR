"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Btn } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";

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
  submissions: BlogSubmission[];
  members: any[];
}

const STATUS_TONES: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "var(--orange-50)", fg: "var(--orange-700)" },
  approved: { bg: "var(--success-bg)", fg: "var(--success)" },
  rejected: { bg: "var(--danger-bg)", fg: "var(--danger)" },
};

export function BlogSubmissionsTab({ submissions, members }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  const handleReview = async (
    id: string,
    action: "approve" | "reject",
    reason?: string
  ) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/blog-submissions/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action, reason }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Review failed");
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
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "16px 18px",
          marginBottom: 22,
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 13.5, color: "var(--fg-muted)", flex: 1 }}>
          <strong style={{ color: "var(--fg)" }}>{submissions.length} submissions.</strong> {pendingCount} awaiting review.
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {submissions.map((s) => (
          <SubmissionRow
            key={s.id}
            submission={s}
            member={members.find((m) => m.id === s.member_id)}
            onOpen={() => setOpen(s.id)}
          />
        ))}
      </div>

      {open && (
        <SubmissionDrawer
          submission={submissions.find((s) => s.id === open)!}
          member={members.find((m) => m.id === submissions.find((s) => s.id === open)?.member_id)}
          onClose={() => setOpen(null)}
          onApprove={() => handleReview(open, "approve")}
          onReject={(reason) => handleReview(open, "reject", reason)}
          onAddToCalendar={() => handleAddToCalendar(open)}
          loading={actionLoading === open}
        />
      )}
    </div>
  );
}

function SubmissionRow({
  submission,
  member,
  onOpen,
}: {
  submission: BlogSubmission;
  member: any;
  onOpen: () => void;
}) {
  const date = new Date(submission.submitted_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const tone = STATUS_TONES[submission.status];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "13px 16px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
      }}
      onClick={onOpen}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{submission.title}</div>
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
          <span>{member?.name || "Unknown"}</span>
          <span>·</span>
          <span>{date}</span>
          {submission.pillar && (
            <>
              <span>·</span>
              <span>{submission.pillar}</span>
            </>
          )}
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
        {submission.status}
      </span>
    </div>
  );
}

function SubmissionDrawer({
  submission,
  member,
  onClose,
  onApprove,
  onReject,
  onAddToCalendar,
  loading,
}: {
  submission: BlogSubmission;
  member: any;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onAddToCalendar: () => void;
  loading: boolean;
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

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
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg)",
          width: "min(720px, 100%)",
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
              Submission by {member?.name || "Unknown"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>
              {submission.title}
            </div>
          </div>
          <Btn variant="ghost" icon="x" onClick={onClose}>
            Close
          </Btn>
        </div>

        <div style={{ padding: 24 }}>
          {submission.pillar && (
            <div style={{ marginBottom: 16 }}>
              <Tag>{submission.pillar}</Tag>
            </div>
          )}

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
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--fg-subtle)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Content
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--fg)",
                whiteSpace: "pre-wrap",
              }}
            >
              {submission.body_md}
            </div>
          </div>

          {submission.summary && (
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
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Summary
              </div>
              <div style={{ fontSize: 13.5, color: "var(--fg-muted)" }}>
                {submission.summary}
              </div>
            </div>
          )}

          {submission.status === "pending" && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Btn
                onClick={onApprove}
                disabled={loading}
              >
                {loading ? "Approving…" : "Approve"}
              </Btn>
              <Btn
                variant="secondary"
                onClick={() => setShowRejectForm(!showRejectForm)}
                disabled={loading}
              >
                Reject
              </Btn>
            </div>
          )}

          {submission.status === "approved" && (
            <Btn
              onClick={onAddToCalendar}
              disabled={loading}
              icon="plus"
            >
              {loading ? "Adding…" : "Add to calendar"}
            </Btn>
          )}

          {showRejectForm && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: "var(--surface)",
                border: "1px solid var(--danger-bg)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--fg-muted)",
                  marginBottom: 8,
                }}
              >
                Rejection reason
              </label>
              <textarea
                rows={3}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1.5px solid var(--border-strong)",
                  background: "var(--bg)",
                  color: "var(--fg)",
                  width: "100%",
                  boxSizing: "border-box",
                  marginBottom: 8,
                }}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this submission is being rejected…"
              />
              <div style={{ display: "flex", gap: 8 }}>
                <Btn
                  onClick={() => {
                    onReject(rejectionReason);
                    setShowRejectForm(false);
                  }}
                  disabled={loading}
                >
                  {loading ? "Rejecting…" : "Reject"}
                </Btn>
                <Btn
                  variant="secondary"
                  onClick={() => setShowRejectForm(false)}
                >
                  Cancel
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
