/**
 * P17 Mood Feature
 *
 * Core insight: Users often blame themselves psychologically (anxiety, laziness)
 * when the actual cause is physiological (low HRV, poor sleep).
 * This module helps with "attribution correction".
 *
 * Four scenarios:
 * A: Recovery ↓ + Mood ↓ → "IT'S YOUR BODY, NOT YOUR MIND" (key insight)
 * B: Recovery ↑ + Mood ↓ → "External factors may be involved"
 * C: Recovery ↓ + Mood ↑ → "Body recovering, don't overdo it"
 * D: Recovery ↑ + Mood ↑ → "Great day to challenge yourself!"
 */

import { BiometricData } from "./types";

// ============================================
// Types
// ============================================

export interface MoodEntry {
  date: string; // YYYY-MM-DD
  score: number; // 1-5 scale
  timestamp: Date;
  note?: string;
}

export type MoodScenario = "A" | "B" | "C" | "D";

export interface MoodAttribution {
  scenario: MoodScenario;
  emoji: string;
  headline: string;
  subheadline: string;
  explanation: string;
  recommendations: string[];
  isPhysiological: boolean;
}

export interface MoodInsight {
  correlation: number | null; // Pearson r between recovery and mood (-1 to 1)
  dataPoints: number;
  trend: "positive" | "negative" | "neutral" | "insufficient_data";
  summary: string;
  insight: string;
}

export interface MoodDecision {
  scenario: MoodScenario;
  attribution: MoodAttribution;
  dataSummary: {
    readiness: number | null;
    recoveryStatus: "low" | "moderate" | "high";
    moodScore: number;
    moodStatus: "low" | "moderate" | "high";
  };
  moodHistory?: MoodInsight;
}

// ============================================
// Constants
// ============================================

const RECOVERY_THRESHOLD_LOW = 60;
const RECOVERY_THRESHOLD_HIGH = 70;
const MOOD_THRESHOLD_LOW = 3;
const MOOD_THRESHOLD_HIGH = 4;

const SCENARIO_DATA: Record<MoodScenario, Omit<MoodAttribution, "scenario">> = {
  A: {
    emoji: "🧠",
    headline: "IT'S YOUR BODY, NOT YOUR MIND",
    subheadline: "Your low mood reflects your physical state.",
    explanation: `Your recovery metrics are low, and you're feeling down.
This is NOT laziness, weakness, or a character flaw.
Your nervous system is depleted - mood follows.`,
    recommendations: [
      "Don't blame yourself for feeling low",
      "Rest is the priority, not productivity",
      "Avoid difficult decisions today",
      "Light movement if anything (walk, stretch)",
      "Early bedtime tonight",
    ],
    isPhysiological: true,
  },
  B: {
    emoji: "🤔",
    headline: "BODY IS FINE - LOOK ELSEWHERE",
    subheadline: "Your physical recovery looks good.",
    explanation: `Your body metrics are healthy, but mood is low.
This suggests external factors may be involved:
- Work stress, relationships, or life circumstances
- Situational challenges
- This is okay - external ups and downs are normal.`,
    recommendations: [
      "Your body can handle some challenge today",
      "Consider what's weighing on you",
      "Talk to someone you trust",
      "Journaling might help clarify thoughts",
      "Light exercise could boost mood",
    ],
    isPhysiological: false,
  },
  C: {
    emoji: "⚠️",
    headline: "BODY NEEDS RECOVERY",
    subheadline: "You feel good, but your body is stressed.",
    explanation: `You're feeling okay, but your recovery metrics are low.
This is a warning: your good mood may be masking fatigue.
Listen to your body's signals, not just your mind.`,
    recommendations: [
      "Don't overcommit based on how you feel",
      "Your body needs rest even if mind says go",
      "Avoid intense workouts today",
      "Watch for energy crash later",
      "Prioritize sleep tonight",
    ],
    isPhysiological: true,
  },
  D: {
    emoji: "🚀",
    headline: "GREEN LIGHT - GO FOR IT",
    subheadline: "Body and mind are aligned and ready.",
    explanation: `Your recovery is good and you're feeling positive.
This is the ideal state for challenging tasks.
Make the most of this alignment!`,
    recommendations: [
      "Great day for challenging tasks",
      "Tackle that hard workout",
      "Make important decisions",
      "Push your limits a bit",
      "Enjoy the momentum!",
    ],
    isPhysiological: false,
  },
};

// ============================================
// Core Functions
// ============================================

function getRecoveryStatus(readiness: number | null): "low" | "moderate" | "high" {
  if (readiness === null) return "moderate";
  if (readiness < RECOVERY_THRESHOLD_LOW) return "low";
  if (readiness >= RECOVERY_THRESHOLD_HIGH) return "high";
  return "moderate";
}

function getMoodStatus(score: number): "low" | "moderate" | "high" {
  if (score < MOOD_THRESHOLD_LOW) return "low";
  if (score >= MOOD_THRESHOLD_HIGH) return "high";
  return "moderate";
}

function determineScenario(
  recoveryStatus: "low" | "moderate" | "high",
  moodStatus: "low" | "moderate" | "high"
): MoodScenario {
  const isRecoveryLow = recoveryStatus === "low";
  const isMoodLow = moodStatus === "low";

  if (isRecoveryLow && isMoodLow) return "A"; // Body ↓ Mind ↓
  if (!isRecoveryLow && isMoodLow) return "B"; // Body ↑ Mind ↓
  if (isRecoveryLow && !isMoodLow) return "C"; // Body ↓ Mind ↑
  return "D"; // Body ↑ Mind ↑
}

/**
 * Get mood attribution based on biometric data and mood score
 */
export function getMoodAttribution(
  data: BiometricData,
  moodScore: number
): MoodAttribution {
  const recoveryStatus = getRecoveryStatus(data.readinessScore);
  const moodStatus = getMoodStatus(moodScore);
  const scenario = determineScenario(recoveryStatus, moodStatus);

  return {
    scenario,
    ...SCENARIO_DATA[scenario],
  };
}

/**
 * Calculate Pearson correlation between two arrays
 */
export function calculatePearsonCorrelation(
  x: number[],
  y: number[]
): number | null {
  if (x.length !== y.length || x.length < 3) return null;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return null;
  return numerator / denominator;
}

/**
 * Calculate mood insight from historical data
 */
export function calculateMoodInsight(
  moodEntries: MoodEntry[],
  recoveryScores: number[]
): MoodInsight {
  const dataPoints = Math.min(moodEntries.length, recoveryScores.length);

  if (dataPoints < 5) {
    return {
      correlation: null,
      dataPoints,
      trend: "insufficient_data",
      summary: `Not enough data yet (${dataPoints}/5 days needed)`,
      insight: "Log your mood for 5+ days to see your personal patterns.",
    };
  }

  // Use the most recent entries that match
  const moodScores = moodEntries.slice(-dataPoints).map((e) => e.score);
  const recovery = recoveryScores.slice(-dataPoints);

  const correlation = calculatePearsonCorrelation(recovery, moodScores);

  let trend: MoodInsight["trend"];
  let summary: string;
  let insight: string;

  if (correlation === null) {
    trend = "insufficient_data";
    summary = "Unable to calculate correlation";
    insight = "More varied data points needed.";
  } else if (correlation > 0.5) {
    trend = "positive";
    summary = `Strong correlation (r=${correlation.toFixed(2)})`;
    insight =
      "Your mood strongly tracks your recovery. When tired, expect lower mood - it's physiological, not personal.";
  } else if (correlation > 0.2) {
    trend = "positive";
    summary = `Moderate correlation (r=${correlation.toFixed(2)})`;
    insight =
      "Your mood is somewhat linked to recovery. Physical state matters, but other factors too.";
  } else if (correlation < -0.2) {
    trend = "negative";
    summary = `Inverse correlation (r=${correlation.toFixed(2)})`;
    insight =
      "Interesting: your mood tends to move opposite to recovery. External factors may dominate.";
  } else {
    trend = "neutral";
    summary = `Weak correlation (r=${correlation.toFixed(2)})`;
    insight =
      "Your mood seems independent of physical recovery. External factors likely play a bigger role.";
  }

  return {
    correlation,
    dataPoints,
    trend,
    summary,
    insight,
  };
}

/**
 * Main mood decision function
 */
export function getMoodDecision(
  data: BiometricData,
  moodScore: number,
  moodHistory?: MoodEntry[],
  recoveryHistory?: number[]
): MoodDecision {
  const attribution = getMoodAttribution(data, moodScore);
  const recoveryStatus = getRecoveryStatus(data.readinessScore);
  const moodStatus = getMoodStatus(moodScore);

  let moodInsight: MoodInsight | undefined;
  if (moodHistory && recoveryHistory) {
    moodInsight = calculateMoodInsight(moodHistory, recoveryHistory);
  }

  return {
    scenario: attribution.scenario,
    attribution,
    dataSummary: {
      readiness: data.readinessScore,
      recoveryStatus,
      moodScore,
      moodStatus,
    },
    moodHistory: moodInsight,
  };
}
