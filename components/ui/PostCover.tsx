import type { CSSProperties } from "react";
import { toneForTag } from "@/lib/utils";

interface CoverPost {
  cover?: string | null;
  tags?: string[];
  title?: string;
}

const COVER_TONES: Record<
  string,
  { a: string; b: string; ink: string }
> = {
  flame: { a: "#FF9C72", b: "#EE4A1C", ink: "#5A1A06" },
  teal: { a: "#5FB7A6", b: "#0F7E6C", ink: "#07372F" },
  honey: { a: "#F2C879", b: "#E7A33C", ink: "#5A3A06" },
  ink: { a: "#534C51", b: "#211E22", ink: "#F7F2EC" },
};

interface PostCoverProps {
  post: CoverPost;
  height?: number;
  radius?: string;
  flat?: boolean;
}

export function PostCover({
  post,
  height = 200,
  radius = "var(--radius-lg) var(--radius-lg) 0 0",
  flat = false,
}: PostCoverProps) {
  if (post.cover) {
    return (
      <div
        style={{
          height,
          borderRadius: radius,
          backgroundImage: `url(${post.cover})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }
  const tag = (post.tags && post.tags[0]) || "flame";
  const toneKey = toneForTag(tag);
  const tone = COVER_TONES[toneKey] || COVER_TONES.flame;
  const onDark = toneKey === "ink";
  return (
    <div
      style={{
        height,
        borderRadius: radius,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${tone.a}, ${tone.b})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.16,
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.6) 0 2px, transparent 2px 13px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -30,
          bottom: -46,
          width: 200,
          height: 200,
          borderRadius: "999px 999px 0 0",
          border: `2px solid ${
            onDark ? "rgba(247,242,236,0.3)" : "rgba(255,255,255,0.45)"
          }`,
          opacity: 0.7,
        }}
      />
      <div
        style={
          {
            position: "absolute",
            left: flat ? 24 : 22,
            bottom: flat ? 22 : 18,
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: onDark ? "#F7F2EC" : "rgba(255,255,255,0.92)",
          } as CSSProperties
        }
      >
        {tag}
      </div>
    </div>
  );
}
