"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { initials, toneForName } from "@/lib/utils";

export interface ProfileSeed {
  name: string;
  role: string;
  company: string;
  location: string;
  bio: string;
  linkedin: string;
  website: string;
  expertise: string[];
  photo: string | null;
}

const TAG_SUGGESTIONS = [
  "AI & Research",
  "Research Methods",
  "ResearchOps",
  "Qualitative",
  "Quantitative",
  "Survey Design",
  "Interviewing",
  "Synthesis",
  "Career",
  "Stakeholders",
  "Strategy",
  "Accessibility",
  "Storytelling",
  "Tools",
  "Mixed Methods",
  "Continuous Discovery",
  "Ethics",
  "Onboarding",
];

const fieldStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  padding: "12px 14px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--fg)",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: 13.5,
  marginBottom: 6,
  color: "var(--fg)",
};

interface Props {
  seed: ProfileSeed;
  isSetup: boolean;
}

function Avatar({
  name,
  photo,
  size,
}: {
  name: string;
  photo: string | null;
  size: number;
}) {
  if (photo) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={photo}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          background: "var(--surface-sunk)",
        }}
      />
    );
  }
  const tone = toneForName(name || "Member");
  return (
    <span
      style={{
        display: "inline-grid",
        placeItems: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: tone.bg,
        color: tone.fg,
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: size * 0.36,
      }}
    >
      {initials(name) || "?"}
    </span>
  );
}

export function ProfileSetupForm({ seed, isSetup }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileSeed>(seed);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProfileSeed>(k: K, v: ProfileSeed[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => set("photo", typeof r.result === "string" ? r.result : null);
    r.readAsDataURL(file);
  };

  const addTag = (t: string) => {
    const tag = t.trim();
    if (!tag) return;
    if (form.expertise.includes(tag)) return;
    set("expertise", [...form.expertise, tag]);
  };

  const removeTag = (t: string) =>
    set(
      "expertise",
      form.expertise.filter((x) => x !== t),
    );

  const save = async () => {
    setSaving(true);
    try {
      // Stub: writes the profile to a real route once Supabase is wired.
      console.log("profile save (stub)", form);
      router.push("/profile");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section style={{ background: "var(--bg)" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 28px 80px" }}>
        {isSetup ? (
          <div style={{ textAlign: "center", marginBottom: 34 }}>
            <span
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: 64,
                height: 64,
                borderRadius: "999px 999px 16px 16px",
                background: "var(--orange-50)",
                color: "var(--primary)",
                marginBottom: 16,
              }}
            >
              <Icon name="sparkles" size={30} />
            </span>
            <h1
              style={{
                fontSize: "clamp(2rem, 1.5rem + 1.6vw, 2.6rem)",
                margin: "0 0 10px",
              }}
            >
              Welcome! Set up your profile
            </h1>
            <p style={{ fontSize: 16.5, color: "var(--fg-muted)", margin: 0 }}>
              Tell the community who you are. You can always change this later.
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: 30 }}>
            <h1 style={{ fontSize: "clamp(2rem, 1.5rem + 1.6vw, 2.6rem)", margin: 0 }}>
              Edit your profile
            </h1>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "30px 30px 34px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <Avatar name={form.name} photo={form.photo} size={84} />
            <div>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: 14,
                  padding: "10px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--surface)",
                  border: "1.5px solid var(--border-strong)",
                  color: "var(--fg)",
                }}
              >
                <Icon name="upload" size={16} />
                {form.photo ? "Change photo" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPhoto}
                  style={{ display: "none" }}
                />
              </label>
              {form.photo && (
                <button
                  type="button"
                  onClick={() => set("photo", null)}
                  style={{
                    marginLeft: 10,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--fg-muted)",
                  }}
                >
                  Remove
                </button>
              )}
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--fg-subtle)",
                  marginTop: 7,
                }}
              >
                No photo? We&apos;ll use your initials.
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Full name</label>
            <input
              style={fieldStyle}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
            className="setup-row"
          >
            <div>
              <label style={labelStyle}>Role / title</label>
              <input
                style={fieldStyle}
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                placeholder="Senior UX Researcher"
              />
            </div>
            <div>
              <label style={labelStyle}>Company</label>
              <input
                style={fieldStyle}
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Where you work"
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input
              style={fieldStyle}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Austin, TX"
            />
          </div>
          <div>
            <label style={labelStyle}>About</label>
            <textarea
              style={{ ...fieldStyle, resize: "vertical", minHeight: 96 }}
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              rows={3}
              placeholder="Mixed-methods researcher focused on…"
            />
          </div>
          <div>
            <label style={labelStyle}>Research interests</label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 10,
              }}
            >
              {form.expertise.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => removeTag(t)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                  aria-label={`Remove ${t}`}
                >
                  <Tag tone="flame">{t} ×</Tag>
                </button>
              ))}
            </div>
            <input
              style={fieldStyle}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                  setTagInput("");
                }
              }}
              placeholder="Type a topic and press enter"
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 10,
              }}
            >
              {TAG_SUGGESTIONS.filter((s) => !form.expertise.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addTag(s)}
                  style={{
                    cursor: "pointer",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-pill)",
                    border: "1px solid var(--border-strong)",
                    background: "var(--surface-sunk)",
                    color: "var(--fg-muted)",
                  }}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
            className="setup-row"
          >
            <div>
              <label style={labelStyle}>LinkedIn</label>
              <input
                style={fieldStyle}
                value={form.linkedin}
                onChange={(e) => set("linkedin", e.target.value)}
                placeholder="linkedin.com/in/you"
              />
            </div>
            <div>
              <label style={labelStyle}>Personal website</label>
              <input
                style={fieldStyle}
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="yoursite.com"
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              flexWrap: "wrap",
              paddingTop: 8,
              borderTop: "1px solid var(--border)",
            }}
          >
            {isSetup && (
              <Btn variant="ghost" onClick={save}>
                Skip for now
              </Btn>
            )}
            <Btn
              variant="primary"
              size="lg"
              icon="check"
              onClick={save}
              disabled={saving}
            >
              {isSetup ? "Finish setup" : "Save changes"}
            </Btn>
          </div>
        </div>
      </div>
    </section>
  );
}
