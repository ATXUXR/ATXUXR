"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { relativeTime } from "@/lib/utils";

export interface CommentRecord {
  id: string;
  author_id: string | null;
  name: string;
  text: string;
  created_at: string;
  author?: { id: string; name: string; photo: string | null } | null;
}

interface Props {
  postId: string;
  comments: CommentRecord[];
  currentMember: { id: string; name: string; photo: string | null } | null;
}

const fieldStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  padding: "12px 14px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--fg)",
  width: "100%",
  boxSizing: "border-box",
};

export function Comments({ postId, comments, currentMember }: Props) {
  const router = useRouter();
  const me = currentMember;
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [posting, setPosting] = useState(false);
  const [, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          name: me ? me.name : name.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to post comment");
      }
      setText("");
      setName("");
      startTransition(() => router.refresh());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "14px 28px 24px",
      }}
    >
      <h2 style={{ fontSize: "var(--text-2xl)", margin: "0 0 20px" }}>
        Discussion{" "}
        <span style={{ color: "var(--fg-subtle)", fontWeight: 400 }}>
          ({comments.length})
        </span>
      </h2>
      <form
        onSubmit={submit}
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          marginBottom: 30,
        }}
      >
        <Avatar
          member={me ? me : { name: name || "?" }}
          size={40}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {!me && (
            <input
              style={fieldStyle}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <textarea
            style={{
              ...fieldStyle,
              resize: "vertical",
              minHeight: 72,
              lineHeight: 1.5,
            }}
            placeholder={me ? "Add to the discussion…" : "Share your thoughts…"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {err && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13.5,
                color: "var(--danger)",
                background: "var(--danger-bg)",
                padding: "9px 12px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <Icon name="alert-circle" size={16} />
              {err}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>
              {me ? `Commenting as ${me.name}` : "Commenting as a guest"}
            </span>
            <Btn variant="primary" type="submit" icon="send" disabled={posting}>
              {posting ? "Posting…" : "Post comment"}
            </Btn>
          </div>
        </div>
      </form>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {comments.length === 0 && (
          <p style={{ color: "var(--fg-muted)", fontSize: 15 }}>
            No comments yet — be the first to weigh in.
          </p>
        )}
        {comments.map((c) => {
          const display = c.author ?? { name: c.name, photo: null };
          return (
            <div
              key={c.id}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <Avatar member={display} size={40} />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 3,
                    flexWrap: "wrap",
                  }}
                >
                  {c.author ? (
                    <Link
                      href={`/members/${c.author.id}`}
                      style={{
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: "var(--fg)",
                        textDecoration: "none",
                      }}
                    >
                      {c.author.name}
                    </Link>
                  ) : (
                    <span
                      style={{
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: "var(--fg)",
                      }}
                    >
                      {c.name}
                    </span>
                  )}
                  {!c.author && (
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9.5,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--fg-subtle)",
                        background: "var(--surface-sunk)",
                        padding: "2px 6px",
                        borderRadius: 999,
                      }}
                    >
                      Guest
                    </span>
                  )}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11.5,
                      color: "var(--fg-subtle)",
                    }}
                  >
                    {relativeTime(c.created_at)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 15,
                    color: "var(--fg-muted)",
                    lineHeight: 1.55,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {c.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
