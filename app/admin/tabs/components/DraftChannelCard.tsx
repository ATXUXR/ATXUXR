"use client";

import { useEffect, useState } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type {
  Channel,
  CalendarDraftVersion,
} from "@/lib/content-calendar";
import { CHANNEL_LABELS } from "@/lib/content-calendar";
import { EnhancedRichTextEditor } from "./EnhancedRichTextEditor";

interface DraftChannelCardProps {
  version: CalendarDraftVersion | null;
  channel: Channel;
  mainContent: string | null;
  draftId?: string;
  onToggle: (enabled: boolean) => void;
  onUpdateContent: (content: string, notes: string) => void;
  onGenerateContent: () => Promise<void>;
  onImageGenerated?: (url: string) => void;
  isGenerating?: boolean;
}

export function DraftChannelCard({
  version,
  channel,
  mainContent,
  draftId,
  onToggle,
  onUpdateContent,
  onGenerateContent,
  onImageGenerated,
  isGenerating = false,
}: DraftChannelCardProps) {
  const [content, setContent] = useState(version?.content || "");
  const [notes, setNotes] = useState(version?.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const enabled = version?.enabled ?? false;
  const generatedFromMain = version?.generated_from_main ?? false;

  // Sync content and notes when version changes
  useEffect(() => {
    setContent(version?.content || "");
    setNotes(version?.notes || "");
  }, [version?.id, version?.content, version?.notes]);

  // Auto-save on content change
  useEffect(() => {
    if (!enabled || (!content && !notes)) return;

    if (saveTimeout) clearTimeout(saveTimeout);

    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onUpdateContent(content, notes);
      } finally {
        setIsSaving(false);
      }
    }, 1500); // 1.5s debounce for auto-save

    setSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [content, notes, enabled, onUpdateContent]);

  const handleInsertFromMain = async () => {
    if (!mainContent) return;

    setContent(mainContent);
    setError(null);

    // Trigger auto-save immediately after setting content
    setTimeout(() => {
      if (!draftId) return;
      onUpdateContent(mainContent, notes);
    }, 100);
  };

  const handleTextSelection = () => {
    const selected = window.getSelection()?.toString() || "";
    setSelectedText(selected);
  };

  const handleGenerateWithError = async () => {
    if (!draftId) {
      setError("Please save the draft first before generating content");
      return;
    }

    setIsGeneratingAI(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/calendar/draft/${draftId}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Generation failed: ${response.statusText}`);
      }

      const updated = await response.json();
      await onUpdateContent(updated.content || content, updated.notes || notes);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to generate content";
      setError(errorMsg);
      console.error("Generation error:", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!draftId || !content) {
      setError("Content required to generate image");
      return;
    }

    setIsGeneratingImage(true);
    setError(null);
    try {
      console.log("Starting image generation for channel:", channel);

      const response = await fetch(`/api/admin/calendar/draft/${draftId}/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          content,
          prompt: notes,
        }),
      });

      console.log("Image generation response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || errorData.message || `HTTP ${response.status}`;
        throw new Error(`Image generation failed: ${errorMsg}`);
      }

      const data = await response.json();
      console.log("Image generation response:", data);

      const imageUrl = data.imageUrl || data.url;
      if (imageUrl) {
        // Insert image into editor content if not already there
        // Create HTML for the image with proper styling
        const imageHtml = `<p><img src="${imageUrl}" alt="Generated image for ${channel}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" /></p>`;

        // Add image to content if it's not already there
        if (!content.includes(imageUrl)) {
          const updatedContent = content + imageHtml;
          setContent(updatedContent);
          // Save the updated content with image
          await onUpdateContent(updatedContent, notes);
        } else {
          // Image already in content, just update
          await onUpdateContent(content, notes);
        }

        onImageGenerated?.(imageUrl);
      } else {
        throw new Error("No image URL in response");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Image generation failed";
      setError(errorMsg);
      console.error("Image generation error:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${enabled ? "var(--primary)" : "var(--border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: 20,
        marginBottom: 16,
        transition: "border-color 200ms",
      }}
    >
      {/* Header with toggle and status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <span style={{ fontSize: 15, fontWeight: 600 }}>
              {CHANNEL_LABELS[channel]}
            </span>
          </label>
          {generatedFromMain && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 4,
                background: "var(--orange-50)",
                color: "var(--orange-700)",
              }}
            >
              AI Generated
            </span>
          )}
        </div>
        {isSaving && (
          <span
            style={{
              fontSize: 11,
              color: "var(--fg-muted)",
              fontStyle: "italic",
            }}
          >
            Saving...
          </span>
        )}
      </div>

      {enabled ? (
        <>
          {/* Content editor - rich text when enabled */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--fg-muted)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Content (Rich Text)
            </label>
            <EnhancedRichTextEditor
              value={content}
              onChange={setContent}
              placeholder={`Write or paste content for ${CHANNEL_LABELS[channel]}...`}
            />

            {/* Loading message */}
            {(isGeneratingImage || isGeneratingAI) && (
              <div
                style={{
                  marginTop: 8,
                  padding: 14,
                  borderRadius: "var(--radius-md)",
                  background: "linear-gradient(135deg, var(--blue-50) 0%, var(--blue-100) 100%)",
                  border: "2px solid var(--blue-400)",
                  color: "var(--blue-900)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontWeight: 500,
                  animation: "pulse-border 1.5s ease-in-out infinite",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    minWidth: 24,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      width: 24,
                      height: 24,
                      border: "3px solid transparent",
                      borderTopColor: "var(--primary)",
                      borderRightColor: "var(--primary)",
                      borderRadius: "50%",
                      animation: "spin-fast 0.8s linear infinite",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      width: 16,
                      height: 16,
                      border: "2px solid transparent",
                      borderBottomColor: "var(--blue-300)",
                      borderLeftColor: "var(--blue-300)",
                      borderRadius: "50%",
                      animation: "spin-slow 1.2s linear infinite reverse",
                    }}
                  />
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, marginLeft: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {isGeneratingImage ? "✨ Generating image..." : "⚡ Generating content..."}
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.75 }}>
                    {isGeneratingImage ? "Creating visual for " + channel : "Adapting for " + channel} • Please wait
                  </span>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div
                style={{
                  marginTop: 8,
                  padding: 10,
                  borderRadius: "var(--radius-md)",
                  background: "var(--red-50)",
                  border: "1px solid var(--red-200)",
                  color: "var(--red-700)",
                  fontSize: 12,
                  lineHeight: 1.4,
                }}
              >
                <strong>Generation failed:</strong> {error}
              </div>
            )}

            <style>{`
              @keyframes spin-fast {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes spin-slow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              @keyframes pulse-border {
                0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
                50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
              }
            `}</style>

            {/* Content toolbar */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              {mainContent && (
                <Btn
                  onClick={handleInsertFromMain}
                  variant="secondary"
                  size="sm"
                >
                  <Icon
                    name="copy"
                    size={14}
                    style={{ marginRight: 4 }}
                  />
                  Insert from main
                </Btn>
              )}

              {mainContent && (
                <Btn
                  onClick={handleGenerateWithError}
                  disabled={isGeneratingAI || !draftId}
                  variant="secondary"
                  size="sm"
                  title={!draftId ? "Save draft first to generate content" : "Generate channel-specific content from main content"}
                >
                  <Icon
                    name="zap"
                    size={14}
                    style={{ marginRight: 4 }}
                  />
                  {isGeneratingAI ? "Generating..." : "Generate via AI"}
                </Btn>
              )}

              {(content || draftId) && (
                <Btn
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !content || !draftId}
                  variant="secondary"
                  size="sm"
                  title={
                    !content ? "Add content to generate an image" :
                    !draftId ? "Save draft first to generate images" :
                    "Generate an image for this channel's content"
                  }
                >
                  <Icon
                    name="image"
                    size={14}
                    style={{ marginRight: 4 }}
                  />
                  {isGeneratingImage ? "Generating..." : "Generate Image"}
                </Btn>
              )}

              {selectedText && (
                <Btn
                  variant="secondary"
                  size="sm"
                  title="Generate image from selected text"
                >
                  <Icon
                    name="sparkles"
                    size={14}
                    style={{ marginRight: 4 }}
                  />
                  AI for selection
                </Btn>
              )}
            </div>
          </div>

          {/* Notes section */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--fg-muted)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Notes (hashtags, alt text, caveats)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add channel-specific notes, hashtags, or formatting hints..."
              style={{
                width: "100%",
                minHeight: 80,
                padding: 12,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                boxSizing: "border-box",
                resize: "vertical",
                background: "var(--bg)",
                color: "var(--fg)",
              }}
            />
          </div>

          {/* Image preview if exists */}
          {version?.image_url && (
            <div
              style={{
                marginTop: 16,
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                maxHeight: 300,
                border: "1px solid var(--border)",
              }}
            >
              <img
                src={version.image_url}
                alt={`Generated for ${channel}`}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "var(--fg-muted)",
            fontSize: 14,
          }}
        >
          <Icon name="check-circle" size={24} style={{ marginBottom: 8 }} />
          <p style={{ margin: 0 }}>Enable this channel to add content</p>
        </div>
      )}
    </div>
  );
}
