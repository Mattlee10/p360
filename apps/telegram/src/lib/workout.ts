import { BiometricData, WorkoutDecision, WorkoutVerdict, Sport, SportGuide } from "./types";

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

function getSportGuide(sport: Sport, verdict: WorkoutVerdict): SportGuide {
  const guides: Record<Sport, Record<WorkoutVerdict, Omit<SportGuide, "sport" | "displayName">>> = {
    basketball: {
      train_hard: {
        todayAdvice: "Great day for full-court games and explosive plays",
        intensityTips: ["Go all out on fast breaks", "Full-intensity scrimmages OK", "Practice shots at game speed"],
        warmup: "Dynamic stretches + shooting (10 min)",
        duration: "60-90 min",
      },
      train_light: {
        todayAdvice: "Stick to shooting drills and half-court",
        intensityTips: ["Focus on shooting form", "Half-court 3v3 max", "Avoid full sprints"],
        warmup: "Extended warm-up (15 min)",
        duration: "30-45 min",
        cautionNotes: ["Skip fast breaks", "Sub out frequently"],
      },
      rest: {
        todayAdvice: "Skip basketball today",
        intensityTips: ["Light shooting only", "No running or jumping"],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["High injury risk if you play tired"],
      },
    },
    running: {
      train_hard: {
        todayAdvice: "Great day for tempo or intervals",
        intensityTips: ["Tempo run at threshold", "400m/800m repeats", "Hill sprints OK"],
        warmup: "Easy jog + stretches (10 min)",
        duration: "45-75 min",
      },
      train_light: {
        todayAdvice: "Easy recovery run only",
        intensityTips: ["Conversational pace", "Zone 2 heart rate", "Walk breaks fine"],
        warmup: "Walk 5 min first",
        duration: "20-30 min",
        cautionNotes: ["No speed work"],
      },
      rest: {
        todayAdvice: "Walking only today",
        intensityTips: ["20-30 min walk max", "Foam rolling"],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Running fatigued = injury risk"],
      },
    },
    cycling: {
      train_hard: {
        todayAdvice: "Push the watts - intervals or climbs",
        intensityTips: ["VO2max intervals", "Hill repeats", "Sprint training"],
        warmup: "Easy spin 10-15 min",
        duration: "60-120 min",
      },
      train_light: {
        todayAdvice: "Zone 2 recovery ride",
        intensityTips: ["Flat routes", "High cadence (90+ rpm)", "Easy effort"],
        warmup: "Easy spin 5 min",
        duration: "30-45 min",
        cautionNotes: ["Avoid hills"],
      },
      rest: {
        todayAdvice: "Stay off the bike",
        intensityTips: ["Stretching", "Walk instead"],
        warmup: "N/A",
        duration: "Rest day",
      },
    },
    weightlifting: {
      train_hard: {
        todayAdvice: "Heavy day - go for PRs",
        intensityTips: ["85-100% 1RM", "Compound lifts", "3-6 reps"],
        warmup: "10 min cardio + empty bar",
        duration: "60-90 min",
      },
      train_light: {
        todayAdvice: "Deload - technique focus",
        intensityTips: ["50-65% 1RM", "10-15 reps", "Machines OK"],
        warmup: "Extended warm-up (15 min)",
        duration: "30-45 min",
        cautionNotes: ["No PRs", "No heavy compounds"],
      },
      rest: {
        todayAdvice: "Skip the gym",
        intensityTips: ["Light stretching", "Foam rolling"],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Lifting tired = poor gains"],
      },
    },
    crossfit: {
      train_hard: {
        todayAdvice: "Full WOD - send it",
        intensityTips: ["RX weights", "Competition intensity"],
        warmup: "Class warm-up + mobility",
        duration: "60-75 min",
      },
      train_light: {
        todayAdvice: "Scale significantly",
        intensityTips: ["50-60% RX", "Focus on quality"],
        warmup: "Extended warm-up",
        duration: "45 min max",
        cautionNotes: ["Skip the leaderboard"],
      },
      rest: {
        todayAdvice: "Skip CrossFit",
        intensityTips: ["Light mobility only"],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["High injury risk when tired"],
      },
    },
    swimming: {
      train_hard: {
        todayAdvice: "Intervals and sprints",
        intensityTips: ["Sprint sets (50m/100m)", "Threshold intervals"],
        warmup: "400m easy + drills",
        duration: "60-90 min",
      },
      train_light: {
        todayAdvice: "Easy laps - technique",
        intensityTips: ["Slow pace", "Drill work"],
        warmup: "200m easy",
        duration: "30-45 min",
        cautionNotes: ["No sprints"],
      },
      rest: {
        todayAdvice: "Pool day off",
        intensityTips: ["Stretching", "Sauna/hot tub OK"],
        warmup: "N/A",
        duration: "Rest day",
      },
    },
    yoga: {
      train_hard: {
        todayAdvice: "Power or Vinyasa flow",
        intensityTips: ["Challenging sequences", "Inversions OK"],
        warmup: "Sun salutations",
        duration: "60-90 min",
      },
      train_light: {
        todayAdvice: "Gentle or Yin yoga",
        intensityTips: ["Restorative poses", "Focus on breath"],
        warmup: "Seated breathing",
        duration: "30-60 min",
      },
      rest: {
        todayAdvice: "Restorative only",
        intensityTips: ["Savasana", "Meditation"],
        warmup: "N/A",
        duration: "20-30 min",
      },
    },
    soccer: {
      train_hard: {
        todayAdvice: "Full match intensity OK",
        intensityTips: ["11v11 or 7v7", "Sprint drills"],
        warmup: "Rondos + stretches (15 min)",
        duration: "90 min match",
      },
      train_light: {
        todayAdvice: "Technical work only",
        intensityTips: ["Passing drills", "No sprints"],
        warmup: "Extended warm-up",
        duration: "30-45 min",
        cautionNotes: ["Skip the match"],
      },
      rest: {
        todayAdvice: "No soccer today",
        intensityTips: ["Light juggling max", "Stretching"],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Soft tissue injury risk"],
      },
    },
    tennis: {
      train_hard: {
        todayAdvice: "Match play or intense drills",
        intensityTips: ["Competitive sets", "Full power serves"],
        warmup: "Mini-tennis + stretches (10 min)",
        duration: "60-120 min",
      },
      train_light: {
        todayAdvice: "Rally practice at 70%",
        intensityTips: ["Groundstroke technique", "Light serves"],
        warmup: "Extended warm-up",
        duration: "30-45 min",
        cautionNotes: ["Easy on serve"],
      },
      rest: {
        todayAdvice: "Off court today",
        intensityTips: ["Shoulder mobility", "Stretching"],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Tennis elbow risk"],
      },
    },
    golf: {
      train_hard: {
        todayAdvice: "Full round or range session",
        intensityTips: ["18 holes walking", "Full swing driver"],
        warmup: "Stretches + putting (15 min)",
        duration: "4 hrs or 60-90 min range",
      },
      train_light: {
        todayAdvice: "Short game focus",
        intensityTips: ["Putting/chipping only", "9 holes with cart"],
        warmup: "Easy stretches",
        duration: "30-60 min",
        cautionNotes: ["Skip driver"],
      },
      rest: {
        todayAdvice: "Skip golf",
        intensityTips: ["Putting mat at home", "Back stretches"],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Low back risk"],
      },
    },
    hiking: {
      train_hard: {
        todayAdvice: "Challenging trail OK",
        intensityTips: ["Steep elevation", "Heavy pack OK"],
        warmup: "5-10 min easy walking",
        duration: "3-6 hours",
      },
      train_light: {
        todayAdvice: "Easy trail",
        intensityTips: ["Flat/gentle incline", "Light pack"],
        warmup: "Start slow",
        duration: "1-2 hours",
        cautionNotes: ["Avoid technical trails"],
      },
      rest: {
        todayAdvice: "Short walk only",
        intensityTips: ["Flat neighborhood walk", "20-30 min"],
        warmup: "N/A",
        duration: "Rest day",
      },
    },
    climbing: {
      train_hard: {
        todayAdvice: "Project your limit grades",
        intensityTips: ["Hard projects", "Campus board OK"],
        warmup: "Easy climbs + fingers (20 min)",
        duration: "2-3 hours",
      },
      train_light: {
        todayAdvice: "Volume at easy grades",
        intensityTips: ["2-3 grades below max", "No crimps"],
        warmup: "Extended warm-up (25 min)",
        duration: "1-1.5 hours",
        cautionNotes: ["No limit bouldering"],
      },
      rest: {
        todayAdvice: "Rest those tendons",
        intensityTips: ["Antagonist exercises", "Finger stretches"],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Finger injuries when tired"],
      },
    },
    martial_arts: {
      train_hard: {
        todayAdvice: "Full sparring OK",
        intensityTips: ["Live sparring", "Full-speed drills"],
        warmup: "Full warm-up + shadow (15 min)",
        duration: "60-90 min",
      },
      train_light: {
        todayAdvice: "Technical drilling only",
        intensityTips: ["Slow positional work", "Light flow"],
        warmup: "Extended movement prep",
        duration: "45-60 min",
        cautionNotes: ["No hard sparring", "Tap early"],
      },
      rest: {
        todayAdvice: "Off the mats",
        intensityTips: ["Watch instructionals", "Light stretching"],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Injuries happen when exhausted"],
      },
    },
    general: {
      train_hard: {
        todayAdvice: "Full intensity",
        intensityTips: ["Push yourself", "High effort"],
        warmup: "10-15 min",
        duration: "60-90 min",
      },
      train_light: {
        todayAdvice: "Light movement",
        intensityTips: ["Easy effort", "Zone 2"],
        warmup: "10 min",
        duration: "30-45 min",
        cautionNotes: ["Don't push hard"],
      },
      rest: {
        todayAdvice: "Rest and recover",
        intensityTips: ["Walking", "Stretching"],
        warmup: "N/A",
        duration: "Rest day",
      },
    },
  };

  const sportNames: Record<Sport, string> = {
    basketball: "Basketball",
    running: "Running",
    cycling: "Cycling",
    weightlifting: "Weightlifting",
    crossfit: "CrossFit",
    swimming: "Swimming",
    yoga: "Yoga",
    soccer: "Soccer",
    tennis: "Tennis",
    golf: "Golf",
    hiking: "Hiking",
    climbing: "Climbing",
    martial_arts: "Martial Arts",
    general: "General",
  };

  const guide = guides[sport][verdict];
  return {
    sport,
    displayName: sportNames[sport],
    ...guide,
  };
}

function buildReasoning(data: BiometricData, verdict: WorkoutVerdict): string[] {
  const reasons: string[] = [];

  if (data.readinessScore !== null) {
    if (data.readinessScore >= 85) {
      reasons.push(`Readiness ${data.readinessScore} - excellent`);
    } else if (data.readinessScore >= 70) {
      reasons.push(`Readiness ${data.readinessScore} - good`);
    } else if (data.readinessScore >= 50) {
      reasons.push(`Readiness ${data.readinessScore} - moderate`);
    } else {
      reasons.push(`Readiness ${data.readinessScore} - low`);
    }
  }

  if (data.hrvBalance !== null) {
    const diff = data.hrvBalance - 50;
    if (diff >= 10) {
      reasons.push(`HRV ${diff}% above baseline`);
    } else if (diff >= 0) {
      reasons.push(`HRV at baseline`);
    } else {
      reasons.push(`HRV ${Math.abs(diff)}% below baseline`);
    }
  }

  if (data.sleepScore !== null) {
    if (data.sleepScore >= 70) {
      reasons.push(`Sleep ${data.sleepScore} - adequate`);
    } else {
      reasons.push(`Sleep ${data.sleepScore} - needs work`);
    }
  }

  return reasons;
}

export function getWorkoutDecision(data: BiometricData, sport?: Sport): WorkoutDecision {
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
      recommendations: ["Heavy lifting - go for PRs", "HIIT / intervals", "Competitive sports"],
      avoidList: [],
      recoveryRisk: "Low - you're recovered",
      tomorrowOutlook: "Should stay good with proper sleep",
      dataSummary,
      reasoning: buildReasoning(data, "train_hard"),
      intensityGuide: {
        cardio: "Zone 4-5, HR 160-185 bpm",
        weights: "85-100% 1RM, 3-6 reps",
        duration: "60-90 min",
        rpe: "8-10 RPE",
      },
      sportGuide: sport ? getSportGuide(sport, "train_hard") : undefined,
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
      recommendations: ["Zone 2 cardio (easy pace)", "Light weights, more reps", "Yoga or stretching"],
      avoidList: ["Heavy lifting", "HIIT", "PRs"],
      maxHeartRate: 140,
      suggestedZone: "Zone 2",
      recoveryRisk: "Moderate - hard training risks setback",
      tomorrowOutlook: "Better if you rest today",
      dataSummary,
      reasoning: buildReasoning(data, "train_light"),
      intensityGuide: {
        cardio: "Zone 2, HR 120-140 bpm",
        weights: "50-65% 1RM, 12-15 reps",
        duration: "30-45 min",
        rpe: "4-6 RPE",
      },
      sportGuide: sport ? getSportGuide(sport, "train_light") : undefined,
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
    reasoning: buildReasoning(data, "rest"),
    intensityGuide: {
      cardio: "Zone 1 only, HR under 110 bpm",
      weights: "None recommended",
      duration: "20-30 min max",
      rpe: "1-3 RPE",
    },
    sportGuide: sport ? getSportGuide(sport, "rest") : undefined,
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

  // Why this verdict
  lines.push("<b>📋 Why:</b>");
  decision.reasoning.forEach((reason) => {
    lines.push(`  → ${reason}`);
  });
  lines.push("");

  // Intensity guide
  lines.push("<b>🎯 Intensity:</b>");
  if (decision.intensityGuide.cardio) {
    lines.push(`  Cardio: ${decision.intensityGuide.cardio}`);
  }
  if (decision.intensityGuide.weights) {
    lines.push(`  Weights: ${decision.intensityGuide.weights}`);
  }
  if (decision.intensityGuide.rpe) {
    lines.push(`  Effort: ${decision.intensityGuide.rpe}`);
  }

  // Sport-specific guide
  if (decision.sportGuide) {
    const sg = decision.sportGuide;
    lines.push("");
    lines.push(`<b>🏀 ${sg.displayName}:</b>`);
    lines.push(`  ${sg.todayAdvice}`);
    sg.intensityTips.slice(0, 3).forEach((tip) => {
      lines.push(`  → ${tip}`);
    });
    if (sg.cautionNotes && sg.cautionNotes.length > 0) {
      lines.push(`  ⚠️ ${sg.cautionNotes[0]}`);
    }
  }

  lines.push("");
  lines.push(`📅 <b>Tomorrow:</b> ${decision.tomorrowOutlook}`);

  return lines.join("\n");
}

export function formatWorkoutShort(decision: WorkoutDecision): string {
  const { dataSummary } = decision;
  return `${decision.emoji} ${decision.headline}\nReadiness ${dataSummary.readiness.value ?? "?"} • HRV ${dataSummary.hrv.trend}`;
}

// Sport parsing helper
const VALID_SPORTS: Sport[] = [
  "basketball", "running", "cycling", "weightlifting", "crossfit",
  "swimming", "yoga", "soccer", "tennis", "golf", "hiking", "climbing", "martial_arts",
];

const SPORT_ALIASES: Record<string, Sport> = {
  bball: "basketball",
  hoops: "basketball",
  run: "running",
  jog: "running",
  bike: "cycling",
  weights: "weightlifting",
  lifting: "weightlifting",
  gym: "weightlifting",
  cf: "crossfit",
  swim: "swimming",
  football: "soccer",
  futbol: "soccer",
  hike: "hiking",
  climb: "climbing",
  bouldering: "climbing",
  bjj: "martial_arts",
  mma: "martial_arts",
  jiu_jitsu: "martial_arts",
  boxing: "martial_arts",
  muay_thai: "martial_arts",
  karate: "martial_arts",
  judo: "martial_arts",
};

export function parseSport(input?: string): Sport | undefined {
  if (!input) return undefined;
  const normalized = input.toLowerCase().replace(/[-\s]/g, "_");
  if (SPORT_ALIASES[normalized]) return SPORT_ALIASES[normalized];
  if (VALID_SPORTS.includes(normalized as Sport)) return normalized as Sport;
  return undefined;
}

export function getSportList(): string[] {
  return VALID_SPORTS.map((s) => s.replace(/_/g, " "));
}
