// Re-export algorithm functions from core
export {
  getWhyDecision,
  parseWhyInput,
  analyzeGap,
} from "@p360/core";

// Re-export types from core
export type {
  WhyCategory,
  WhyVerdict,
  GapDirection,
  WhyUserInput,
  GapAnalysis,
  WhyDataSummary,
  WhyDecision,
} from "@p360/core";

import type { WhyDecision, WhyUserInput } from "@p360/core";

// ============================================
// Telegram-specific Formatters
// ============================================

export function formatWhyTelegram(
  decision: WhyDecision,
  userInput?: WhyUserInput
): string {
  const lines: string[] = [];

  // Header
  lines.push(`${decision.emoji} <b>${decision.headline}</b>`);
  lines.push("");

  // User input echo (if provided)
  if (userInput?.rawText && userInput.rawText.trim()) {
    const scoreText = userInput.subjectiveScore
      ? ` (${userInput.subjectiveScore}/10)`
      : "";
    lines.push(`<i>You said: "${userInput.rawText}"${scoreText}</i>`);
    lines.push("");
  }

  lines.push(`<i>${decision.subheadline}</i>`);
  lines.push("");

  // Data summary
  lines.push("<b>📊 Your Body Says:</b>");
  const { dataSummary } = decision;
  lines.push(
    `  • Readiness: <b>${dataSummary.readiness.value ?? "?"}</b> (${dataSummary.readiness.status})`
  );
  lines.push(`  • HRV: <b>${dataSummary.hrv.trend}</b>`);
  lines.push(`  • Sleep: <b>${dataSummary.sleep.value ?? "?"}</b>`);
  lines.push("");

  // Gap analysis (if available)
  if (decision.gapAnalysis) {
    lines.push("<b>🔍 Gap Analysis:</b>");
    lines.push(
      `  You feel: ${decision.gapAnalysis.subjectiveScore}/10`
    );
    lines.push(
      `  Body says: ${decision.gapAnalysis.objectiveScore}/10`
    );
    lines.push(`  → ${decision.gapAnalysis.explanation.split("\n")[0]}`);
    lines.push("");
  }

  // Explanation
  lines.push("<b>💡 Why you feel this way:</b>");
  decision.explanation.split("\n").forEach((line) => {
    lines.push(`  ${line}`);
  });
  lines.push("");
  lines.push(`  <i>${decision.mindBodyStatement}</i>`);
  lines.push("");

  // Recommendations
  lines.push("<b>🎯 What to do:</b>");
  decision.recommendations.forEach((rec) => {
    lines.push(`  • ${rec}`);
  });
  lines.push("");

  // Risk warning (only for physiological/mixed)
  if (decision.verdict !== "psychological") {
    lines.push(`<b>⚠️ If you push through:</b>`);
    lines.push(`  ${decision.risk}`);
  }

  return lines.join("\n");
}
