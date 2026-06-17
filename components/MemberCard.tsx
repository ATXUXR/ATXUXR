"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Tag } from "@/components/ui/Tag";
import { Icon } from "@/components/ui/Icon";
import { toneForTag } from "@/lib/utils";
import type { DirectoryMember } from "@/lib/members";

interface MemberCardProps {
  member: DirectoryMember;
}

export function MemberCard({ member }: MemberCardProps) {
  const [h, setH] = useState(false);
  return (
    <Link
      href={`/members/${member.id}`}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        cursor: "pointer",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "26px 24px",
        boxShadow: h ? "var(--shadow-md)" : "var(--shadow-sm)",
        transform: h ? "translateY(-3px)" : "none",
        transition: "var(--transition)",
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <Avatar member={member} size={56} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <h3
              style={{
                fontSize: 18,
                margin: 0,
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {member.name || "Unnamed member"}
            </h3>
            {member.admin && (
              <Tag tone="ink" style={{ fontSize: 9 }}>
                Organizer
              </Tag>
            )}
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: "var(--fg-muted)",
              marginTop: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {member.role || "—"}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 7,
          marginBottom: 16,
          fontSize: 13.5,
          color: "var(--fg-muted)",
        }}
      >
        {member.company && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon
              name="building-2"
              size={14}
              style={{ color: "var(--fg-subtle)" }}
            />
            {member.company}
          </span>
        )}
        {member.location && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon
              name="map-pin"
              size={14}
              style={{ color: "var(--fg-subtle)" }}
            />
            {member.location}
          </span>
        )}
      </div>
      {member.expertise && member.expertise.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: "auto",
          }}
        >
          {member.expertise.slice(0, 3).map((t) => (
            <Tag key={t} tone={toneForTag(t)} style={{ fontSize: 9.5 }}>
              {t}
            </Tag>
          ))}
        </div>
      )}
    </Link>
  );
}
