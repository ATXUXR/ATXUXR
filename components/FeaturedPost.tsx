"use client";

import Link from "next/link";
import { useState } from "react";
import { PostCover } from "@/components/ui/PostCover";
import { Tag } from "@/components/ui/Tag";
import { Icon } from "@/components/ui/Icon";
import { Byline } from "@/components/Byline";
import { AdminCardToolbar } from "@/components/AdminCardToolbar";
import { toneForTag } from "@/lib/utils";
import type { PostWithAuthor } from "@/lib/posts";

interface Props {
  post: PostWithAuthor;
  isAdmin?: boolean;
  showStatus?: boolean;
}

export function FeaturedPost({ post, isAdmin = false, showStatus = false }: Props) {
  const [h, setH] = useState(false);
  const isHidden = post.status !== "published";
  const isHiddenByAdmin = isHidden && isAdmin;

  return (
    <div style={{ position: "relative" }}>
    <Link
      href={`/blog/${post.id}`}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      className="blog-featured"
      style={{
        display: "grid",
        gridTemplateColumns: "1.05fr 0.95fr",
        textDecoration: "none",
        color: "inherit",
        background: "var(--surface)",
        border: isHiddenByAdmin ? "2px dotted var(--fg-muted)" : "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        boxShadow: h ? "var(--shadow-lg)" : "var(--shadow-md)",
        transition: "var(--transition)",
        opacity: isHiddenByAdmin ? 0.55 : 1,
      }}
    >
      <PostCover post={post} height={340} radius="0" />
      <div
        style={{
          padding: "40px 38px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--primary)",
            }}
          >
            Latest
          </span>
          {(post.tags ?? []).slice(0, 1).map((t) => (
            <Tag key={t} tone={toneForTag(t)} style={{ fontSize: 10 }}>
              {t}
            </Tag>
          ))}
        </div>
        <h2
          style={{
            fontSize: "clamp(1.7rem, 1.3rem + 1.3vw, 2.3rem)",
            lineHeight: 1.1,
            margin: "0 0 14px",
          }}
        >
          {post.title}
        </h2>
        <p
          style={{
            fontSize: 16.5,
            color: "var(--fg-muted)",
            lineHeight: 1.55,
            margin: "0 0 24px",
          }}
        >
          {post.excerpt}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <Byline
            author={post.author}
            date={post.created_at}
            readMins={post.read_mins}
            size={38}
          />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontWeight: 600,
              fontSize: 14.5,
              color: "var(--orange-700)",
            }}
          >
            Read article <Icon name="arrow-right" size={17} />
          </span>
        </div>
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
