import { createClient } from "@/lib/supabase/server";

export interface PostAuthor {
  id: string;
  name: string;
  photo: string | null;
  role: string;
  company: string;
  bio: string;
}

export interface PostRecord {
  id: string;
  author_id: string;
  title: string;
  excerpt: string;
  body: string;
  tags: string[];
  cover: string | null;
  read_mins: number;
  status: "published" | "pending" | "rejected";
  created_at: string;
}

export interface PostWithAuthor extends PostRecord {
  author: PostAuthor | null;
}

function emptyClient() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const AUTHOR_FIELDS = "id, name, photo, role, company, bio";

export async function getPublishedPosts(opts: {
  tag?: string;
  q?: string;
} = {}): Promise<PostWithAuthor[]> {
  if (emptyClient()) return [];
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(`*, author:members!posts_author_id_fkey(${AUTHOR_FIELDS})`)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (opts.tag) query = query.contains("tags", [opts.tag]);
  if (opts.q && opts.q.trim()) {
    const term = opts.q.trim().replace(/[%_]/g, "");
    query = query.or(
      `title.ilike.%${term}%,excerpt.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("getPublishedPosts", error);
    return [];
  }
  return (data ?? []) as PostWithAuthor[];
}

export async function getPostById(id: string): Promise<PostWithAuthor | null> {
  if (emptyClient()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`*, author:members!posts_author_id_fkey(${AUTHOR_FIELDS})`)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getPostById", error);
    return null;
  }
  return (data as PostWithAuthor) ?? null;
}

export async function getRelatedPosts(
  post: PostWithAuthor,
  limit = 3,
): Promise<PostWithAuthor[]> {
  if (emptyClient() || !post.tags?.length) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(`*, author:members!posts_author_id_fkey(${AUTHOR_FIELDS})`)
    .eq("status", "published")
    .overlaps("tags", post.tags)
    .neq("id", post.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getRelatedPosts", error);
    return [];
  }
  return (data ?? []) as PostWithAuthor[];
}

export async function getAllPublishedTags(): Promise<string[]> {
  if (emptyClient()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("tags")
    .eq("status", "published");
  if (error) {
    console.error("getAllPublishedTags", error);
    return [];
  }
  const set = new Set<string>();
  (data ?? []).forEach((row: { tags?: string[] | null }) => {
    (row.tags ?? []).forEach((t) => t && set.add(t));
  });
  return Array.from(set).sort();
}

export async function getPostsByAuthor(
  authorId: string,
  opts: { includePending?: boolean } = {},
): Promise<PostWithAuthor[]> {
  if (emptyClient()) return [];
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(`*, author:members!posts_author_id_fkey(${AUTHOR_FIELDS})`)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });
  if (!opts.includePending) {
    query = query.eq("status", "published");
  }
  const { data, error } = await query;
  if (error) {
    console.error("getPostsByAuthor", error);
    return [];
  }
  return (data ?? []) as PostWithAuthor[];
}
