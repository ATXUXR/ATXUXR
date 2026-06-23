"use client";

import { useEffect, useState, useRef } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  CHANNELS,
  PILLARS,
  POST_TYPES,
  POST_TYPE_LABELS,
  type CalendarDraftWithVersions,
  type Channel,
} from "@/lib/content-calendar";
import { ChannelTabs } from "./ChannelTabs";
import { RichTextEditor } from "./RichTextEditor";

interface DraftEditorProps {
  draft?: CalendarDraftWithVersions;
  onSave?: (draftId: string) => void;
  onPublish?: (draftId: string) => void;
}

export function DraftEditor({
  draft,
  onSave,
  onPublish,
}: DraftEditorProps) {
  const [title, setTitle] = useState(draft?.title || "");
  const [mainContent, setMainContent] = useState(draft?.main_content || "");
  const [pillars, setPillars] = useState<(string)[]>(draft?.pillar || []);
  const [customPillar, setCustomPillar] = useState("");
  const [postTypes, setPostTypes] = useState<string[]>(draft?.post_type || []);
  const [notes, setNotes] = useState(draft?.notes || "");
  const [scheduledDate, setScheduledDate] = useState(draft?.scheduled_date || "");

  const [versions, setVersions] = useState(draft?.versions || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState<Channel | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const draftIdRef = useRef(draft?.id);

  // Auto-save when content changes
  useEffect(() => {
    if (!title && !mainContent) return; // Don't autosave empty drafts

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      await handleAutoSave();
    }, 2000); // 2 second debounce

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, mainContent, pillars, postTypes, notes, scheduledDate, customPillar]);

  const handleAutoSave = async () => {
    if (!title && !mainContent) return;

    setIsSaving(true);
    try {
      const allPillars = [...pillars];
      if (customPillar.trim()) {
        allPillars.push(customPillar.trim());
      }

      const response = await fetch("/api/admin/calendar/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftIdRef.current,
          title,
          main_content: mainContent,
          pillar: allPillars.length > 0 ? allPillars : null,
          post_type: postTypes.length > 0 ? postTypes : null,
          notes,
          scheduled_date: scheduledDate || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        draftIdRef.current = data.id;
        setLastSaved(new Date().toLocaleTimeString());
        onSave?.(data.id);
      }
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePillar = (pillar: string) => {
    setPillars((prev) =>
      prev.includes(pillar) ? prev.filter((p) => p !== pillar) : [...prev, pillar]
    );
  };

  const togglePostType = (type: string) => {
    setPostTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleToggleChannel = async (channel: Channel, enabled: boolean) => {
    if (!draftIdRef.current) return;

    const response = await fetch(
      `/api/admin/calendar/draft/${draftIdRef.current}/version`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          enabled,
          content: "",
        }),
      }
    );

    if (response.ok) {
      const updated = await response.json();
      setVersions((prev) => {
        const idx = prev.findIndex((v) => v.channel === channel);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
    }
  };

  const handleUpdateChannelContent = async (
    channel: Channel,
    content: string,
    notes: string
  ) => {
    if (!draftIdRef.current) return;

    const response = await fetch(
      `/api/admin/calendar/draft/${draftIdRef.current}/version`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          content,
          notes,
        }),
      }
    );

    if (response.ok) {
      const updated = await response.json();
      setVersions((prev) => {
        const idx = prev.findIndex((v) => v.channel === channel);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
    }
  };

  const handleGenerateContent = async (channel: Channel) => {
    if (!draftIdRef.current || !mainContent) return;

    setIsGenerating(channel);
    try {
      const response = await fetch(
        `/api/admin/calendar/draft/${draftIdRef.current}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setVersions((prev) => {
          const idx = prev.findIndex((v) => v.channel === channel);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated;
            return next;
          }
          return [...prev, updated];
        });
      }
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header with save status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ margin: 0, marginBottom: 4 }}>
            {draft ? "Edit Draft" : "New Draft"}
          </h2>
          {lastSaved && (
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "var(--fg-muted)",
              }}
            >
              Last saved {lastSaved}
              {isSaving && " • Saving..."}
            </p>
          )}
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title..."
        style={{
          width: "100%",
          padding: 12,
          fontSize: 18,
          fontWeight: 600,
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          marginBottom: 16,
          boxSizing: "border-box",
        }}
      />

      {/* Pillars multi-select */}
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
          Pillars (select one or more)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {PILLARS.map((pillar) => (
            <label key={pillar} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={pillars.includes(pillar)}
                onChange={() => togglePillar(pillar)}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <span style={{ fontSize: 13 }}>{pillar}</span>
            </label>
          ))}
        </div>

        {/* Custom pillar input */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={customPillar}
            onChange={(e) => setCustomPillar(e.target.value)}
            placeholder="Or enter a custom pillar..."
            style={{
              flex: 1,
              padding: 10,
              fontSize: 13,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Post types multi-select */}
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
          Post Types (select one or more)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {POST_TYPES.map((type) => (
            <label key={type} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={postTypes.includes(type)}
                onChange={() => togglePostType(type)}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <span style={{ fontSize: 13 }}>
                {POST_TYPE_LABELS[type as keyof typeof POST_TYPE_LABELS]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Scheduled date */}
      <input
        type="date"
        value={scheduledDate}
        onChange={(e) => setScheduledDate(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          fontSize: 13,
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          marginBottom: 16,
          boxSizing: "border-box",
        }}
      />

      {/* Main content - Rich text editor */}
      <label style={{ display: "block", marginBottom: 8 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--fg)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Main Content (for all channels)
        </span>
      </label>
      <div style={{ marginBottom: 24 }}>
        <RichTextEditor
          value={mainContent}
          onChange={setMainContent}
          placeholder="Write the main content. Channel-specific versions will be generated or customized from this..."
        />
      </div>

      {/* Notes */}
      <label style={{ display: "block", marginBottom: 8 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--fg-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Admin Notes
        </span>
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Internal notes for reviewers..."
        style={{
          width: "100%",
          minHeight: 100,
          padding: 12,
          fontSize: 13,
          fontFamily: "var(--font-sans)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          marginBottom: 24,
          boxSizing: "border-box",
          resize: "vertical",
          lineHeight: 1.6,
        }}
      />

      {/* Channel tabs */}
      <h3
        style={{
          margin: "24px 0 16px",
          fontSize: 14,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--fg-muted)",
        }}
      >
        Channel Versions
      </h3>

      <ChannelTabs
        versions={versions}
        mainContent={mainContent}
        draftId={draftIdRef.current}
        onToggle={handleToggleChannel}
        onUpdateContent={handleUpdateChannelContent}
        onGenerateContent={handleGenerateContent}
        onImageGenerated={(channel, url) => {
          // Refresh version with new image
          setVersions((prev) => {
            const idx = prev.findIndex((v) => v.channel === channel);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = { ...next[idx], image_url: url };
              return next;
            }
            return prev;
          });
        }}
        isGenerating={isGenerating}
      />

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 24,
          paddingTop: 24,
          borderTop: "1px solid var(--border)",
        }}
      >
        <Btn onClick={() => handleAutoSave()} disabled={isSaving || (!title && !mainContent)}>
          <Icon name="save" size={14} style={{ marginRight: 4 }} />
          {isSaving ? "Saving..." : "Save Draft"}
        </Btn>

        {draftIdRef.current && (
          <>
            <Btn onClick={() => onPublish?.(draftIdRef.current!)}>
              <Icon name="send" size={14} style={{ marginRight: 4 }} />
              Schedule & Publish
            </Btn>
            <Btn variant="secondary">
              <Icon name="trash-2" size={14} style={{ marginRight: 4 }} />
              Delete Draft
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}
