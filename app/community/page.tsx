import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata = { title: "Community" };

export default function CommunityPage() {
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
        <Eyebrow style={{ marginBottom: 14 }}>COMMUNITY</Eyebrow>
        <h1
          style={{
            fontSize: "clamp(2rem, 1.4rem + 2vw, 3rem)",
            margin: "0 0 14px",
          }}
        >
          Coming soon
        </h1>
        <p style={{ fontSize: 17, color: "var(--fg-muted)" }}>
          A directory of Austin&apos;s UX, CX, HF, and HCI researchers. Once you
          sign up and finish your profile, you&apos;ll show up here.
        </p>
      </div>
    </section>
  );
}
