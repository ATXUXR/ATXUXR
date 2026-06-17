import { Avatar, type AvatarMember } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";

interface BylineProps {
  author: AvatarMember | null;
  date: string;
  readMins: number;
  size?: number;
  dark?: boolean;
}

export function Byline({
  author,
  date,
  readMins,
  size = 30,
  dark = false,
}: BylineProps) {
  const muted = dark ? "rgba(247,242,236,0.7)" : "var(--fg-subtle)";
  const fg = dark ? "#fff" : "var(--fg)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Avatar member={author} size={size} />
      <div style={{ lineHeight: 1.25 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: fg }}>
          {author?.name || "Unknown"}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: muted,
          }}
        >
          {formatDate(date)} · {readMins} min read
        </div>
      </div>
    </div>
  );
}
