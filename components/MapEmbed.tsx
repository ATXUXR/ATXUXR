import { Icon } from "./ui/Icon";

interface Props {
  address: string;
}

/**
 * Google Maps embed iframe. No API key required — uses the legacy
 * /maps?q=...&output=embed URL. Renders nothing if address is empty.
 */
export function MapEmbed({ address }: Props) {
  if (!address) return null;
  const q = encodeURIComponent(address);
  const src = `https://www.google.com/maps?q=${q}&output=embed`;
  const open = `https://www.google.com/maps?q=${q}`;
  return (
    <div>
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 10",
          maxHeight: 280,
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "var(--surface-sunk)",
        }}
        className="map-embed-frame"
      >
        <iframe
          src={src}
          title={`Map of ${address}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            display: "block",
          }}
          allowFullScreen
        />
      </div>
      <a
        href={open}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginTop: 10,
          fontSize: 14,
          fontWeight: 600,
          color: "var(--orange-700)",
        }}
      >
        Open in Google Maps <Icon name="external-link" size={15} />
      </a>
    </div>
  );
}
