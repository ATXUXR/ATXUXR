"use client";

interface TagChipsProps {
  tags: string[];
  active?: (t: string) => boolean;
  onToggle: (t: string) => void;
  small?: boolean;
}

export function TagChips({ tags, active, onToggle, small = false }: TagChipsProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {tags.map((t) => {
        const on = active ? active(t) : false;
        return (
          <button
            type="button"
            key={t}
            onClick={() => onToggle(t)}
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: small ? 10.5 : 11.5,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: small ? "5px 10px" : "7px 13px",
              borderRadius: "var(--radius-pill)",
              transition: "var(--transition)",
              border: "1.5px solid " + (on ? "var(--primary)" : "var(--border-strong)"),
              background: on ? "var(--primary)" : "var(--surface)",
              color: on ? "#fff" : "var(--fg-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
