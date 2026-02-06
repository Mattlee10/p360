// Re-export algorithm functions from core
export {
  getRecoveryCost,
  parseSubstance,
  getSubstanceList,
  getSubstanceCategory,
} from "@p360/core";

// Re-export types from core
export type {
  SubstanceType,
  SubstanceCategory,
  DayCost,
  RecoveryCost,
} from "@p360/core";

import type { RecoveryCost } from "@p360/core";

// ============================================
// Telegram-specific Formatters
// ============================================

export function formatCostTelegram(cost: RecoveryCost): string {
  const lines: string[] = [];

  // Header
  lines.push(`${cost.emoji} <b>${cost.headline}</b>`);
  lines.push("");
  lines.push(cost.subheadline);
  lines.push("");

  // Data summary
  const { dataSummary } = cost;
  lines.push(
    `readiness ${dataSummary.readiness.value ?? "?"} / hrv ${dataSummary.hrv.trend} / sleep ${dataSummary.sleep.value ?? "?"}`
  );
  lines.push("");

  // Timeline
  if (cost.timeline.length > 0) {
    lines.push("<b>day-by-day forecast:</b>");
    for (const day of cost.timeline) {
      const parts: string[] = [];
      parts.push(`HRV ${day.hrvChange}%`);
      if (day.sleepImpact) {
        parts.push(day.sleepImpact);
      }
      parts.push(`workout: ${day.workoutCapacity}`);

      lines.push(`  ${day.label}: ${parts.join(", ")}`);
    }
    lines.push("");
  }

  // Tradeoff
  lines.push(`<b>${cost.tradeoff}</b>`);

  return lines.join("\n");
}
