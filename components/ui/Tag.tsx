import type { CSSProperties, ReactNode } from "react";

type Tone = "flame" | "ink" | "teal" | "honey";

interface TagProps {
  children: ReactNode;
  tone?: Tone;
  style?: CSSProperties;
}

const TONES: Record<Tone, CSSProperties> = {
  flame: { background: "var(--orange-50)", color: "var(--orange-700)" },
  ink: { background: "var(--neutral-950)", color: "#F7F2EC" },
  teal: { background: "var(--teal-50)", color: "var(--teal-700)" },
  honey: { background: "var(--honey-100)", color: "var(--honey-700)" },
};

export function Tag({ children, tone = "flame", style }: TagProps) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: "4px 10px",
        borderRadius: "var(--radius-pill)",
        display: "inline-block",
        ...TONES[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
