import { icons, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  style?: CSSProperties;
  className?: string;
}

function asPascal(name: string): string {
  return name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

export function Icon({ name, size = 20, strokeWidth = 2, style, className }: IconProps) {
  const Cmp = (icons as Record<string, LucideIcon>)[asPascal(name)];
  if (!Cmp) {
    return (
      <span
        aria-hidden="true"
        style={{ display: "inline-block", width: size, height: size, ...style }}
      />
    );
  }
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      style={style}
      className={className}
      aria-hidden="true"
    />
  );
}
