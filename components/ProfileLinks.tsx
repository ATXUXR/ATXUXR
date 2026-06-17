import { Icon } from "@/components/ui/Icon";

interface ProfileLinksProps {
  linkedin?: string | null;
  website?: string | null;
  email?: string | null;
  /** when false, the "Email" link is omitted (e.g. public member page that wants privacy). */
  showEmail?: boolean;
}

function externalHref(raw: string): string {
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

const linkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
  color: "var(--fg)",
  padding: "8px 14px",
  borderRadius: "var(--radius-pill)",
  background: "var(--surface)",
  border: "1.5px solid var(--border-strong)",
  textDecoration: "none",
};

export function ProfileLinks({
  linkedin,
  website,
  email,
  showEmail = true,
}: ProfileLinksProps) {
  const hasAny = Boolean(linkedin || website || (showEmail && email));
  if (!hasAny) return null;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "22px 24px",
      }}
    >
      <h3
        style={{
          fontSize: 15,
          margin: "0 0 14px",
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--fg-subtle)",
        }}
      >
        Find me online
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
        {linkedin && (
          <a
            href={externalHref(linkedin)}
            target="_blank"
            rel="noreferrer"
            style={linkStyle}
          >
            <Icon name="linkedin" size={16} style={{ color: "var(--fg-muted)" }} />
            LinkedIn
          </a>
        )}
        {website && (
          <a
            href={externalHref(website)}
            target="_blank"
            rel="noreferrer"
            style={linkStyle}
          >
            <Icon name="globe" size={16} style={{ color: "var(--fg-muted)" }} />
            Website
          </a>
        )}
        {showEmail && email && (
          <a href={`mailto:${email}`} style={linkStyle}>
            <Icon name="mail" size={16} style={{ color: "var(--fg-muted)" }} />
            Email
          </a>
        )}
      </div>
    </div>
  );
}
