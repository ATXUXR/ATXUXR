"use client";

import { useState } from "react";
import type { Channel, CalendarDraftVersion } from "@/lib/content-calendar";
import { CHANNELS, CHANNEL_LABELS } from "@/lib/content-calendar";
import { DraftChannelCard } from "./DraftChannelCard";

interface ChannelTabsProps {
  versions: CalendarDraftVersion[];
  mainContent: string | null;
  draftId?: string;
  onToggle: (channel: Channel, enabled: boolean) => void;
  onUpdateContent: (channel: Channel, content: string, notes: string) => void;
  onGenerateContent: (channel: Channel) => Promise<void>;
  onImageGenerated?: (channel: Channel, url: string) => void;
  isGenerating?: Channel | null;
}

export function ChannelTabs({
  versions,
  mainContent,
  draftId,
  onToggle,
  onUpdateContent,
  onGenerateContent,
  onImageGenerated,
  isGenerating,
}: ChannelTabsProps) {
  const [activeChannel, setActiveChannel] = useState<Channel>(CHANNELS[0]);

  const version = versions.find((v) => v.channel === activeChannel) || null;

  return (
    <div>
      {/* Tab buttons */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          borderBottom: "2px solid var(--border)",
          overflowX: "auto",
          paddingBottom: 12,
        }}
      >
        {CHANNELS.map((channel) => {
          const isActive = activeChannel === channel;
          const hasContent = versions.some(
            (v) => v.channel === channel && v.content
          );

          return (
            <button
              key={channel}
              onClick={() => setActiveChannel(channel)}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "white" : "var(--fg-muted)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                transition: "all 200ms",
                whiteSpace: "nowrap",
                position: "relative",
              }}
            >
              {CHANNEL_LABELS[channel]}
              {hasContent && !isActive && (
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--success)",
                  }}
                  title="Has tailored content"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active channel card */}
      <DraftChannelCard
        key={activeChannel}
        version={version}
        channel={activeChannel}
        mainContent={mainContent}
        draftId={draftId}
        onToggle={(enabled) => onToggle(activeChannel, enabled)}
        onUpdateContent={(content, notes) =>
          onUpdateContent(activeChannel, content, notes)
        }
        onGenerateContent={() => onGenerateContent(activeChannel)}
        onImageGenerated={(url) => onImageGenerated?.(activeChannel, url)}
        isGenerating={isGenerating === activeChannel}
      />
    </div>
  );
}
