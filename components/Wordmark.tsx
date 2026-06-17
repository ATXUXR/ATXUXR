import { Mark } from "./Mark";

interface WordmarkProps {
  height?: number;
  dark?: boolean;
}

export function Wordmark({ height = 28, dark = false }: WordmarkProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: height * 0.34,
      }}
    >
      <Mark variant={dark ? "white" : "orange"} height={height} />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: height * 0.92,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        <span style={{ color: dark ? "#fff" : "var(--neutral-700)" }}>ATX</span>
        <span style={{ color: "var(--primary)" }}>UXR</span>
      </span>
    </span>
  );
}
