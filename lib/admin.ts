import { createClient } from "@/lib/supabase/server";
import type { PostWithAuthor } from "@/lib/posts";
import { getDashboardData, type DashboardData } from "@/lib/analytics";

export interface AdminMember {
  id: string;
  email: string;
  name: string;
  photo: string | null;
  role: string;
  company: string;
  admin: boolean;
  joined: string;
}

export interface SignupRow {
  id: string;
  name: string;
  email: string;
  source: string;
  tags: string[];
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  position: string | null;
  created_at: string;
}

export interface RsvpRow {
  id: string;
  event_id: string;
  name: string;
  email: string;
  guests: number;
  created_at: string;
}

export interface VolunteerRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string | null;
  position: string | null;
  role: string;
  created_at: string;
}

export interface FeedbackRow {
  id: string;
  rating: number | null;
  message: string;
  email: string | null;
  page: string | null;
  created_at: string;
}

export interface EmailRow {
  id: string;
  to_address: string;
  subject: string;
  body: string;
  status: "queued" | "sent" | "failed";
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  kind: string;
  starts_at: string;
}

export interface ReactionStat {
  post_id: string;
  count: number;
}

export interface AdminBundle {
  pending: PostWithAuthor[];
  published: PostWithAuthor[];
  members: AdminMember[];
  signups: SignupRow[];
  rsvps: RsvpRow[];
  events: EventRow[];
  volunteers: VolunteerRow[];
  feedback: FeedbackRow[];
  emails: EmailRow[];
  reactionStats: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  analytics: DashboardData;
}

const AUTHOR_FIELDS = "id, name, photo, role, company, bio";

export async function getAdminBundle(
  options: { analyticsDays?: number } = {},
): Promise<AdminBundle | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }
  const supabase = await createClient();
  const [
    postsRes,
    membersRes,
    signupsRes,
    rsvpsRes,
    eventsRes,
    volunteersRes,
    feedbackRes,
    emailsRes,
    reactionsRes,
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(`*, author:members!posts_author_id_fkey(${AUTHOR_FIELDS})`)
      .in("status", ["pending", "published"])
      .order("created_at", { ascending: false }),
    supabase
      .from("members")
      .select("id, email, name, photo, role, company, admin, joined")
      .order("joined", { ascending: false }),
    supabase
      .from("signups")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("rsvps")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("events").select("id, title, kind, starts_at"),
    supabase
      .from("volunteers")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("emails")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("reactions").select("post_id"),
  ]);

  const posts = (postsRes.data ?? []) as PostWithAuthor[];
  const pending = posts.filter((p) => p.status === "pending");
  const published = posts.filter((p) => p.status === "published");

  const reactionStats: Record<string, number> = {};
  (reactionsRes.data ?? []).forEach((r: { post_id: string }) => {
    reactionStats[r.post_id] = (reactionStats[r.post_id] || 0) + 1;
  });

  // Top tags by use across published posts
  const tagCounts = new Map<string, number>();
  published.forEach((p) => {
    (p.tags ?? []).forEach((t) =>
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1),
    );
  });
  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const analytics = await getDashboardData(options.analyticsDays ?? 30);

  return {
    pending,
    published,
    members: (membersRes.data ?? []) as AdminMember[],
    signups: (signupsRes.data ?? []) as SignupRow[],
    rsvps: (rsvpsRes.data ?? []) as RsvpRow[],
    events: (eventsRes.data ?? []) as EventRow[],
    volunteers: (volunteersRes.data ?? []) as VolunteerRow[],
    feedback: (feedbackRes.data ?? []) as FeedbackRow[],
    emails: (emailsRes.data ?? []) as EmailRow[],
    reactionStats,
    topTags,
    analytics,
  };
}
