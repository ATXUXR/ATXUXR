"use client";

import { useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { icons, type LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "ink";
type Size = "sm" | "md" | "lg";

interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconRight?: string;
  children: ReactNode;
}

const PAD: Record<Size, string> = { sm: "8px 15px", md: "12px 22px", lg: "15px 28px" };
const FONT: Record<Size, number> = { sm: 13, md: 15, lg: 17 };

function asPascal(name: string): string {
  return name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function IconByName({ name, size }: { name: string; size: number }) {
  const Cmp = (icons as Record<string, LucideIcon>)[asPascal(name)];
  if (!Cmp) return null;
  return <Cmp size={size} aria-hidden="true" />;
}

export function Btn({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  type = "button",
  style,
  ...rest
}: BtnProps) {
  const [h, setH] = useState(false);
  const v: Record<Variant, CSSProperties> = {
    primary: {
      background: h ? "var(--orange-600)" : "var(--primary)",
      color: "#fff",
      boxShadow: h ? "var(--shadow-flame)" : "none",
    },
    secondary: {
      background: h ? "var(--surface-sunk)" : "var(--surface)",
      color: "var(--fg)",
      boxShadow: "inset 0 0 0 1.5px var(--border-strong)",
    },
    ghost: {
      background: h ? "var(--orange-50)" : "transparent",
      color: "var(--orange-700)",
    },
    ink: {
      background: h ? "#000" : "var(--neutral-950)",
      color: "#F7F2EC",
    },
  };
  return (
    <button
      type={type}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        fontSize: FONT[size],
        cursor: "pointer",
        border: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: PAD[size],
        borderRadius: "var(--radius-md)",
        transition: "var(--transition)",
        whiteSpace: "nowrap",
        lineHeight: 1.2,
        ...v[variant],
        ...style,
      }}
      {...rest}
    >
      {icon && <IconByName name={icon} size={FONT[size] + 2} />}
      {children}
      {iconRight && <IconByName name={iconRight} size={FONT[size] + 2} />}
    </button>
  );
}
