import type { CSSProperties } from "react";
import { initials, toneForName } from "@/lib/utils";

export interface AvatarMember {
  name?: string | null;
  photo?: string | null;
}

interface AvatarProps {
  member: AvatarMember | null | undefined;
  size?: number;
  ring?: boolean;
  style?: CSSProperties;
}

export function Avatar({ member, size = 44, ring = false, style }: AvatarProps) {
  const name = member?.name || "?";
  const tone = toneForName(name);
  const common: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flex: "none",
    display: "block",
    boxShadow: ring
      ? "0 0 0 2px var(--surface), 0 0 0 3.5px var(--border-strong)"
      : "none",
    ...style,
  };
  if (member?.photo) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={member.photo}
        alt={name}
        style={{ ...common, objectFit: "cover" }}
      />
    );
  }
  return (
    <span
      style={{
        ...common,
        background: tone.bg,
        color: tone.fg,
        display: "grid",
        placeItems: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: size * 0.4,
        letterSpacing: "-0.01em",
      }}
    >
      {initials(name)}
    </span>
  );
}
