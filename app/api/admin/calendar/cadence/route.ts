import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface CadenceMetric {
  pillar: string;
  lastPostDate: string | null;
  daysSinceLastPost: number | null;
  averageDaysBetweenPosts: number;
  totalPostsInPeriod: number;
  suggestedNextSlots: string[];
  isOverdue: boolean;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get published posts for cadence analysis (last 3 months + last 10 per pillar)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: publishedPosts, error: publishedError } = await supabase
      .from("posts")
      .select("pillar, created_at")
      .eq("status", "published")
      .gte("created_at", threeMonthsAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    if (publishedError) {
      throw new Error("Failed to fetch published posts");
    }

    // Get unique pillars from published posts
    const pillars = new Set<string>();
    publishedPosts?.forEach((p) => p.pillar && pillars.add(p.pillar));

    // Calculate cadence metrics per pillar
    const cadenceMetrics: CadenceMetric[] = Array.from(pillars).map(
      (pillar) => {
        // Get last 10 posts for this pillar
        const pillarPosts = publishedPosts
          ?.filter((p) => p.pillar === pillar)
          .slice(0, 10) || [];

        // Get last post date
        const lastPost = pillarPosts[0];
        const lastPostDate = lastPost?.created_at;
        const daysSinceLastPost = lastPostDate
          ? Math.floor(
              (Date.now() - new Date(lastPostDate).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        // Calculate average days between posts
        let averageDaysBetweenPosts = 7;
        if (pillarPosts.length > 1) {
          let totalDays = 0;
          for (let i = 0; i < pillarPosts.length - 1; i++) {
            const current = new Date(pillarPosts[i].created_at);
            const next = new Date(pillarPosts[i + 1].created_at);
            totalDays += (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
          }
          averageDaysBetweenPosts = Math.round(
            totalDays / (pillarPosts.length - 1)
          );
        }

        // Suggest next slots
        const suggestedNextSlots = calculateNextSlots(
          lastPostDate,
          averageDaysBetweenPosts
        );

        // Check if overdue
        const isOverdue = daysSinceLastPost
          ? daysSinceLastPost > averageDaysBetweenPosts * 1.5
          : false;

        return {
          pillar,
          lastPostDate: lastPostDate || null,
          daysSinceLastPost,
          averageDaysBetweenPosts,
          totalPostsInPeriod: pillarPosts.length,
          suggestedNextSlots,
          isOverdue,
        };
      }
    );

    return NextResponse.json(cadenceMetrics);
  } catch (err) {
    console.error("Cadence error:", err);
    return NextResponse.json(
      { error: "Failed to calculate cadence" },
      { status: 500 }
    );
  }
}

function calculateNextSlots(lastPostDate: string | null, cadenceDays: number): string[] {
  const slots = [];
  const baseDate = lastPostDate ? new Date(lastPostDate) : new Date();

  const ideal = new Date(baseDate);
  ideal.setDate(ideal.getDate() + cadenceDays);

  const early = new Date(baseDate);
  early.setDate(early.getDate() + Math.max(3, cadenceDays - 2));

  const late = new Date(baseDate);
  late.setDate(late.getDate() + cadenceDays + 3);

  slots.push(formatSlot(ideal, "Ideal"));
  slots.push(formatSlot(early, "Early"));
  slots.push(formatSlot(late, "Later"));

  return slots;
}

function formatSlot(date: Date, label: string): string {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    date.getDay()
  ];
  return `${label}: ${dayName} ${month}/${day}`;
}
