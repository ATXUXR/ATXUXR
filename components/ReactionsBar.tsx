"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

type ReactionType = "up" | "heart" | "insight";

interface ReactionCounts {
  up: number;
  heart: number;
  insight: number;
}

interface Props {
  postId: string;
  counts: ReactionCounts;
  mine: Partial<Record<ReactionType, boolean>>;
  signedIn: boolean;
}

const DEFS: { key: ReactionType; icon: string; label: string }[] = [
  { key: "up", icon: "thumbs-up", label: "Helpful" },
  { key: "heart", icon: "heart", label: "Love this" },
  { key: "insight", icon: "lightbulb", label: "Insightful" },
];

export function ReactionsBar({ postId, counts, mine, signedIn }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optCounts, setCounts] = useState<ReactionCounts>(counts);
  const [optMine, setMine] = useState<Partial<Record<ReactionType, boolean>>>(
    mine,
  );

  const toggle = async (type: ReactionType) => {
    if (!signedIn) return; // tooltip is shown via title
    const wasOn = Boolean(optMine[type]);
    setMine((m) => ({ ...m, [type]: !wasOn }));
    setCounts((c) => ({ ...c, [type]: Math.max(0, c[type] + (wasOn ? -1 : 1)) }));
    try {
      await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type }),
      });
      startTransition(() => router.refresh());
    } catch {
      // rollback on failure
      setMine((m) => ({ ...m, [type]: wasOn }));
      setCounts((c) => ({ ...c, [type]: Math.max(0, c[type] + (wasOn ? 1 : -1)) }));
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "18px 0",
        borderTop: "1px solid var(--border)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--fg-subtle)",
          marginRight: 4,
        }}
      >
        React
      </span>
      {DEFS.map((d) => {
        const on = Boolean(optMine[d.key]);
        const n = optCounts[d.key] || 0;
        return (
          <button
            type="button"
            key={d.key}
            onClick={() => toggle(d.key)}
            title={signedIn ? d.label : "Sign in to react"}
            disabled={!signedIn}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              cursor: signedIn ? "pointer" : "not-allowed",
              padding: "8px 14px",
              borderRadius: "var(--radius-pill)",
              transition: "var(--transition)",
              border:
                "1.5px solid " +
                (on ? "var(--primary)" : "var(--border-strong)"),
              background: on ? "var(--orange-50)" : "var(--surface)",
              color: on ? "var(--orange-700)" : "var(--fg-muted)",
              fontWeight: 600,
              fontSize: 14,
              opacity: signedIn ? 1 : 0.7,
            }}
          >
            <Icon name={d.icon} size={16} /> {d.label}
            {n > 0 && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                {n}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
