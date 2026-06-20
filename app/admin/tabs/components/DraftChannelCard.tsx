"use client";

import { useState } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type {
  Channel,
  CalendarDraftVersion,
} from "@/lib/content-calendar";
import { CHANNEL_LABELS } from "@/lib/content-calendar";

interface DraftChannelCardProps {
  version: CalendarDraftVersion | null;
  channel: Channel;
  mainContent: string | null;
  onToggle: (enabled: boolean) => void;
  onUpdateContent: (content: string, notes: string) => void;
  onGenerateContent: () => Promise<void>;
  onImageUpload: (url: string) => void;
  isGenerating?: boolean;
}

export function DraftChannelCard({
  version,
  channel,
  mainContent,
  onToggle,
  onUpdateContent,
  onGenerateContent,
  onImageUpload,
  isGenerating = false,
}: DraftChannelCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(version?.content || "");
  const [notes, setNotes] = useState(version?.notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onUpdateContent(content, notes);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const enabled = version?.enabled ?? false;
  const generatedFromMain = version?.generated_from_main ?? false;

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
      {/* Header with toggle */}
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
      </div>

      {enabled && (
        <>
          {/* Preview of content if not editing */}
          {!isEditing && version?.content && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                background: "var(--bg)",
                borderRadius: "var(--radius-md)",
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--fg-muted)",
                maxHeight: 120,
                overflowY: "auto",
              }}
            >
              <p style={{ margin: 0 }}>{version.content.substring(0, 200)}...</p>
            </div>
          )}

          {/* Edit mode */}
          {isEditing ? (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Write content for ${CHANNEL_LABELS[channel]}...`}
                style={{
                  width: "100%",
                  minHeight: 200,
                  padding: 12,
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  marginBottom: 12,
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (hashtags, alt text, caveats)..."
                style={{
                  width: "100%",
                  minHeight: 80,
                  padding: 12,
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  marginBottom: 12,
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />

              <div style={{ display: "flex", gap: 8 }}>
                <Btn
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ flex: 1 }}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Btn>
                <Btn
                  onClick={() => setIsEditing(false)}
                  variant="secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </Btn>
              </div>
            </>
          ) : (
            <>
              {/* Buttons when not editing */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn
                  onClick={() => setIsEditing(true)}
                  variant="secondary"
                  size="sm"
                >
                  <Icon name="edit-2" size={14} style={{ marginRight: 4 }} />
                  Edit
                </Btn>

                {mainContent && (
                  <Btn
                    onClick={onGenerateContent}
                    disabled={isGenerating}
                    variant="secondary"
                    size="sm"
                  >
                    <Icon
                      name="zap"
                      size={14}
                      style={{ marginRight: 4 }}
                    />
                    {isGenerating ? "Generating..." : "Generate"}
                  </Btn>
                )}

                {version?.image_url && (
                  <div
                    style={{
                      marginTop: 8,
                      width: "100%",
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      maxHeight: 200,
                    }}
                  >
                    <img
                      src={version.image_url}
                      alt={`${channel} version`}
                      style={{ width: "100%", height: "auto" }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {!enabled && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "var(--fg-muted)",
            fontSize: 14,
          }}
        >
          Enable this channel to add content
        </div>
      )}
    </div>
  );
}
