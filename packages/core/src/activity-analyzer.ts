/**
 * Activity Analyzer for p360
 * Converts Oura daily activity data into confound flags for confound-filter.ts
 *
 * Purpose: Detect when readiness/HRV drops are caused by high activity (confounding)
 * vs actual physiological stress.
 *
 * Use case: matteson4 — "daytime stress high but HRV great" → activity confounding
 */

import type { OuraDailyActivity } from "./types";
import type { ConfoundFlags } from "./confound-filter";
import { applyConfoundFiltering } from "./confound-filter";

export interface ActivityBaseline {
  avgSteps: number;
  avgActiveCalories: number;
  avgHighActivityMinutes: number;
  sampleDays: number;
}

export interface ActivityConfoundSummary {
  date: string;
  steps: number | null;
  activeCalories: number | null;
  trainingIntensity: number; // 0-100 relative score
  isHighActivityDay: boolean;
  confoundFlags: ConfoundFlags;
}

export interface ConfoundingAnalysis {
  baseline: ActivityBaseline;
  days: ActivityConfoundSummary[];
  adjustedReadiness: { raw: number[]; adjusted: number[] };
  adjustedHrv: { raw: number[]; adjusted: number[] };
  latestDay: ActivityConfoundSummary | null;
  interpretation: string;
  activityExplainsGap: boolean; // true = activity is likely confounding the readiness/HRV drop
}

/**
 * Estimate user's activity baseline from 60-day history
 * Filters out zeros (missing data) and outliers before calculating mean
 */
export function estimateActivityBaseline(
  activityData: OuraDailyActivity[]
): ActivityBaseline {
  const validSteps = activityData
    .map((d) => d.steps ?? 0)
    .filter((s) => s > 0);
  const validCalories = activityData
    .map((d) => d.active_calories ?? 0)
    .filter((c) => c > 0);
  const validHighActivity = activityData
    .map((d) => d.high_activity_met_minutes ?? 0)
    .filter((m) => m >= 0);

  const mean = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    avgSteps: Math.round(mean(validSteps)),
    avgActiveCalories: Math.round(mean(validCalories)),
    avgHighActivityMinutes: Math.round(mean(validHighActivity)),
    sampleDays: activityData.length,
  };
}

/**
 * Convert a single day's activity into confound flags
 * Training intensity is relative to user's personal baseline (not population norms)
 */
export function generateConfoundFlagsFromActivity(
  dayActivity: OuraDailyActivity,
  baseline: ActivityBaseline
): ConfoundFlags {
  const steps = dayActivity.steps ?? 0;
  const calories = dayActivity.active_calories ?? 0;
  const highActivity = dayActivity.high_activity_met_minutes ?? 0;

  // Calculate step excess (relative to user's personal average)
  const stepExcessRatio =
    baseline.avgSteps > 0 ? (steps - baseline.avgSteps) / baseline.avgSteps : 0;

  const calExcessRatio =
    baseline.avgActiveCalories > 0
      ? (calories - baseline.avgActiveCalories) / baseline.avgActiveCalories
      : 0;

  // Training intensity: 0-100 based on step/calorie excess vs personal baseline
  // 50% above baseline → ~50 intensity
  // 100% above baseline → ~80 intensity
  // 200%+ above baseline → ~100 intensity
  const rawIntensity =
    (Math.max(0, stepExcessRatio) * 40 + Math.max(0, calExcessRatio) * 40 + (highActivity > 30 ? 20 : 0));
  const trainingIntensity = Math.min(100, Math.round(rawIntensity));

  // Travel detection: high sedentary time + lower than usual active calories
  const isLikelyTravel =
    (dayActivity.long_periods_sedentary ?? 0) > 120 &&
    calories < baseline.avgActiveCalories * 0.7;

  return {
    training_intensity: trainingIntensity > 10 ? trainingIntensity : 0,
    travel_day: isLikelyTravel,
  };
}

/**
 * Build a timeline of confound flags from 60-day activity history
 */
export function buildActivityConfoundTimeline(
  activityData: OuraDailyActivity[],
  baseline: ActivityBaseline
): ActivityConfoundSummary[] {
  return activityData.map((day) => {
    const confoundFlags = generateConfoundFlagsFromActivity(day, baseline);
    const trainingIntensity = confoundFlags.training_intensity ?? 0;

    return {
      date: day.day,
      steps: day.steps,
      activeCalories: day.active_calories,
      trainingIntensity,
      isHighActivityDay: trainingIntensity >= 40,
      confoundFlags,
    };
  });
}

/**
 * Main confounding analysis: given activity history + biometric arrays,
 * determine if activity explains observed readiness/HRV drops
 */
export function analyzeActivityConfounding(
  activityData: OuraDailyActivity[],
  readinessValues: number[],
  hrvValues: number[]
): ConfoundingAnalysis {
  const baseline = estimateActivityBaseline(activityData);
  const timeline = buildActivityConfoundTimeline(activityData, baseline);

  // Align confound flags with biometric arrays (trim to min length)
  const minLen = Math.min(
    timeline.length,
    readinessValues.length,
    hrvValues.length
  );
  const confoundFlags = timeline.slice(-minLen).map((d) => d.confoundFlags);
  const readinessSlice = readinessValues.slice(-minLen);
  const hrvSlice = hrvValues.slice(-minLen);

  const adjustedReadiness = applyConfoundFiltering(
    readinessSlice,
    confoundFlags,
    "readiness"
  );
  const adjustedHrv = applyConfoundFiltering(hrvSlice, confoundFlags, "hrv");

  const latestDay = timeline[timeline.length - 1] ?? null;

  // Determine if activity explains the current readiness/HRV gap
  const latestRawReadiness = readinessSlice[readinessSlice.length - 1] ?? 65;
  const latestAdjReadiness =
    adjustedReadiness.adjusted[adjustedReadiness.adjusted.length - 1] ?? 65;
  const readinessLift = latestAdjReadiness - latestRawReadiness;

  const activityExplainsGap =
    (latestDay?.isHighActivityDay ?? false) && readinessLift > 5;

  let interpretation = "";
  if (activityExplainsGap) {
    interpretation = `High activity yesterday (${latestDay?.steps?.toLocaleString() ?? "?"} steps, ${latestDay?.activeCalories ?? "?"} cal) explains your ${Math.round(readinessLift)}-point readiness drop. Activity-adjusted readiness: ${Math.round(latestAdjReadiness)} (not ${Math.round(latestRawReadiness)}).`;
  } else if (latestDay?.isHighActivityDay) {
    interpretation = `High activity day detected, but readiness drop may reflect real physiological stress (not just training load).`;
  } else {
    interpretation = `Activity levels normal vs your baseline (${baseline.avgSteps.toLocaleString()} avg steps). Readiness drop not explained by activity confounding.`;
  }

  return {
    baseline,
    days: timeline.slice(-7), // Return last 7 days only
    adjustedReadiness: {
      raw: readinessSlice.slice(-7),
      adjusted: adjustedReadiness.adjusted.slice(-7),
    },
    adjustedHrv: {
      raw: hrvSlice.slice(-7),
      adjusted: adjustedHrv.adjusted.slice(-7),
    },
    latestDay,
    interpretation,
    activityExplainsGap,
  };
}
