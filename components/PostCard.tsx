"use client";

import Link from "next/link";
import { useState } from "react";
import { PostCover } from "@/components/ui/PostCover";
import { Tag } from "@/components/ui/Tag";
import { Byline } from "@/components/Byline";
import { AdminCardToolbar } from "@/components/AdminCardToolbar";
import { toneForTag } from "@/lib/utils";
import type { PostWithAuthor } from "@/lib/posts";

interface PostCardProps {
  post: PostWithAuthor;
  isAdmin?: boolean;
  showStatus?: boolean;
}

export function PostCard({ post, isAdmin = false, showStatus = false }: PostCardProps) {
  const [h, setH] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <Link
        href={`/blog/${post.id}`}
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: h ? "var(--shadow-md)" : "var(--shadow-sm)",
          transform: h ? "translateY(-3px)" : "none",
          transition: "var(--transition)",
        }}
      >
      <PostCover post={post} height={172} />
      <div
        style={{
          padding: "20px 22px 22px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 7,
            marginBottom: 12,
          }}
        >
          {showStatus && post.status !== "published" && (
            <Tag tone="ink" style={{ fontSize: 10 }}>
              {post.status?.toUpperCase() || "DRAFT"}
            </Tag>
          )}
          {(post.tags ?? []).slice(0, 2).map((t) => (
            <Tag key={t} tone={toneForTag(t)} style={{ fontSize: 10 }}>
              {t}
            </Tag>
          ))}
        </div>
        <h3 style={{ fontSize: 21, lineHeight: 1.2, margin: "0 0 10px" }}>
          {post.title}
        </h3>
        <p
          style={{
            fontSize: 14.5,
            color: "var(--fg-muted)",
            lineHeight: 1.55,
            margin: "0 0 18px",
            flex: 1,
          }}
        >
          {post.excerpt}
        </p>
        <Byline
          author={post.author}
          date={post.created_at}
          readMins={post.read_mins}
        />
      </div>
    </Link>
      <AdminCardToolbar
        itemId={post.id}
        itemType="post"
        isAdmin={isAdmin}
        status={post.status}
      />
    </div>
  );
}
