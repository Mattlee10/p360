import { BiometricData } from "./types";

// Drink log entry
export interface DrinkLog {
  date: string; // YYYY-MM-DD
  amount: number; // number of standard drinks
  timestamp: Date;
}

// Drink decision types
export type DrinkVerdict = "green" | "yellow" | "red";

export interface DrinkImpact {
  drinks: number;
  hrvDrop: string;
  recoveryTime: string;
  fatigue: string;
}

export interface DrinkDecision {
  verdict: DrinkVerdict;
  greenLimit: number; // safe limit (drinks)
  yellowLimit: number; // caution limit (drinks)
  redThreshold: number; // danger starts (drinks)

  emoji: string;
  headline: string;
  subheadline: string;

  impacts: DrinkImpact[];
  tips: string[];

  dataSummary: {
    readiness: { value: number | null; status: string };
    hrv: { value: number | null; trend: string };
    sleep: { value: number | null };
  };

  reasoning: string[];
}

export interface DrinkHistory {
  logs: DrinkLog[];
  avgPerWeek: number;
  avgPerSession: number;
  personalSafeLimit?: number;
  patterns: {
    drinks: number;
    avgHrvDrop: number;
    avgRecoveryDays: number;
  }[];
}

export interface SocialStrategy {
  headline: string;
  limit: number;
  tips: string[];
  reminderIntervals: number[]; // in minutes
}

// Helper functions
function getScoreStatus(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Low";
}

function getHrvTrendText(hrvBalance: number | null): string {
  if (hrvBalance === null) return "N/A";
  const diff = hrvBalance - 50;
  if (diff > 0) return `+${diff}%`;
  if (diff < 0) return `${diff}%`;
  return "baseline";
}

function getBaselineDeviation(hrvBalance: number | null): number {
  if (hrvBalance === null) return 0;
  return hrvBalance - 50;
}

// Main drink decision algorithm
export function getDrinkDecision(
  data: BiometricData,
  history?: DrinkHistory
): DrinkDecision {
  const baselineDeviation = getBaselineDeviation(data.hrvBalance);
  const sleepScore = data.sleepScore ?? 50;
  const readinessScore = data.readinessScore ?? 50;

  // Base limit (when in good condition)
  let baseLimit = 3;

  const reasoning: string[] = [];

  // Adjust based on HRV
  if (baselineDeviation < -15) {
    baseLimit -= 1;
    reasoning.push(`HRV ${baselineDeviation}% below baseline - limit reduced`);
  } else if (baselineDeviation >= 10) {
    reasoning.push(`HRV above baseline - body is recovered`);
  } else {
    reasoning.push(`HRV at baseline`);
  }

  // Adjust based on sleep
  if (sleepScore < 60) {
    baseLimit -= 1;
    reasoning.push(`Sleep score ${sleepScore} - poor recovery`);
  } else if (sleepScore < 70) {
    reasoning.push(`Sleep score ${sleepScore} - moderate`);
  } else {
    reasoning.push(`Sleep score ${sleepScore} - adequate`);
  }

  // Adjust based on readiness
  if (readinessScore < 50) {
    baseLimit -= 1;
    reasoning.push(`Readiness ${readinessScore} - body stressed`);
  } else if (readinessScore >= 70) {
    reasoning.push(`Readiness ${readinessScore} - good condition`);
  }

  // Check recent drinking (if history available)
  if (history && history.logs.length > 0) {
    const recentHeavy = history.logs.some((log) => {
      const daysAgo = Math.floor(
        (Date.now() - log.timestamp.getTime()) / (1000 * 60 * 60 * 24)
      );
      return log.amount >= 4 && daysAgo < 3;
    });

    if (recentHeavy) {
      baseLimit -= 1;
      reasoning.push(`Recent heavy drinking - still recovering`);
    }
  }

  // Ensure minimum of 1
  baseLimit = Math.max(1, baseLimit);

  // Calculate impacts for different drink amounts
  const impacts: DrinkImpact[] = [];

  for (let drinks = 1; drinks <= 5; drinks++) {
    let hrvDrop: string;
    let recoveryTime: string;
    let fatigue: string;

    // Base impact adjusted by current condition
    const conditionMultiplier =
      baselineDeviation < -10 ? 1.3 : baselineDeviation > 10 ? 0.8 : 1.0;

    if (drinks <= baseLimit) {
      hrvDrop = `-${Math.round(5 * drinks * conditionMultiplier)}%`;
      recoveryTime = "Normal tomorrow";
      fatigue = "Minimal";
    } else if (drinks <= baseLimit + 1) {
      hrvDrop = `-${Math.round(12 * drinks * conditionMultiplier * 0.8)}%`;
      recoveryTime = "Afternoon recovery";
      fatigue = "Morning fatigue";
    } else {
      const daysToRecover = Math.min(3, Math.ceil((drinks - baseLimit) / 2));
      hrvDrop = `-${Math.round(18 * drinks * conditionMultiplier * 0.6)}%`;
      recoveryTime = `${daysToRecover} day${daysToRecover > 1 ? "s" : ""} recovery`;
      fatigue = "Significant fatigue";
    }

    impacts.push({ drinks, hrvDrop, recoveryTime, fatigue });
  }

  // Generate tips based on condition
  const tips: string[] = [];
  tips.push("Alternate with water between drinks");

  if (sleepScore < 70) {
    tips.push("Sleep deficit makes alcohol hit harder");
  }

  if (baselineDeviation < -10) {
    tips.push("Your body is already stressed - go easy");
  }

  tips.push("Eat before/during drinking to slow absorption");

  // Determine verdict
  let verdict: DrinkVerdict;
  let emoji: string;
  let headline: string;
  let subheadline: string;

  if (baseLimit >= 3) {
    verdict = "green";
    emoji = "🟢";
    headline = "GOOD TO GO";
    subheadline = "Your body can handle moderate drinking tonight";
  } else if (baseLimit >= 2) {
    verdict = "yellow";
    emoji = "🟡";
    headline = "PROCEED WITH CAUTION";
    subheadline = "Keep it light - your body needs some care";
  } else {
    verdict = "red";
    emoji = "🔴";
    headline = "TAKE IT EASY";
    subheadline = "Your body is already stressed - minimal drinks recommended";
  }

  return {
    verdict,
    greenLimit: baseLimit,
    yellowLimit: baseLimit + 1,
    redThreshold: baseLimit + 2,
    emoji,
    headline,
    subheadline,
    impacts,
    tips,
    dataSummary: {
      readiness: {
        value: data.readinessScore,
        status: getScoreStatus(data.readinessScore),
      },
      hrv: {
        value: data.hrvBalance,
        trend: getHrvTrendText(data.hrvBalance),
      },
      sleep: {
        value: data.sleepScore,
      },
    },
    reasoning,
  };
}

// Get social/work event strategy
export function getSocialStrategy(decision: DrinkDecision): SocialStrategy {
  const { greenLimit, yellowLimit } = decision;

  const tips: string[] = [
    `Pace yourself - first ${greenLimit} drinks slowly`,
    `After drink ${greenLimit}, switch to soft drinks or water`,
    "Keep eating throughout",
    "Leave before the late rounds",
  ];

  if (decision.verdict === "red") {
    tips.unshift("Consider being the designated driver tonight");
  }

  return {
    headline: "Social Event Strategy",
    limit: yellowLimit,
    tips,
    reminderIntervals: [30, 60], // reminder every 30 or 60 minutes
  };
}

// Format drink decision for Telegram
export function formatDrinkTelegram(decision: DrinkDecision): string {
  const lines: string[] = [];

  // Header
  lines.push(`${decision.emoji} <b>${decision.headline}</b>`);
  lines.push("");
  lines.push(`<i>${decision.subheadline}</i>`);
  lines.push("");

  // Data summary
  const { dataSummary } = decision;
  lines.push(
    `📊 Readiness <b>${dataSummary.readiness.value ?? "?"}</b> • HRV <b>${dataSummary.hrv.trend}</b> • Sleep <b>${dataSummary.sleep.value ?? "?"}</b>`
  );
  lines.push("");

  // Recommended limits
  lines.push("<b>🍺 Tonight's Limit:</b>");
  lines.push(
    `├─ 🟢 ${decision.greenLimit} drink${decision.greenLimit > 1 ? "s" : ""}: ${decision.impacts[decision.greenLimit - 1]?.recoveryTime || "Normal tomorrow"}`
  );
  lines.push(
    `├─ 🟡 ${decision.yellowLimit} drinks: ${decision.impacts[decision.yellowLimit - 1]?.recoveryTime || "Afternoon recovery"}`
  );
  lines.push(
    `└─ 🔴 ${decision.redThreshold}+ drinks: ${decision.impacts[Math.min(decision.redThreshold, 4)]?.recoveryTime || "Multi-day recovery"}`
  );
  lines.push("");

  // Tips
  lines.push("<b>💡 Tips:</b>");
  decision.tips.slice(0, 3).forEach((tip) => {
    lines.push(`  → ${tip}`);
  });

  return lines.join("\n");
}

// Format social strategy for Telegram
export function formatSocialStrategyTelegram(
  strategy: SocialStrategy
): string {
  const lines: string[] = [];

  lines.push(`🍻 <b>${strategy.headline}</b>`);
  lines.push("");
  lines.push(`Tonight's max: <b>${strategy.limit} drinks</b>`);
  lines.push("");

  lines.push("<b>Strategy:</b>");
  strategy.tips.forEach((tip, i) => {
    lines.push(`${i + 1}. ${tip}`);
  });

  return lines.join("\n");
}

// Format drink log confirmation
export function formatDrinkLogTelegram(
  amount: number,
  decision: DrinkDecision
): string {
  const lines: string[] = [];

  lines.push(`✅ <b>Logged: ${amount} drink${amount > 1 ? "s" : ""}</b>`);
  lines.push("");

  // Find impact for this amount
  const impact = decision.impacts.find((i) => i.drinks === amount) ||
    decision.impacts[decision.impacts.length - 1];

  lines.push("<b>Tomorrow's Forecast:</b>");
  lines.push(`  HRV: ${impact.hrvDrop} expected`);
  lines.push(`  Fatigue: ${impact.fatigue}`);
  lines.push(`  Recovery: ${impact.recoveryTime}`);
  lines.push("");

  if (amount > decision.greenLimit) {
    lines.push("💤 Early bedtime will help recovery");
  } else {
    lines.push("👍 Within your safe limit - nice job!");
  }

  return lines.join("\n");
}

// Format drink history for Telegram
export function formatDrinkHistoryTelegram(history: DrinkHistory): string {
  const lines: string[] = [];

  lines.push("📈 <b>Your Drinking Patterns</b>");
  lines.push("");

  lines.push("<b>Last 30 Days:</b>");
  lines.push(`  Avg per week: ${history.avgPerWeek.toFixed(1)} sessions`);
  lines.push(`  Avg per session: ${history.avgPerSession.toFixed(1)} drinks`);
  lines.push("");

  if (history.patterns.length > 0) {
    lines.push("<b>Your Impact Patterns:</b>");
    history.patterns.forEach((p) => {
      lines.push(
        `  ${p.drinks} drinks → HRV -${p.avgHrvDrop}%, ${p.avgRecoveryDays}d recovery`
      );
    });
    lines.push("");
  }

  if (history.personalSafeLimit) {
    lines.push(
      `🎯 <b>Your Safe Limit:</b> ${history.personalSafeLimit} drinks`
    );
    lines.push("<i>(Based on your personal data)</i>");
  }

  // Recent logs
  if (history.logs.length > 0) {
    lines.push("");
    lines.push("<b>Recent:</b>");
    history.logs.slice(0, 5).forEach((log) => {
      lines.push(`  ${log.date}: ${log.amount} drinks`);
    });
  }

  return lines.join("\n");
}

// Calculate history from logs
export function calculateDrinkHistory(logs: DrinkLog[]): DrinkHistory {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter to last 30 days
  const recentLogs = logs.filter((log) => log.timestamp >= thirtyDaysAgo);

  // Calculate averages
  const sessionsPerWeek = recentLogs.length / 4.3; // 30 days = ~4.3 weeks
  const totalDrinks = recentLogs.reduce((sum, log) => sum + log.amount, 0);
  const avgPerSession =
    recentLogs.length > 0 ? totalDrinks / recentLogs.length : 0;

  // Group by drink amount for patterns
  const patternMap = new Map<
    number,
    { count: number; hrvDropSum: number; recoverySum: number }
  >();

  // Note: In a real implementation, we'd correlate with next-day Oura data
  // For MVP, we use estimated patterns
  recentLogs.forEach((log) => {
    const bucket = Math.min(log.amount, 5);
    const existing = patternMap.get(bucket) || {
      count: 0,
      hrvDropSum: 0,
      recoverySum: 0,
    };

    // Estimated impact (would be replaced with real data)
    const estimatedHrvDrop = bucket * 5 + Math.random() * 5;
    const estimatedRecovery = bucket <= 2 ? 0.5 : bucket <= 4 ? 1 : 2;

    patternMap.set(bucket, {
      count: existing.count + 1,
      hrvDropSum: existing.hrvDropSum + estimatedHrvDrop,
      recoverySum: existing.recoverySum + estimatedRecovery,
    });
  });

  const patterns = Array.from(patternMap.entries())
    .map(([drinks, data]) => ({
      drinks,
      avgHrvDrop: Math.round(data.hrvDropSum / data.count),
      avgRecoveryDays: Math.round((data.recoverySum / data.count) * 10) / 10,
    }))
    .sort((a, b) => a.drinks - b.drinks);

  // Determine personal safe limit
  let personalSafeLimit: number | undefined;
  if (patterns.length >= 3) {
    // Find where recovery exceeds 1 day
    const threshold = patterns.find((p) => p.avgRecoveryDays >= 1);
    personalSafeLimit = threshold ? threshold.drinks - 1 : 4;
  }

  return {
    logs: recentLogs.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    ),
    avgPerWeek: sessionsPerWeek,
    avgPerSession,
    personalSafeLimit,
    patterns,
  };
}
