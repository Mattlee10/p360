// ============================================
// Activity Confounding Detector
// ============================================
//
// Detects when Oura Ring underestimates activity because the user also
// wore an Apple Watch. Cross-references Apple Health step data with Oura's
// activity_balance contributor to compute an adjusted readiness score.
//
// Example confound:
//   Apple Health: 10,000 steps (real)
//   Oura estimated: 4,000 steps (missed because Ring was off)
//   Oura readiness: 75 (inflated — thinks user rested more)
//   Adjusted readiness: ~71 (corrected for actual activity load)
//

export interface ActivityConfoundingReport {
  date: string;
  ouraActivityBalance: number | null; // raw contributor from Oura (0-100), null if unavailable
  ouraEstimatedSteps: number;         // back-calculated: (activityBalance/100) × USER_OPTIMAL_STEPS
  appleHealthSteps: number;
  stepGap: number;                    // appleSteps - ouraEstimated (positive = Oura missed activity)
  stepGapPercent: number;             // stepGap / ouraEstimatedSteps × 100
  ourasReadiness: number;             // original Oura readiness score
  adjustedReadiness: number;          // corrected readiness score
  readinessDelta: number;             // adjustment applied (negative if Oura was inflated)
  ourasRecommendation: string;        // recommendation derived from ourasReadiness
  p360Recommendation: string;         // recommendation derived from adjustedReadiness
  confidence: number;                 // 0-100 (scales with step gap size)
  detectedConfound: boolean;          // true if stepGap > MIN_SIGNIFICANT_GAP
  explanation: string;                // human-readable one-liner
}

// ============================================
// Constants
// ============================================

// WHO/Oura recommended daily steps baseline
const USER_OPTIMAL_STEPS = 8000;

// Penalty per 1000 uncounted steps (calibrated conservatively, refined by causality data)
// 1000 uncounted steps ≈ 0.75km extra walking ≈ 45 kcal ≈ ~10min moderate activity
// → roughly 0.75 readiness points impact
const READINESS_PENALTY_PER_1000_STEPS = 0.75;

// Below this gap, don't flag as confound (within sensor noise)
const MIN_SIGNIFICANT_GAP = 1000;

// Maximum adjustment (prevent overcorrection for extreme outliers)
const MAX_READINESS_DELTA = 20;

// ============================================
// Recommendation Labels (matching advisor.ts thresholds)
// ============================================

function readinessToRecommendation(readiness: number): string {
  if (readiness >= 85) return "Excellent - Train Hard";
  if (readiness >= 70) return "Good - Train Normally";
  if (readiness >= 50) return "Fair - Train Light";
  return "Low - Rest Day";
}

// ============================================
// Analyzer
// ============================================

export class ActivityConfoundingAnalyzer {
  /**
   * Analyze activity confounding between Oura and Apple Health for a single day.
   *
   * @param ourasReadiness - Oura's readiness score (0-100)
   * @param activityBalance - Oura's activity_balance contributor (0-100), null if not available
   * @param appleSteps - Apple Health step count for the same day
   */
  analyze(
    ourasReadiness: number,
    activityBalance: number | null,
    appleSteps: number,
  ): ActivityConfoundingReport {
    const today = new Date().toISOString().split("T")[0];

    // Back-calculate Oura's estimated steps from activity_balance.
    // activity_balance of 50 = neutral (at baseline), 100 = optimal, 0 = very low.
    // We use 50 as default when activityBalance is unavailable (conservative).
    const effectiveBalance = activityBalance ?? 50;
    const ouraEstimatedSteps = Math.round((effectiveBalance / 100) * USER_OPTIMAL_STEPS);

    const stepGap = appleSteps - ouraEstimatedSteps;
    const stepGapPercent =
      ouraEstimatedSteps > 0
        ? Math.round((stepGap / ouraEstimatedSteps) * 100)
        : 0;

    // Compute readiness adjustment
    // Only penalize positive gaps (Oura missed activity).
    // Negative gaps (Oura over-counted) are ignored — don't inflate readiness artificially.
    const rawDelta =
      stepGap > 0
        ? -(stepGap / 1000) * READINESS_PENALTY_PER_1000_STEPS
        : 0;
    const readinessDelta = Math.max(-MAX_READINESS_DELTA, Math.round(rawDelta));
    const adjustedReadiness = Math.max(1, Math.min(100, ourasReadiness + readinessDelta));

    const detectedConfound = stepGap > MIN_SIGNIFICANT_GAP;

    // Confidence based on gap size
    let confidence = 20;
    if (stepGap >= 7000) confidence = 90;
    else if (stepGap >= 3000) confidence = 75;
    else if (stepGap >= 1000) confidence = 50;

    const ourasRecommendation = readinessToRecommendation(ourasReadiness);
    const p360Recommendation = readinessToRecommendation(adjustedReadiness);

    const explanation = detectedConfound
      ? `Oura missed ~${stepGap.toLocaleString()} steps from Apple Health — readiness adjusted by ${readinessDelta} pts`
      : "No significant activity gap detected between Oura and Apple Health";

    return {
      date: today,
      ouraActivityBalance: activityBalance,
      ouraEstimatedSteps,
      appleHealthSteps: appleSteps,
      stepGap,
      stepGapPercent,
      ourasReadiness,
      adjustedReadiness,
      readinessDelta,
      ourasRecommendation,
      p360Recommendation,
      confidence,
      detectedConfound,
      explanation,
    };
  }

  /**
   * Format the confounding report as a text block for injection into Claude's system prompt.
   */
  generateReport(report: ActivityConfoundingReport): string {
    if (!report.detectedConfound) {
      return `ACTIVITY CHECK: No significant confounding detected (Apple Health: ${report.appleHealthSteps.toLocaleString()} steps, Oura estimated: ${report.ouraEstimatedSteps.toLocaleString()} steps). Use Oura readiness as-is.`;
    }

    const lines = [
      `ACTIVITY CONFOUNDING DETECTED (confidence: ${report.confidence}%):`,
      `- Apple Health: ${report.appleHealthSteps.toLocaleString()} steps | Oura estimated: ${report.ouraEstimatedSteps.toLocaleString()} steps | Gap: ${report.stepGap.toLocaleString()} steps (+${report.stepGapPercent}%)`,
      `- Oura readiness ${report.ourasReadiness} is INFLATED. Adjusted readiness: ~${report.adjustedReadiness} (${report.readinessDelta} pts)`,
      `- Oura says: "${report.ourasRecommendation}" — P360 adjusted: "${report.p360Recommendation}"`,
      `- Use adjustedReadiness (${report.adjustedReadiness}) for recommendations, not Oura score (${report.ourasReadiness}).`,
    ];

    return lines.join("\n");
  }
}
