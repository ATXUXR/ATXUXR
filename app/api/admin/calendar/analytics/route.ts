import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface Analytics {
  totalScheduledPosts: number;
  averagePostsPerMonth: number;
  pillarDistribution: Record<string, number>;
  contentGaps: string[];
  lastPublishedDate: string | null;
  nextPublishDate: string | null;
  healthScore: number;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get all scheduled posts from next 6 months
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    const { data: scheduledPosts } = await supabase
      .from("calendar_drafts")
      .select("id, pillar, scheduled_date, status")
      .eq("status", "scheduled")
      .lte("scheduled_date", sixMonthsFromNow.toISOString());

    // Get all published posts from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: publishedPosts } = await supabase
      .from("posts")
      .select("id, pillar, created_at")
      .gte("created_at", sixMonthsAgo.toISOString());

    // Calculate analytics
    const posts = scheduledPosts || [];
    const published = publishedPosts || [];

    const pillarDistribution: Record<string, number> = {};
    posts.forEach((post: any) => {
      const pillar = post.pillar || "Unassigned";
      pillarDistribution[pillar] = (pillarDistribution[pillar] || 0) + 1;
    });

    // Find content gaps (pillars with <25% share)
    const totalPosts = posts.length;
    const contentGaps = Object.entries(pillarDistribution)
      .filter(([_, count]) => (count / totalPosts) < 0.25)
      .map(([pillar]) => pillar);

    // Calculate health score (0-100)
    // 40% evenly distributed, 30% consistent cadence, 30% healthy schedule
    const avgShare = 1 / Object.keys(pillarDistribution).length;
    const distributionScore = Math.min(
      100,
      (Object.values(pillarDistribution).reduce((sum, count) => sum + Math.abs((count / totalPosts) - avgShare), 0) / (Object.keys(pillarDistribution).length - 1)) * -100 + 100
    );

    const cadenceScore = posts.length >= 12 ? 100 : (posts.length / 12) * 100;
    const healthScore = Math.round((distributionScore * 0.4 + cadenceScore * 0.3 + 100 * 0.3));

    return NextResponse.json({
      totalScheduledPosts: posts.length,
      averagePostsPerMonth: Math.round((posts.length / 6) * 10) / 10,
      pillarDistribution,
      contentGaps,
      lastPublishedDate: published.length > 0 ? published[0].created_at : null,
      nextPublishDate: posts.length > 0 ? posts.sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())[0].scheduled_date : null,
      healthScore,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
