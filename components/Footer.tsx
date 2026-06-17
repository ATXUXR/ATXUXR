import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { Icon } from "./ui/Icon";
import { SOCIALS } from "@/lib/events";
import { Mailing } from "./Mailing";

const NAV: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Events", href: "/events" },
  { label: "Blog", href: "/blog" },
  { label: "Community", href: "/community" },
  { label: "Volunteer", href: "/volunteer" },
  { label: "Donate", href: "/donate" },
];

export function Footer() {
  return (
    <>
      <Mailing />
      <footer
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "52px 28px 30px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 32,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div style={{ maxWidth: "34ch" }}>
              <Wordmark height={28} />
              <p
                style={{
                  fontSize: 14,
                  color: "var(--fg-muted)",
                  marginTop: 14,
                }}
              >
                Austin Texas UXR · CXR · HCI · HF. User experience research,
                usability, human factors — the people-people of ATX.
              </p>
            </div>
            <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--fg-subtle)",
                    marginBottom: 14,
                  }}
                >
                  Explore
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {NAV.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        style={{ fontSize: 14.5, color: "var(--fg)" }}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--fg-subtle)",
                    marginBottom: 14,
                  }}
                >
                  Connect
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 9,
                        fontSize: 14.5,
                        color: "var(--fg)",
                      }}
                    >
                      <span
                        style={{
                          display: "grid",
                          placeItems: "center",
                          width: 30,
                          height: 30,
                          borderRadius: "var(--radius-sm)",
                          background: "var(--surface-sunk)",
                          color: "var(--fg-muted)",
                        }}
                      >
                        <Icon name={s.icon} size={16} />
                      </span>
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 40,
              paddingTop: 22,
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 13,
              color: "var(--fg-subtle)",
            }}
          >
            <span>© 2026 ATX UXR · Austin UX Researchers</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
              }}
            >
              MADE WITH CARE IN AUSTIN, TX
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
