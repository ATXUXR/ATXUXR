"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { RichEditor } from "@/components/RichEditor";
import { TagPicker } from "@/components/TagPicker";
import { TAG_SUGGESTIONS } from "@/lib/tags";
import { uploadImage } from "@/lib/supabase/upload";
import { wordCount } from "@/lib/utils";
import type { PostWithAuthor } from "@/lib/posts";

interface Props {
  post: PostWithAuthor;
}

export function EditPostForm({ post }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [tags, setTags] = useState<string[]>(post.tags ?? []);
  const [coverPreview, setCoverPreview] = useState<string | null>(post.cover || null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [body, setBody] = useState(post.body);
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
      let coverUrl: string | null = post.cover || null;
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

      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: "PATCH",
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
        throw new Error(data?.error || "Failed to update");
      }

      router.push(`/blog/${post.id}`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

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
          href={`/blog/${post.id}`}
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
          <Icon name="arrow-left" size={16} /> Back to post
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
            EDIT POST
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 1.5rem + 1.6vw, 2.7rem)",
              margin: 0,
            }}
          >
            {title || "Untitled"}
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* COVER */}
          <Field
            label="Cover image"
            optional
            hint="A cover makes your post stand out in the feed."
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
              className="contribute-title-input"
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
              placeholder="What's the takeaway? Hook the reader in a sentence or two."
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
              Changes are saved to the published post.
            </div>
            <Btn
              variant="primary"
              size="lg"
              icon={submitting ? "loader" : "save"}
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Save changes"}
            </Btn>
          </div>
        </div>

        {/* Error toast at bottom */}
        {err && (
          <div
            style={{
              position: "fixed",
              bottom: 20,
              left: 20,
              right: 20,
              maxWidth: 500,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 14,
              color: "white",
              background: "var(--danger)",
              padding: "14px 18px",
              borderRadius: "var(--radius-md)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              zIndex: 1000,
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <Icon name="alert-circle" size={18} style={{ flexShrink: 0 }} />
            <span>{err}</span>
          </div>
        )}
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
