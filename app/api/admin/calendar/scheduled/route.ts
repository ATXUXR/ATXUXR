import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all scheduled drafts for next 6 months
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    const { data: drafts, error } = await supabase
      .from("calendar_drafts")
      .select("id, title, pillar, post_type, scheduled_date, enabled_channels_count, status")
      .gte("scheduled_date", new Date().toISOString())
      .lte("scheduled_date", sixMonthsFromNow.toISOString())
      .order("scheduled_date");

    if (error) {
      throw error;
    }

    // Group by date for calendar
    const calendarData = (drafts || []).reduce(
      (acc, draft) => {
        const date = draft.scheduled_date?.split("T")[0] || "";
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push({
          id: draft.id,
          title: draft.title,
          pillar: draft.pillar,
          postType: draft.post_type,
          channelsCount: draft.enabled_channels_count,
          status: draft.status,
        });
        return acc;
      },
      {} as Record<string, any[]>
    );

    return NextResponse.json({
      posts: drafts,
      byDate: calendarData,
    });
  } catch (err) {
    console.error("Calendar data error:", err);
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}
