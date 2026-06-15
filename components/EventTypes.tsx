import { EVENT_TYPES } from "@/lib/events";
import { Eyebrow } from "./ui/Eyebrow";
import { Icon } from "./ui/Icon";

export function EventTypes() {
  return (
    <section
      style={{
        background: "var(--bg-alt)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "76px 28px" }}>
        <Eyebrow style={{ marginBottom: 14 }}>OUR EVENT TYPES</Eyebrow>
        <h2 style={{ fontSize: "var(--text-3xl)", margin: "0 0 36px", maxWidth: "20ch" }}>
          Three ways we show up for each other.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
          className="types-grid"
        >
          {EVENT_TYPES.map((t) => (
            <div
              key={t.name}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "28px 26px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 18,
                }}
              >
                <span
                  style={{
                    display: "inline-grid",
                    placeItems: "center",
                    width: 50,
                    height: 50,
                    borderRadius: "999px 999px 14px 14px",
                    background:
                      t.tone === "teal"
                        ? "var(--teal-50)"
                        : t.tone === "honey"
                        ? "var(--honey-100)"
                        : "var(--orange-50)",
                    color:
                      t.tone === "teal"
                        ? "var(--teal-700)"
                        : t.tone === "honey"
                        ? "var(--honey-700)"
                        : "var(--primary)",
                  }}
                >
                  <Icon name={t.icon} size={24} />
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 30,
                    color: "var(--border-strong)",
                  }}
                >
                  {t.n}
                </span>
              </div>
              <h3 style={{ fontSize: 24, margin: "0 0 10px" }}>{t.name}</h3>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--fg-muted)",
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {t.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
