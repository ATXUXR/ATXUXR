"use client";

import { useState } from "react";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { DraftEditor } from "./components/DraftEditor";
import type { CalendarDraftWithVersions } from "@/lib/content-calendar";

interface DraftsTabProps {
  drafts: CalendarDraftWithVersions[];
}

export function DraftsTab({ drafts: initialDrafts }: DraftsTabProps) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const selectedDraft = drafts.find((d) => d.id === selectedDraftId);

  const handleNewDraft = () => {
    setSelectedDraftId(null);
    setIsCreating(true);
  };

  const handleSaveDraft = (draftId: string) => {
    setSelectedDraftId(draftId);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
      {/* Sidebar: Drafts list */}
      <div>
        <Btn onClick={handleNewDraft} style={{ width: "100%", marginBottom: 16 }}>
          <Icon name="plus" size={14} style={{ marginRight: 6 }} />
          New Draft
        </Btn>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {drafts.map((draft) => (
            <button
              key={draft.id}
              onClick={() => {
                setSelectedDraftId(draft.id);
                setIsCreating(false);
              }}
              style={{
                padding: 12,
                textAlign: "left",
                border:
                  selectedDraftId === draft.id
                    ? "2px solid var(--primary)"
                    : "1px solid var(--border)",
                background:
                  selectedDraftId === draft.id
                    ? "var(--orange-50)"
                    : "transparent",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontSize: 13,
                transition: "all 200ms",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--fg)" }}>
                {draft.title || "(Untitled)"}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fg-muted)",
                  marginBottom: 4,
                }}
              >
                {draft.status}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      draft.enabled_channels_count > 0
                        ? "var(--green-600)"
                        : "var(--fg-subtle)",
                  }}
                />
                {draft.enabled_channels_count} channels enabled
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main: Draft editor or empty state */}
      <div>
        {isCreating || selectedDraft ? (
          <DraftEditor
            draft={selectedDraft}
            onSave={handleSaveDraft}
          />
        ) : (
          <div
            style={{
              minHeight: "60vh",
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              color: "var(--fg-muted)",
            }}
          >
            <div>
              <Icon
                name="file-text"
                size={40}
                style={{ marginBottom: 16, opacity: 0.5 }}
              />
              <p style={{ margin: 0, marginBottom: 8 }}>
                No draft selected
              </p>
              <p style={{ margin: 0, fontSize: 13 }}>
                Create a new draft or select one from the list
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
