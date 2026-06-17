import type { CSSProperties, ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function Eyebrow({ children, style }: EyebrowProps) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--primary)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
