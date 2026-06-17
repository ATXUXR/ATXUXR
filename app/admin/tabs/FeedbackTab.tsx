"use client";

import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "./SubmissionsTab";
import type { FeedbackRow } from "@/lib/admin";

interface Props {
  feedback: FeedbackRow[];
}

function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          style={{
            color: i <= n ? "var(--honey-500)" : "var(--border-strong)",
            fill: i <= n ? "var(--honey-500)" : "transparent",
          }}
        />
      ))}
    </span>
  );
}

export function FeedbackTab({ feedback }: Props) {
  if (!feedback.length) {
    return (
      <EmptyState
        icon="message-square"
        title="No feedback yet"
        body="Visitor feedback from the site will appear here."
      />
    );
  }
  const rated = feedback.filter((f) => (f.rating ?? 0) > 0);
  const avg = rated.length
    ? rated.reduce((n, f) => n + (f.rating ?? 0), 0) / rated.length
    : 0;
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "14px 20px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 30,
              color: "var(--fg)",
            }}
          >
            {avg.toFixed(1)}
          </span>
          <div>
            <Stars n={Math.round(avg)} />
            <div
              style={{
                fontSize: 12.5,
                color: "var(--fg-subtle)",
                marginTop: 2,
              }}
            >
              {feedback.length} responses
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        {feedback.map((f) => (
          <div
            key={f.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "20px 22px",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              {(f.rating ?? 0) > 0 ? (
                <Stars n={f.rating ?? 0} />
              ) : (
                <span style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>
                  No rating
                </span>
              )}
              {f.page && (
                <Tag tone="ink" style={{ fontSize: 9 }}>
                  {f.page}
                </Tag>
              )}
            </div>
            <p
              style={{
                fontSize: 15,
                color: "var(--fg)",
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {f.message || (
                <span style={{ color: "var(--fg-subtle)" }}>(no message)</span>
              )}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginTop: "auto",
                fontSize: 12.5,
                color: "var(--fg-subtle)",
              }}
            >
              {f.email ? (
                <a
                  href={`mailto:${f.email}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--orange-700)",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <Icon name="mail" size={13} /> Reply
                </a>
              ) : (
                <span>Anonymous</span>
              )}
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {formatDate(f.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
