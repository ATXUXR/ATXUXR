// Types + server-side fetch helpers for the editorial content calendar.

export const PILLARS = [
  "Probabilistic User Research",
  "Trust, Verification, and Safe Reliance",
  "Agentic and Anticipatory UX",
  "AI Economics and Value",
  "Research Craft in the AI Era",
] as const;
export type Pillar = (typeof PILLARS)[number];

export const POST_TYPES = [
  "original",
  "reflection",
  "industry",
  "academic",
] as const;
export type PostType = (typeof POST_TYPES)[number];

export const POST_TYPE_LABELS: Record<PostType, string> = {
  original: "Original POV",
  reflection: "Personal reflection",
  industry: "Industry pointer",
  academic: "Academic citation",
};

export const CALENDAR_STATUSES = [
  "planned",
  "drafting",
  "public-safe-review",
  "scheduled",
  "published",
] as const;
export type CalendarStatus = (typeof CALENDAR_STATUSES)[number];

export const CHANNELS = [
  "atxuxr",
  "linkedin",
  "medium",
  "slack",
  "instagram",
] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  atxuxr: "atxuxr.com (canonical)",
  linkedin: "LinkedIn",
  medium: "Medium",
  slack: "Slack",
  instagram: "Instagram",
};

export const DRAFT_STATUSES = [
  "todo",
  "drafting",
  "ready",
  "published",
] as const;
export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export const CALENDAR_DRAFT_STATUSES = [
  "draft",
  "reviewing",
  "scheduled",
  "published",
] as const;
export type CalendarDraftStatus = (typeof CALENDAR_DRAFT_STATUSES)[number];

export interface CalendarPost {
  id: string;
  pillar: Pillar;
  post_type: PostType;
  anchor_title: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  marquee: boolean;
  status: CalendarStatus;
  source_files: string[] | null;
  notes: string | null;
  published_post_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarDraft {
  id: string;
  calendar_id: string;
  channel: Channel;
  status: DraftStatus;
  body_md: string | null;
  image_prompt: string | null;
  image_url: string | null;
  notes: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarRow {
  post: CalendarPost;
  drafts: CalendarDraft[];
}

// New draft system types
export interface CalendarDraftVersion {
  id: string;
  draft_id: string;
  channel: Channel;
  enabled: boolean;
  content: string | null;
  image_url: string | null;
  image_prompt: string | null;
  generated_from_main: boolean;
  last_generated_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarDraftWithVersions {
  id: string;
  pillar: Pillar | null;
  post_type: PostType | null;
  title: string | null;
  main_content: string | null;
  notes: string | null;
  scheduled_date: string | null;
  status: CalendarDraftStatus;
  enabled_channels_count: number;
  versions: CalendarDraftVersion[];
  created_at: string;
  updated_at: string;
}
