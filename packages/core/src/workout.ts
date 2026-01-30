import { BiometricData, ReadinessStatus } from "./types";

// ============================================
// Workout-specific Types
// ============================================

export type WorkoutVerdict = "train_hard" | "train_light" | "rest";

export interface WorkoutDecision {
  verdict: WorkoutVerdict;
  confidence: number; // 0-100

  // Display
  emoji: string;
  headline: string;
  subheadline: string;

  // Recommendations
  recommendations: string[];
  avoidList: string[];

  // Workout parameters
  maxHeartRate?: number;
  suggestedZone?: string;

  // Projections
  recoveryRisk: string;
  tomorrowOutlook: string;

  // Data summary
  dataSummary: {
    readiness: { value: number | null; status: string };
    hrv: { value: number | null; trend: string };
    sleep: { value: number | null; hours?: string };
  };
}

// ============================================
// Score Calculation (shared with main algorithm)
// ============================================

function calculateBaseScore(data: BiometricData): number {
  let baseScore = data.readinessScore ?? data.sleepScore ?? 50;

  if (data.hrvBalance !== null) {
    const hrvModifier = (data.hrvBalance - 50) * 0.1;
    baseScore = Math.round(baseScore + hrvModifier);
  }

  return Math.max(0, Math.min(100, baseScore));
}

function getHrvTrend(data: BiometricData): string {
  if (data.hrvBalance === null) return "unknown";
  if (data.hrvBalance >= 60) return "above_baseline";
  if (data.hrvBalance >= 40) return "normal";
  return "below_baseline";
}

function getHrvTrendText(data: BiometricData): string {
  if (data.hrvBalance === null) return "N/A";
  const diff = data.hrvBalance - 50;
  if (diff > 0) return `+${diff}% vs baseline`;
  if (diff < 0) return `${diff}% vs baseline`;
  return "At baseline";
}

function getScoreStatus(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Low";
}

// ============================================
// Main Workout Decision Function
// ============================================

export function getWorkoutDecision(data: BiometricData): WorkoutDecision {
  const score = calculateBaseScore(data);
  const hrvTrend = getHrvTrend(data);

  // Build data summary
  const dataSummary = {
    readiness: {
      value: data.readinessScore,
      status: getScoreStatus(data.readinessScore),
    },
    hrv: {
      value: data.hrvBalance,
      trend: getHrvTrendText(data),
    },
    sleep: {
      value: data.sleepScore,
      hours: undefined as string | undefined,
    },
  };

  // Decision logic
  if (score >= 70 && (hrvTrend === "above_baseline" || hrvTrend === "normal")) {
    return {
      verdict: "train_hard",
      confidence: Math.min(95, score),
      emoji: "🟢",
      headline: "TRAIN HARD",
      subheadline: "Your body is ready for intense work",
      recommendations: [
        "Heavy lifting - go for PRs",
        "High-intensity intervals (HIIT)",
        "Competitive sports",
        "Challenging workouts you've been putting off",
      ],
      avoidList: [],
      recoveryRisk: "Low - you're fully recovered",
      tomorrowOutlook: "Should stay good with proper sleep",
      dataSummary,
    };
  }

  if (score >= 50 || (score >= 40 && hrvTrend !== "below_baseline")) {
    return {
      verdict: "train_light",
      confidence: Math.min(85, score + 10),
      emoji: "🟡",
      headline: "TRAIN LIGHT",
      subheadline: "Move your body, but don't push it",
      recommendations: [
        "Zone 2 cardio (conversational pace)",
        "Light weights, higher reps",
        "Yoga or mobility work",
        "Swimming or cycling (easy effort)",
      ],
      avoidList: [
        "Heavy lifting",
        "HIIT or sprints",
        "Attempting PRs",
        "Competitive games",
      ],
      maxHeartRate: 140,
      suggestedZone: "Zone 2 (60-70% max HR)",
      recoveryRisk: "Moderate - pushing hard risks 2-3 day setback",
      tomorrowOutlook: "Better recovery expected if you take it easy",
      dataSummary,
    };
  }

  // Rest day
  return {
    verdict: "rest",
    confidence: Math.min(90, 100 - score),
    emoji: "🔴",
    headline: "REST DAY",
    subheadline: "Your body is asking for recovery",
    recommendations: [
      "Walking (20-30 min)",
      "Gentle stretching",
      "Foam rolling",
      "Meditation or breathwork",
      "Extra sleep if possible",
    ],
    avoidList: [
      "All intense exercise",
      "Heavy lifting",
      "Cardio above Zone 1",
      "Sports or competition",
    ],
    recoveryRisk: "High if you train - expect 2-3 day forced recovery",
    tomorrowOutlook: "Significant improvement likely with rest",
    dataSummary,
  };
}

// ============================================
// Formatters for different outputs
// ============================================

export function formatWorkoutCLI(decision: WorkoutDecision): string {
  const lines: string[] = [];

  // Header
  lines.push(`${decision.emoji} ${decision.headline}`);
  lines.push("");
  lines.push(decision.subheadline);
  lines.push("");

  // Data summary
  const { dataSummary } = decision;
  lines.push(
    `Readiness: ${dataSummary.readiness.value ?? "N/A"} (${dataSummary.readiness.status})`
  );
  lines.push(`HRV: ${dataSummary.hrv.trend}`);
  lines.push(
    `Sleep: ${dataSummary.sleep.value ?? "N/A"} (${getScoreStatus(dataSummary.sleep.value)})`
  );
  lines.push("");

  // Recommendations
  lines.push("✓ Recommended:");
  decision.recommendations.forEach((rec) => {
    lines.push(`  • ${rec}`);
  });

  if (decision.avoidList.length > 0) {
    lines.push("");
    lines.push("✗ Avoid:");
    decision.avoidList.forEach((item) => {
      lines.push(`  • ${item}`);
    });
  }

  if (decision.maxHeartRate) {
    lines.push("");
    lines.push(`Max HR: ${decision.maxHeartRate} bpm`);
  }

  lines.push("");
  lines.push(`⚠ Risk: ${decision.recoveryRisk}`);
  lines.push(`📅 Tomorrow: ${decision.tomorrowOutlook}`);

  return lines.join("\n");
}

export function formatWorkoutTelegram(decision: WorkoutDecision): string {
  const lines: string[] = [];

  // Header with box
  lines.push(`${decision.emoji} <b>${decision.headline}</b>`);
  lines.push("");
  lines.push(`<i>${decision.subheadline}</i>`);
  lines.push("");

  // Data summary (compact)
  const { dataSummary } = decision;
  lines.push(
    `📊 Readiness ${dataSummary.readiness.value ?? "?"} • HRV ${dataSummary.hrv.trend} • Sleep ${dataSummary.sleep.value ?? "?"}`
  );
  lines.push("");

  // Recommendations (top 3)
  lines.push("<b>Do this:</b>");
  decision.recommendations.slice(0, 3).forEach((rec) => {
    lines.push(`→ ${rec}`);
  });

  if (decision.avoidList.length > 0) {
    lines.push("");
    lines.push("<b>Skip this:</b>");
    decision.avoidList.slice(0, 2).forEach((item) => {
      lines.push(`✗ ${item}`);
    });
  }

  if (decision.maxHeartRate) {
    lines.push("");
    lines.push(`💓 Keep HR under ${decision.maxHeartRate} bpm`);
  }

  lines.push("");
  lines.push(`<b>Tomorrow:</b> ${decision.tomorrowOutlook}`);

  return lines.join("\n");
}

export function formatWorkoutJSON(decision: WorkoutDecision): string {
  return JSON.stringify(decision, null, 2);
}

// ============================================
// Verdict helpers
// ============================================

export function getVerdictEmoji(verdict: WorkoutVerdict): string {
  const emojis: Record<WorkoutVerdict, string> = {
    train_hard: "🟢",
    train_light: "🟡",
    rest: "🔴",
  };
  return emojis[verdict];
}

export function getVerdictColor(verdict: WorkoutVerdict): string {
  const colors: Record<WorkoutVerdict, string> = {
    train_hard: "#10B981",
    train_light: "#F59E0B",
    rest: "#EF4444",
  };
  return colors[verdict];
}
