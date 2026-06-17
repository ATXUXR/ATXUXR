import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <section style={{ background: "var(--bg)" }}>
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "96px 28px",
          textAlign: "center",
        }}
      >
        <Eyebrow style={{ marginBottom: 14 }}>BLOG</Eyebrow>
        <h1
          style={{
            fontSize: "clamp(2rem, 1.4rem + 2vw, 3rem)",
            margin: "0 0 14px",
          }}
        >
          Coming soon
        </h1>
        <p style={{ fontSize: 17, color: "var(--fg-muted)" }}>
          We&apos;re building a home for field notes, essays, and stories from
          Austin&apos;s research community. Watch this space.
        </p>
      </div>
    </section>
  );
}
