"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface ShareBarProps {
  title: string;
  url: string;
  label?: boolean;
}


function MediumLogo({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
    </svg>
  );
}

function LinkedInLogo({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export function ShareBar({ title, url, label = true }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const text = `${title} — via ATX UXR`;
  const open = (href: string) => window.open(href, "_blank", "noopener");

  const targets = [
    {
      key: "li",
      Logo: LinkedInLogo,
      title: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url,
      )}`,
    },
    {
      key: "md",
      Logo: MediumLogo,
      title: "Import to Medium",
      href: `https://medium.com/p/import?url=${encodeURIComponent(url)}`,
    },
  ];

  const copy = async () => {
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    };
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
    done();
  };

  const btnBase: React.CSSProperties = {
    display: "inline-grid",
    placeItems: "center",
    width: 40,
    height: 40,
    borderRadius: "50%",
    cursor: "pointer",
    background: "var(--surface)",
    color: "var(--fg-muted)",
    border: "1.5px solid var(--border-strong)",
    transition: "var(--transition)",
  };

  const onHover = (
    e: React.MouseEvent<HTMLButtonElement>,
    on: boolean,
  ) => {
    const el = e.currentTarget;
    el.style.background = on ? "var(--neutral-950)" : "var(--surface)";
    el.style.color = on ? "#fff" : "var(--fg-muted)";
    el.style.borderColor = on ? "var(--neutral-950)" : "var(--border-strong)";
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {label && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--fg-subtle)",
            marginRight: 2,
          }}
        >
          Share
        </span>
      )}
      {targets.map(({ key, Logo, title: t, href }) => (
        <button
          type="button"
          key={key}
          title={t}
          aria-label={t}
          onClick={() => open(href)}
          style={btnBase}
          onMouseEnter={(e) => onHover(e, true)}
          onMouseLeave={(e) => onHover(e, false)}
        >
          <Logo />
        </button>
      ))}
      <button
        type="button"
        title={copied ? "Copied!" : "Copy link"}
        aria-label="Copy link"
        onClick={copy}
        style={btnBase}
        onMouseEnter={(e) => onHover(e, true)}
        onMouseLeave={(e) => onHover(e, false)}
      >
        <Icon name={copied ? "check" : "link"} size={16} />
      </button>
    </div>
  );
}
