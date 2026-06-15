import type { CSSProperties } from "react";

type MarkVariant = "orange" | "white" | "ink" | "gray";

interface MarkProps {
  variant?: MarkVariant;
  height?: number;
  style?: CSSProperties;
  className?: string;
}

export function Mark({
  variant = "orange",
  height = 30,
  style,
  className,
}: MarkProps) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`/assets/mark-skyline-${variant}.png`}
      alt=""
      className={className}
      style={{ height, width: "auto", display: "block", ...style }}
    />
  );
}
