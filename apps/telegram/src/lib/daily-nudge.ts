import type { BiometricData } from "@p360/core";

/**
 * Generate a daily decision question for the Shame Bot (hardcore mode).
 * Focuses on opportunity cost framing — no empathy, just numbers.
 */
export function generateDailyDecisionQuestion(data: BiometricData): string {
  const readiness = data.readinessScore ?? 0;
  const hrv = data.hrvBalance ?? 0;
  const sleep = data.sleepScore ?? 0;

  if (readiness < 50) {
    return (
      `Readiness ${readiness}. HRV ${hrv}ms. Sleep ${sleep}. ` +
      `What's the exact point cost of training today vs resting? ` +
      `Include recovery days. Also: what's the cost of 2 drinks tonight on top of this?`
    );
  } else if (readiness < 70) {
    return (
      `Readiness ${readiness}. HRV ${hrv}ms. Sleep ${sleep}. ` +
      `If I train hard today, what's tomorrow's readiness cost in exact points? ` +
      `What intensity keeps me under -5pts cost? Also: drinking tonight — safe or not?`
    );
  } else {
    return (
      `Readiness ${readiness}. HRV ${hrv}ms. Sleep ${sleep}. ` +
      `I'm at peak. What decisions today would blow this recovery? ` +
      `Exact cost of: hard training, 2 drinks, 3 drinks, late sleep (past midnight).`
    );
  }
}

/**
 * Format the daily nudge header for Telegram (hardcore style).
 * Prepended before the Claude response.
 */
export function formatDailyNudgeHeader(data: BiometricData): string {
  const readiness = data.readinessScore ?? 0;
  const hrv = data.hrvBalance ?? 0;
  const sleep = data.sleepScore ?? 0;

  const readinessBar = readiness >= 70 ? "🟢" : readiness >= 50 ? "🟡" : "🔴";

  return [
    `<b>⚡ Daily Readiness Report</b>`,
    ``,
    `${readinessBar} Readiness: <b>${readiness}</b> | HRV: <b>${hrv}ms</b> | Sleep: <b>${sleep}</b>`,
    `━━━━━━━━━━━━━━━━━━━━━`,
  ].join("\n");
}
