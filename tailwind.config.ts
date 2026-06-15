import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        // Brand colors are sourced from CSS variables in app/globals.css.
        // Use them as: text-[color:var(--primary)] etc., or via these aliases.
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "primary-press": "var(--primary-press)",
        bg: "var(--bg)",
        "bg-alt": "var(--bg-alt)",
        surface: "var(--surface)",
        "surface-sunk": "var(--surface-sunk)",
        fg: "var(--fg)",
        "fg-muted": "var(--fg-muted)",
        "fg-subtle": "var(--fg-subtle)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        pill: "var(--radius-pill)",
      },
    },
  },
  plugins: [],
};

export default config;
