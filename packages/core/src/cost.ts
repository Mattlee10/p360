import { BiometricData } from "./types";
import type { CausalityProfile } from "./causality";

// ============================================
// Recovery Cost Types
// ============================================

export type SubstanceType = "beer" | "wine" | "spirits" | "coffee" | "tea";

export type SubstanceCategory = "alcohol" | "caffeine";

export interface DayCost {
  day: number; // 0 = today, 1 = tomorrow, etc.
  label: string; // "tomorrow", "day 2", etc.
  hrvChange: number; // percentage change (negative = drop)
  recoveryDrop: number; // percentage points drop
  workoutCapacity: string; // "none", "light only", "moderate", "full"
  sleepImpact?: string; // caffeine only: estimated sleep score impact
}

export interface RecoveryCost {
  substance: SubstanceType;
  category: SubstanceCategory;
  amount: number;
  emoji: string;
  headline: string;
  subheadline: string;

  timeline: DayCost[];
  totalRecoveryDays: number;

  tradeoff: string; // one-line summary: "3 beers = 2 lost workout days"

  dataSummary: {
    readiness: { value: number | null; status: string };
    hrv: { value: number | null; trend: string };
    sleep: { value: number | null };
  };
}

// ============================================
// Constants (WHOOP / Oura research)
// ============================================

// Per standard drink: -4.2% recovery, +1.3 bpm RHR, -2.4ms HRV (WHOOP data)
const ALCOHOL_PER_DRINK = {
  recoveryDrop: 4.2,
  hrvDropPercent: 4.5, // ~2.4ms on 53ms avg = ~4.5%
  rhrIncrease: 1.3,
};

// Multi-day decay: day 1 = 100%, day 2 = 29%, day 3 = 19% (WHOOP "4-Day Hangover")
const ALCOHOL_DECAY = [1.0, 0.29, 0.19, 0.08];

// Caffeine: ~6 hour half-life, sleep disruption within 12 hours
const CAFFEINE_PER_CUP = {
  sleepScoreDrop: 4, // estimated per cup
  hrvDropPercent: 1.5,
};

const CAFFEINE_HALF_LIFE_HOURS = 6;

// Substance info
const SUBSTANCE_INFO: Record<
  SubstanceType,
  { category: SubstanceCategory; standardUnits: number; emoji: string; label: string }
> = {
  beer: { category: "alcohol", standardUnits: 1, emoji: "🍺", label: "beer" },
  wine: { category: "alcohol", standardUnits: 1.5, emoji: "🍷", label: "wine" },
  spirits: { category: "alcohol", standardUnits: 1.5, emoji: "🥃", label: "spirits" },
  coffee: { category: "caffeine", standardUnits: 1, emoji: "☕", label: "coffee" },
  tea: { category: "caffeine", standardUnits: 0.5, emoji: "🍵", label: "tea" },
};

// ============================================
// Helpers
// ============================================

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

function getConditionMultiplier(hrvBalance: number | null): number {
  if (hrvBalance === null) return 1.0;
  const deviation = hrvBalance - 50;
  // Already stressed = bigger impact, well-recovered = smaller impact
  if (deviation < -15) return 1.4;
  if (deviation < -10) return 1.3;
  if (deviation < 0) return 1.1;
  if (deviation > 10) return 0.8;
  return 1.0;
}

function getWorkoutCapacity(recoveryDrop: number): string {
  if (recoveryDrop >= 20) return "none";
  if (recoveryDrop >= 12) return "light only";
  if (recoveryDrop >= 6) return "moderate";
  return "full";
}

export function parseSubstance(input: string): SubstanceType | null {
  const normalized = input.toLowerCase().trim();
  const aliases: Record<string, SubstanceType> = {
    beer: "beer",
    beers: "beer",
    wine: "wine",
    wines: "wine",
    spirit: "spirits",
    spirits: "spirits",
    liquor: "spirits",
    soju: "spirits",
    whiskey: "spirits",
    vodka: "spirits",
    rum: "spirits",
    gin: "spirits",
    tequila: "spirits",
    cocktail: "spirits",
    coffee: "coffee",
    coffees: "coffee",
    espresso: "coffee",
    latte: "coffee",
    americano: "coffee",
    tea: "tea",
    teas: "tea",
    matcha: "tea",
  };
  return aliases[normalized] || null;
}

// ============================================
// Alcohol Recovery Cost
// ============================================

function calculateAlcoholCost(
  data: BiometricData,
  substance: SubstanceType,
  amount: number,
  profile?: CausalityProfile,
): RecoveryCost {
  const info = SUBSTANCE_INFO[substance];
  const standardDrinks = amount * info.standardUnits;
  const multiplier = getConditionMultiplier(data.hrvBalance);

  const timeline: DayCost[] = [];
  let totalRecoveryDays = 0;

  // Use personal constants if available, otherwise population defaults
  const hrvDropPerDrink = profile?.personalConstants.alcoholHrvDropPerDrink
    ?? ALCOHOL_PER_DRINK.hrvDropPercent;
  const recoveryDropPerDrink = profile?.personalConstants.alcoholRecoveryDropPerDrink
    ?? ALCOHOL_PER_DRINK.recoveryDrop;

  // Calculate day-by-day impact
  for (let day = 0; day < ALCOHOL_DECAY.length; day++) {
    const decayFactor = ALCOHOL_DECAY[day];
    const hrvChange = -Math.round(
      hrvDropPerDrink * standardDrinks * multiplier * decayFactor
    );
    const recoveryDrop = Math.round(
      recoveryDropPerDrink * standardDrinks * multiplier * decayFactor
    );

    // Skip days with negligible impact
    if (Math.abs(hrvChange) < 1 && recoveryDrop < 1) break;

    const label =
      day === 0
        ? "tonight"
        : day === 1
          ? "tomorrow"
          : `day ${day + 1}`;

    timeline.push({
      day,
      label,
      hrvChange,
      recoveryDrop,
      workoutCapacity: getWorkoutCapacity(recoveryDrop),
    });

    if (recoveryDrop >= 6) {
      totalRecoveryDays = day + 1;
    }
  }

  // At minimum 1 day if any drinks
  if (totalRecoveryDays === 0 && standardDrinks > 0) {
    totalRecoveryDays = 1;
  }

  // Headline based on severity
  let emoji: string;
  let headline: string;
  let subheadline: string;

  const peakDrop = timeline[0]?.recoveryDrop || 0;

  if (peakDrop >= 25) {
    emoji = "🔴";
    headline = "heavy cost";
    subheadline = `${amount} ${info.label}${amount > 1 ? "s" : ""} will wreck your recovery for ${totalRecoveryDays} days`;
  } else if (peakDrop >= 15) {
    emoji = "🟡";
    headline = "moderate cost";
    subheadline = `${amount} ${info.label}${amount > 1 ? "s" : ""} will cost you ${totalRecoveryDays} day${totalRecoveryDays > 1 ? "s" : ""} of reduced performance`;
  } else {
    emoji = "🟢";
    headline = "low cost";
    subheadline = `${amount} ${info.label}${amount > 1 ? "s" : ""} should be fine - back to normal by tomorrow`;
  }

  // Tradeoff summary
  const lostWorkoutDays = timeline.filter(
    (d) => d.workoutCapacity === "none" || d.workoutCapacity === "light only"
  ).length;
  const tradeoff =
    lostWorkoutDays > 0
      ? `${amount} ${info.label}${amount > 1 ? "s" : ""} = ${lostWorkoutDays} lost workout day${lostWorkoutDays > 1 ? "s" : ""}`
      : `${amount} ${info.label}${amount > 1 ? "s" : ""} = minimal workout impact`;

  return {
    substance,
    category: "alcohol",
    amount,
    emoji,
    headline,
    subheadline,
    timeline,
    totalRecoveryDays,
    tradeoff,
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
  };
}

// ============================================
// Caffeine Recovery Cost
// ============================================

function calculateCaffeineCost(
  data: BiometricData,
  substance: SubstanceType,
  amount: number,
  profile?: CausalityProfile,
): RecoveryCost {
  const info = SUBSTANCE_INFO[substance];
  const standardCups = amount * info.standardUnits;

  const hour = new Date().getHours();
  const hoursUntilSleep = Math.max(0, 22 - hour); // assume 10pm sleep

  // Use personal constants if available
  const halfLifeHours = profile?.personalConstants.caffeineHalfLifeHours
    ?? CAFFEINE_HALF_LIFE_HOURS;

  // Caffeine remaining at sleep time
  const halfLives = hoursUntilSleep / halfLifeHours;
  const caffeineAtSleep = Math.pow(0.5, halfLives); // fraction remaining

  const sleepDropPerCup = profile?.personalConstants.caffeineSleepImpactPerCup
    ?? CAFFEINE_PER_CUP.sleepScoreDrop;

  const sleepImpact = Math.round(
    sleepDropPerCup * standardCups * caffeineAtSleep
  );
  const hrvDrop = Math.round(
    CAFFEINE_PER_CUP.hrvDropPercent * standardCups
  );

  const timeline: DayCost[] = [];

  // Tonight's sleep impact
  if (sleepImpact >= 1 || hrvDrop >= 1) {
    timeline.push({
      day: 0,
      label: "tonight",
      hrvChange: -hrvDrop,
      recoveryDrop: sleepImpact,
      workoutCapacity: "full", // caffeine doesn't block today's workout
      sleepImpact: sleepImpact > 0 ? `sleep score -${sleepImpact}` : undefined,
    });
  }

  // Tomorrow's impact from poor sleep
  if (sleepImpact >= 4) {
    const tomorrowDrop = Math.round(sleepImpact * 0.7);
    timeline.push({
      day: 1,
      label: "tomorrow",
      hrvChange: -Math.round(hrvDrop * 0.3),
      recoveryDrop: tomorrowDrop,
      workoutCapacity: getWorkoutCapacity(tomorrowDrop),
    });
  }

  const totalRecoveryDays = timeline.length > 0 && sleepImpact >= 4 ? 1 : 0;

  // Cutoff time calculation
  const cutoffHour = 22 - Math.ceil(CAFFEINE_HALF_LIFE_HOURS * 2); // 2 half-lives = 25% remaining
  const cutoffTime =
    cutoffHour <= 12 ? `${cutoffHour}am` : `${cutoffHour - 12}pm`;

  let emoji: string;
  let headline: string;
  let subheadline: string;

  if (sleepImpact >= 8) {
    emoji = "🔴";
    headline = "bad timing";
    subheadline = `${amount} ${info.label}${amount > 1 ? "s" : ""} now will cost you -${sleepImpact} sleep score tonight`;
  } else if (sleepImpact >= 4) {
    emoji = "🟡";
    headline = "some cost";
    subheadline = `${amount} ${info.label}${amount > 1 ? "s" : ""} now will impact tonight's sleep by -${sleepImpact}`;
  } else {
    emoji = "🟢";
    headline = "you're fine";
    subheadline = `${amount} ${info.label}${amount > 1 ? "s" : ""} at this time has minimal sleep impact`;
  }

  const tradeoff =
    sleepImpact >= 4
      ? `cutoff time: ${cutoffTime} (based on 10pm sleep)`
      : `${amount} ${info.label}${amount > 1 ? "s" : ""} = no significant sleep impact`;

  return {
    substance,
    category: "caffeine",
    amount,
    emoji,
    headline,
    subheadline,
    timeline,
    totalRecoveryDays,
    tradeoff,
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
  };
}

// ============================================
// Main Entry Point
// ============================================

export function getRecoveryCost(
  data: BiometricData,
  substance: SubstanceType,
  amount: number,
  profile?: CausalityProfile,
): RecoveryCost {
  const info = SUBSTANCE_INFO[substance];

  if (info.category === "alcohol") {
    return calculateAlcoholCost(data, substance, amount, profile);
  }
  return calculateCaffeineCost(data, substance, amount, profile);
}

export function getSubstanceList(): string[] {
  return Object.keys(SUBSTANCE_INFO);
}

export function getSubstanceCategory(substance: SubstanceType): SubstanceCategory {
  return SUBSTANCE_INFO[substance].category;
}
