import { Eyebrow } from "./ui/Eyebrow";
import { Icon } from "./ui/Icon";

interface PageHeroProps {
  icon: string;
  eyebrow: string;
  title: string;
  sub: string;
}

export function PageHero({ icon, eyebrow, title, sub }: PageHeroProps) {
  return (
    <section style={{ position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: -280,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 540,
          background:
            "radial-gradient(circle at 50% 50%, rgba(238,74,28,0.16), transparent 64%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "76px 28px 8px",
          position: "relative",
          textAlign: "center",
        }}
      >
        <span
          style={{
            display: "inline-grid",
            placeItems: "center",
            width: 70,
            height: 70,
            borderRadius: "999px 999px 18px 18px",
            background: "var(--primary)",
            color: "#fff",
            marginBottom: 22,
          }}
        >
          <Icon name={icon} size={34} />
        </span>
        <Eyebrow style={{ marginBottom: 14 }}>{eyebrow}</Eyebrow>
        <h1
          style={{
            fontSize: "clamp(2rem, 1.4rem + 2vw, 3rem)",
            margin: 0,
          }}
        >
          {title}
        </h1>
        <p
          className="lead"
          style={{ fontSize: 18, maxWidth: "48ch", margin: "18px auto 0" }}
        >
          {sub}
        </p>
      </div>
    </section>
  );
}
