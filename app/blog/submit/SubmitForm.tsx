"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Btn } from "@/components/ui/Button";

const PILLARS = [
  "Probabilistic User Research",
  "Trust, Verification, and Safe Reliance",
  "Agentic and Anticipatory UX",
  "AI Economics and Value",
  "Research Craft in the AI Era",
];

export function SubmitForm({ member }: { member: any }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [summary, setSummary] = useState("");
  const [pillar, setPillar] = useState(PILLARS[0]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setErr("Title and body are required");
      return;
    }

    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/blog-submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          body_md: body,
          summary: summary || null,
          pillar,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Submission failed");
      }

      setSuccess(true);
      setTitle("");
      setBody("");
      setSummary("");

      setTimeout(() => {
        router.push("/blog");
      }, 2000);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          background: "var(--success-bg)",
          color: "var(--success)",
          padding: 24,
          borderRadius: "var(--radius-lg)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          ✓ Submission received
        </div>
        <div style={{ fontSize: 14 }}>
          Thank you! Your post is under review. We'll let you know when it's published.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {err && (
        <div
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger)",
            padding: 12,
            borderRadius: "var(--radius-md)",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {err}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        <Field label="Your name">
          <input
            type="text"
            disabled
            value={member.name || member.email}
            style={{
              ...inputStyle,
              background: "var(--surface-sunk)",
              color: "var(--fg-muted)",
            }}
          />
        </Field>

        <Field label="Post title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's the main idea?"
            style={inputStyle}
          />
        </Field>

        <Field label="Pillar">
          <select value={pillar} onChange={(e) => setPillar(e.target.value)} style={inputStyle}>
            {PILLARS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>

        <Field label="Summary (optional)">
          <textarea
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="One-sentence summary for social sharing"
            style={inputStyle}
          />
        </Field>

        <Field label="Your post (markdown)" required>
          <textarea
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`# Your headline

Write your post here. You can use **bold**, *italic*, and [links](https://example.com).

- Bullet points
- Work too

\`\`\`
code blocks
\`\`\``}
            style={{
              ...inputStyle,
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          />
          <div
            style={{
              fontSize: 12,
              color: "var(--fg-subtle)",
              marginTop: 8,
            }}
          >
            Markdown formatting supported. Keep it between 500–2000 words.
          </div>
        </Field>

        <div style={{ display: "flex", gap: 8 }}>
          <Btn type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit for review"}
          </Btn>
          <Btn
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Btn>
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--fg-subtle)",
            padding: 12,
            background: "var(--surface)",
            borderRadius: "var(--radius-md)",
            borderLeft: "3px solid var(--primary)",
          }}
        >
          <strong>What happens next?</strong> Your submission goes to our editorial team for
          review. We typically respond within 5–7 business days. Accepted posts are edited for
          clarity and published on the ATXUXR blog and syndicated to our social channels.
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--fg)",
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: "var(--danger)", marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  padding: "9px 12px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-strong)",
  background: "var(--bg)",
  color: "var(--fg)",
  width: "100%",
  boxSizing: "border-box",
};
