"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { PublicEvent } from "@/lib/event-fetch";

interface EventFile {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  created_at: string;
}

interface Props {
  event: PublicEvent;
  initialFiles: EventFile[];
}

export function EventFilesManager({ event, initialFiles }: Props) {
  const router = useRouter();
  const [files, setFiles] = useState<EventFile[]>(initialFiles);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      setErr("File size must be under 50MB");
      return;
    }

    setSelectedFile(file);
    setErr(null);
  };

  const upload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setErr(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("eventId", event.id);

      const res = await fetch("/api/admin/event-files/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Upload failed");
      }

      const uploadedFile = await res.json();
      setFiles([uploadedFile, ...files]);
      setSelectedFile(null);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm("Delete this file?")) return;

    setDeleting(fileId);
    setErr(null);
    try {
      const res = await fetch("/api/admin/event-files/delete", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Delete failed");
      }

      setFiles(files.filter((f) => f.id !== fileId));
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
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
          href={`/events/${event.routeId}`}
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
          <Icon name="arrow-left" size={16} /> Back to event
        </Link>

        <div style={{ marginBottom: 30 }}>
          <h1 style={{ fontSize: "clamp(2rem, 1.5rem + 1.6vw, 2.7rem)", margin: 0 }}>
            Manage files
          </h1>
          <p style={{ color: "var(--fg-muted)", margin: "8px 0 0" }}>
            {event.title}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* UPLOAD SECTION */}
          <div style={{ background: "var(--surface)", padding: 24, borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>
              Upload file
            </h2>
            <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: "0 0 16px" }}>
              Add images, PDFs, presentations, or other documents (max 50MB)
            </p>

            {selectedFile ? (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span style={{ color: "var(--fg-muted)" }}>
                    <Icon name="file" size={16} />
                  </span>
                  <span style={{ flex: 1, fontSize: 14 }}>{selectedFile.name}</span>
                  <span style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--fg-muted)",
                    }}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
                <Btn
                  variant="primary"
                  size="lg"
                  icon={uploading ? "loader" : "upload"}
                  onClick={upload}
                  disabled={uploading}
                  style={{ width: "100%" }}
                >
                  {uploading ? "Uploading…" : "Upload"}
                </Btn>
              </div>
            ) : (
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  height: 120,
                  borderRadius: "var(--radius-lg)",
                  border: "2px dashed var(--border-strong)",
                  background: "var(--bg)",
                  cursor: "pointer",
                  color: "var(--fg-muted)",
                }}
              >
                <Icon name="upload-cloud" size={26} />
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>
                  Click to select a file
                </span>
                <input
                  type="file"
                  onChange={onFileSelect}
                  style={{ display: "none" }}
                />
              </label>
            )}
          </div>

          {/* FILES LIST */}
          {files.length > 0 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 12px" }}>
                Files ({files.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {files.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <span style={{ color: "var(--fg-muted)" }}>
                    <Icon name="file" size={16} />
                  </span>
                    <div style={{ flex: 1 }}>
                      <a
                        href={f.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "var(--primary)",
                          textDecoration: "none",
                        }}
                      >
                        {f.file_name}
                      </a>
                      <div style={{ fontSize: 12, color: "var(--fg-subtle)" }}>
                        {(f.file_size / 1024).toFixed(0)} KB · {new Date(f.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Btn
                      variant="secondary"
                      size="sm"
                      icon="trash-2"
                      onClick={() => deleteFile(f.id)}
                      disabled={deleting === f.id}
                      title="Delete file"
                    >
                      {deleting === f.id ? "…" : ""}
                    </Btn>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error toast */}
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
