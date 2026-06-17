"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface Props {
  tags: string[];
  q: string;
  activeTag: string;
}

export function BlogToolbar({ tags, q, activeTag }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [draft, setDraft] = useState(q);

  // Reset local input if a deep link changes ?q=
  useEffect(() => setDraft(q), [q]);

  const updateParams = (mutate: (u: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    const qs = next.toString();
    router.push(qs ? `/blog?${qs}` : "/blog");
  };

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateParams((p) => {
      const v = draft.trim();
      if (v) p.set("q", v);
      else p.delete("q");
    });
  };

  const toggleTag = (t: string) => {
    updateParams((p) => {
      if (activeTag === t) p.delete("tag");
      else p.set("tag", t);
    });
  };

  const clear = () => router.push("/blog");
  const filtering = Boolean(activeTag) || Boolean(q);

  return (
    <section
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 73,
        zIndex: 20,
      }}
    >
      <div
        style={{
          maxWidth: 1140,
          margin: "0 auto",
          padding: "18px 28px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <form
          onSubmit={onSearch}
          style={{
            position: "relative",
            flex: "1 1 260px",
            maxWidth: 360,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--fg-subtle)",
              display: "inline-flex",
            }}
          >
            <Icon name="search" size={18} />
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search posts…"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 14.5,
              padding: "11px 14px 11px 42px",
              borderRadius: "var(--radius-pill)",
              border: "1.5px solid var(--border-strong)",
              background: "var(--bg)",
              color: "var(--fg)",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </form>
        <div
          style={{
            flex: "1 1 auto",
            overflowX: "auto",
            display: "flex",
            gap: 7,
          }}
        >
          {tags.slice(0, 12).map((t) => {
            const on = activeTag === t;
            return (
              <button
                type="button"
                key={t}
                onClick={() => toggleTag(t)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: 10.5,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  padding: "5px 11px",
                  borderRadius: "var(--radius-pill)",
                  transition: "var(--transition)",
                  border:
                    "1.5px solid " +
                    (on ? "var(--primary)" : "var(--border-strong)"),
                  background: on ? "var(--primary)" : "var(--surface)",
                  color: on ? "#fff" : "var(--fg-muted)",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
        {filtering && (
          <button
            type="button"
            onClick={clear}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--fg-muted)",
              background: "none",
              border: "none",
            }}
          >
            <Icon name="x" size={15} /> Clear
          </button>
        )}
      </div>
    </section>
  );
}
