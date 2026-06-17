"use client";

import { useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";

interface TagPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

const FIELD_BOX: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  padding: "10px 12px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--fg)",
  width: "100%",
  boxSizing: "border-box",
  minHeight: 46,
};

export function TagPicker({
  value,
  onChange,
  suggestions = [],
  placeholder,
}: TagPickerProps) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
    setDraft("");
  };

  const remove = (t: string) => onChange(value.filter((v) => v !== t));

  const open = suggestions
    .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))
    .filter((s) => !draft || s.toLowerCase().includes(draft.toLowerCase()))
    .slice(0, 8);

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          ...FIELD_BOX,
        }}
      >
        {value.map((t) => (
          <span
            key={t}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "5px 6px 5px 10px",
              borderRadius: "var(--radius-pill)",
              background: "var(--orange-50)",
              color: "var(--orange-700)",
            }}
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              aria-label={`Remove ${t}`}
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                background: "var(--orange-200)",
                color: "var(--orange-800)",
              }}
            >
              <Icon name="x" size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={
            placeholder ||
            (value.length
              ? "Add another…"
              : "Pick from suggestions or type your own…")
          }
          style={{
            flex: "1 1 120px",
            minWidth: 120,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--fg)",
          }}
        />
      </div>
      {open.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 7,
            marginTop: 10,
          }}
        >
          {open.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => add(s)}
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: "5px 11px",
                borderRadius: "var(--radius-pill)",
                background: "var(--surface)",
                color: "var(--fg-muted)",
                border: "1.5px dashed var(--border-strong)",
              }}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
