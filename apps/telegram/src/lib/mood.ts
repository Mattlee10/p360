// Re-export algorithm functions from core
export {
  getMoodAttribution,
  getMoodDecision,
  calculateMoodInsight,
  calculatePearsonCorrelation,
} from "@p360/core";

// Re-export types from core
export type {
  MoodEntry,
  MoodScenario,
  MoodAttribution,
  MoodInsight,
  MoodDecision,
} from "@p360/core";

import type { MoodDecision, MoodInsight } from "@p360/core";

// ============================================
// Telegram-specific Formatters
// ============================================

export function formatMoodTelegram(decision: MoodDecision): string {
  const lines: string[] = [];
  const { attribution, dataSummary } = decision;

  // Header
  lines.push(`${attribution.emoji} <b>${attribution.headline}</b>`);
  lines.push("");
  lines.push(`<i>${attribution.subheadline}</i>`);
  lines.push("");

  // Data summary
  lines.push("<b>📊 Today's State:</b>");
  lines.push(
    `  • Recovery: <b>${dataSummary.readiness ?? "?"}</b> (${dataSummary.recoveryStatus})`
  );
  lines.push(`  • Mood: <b>${dataSummary.moodScore}/5</b> (${dataSummary.moodStatus})`);
  lines.push("");

  // Explanation
  lines.push("<b>💡 What's Happening:</b>");
  attribution.explanation.split("\n").forEach((line) => {
    if (line.trim()) {
      lines.push(`  ${line}`);
    }
  });
  lines.push("");

  // Recommendations
  lines.push("<b>🎯 What to Do:</b>");
  attribution.recommendations.slice(0, 4).forEach((rec) => {
    lines.push(`  • ${rec}`);
  });

  // Key insight for scenario A (the main P17 insight)
  if (decision.scenario === "A") {
    lines.push("");
    lines.push("<b>⚡ Key Insight:</b>");
    lines.push("  <i>What you're feeling is NOT a personal failing.</i>");
    lines.push("  <i>Your body needs rest - listen to it.</i>");
  }

  return lines.join("\n");
}

export function formatMoodHistoryTelegram(insight: MoodInsight): string {
  const lines: string[] = [];

  lines.push("📈 <b>Your Mood-Recovery Pattern</b>");
  lines.push("");

  if (insight.trend === "insufficient_data") {
    lines.push(`<i>${insight.summary}</i>`);
    lines.push("");
    lines.push(insight.insight);
    lines.push("");
    lines.push("Keep logging your mood daily to see your personal patterns!");
  } else {
    lines.push(`<b>Correlation:</b> ${insight.summary}`);
    lines.push(`<b>Data points:</b> ${insight.dataPoints} days`);
    lines.push("");
    lines.push("<b>💡 Your Pattern:</b>");
    lines.push(`  ${insight.insight}`);
  }

  return lines.join("\n");
}

export function formatMoodLoggedTelegram(
  score: number,
  attribution: { emoji: string; headline: string; isPhysiological: boolean }
): string {
  const lines: string[] = [];

  lines.push(`✅ <b>Mood Logged: ${score}/5</b>`);
  lines.push("");
  lines.push(`${attribution.emoji} ${attribution.headline}`);
  lines.push("");

  if (attribution.isPhysiological) {
    lines.push(
      "<i>Remember: Low mood during low recovery is your body talking, not a character flaw.</i>"
    );
  }

  lines.push("");
  lines.push("Use /mood history to see your patterns over time.");

  return lines.join("\n");
}
