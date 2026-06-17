"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { RichEditor } from "@/components/RichEditor";
import { TagPicker } from "@/components/TagPicker";
import { TAG_SUGGESTIONS } from "@/lib/tags";
import { uploadImage } from "@/lib/supabase/upload";
import { wordCount } from "@/lib/utils";

interface Props {
  me: {
    id: string;
    name: string;
    photo: string | null;
  };
}

export function ContributeForm({ me }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const words = wordCount(body);
  const minutes = Math.max(1, Math.round(words / 200));

  const onCover = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const r = new FileReader();
    r.onload = () =>
      setCoverPreview(typeof r.result === "string" ? r.result : null);
    r.readAsDataURL(file);
  };

  const removeCover = () => {
    setCoverPreview(null);
    setCoverFile(null);
  };

  const submit = async () => {
    setErr(null);
    if (!title.trim()) {
      setErr("Give your post a title.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (words < 20) {
      setErr("Write a bit more before submitting (at least ~20 words).");
      return;
    }
    if (!excerpt.trim()) {
      setErr("Add a short summary so it reads well in the feed.");
      return;
    }
    setSubmitting(true);
    try {
      let coverUrl: string | null = null;
      if (coverFile) {
        try {
          const { url } = await uploadImage({ bucket: "covers", file: coverFile });
          coverUrl = url;
        } catch (e) {
          setErr(
            e instanceof Error
              ? `Cover upload failed: ${e.message}`
              : "Cover upload failed",
          );
          return;
        }
      }
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim(),
          body,
          tags,
          cover: coverUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit");
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section
        style={{
          background: "var(--bg)",
          minHeight: "60vh",
          display: "grid",
          placeItems: "center",
          padding: 40,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--success-bg)",
              color: "var(--success)",
              marginBottom: 20,
            }}
          >
            <Icon name="check" size={36} />
          </span>
          <h2 style={{ fontSize: 30, margin: "0 0 12px" }}>
            Submitted for review!
          </h2>
          <p
            style={{
              fontSize: 16.5,
              color: "var(--fg-muted)",
              margin: "0 0 26px",
              lineHeight: 1.6,
            }}
          >
            Thanks for contributing, {me.name.split(" ")[0]}. An organizer will
            review{" "}
            <strong style={{ color: "var(--fg)" }}>“{title}”</strong> and publish
            it to the blog. You&apos;ll see it in the feed once it&apos;s approved.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/blog" style={{ textDecoration: "none" }}>
              <Btn variant="secondary">Back to blog</Btn>
            </Link>
            <Btn
              variant="primary"
              icon="pen-line"
              onClick={() => {
                setTitle("");
                setExcerpt("");
                setTags([]);
                removeCover();
                setBody("");
                setDone(false);
              }}
            >
              Write another
            </Btn>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ background: "var(--bg)" }}>
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "44px 28px 80px",
        }}
      >
        <Link
          href="/blog"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontWeight: 600,
            fontSize: 14,
            color: "var(--fg-muted)",
            textDecoration: "none",
            marginBottom: 22,
          }}
        >
          <Icon name="arrow-left" size={16} /> Back to blog
        </Link>

        <div style={{ marginBottom: 30 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--primary)",
              marginBottom: 12,
            }}
          >
            CONTRIBUTE
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 1.5rem + 1.6vw, 2.7rem)",
              margin: "0 0 10px",
            }}
          >
            Write a post
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "var(--fg-muted)",
              fontSize: 14.5,
            }}
          >
            <Avatar member={me} size={28} /> Posting as{" "}
            <strong style={{ color: "var(--fg)" }}>{me.name}</strong>
          </div>
        </div>

        {err && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: 14,
              color: "var(--danger)",
              background: "var(--danger-bg)",
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              marginBottom: 22,
            }}
          >
            <Icon name="alert-circle" size={18} /> {err}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* COVER */}
          <Field
            label="Cover image"
            optional
            hint="A cover makes your post stand out in the feed. Leave blank for a branded cover."
          >
            {coverPreview ? (
              <div
                style={{
                  position: "relative",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: 200,
                    backgroundImage: `url(${coverPreview})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <button
                  type="button"
                  onClick={removeCover}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    cursor: "pointer",
                    background: "rgba(33,30,34,0.78)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <Icon name="trash-2" size={14} /> Remove
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  height: 150,
                  borderRadius: "var(--radius-lg)",
                  border: "2px dashed var(--border-strong)",
                  background: "var(--surface)",
                  cursor: "pointer",
                  color: "var(--fg-muted)",
                }}
              >
                <Icon name="image-plus" size={26} />
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>
                  Click to upload a cover
                </span>
                <span style={{ fontSize: 12.5, color: "var(--fg-subtle)" }}>
                  PNG or JPG
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onCover}
                  style={{ display: "none" }}
                />
              </label>
            )}
          </Field>

          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A clear, specific headline"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 26,
                letterSpacing: "-0.02em",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-strong)",
                background: "var(--surface)",
                color: "var(--fg)",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
          </Field>

          <Field
            label="Summary"
            hint="One or two sentences shown on the blog card and at the top of your article."
          >
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              placeholder="What’s the takeaway? Hook the reader in a sentence or two."
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "1.5px solid var(--border-strong)",
                background: "var(--surface)",
                color: "var(--fg)",
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </Field>

          <Field
            label="Tags"
            hint="Pick from suggested UXR topics or add your own."
          >
            <TagPicker
              value={tags}
              onChange={setTags}
              suggestions={TAG_SUGGESTIONS}
            />
          </Field>

          <Field label="Body">
            <RichEditor
              value={body}
              onChange={setBody}
              placeholder="Tell your story… use the toolbar for headings, lists, and quotes."
            />
            <div
              style={{
                fontSize: 12.5,
                color: "var(--fg-subtle)",
                marginTop: 6,
                textAlign: "right",
              }}
            >
              {words} words · ~{minutes} min read
            </div>
          </Field>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
              paddingTop: 8,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13.5,
                color: "var(--fg-muted)",
              }}
            >
              <Icon
                name="shield-check"
                size={17}
                style={{ color: "var(--teal-500)" }}
              />{" "}
              Posts are reviewed by an organizer before publishing.
            </div>
            <Btn
              variant="primary"
              size="lg"
              icon={submitting ? "loader" : "send"}
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit for review"}
            </Btn>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          fontSize: 13.5,
          marginBottom: 6,
          color: "var(--fg)",
        }}
      >
        {label}
        {optional && (
          <span style={{ color: "var(--fg-subtle)", fontWeight: 400 }}>
            {" "}
            (optional)
          </span>
        )}
      </label>
      {children}
      {hint && (
        <div
          style={{
            fontSize: 12.5,
            color: "var(--fg-subtle)",
            marginTop: 5,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
