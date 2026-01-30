import { BiometricData, WorkoutDecision } from "./types";

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
  if (diff > 0) return `+${diff}%`;
  if (diff < 0) return `${diff}%`;
  return "baseline";
}

function getScoreStatus(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Low";
}

export function getWorkoutDecision(data: BiometricData): WorkoutDecision {
  const score = calculateBaseScore(data);
  const hrvTrend = getHrvTrend(data);

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

  // TRAIN HARD
  if (score >= 70 && (hrvTrend === "above_baseline" || hrvTrend === "normal")) {
    return {
      verdict: "train_hard",
      confidence: Math.min(95, score),
      emoji: "🟢",
      headline: "TRAIN HARD",
      subheadline: "Your body is ready for intense work",
      recommendations: [
        "Heavy lifting - go for PRs",
        "HIIT / intervals",
        "Competitive sports",
      ],
      avoidList: [],
      recoveryRisk: "Low - you're recovered",
      tomorrowOutlook: "Should stay good with proper sleep",
      dataSummary,
    };
  }

  // TRAIN LIGHT
  if (score >= 50 || (score >= 40 && hrvTrend !== "below_baseline")) {
    return {
      verdict: "train_light",
      confidence: Math.min(85, score + 10),
      emoji: "🟡",
      headline: "TRAIN LIGHT",
      subheadline: "Move your body, but don't push it",
      recommendations: [
        "Zone 2 cardio (easy pace)",
        "Light weights, more reps",
        "Yoga or stretching",
      ],
      avoidList: ["Heavy lifting", "HIIT", "PRs"],
      maxHeartRate: 140,
      suggestedZone: "Zone 2",
      recoveryRisk: "Moderate - hard training risks 2-3 day setback",
      tomorrowOutlook: "Better if you rest today",
      dataSummary,
    };
  }

  // REST
  return {
    verdict: "rest",
    confidence: Math.min(90, 100 - score),
    emoji: "🔴",
    headline: "REST DAY",
    subheadline: "Your body needs recovery",
    recommendations: ["Walking", "Gentle stretching", "Extra sleep"],
    avoidList: ["All intense exercise"],
    recoveryRisk: "High if you train - expect 2-3 day forced recovery",
    tomorrowOutlook: "Big improvement likely with rest",
    dataSummary,
  };
}

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

  // Recommendations
  lines.push("<b>✓ Do this:</b>");
  decision.recommendations.forEach((rec) => {
    lines.push(`  → ${rec}`);
  });

  if (decision.avoidList.length > 0) {
    lines.push("");
    lines.push("<b>✗ Skip:</b>");
    decision.avoidList.forEach((item) => {
      lines.push(`  → ${item}`);
    });
  }

  if (decision.maxHeartRate) {
    lines.push("");
    lines.push(`💓 Max HR: <b>${decision.maxHeartRate} bpm</b>`);
  }

  lines.push("");
  lines.push(`📅 <b>Tomorrow:</b> ${decision.tomorrowOutlook}`);

  return lines.join("\n");
}

export function formatWorkoutShort(decision: WorkoutDecision): string {
  const { dataSummary } = decision;
  return `${decision.emoji} ${decision.headline}\nReadiness ${dataSummary.readiness.value ?? "?"} • HRV ${dataSummary.hrv.trend}`;
}
