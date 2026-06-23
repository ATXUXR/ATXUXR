import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch published posts
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, created_at, status")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch published posts:", error);
      return Response.json([]);
    }

    return Response.json(data || []);
  } catch (err) {
    console.error("API error:", err);
    return Response.json([], { status: 500 });
  }
}
