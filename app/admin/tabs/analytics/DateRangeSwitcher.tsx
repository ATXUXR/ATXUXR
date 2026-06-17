"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

const PRESETS = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
];

export function DateRangeSwitcher({ current }: { current: number }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  function go(days: number) {
    const next = new URLSearchParams(params.toString());
    next.set("days", String(days));
    if (!next.get("tab")) next.set("tab", "analytics");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div
      role="tablist"
      aria-label="Date range"
      style={{
        display: "inline-flex",
        gap: 4,
        padding: 4,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {PRESETS.map((p) => {
        const on = p.days === current;
        return (
          <button
            key={p.days}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => go(p.days)}
            style={{
              border: 0,
              cursor: "pointer",
              padding: "8px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "var(--font-body, inherit)",
              background: on ? "var(--primary)" : "transparent",
              color: on ? "#fff" : "var(--fg-muted)",
              transition: "background 0.15s ease, color 0.15s ease",
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
