// Re-export algorithm functions from core
export {
  getWorkoutDecision,
  parseSport,
  getSportList,
  getSportGuide,
} from "@p360/core";

// Re-export types from core
export type { WorkoutDecision, WorkoutVerdict, Sport, SportGuide } from "@p360/core";

import type { WorkoutDecision } from "@p360/core";

// ============================================
// Telegram-specific Formatters
// ============================================

export function formatWorkoutTelegram(decision: WorkoutDecision): string {
  const lines: string[] = [];

  // Header
  lines.push(`${decision.emoji} <b>${decision.headline}</b>`);
  lines.push("");
  lines.push(`<i>${decision.subheadline}</i>`);
  lines.push("");

  // Data summary (compact)
  const { dataSummary } = decision;
  lines.push(
    `📊 Readiness <b>${dataSummary.readiness.value ?? "?"}</b> • HRV <b>${dataSummary.hrv.trend}</b> • Sleep <b>${dataSummary.sleep.value ?? "?"}</b>`
  );
  lines.push("");

  // Why this verdict
  lines.push("<b>📋 Why:</b>");
  decision.reasoning.forEach((reason) => {
    lines.push(`  → ${reason}`);
  });
  lines.push("");

  // Intensity guide
  lines.push("<b>🎯 Intensity:</b>");
  if (decision.intensityGuide.cardio) {
    lines.push(`  Cardio: ${decision.intensityGuide.cardio}`);
  }
  if (decision.intensityGuide.weights) {
    lines.push(`  Weights: ${decision.intensityGuide.weights}`);
  }
  if (decision.intensityGuide.rpe) {
    lines.push(`  Effort: ${decision.intensityGuide.rpe}`);
  }

  // Sport-specific guide
  if (decision.sportGuide) {
    const sg = decision.sportGuide;
    lines.push("");
    lines.push(`<b>🏀 ${sg.displayName}:</b>`);
    lines.push(`  ${sg.todayAdvice}`);
    sg.intensityTips.slice(0, 3).forEach((tip) => {
      lines.push(`  → ${tip}`);
    });
    if (sg.cautionNotes && sg.cautionNotes.length > 0) {
      lines.push(`  ⚠️ ${sg.cautionNotes[0]}`);
    }
  }

  lines.push("");
  lines.push(`📅 <b>Tomorrow:</b> ${decision.tomorrowOutlook}`);

  return lines.join("\n");
}

export function formatWorkoutShort(decision: WorkoutDecision): string {
  const { dataSummary } = decision;
  return `${decision.emoji} ${decision.headline}\nReadiness ${dataSummary.readiness.value ?? "?"} • HRV ${dataSummary.hrv.trend}`;
}
