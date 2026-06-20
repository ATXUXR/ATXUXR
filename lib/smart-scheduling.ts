/**
 * Smart Scheduling Engine
 * Phase 2: Intelligent content recommendations based on cadence, pillar health, and user patterns
 */

export interface CadenceMetric {
  pillar: string;
  lastPostDate: string | null;
  daysSinceLastPost: number | null;
  averageDaysBetweenPosts: number;
  totalPostsInPeriod: number;
  suggestedNextSlots: string[];
  isOverdue: boolean;
}

export interface SmartSuggestion {
  pillar: string;
  priority: "critical" | "high" | "medium" | "low";
  reason: string;
  suggestedDate: string;
  confidence: number; // 0-100
  isDiversityGap: boolean; // True if this pillar hasn't been published relative to others
}

export function generateSmartSuggestions(
  cadenceMetrics: CadenceMetric[],
  recentScheduledCount: Record<string, number> = {},
  today = new Date()
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];

  // Calculate diversity scores (which pillars are underrepresented)
  const totalPosts = cadenceMetrics.reduce((sum, m) => sum + m.totalPostsInPeriod, 0);
  const diversityScores = cadenceMetrics.map((m) => ({
    pillar: m.pillar,
    score: totalPosts > 0 ? m.totalPostsInPeriod / totalPosts : 0,
  }));

  for (const metric of cadenceMetrics) {
    let priority: "critical" | "high" | "medium" | "low" = "low";
    let reason = "";
    let confidence = 50;
    let isDiversityGap = false;

    // CRITICAL: Overdue content
    if (metric.isOverdue) {
      priority = "critical";
      reason = `This pillar is overdue (last post ${metric.daysSinceLastPost}d ago, cadence is ${metric.averageDaysBetweenPosts}d)`;
      confidence = 95;
    }
    // HIGH: Already scheduled something soon + this one is waiting
    else if (metric.lastPostDate && metric.daysSinceLastPost && metric.daysSinceLastPost > metric.averageDaysBetweenPosts * 0.8) {
      priority = "high";
      reason = `Due soon (${Math.ceil(metric.averageDaysBetweenPosts - metric.daysSinceLastPost)}d remaining in cadence)`;
      confidence = 85;
    }
    // MEDIUM: Diversity gap (underrepresented relative to other pillars)
    else if (
      diversityScores.find((s) => s.pillar === metric.pillar)?.score! <
      diversityScores.reduce((sum, s) => sum + s.score, 0) / diversityScores.length * 0.7
    ) {
      priority = "medium";
      reason = "Underrepresented relative to other pillars";
      confidence = 70;
      isDiversityGap = true;
    }
    // LOW: Regular cadence maintenance
    else {
      priority = "low";
      reason = "Routine maintenance post";
      confidence = 50;
    }

    // Calculate suggested date from the first suggested slot
    let suggestedDate = today.toISOString().split("T")[0];
    if (metric.suggestedNextSlots && metric.suggestedNextSlots.length > 0) {
      const dateMatch = metric.suggestedNextSlots[0].match(/(\d{2})\/(\d{2})/);
      if (dateMatch) {
        const month = dateMatch[1];
        const day = dateMatch[2];
        suggestedDate = `${today.getFullYear()}-${month}-${day}`;
      }
    }

    suggestions.push({
      pillar: metric.pillar,
      priority,
      reason,
      suggestedDate,
      confidence,
      isDiversityGap,
    });
  }

  // Sort by priority (critical > high > medium > low) and confidence
  return suggestions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.confidence - a.confidence;
  });
}

export function getRecommendedPillar(suggestions: SmartSuggestion[]): SmartSuggestion | null {
  // Return the highest priority suggestion
  return suggestions.length > 0 ? suggestions[0] : null;
}

export function getSchedulingWindowsForMonth(
  date: Date,
  cadenceMetrics: CadenceMetric[]
): Record<string, string[]> {
  /**
   * Returns optimal scheduling windows for each pillar within a calendar month
   * e.g., { "Probabilistic User Research": ["June 5", "June 15", "June 25"] }
   */
  const windows: Record<string, string[]> = {};

  for (const metric of cadenceMetrics) {
    const slots: string[] = [];
    const cadence = Math.max(metric.averageDaysBetweenPosts, 7); // Min 7 days between posts

    // Generate 3-4 evenly spaced slots throughout the month
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const interval = Math.floor(daysInMonth / 3);

    for (let i = 1; i <= 3; i++) {
      const day = Math.min(i * interval, daysInMonth);
      slots.push(`${date.getMonth() + 1}/${day}`);
    }

    windows[metric.pillar] = slots;
  }

  return windows;
}
