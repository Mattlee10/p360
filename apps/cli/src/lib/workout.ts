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

function getSportGuide(sport: Sport, verdict: WorkoutVerdict): SportGuide {
  const guides: Record<Sport, Record<WorkoutVerdict, Omit<SportGuide, "sport" | "displayName">>> = {
    basketball: {
      train_hard: {
        todayAdvice: "Great day for full-court games and explosive plays",
        intensityTips: [
          "Go all out on fast breaks and defense",
          "Work on explosive dunks/layups",
          "Full-intensity scrimmages OK",
          "Practice jump shots at game speed",
        ],
        warmup: "Dynamic stretches + light shooting (10 min)",
        duration: "60-90 min of play",
      },
      train_light: {
        todayAdvice: "Stick to shooting drills and half-court games",
        intensityTips: [
          "Focus on shooting form and free throws",
          "Light ball handling drills",
          "Half-court 3v3 max",
          "Avoid full sprints and hard cuts",
        ],
        warmup: "Extended warm-up (15 min)",
        duration: "30-45 min",
        cautionNotes: ["Skip the fast breaks", "Sub out frequently"],
      },
      rest: {
        todayAdvice: "Skip basketball today - watch game film instead",
        intensityTips: [
          "Light shooting only if you must",
          "No running or jumping",
          "Visualization and mental practice",
        ],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["High ankle/knee injury risk if you play tired"],
      },
    },
    running: {
      train_hard: {
        todayAdvice: "Great day for tempo runs or intervals",
        intensityTips: [
          "Tempo run at threshold pace",
          "Interval training (400m/800m repeats)",
          "Hill sprints",
          "Race pace practice",
        ],
        warmup: "Easy jog + dynamic stretches (10 min)",
        duration: "45-75 min",
      },
      train_light: {
        todayAdvice: "Easy recovery run only",
        intensityTips: [
          "Conversational pace only",
          "Keep heart rate in Zone 2",
          "Focus on form, not speed",
          "Walk breaks are fine",
        ],
        warmup: "Walk 5 min before running",
        duration: "20-30 min",
        cautionNotes: ["No speed work", "Stop if anything feels off"],
      },
      rest: {
        todayAdvice: "Complete rest or very light walk",
        intensityTips: [
          "Walking only (20-30 min max)",
          "Foam rolling and stretching",
          "No running today",
        ],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Running fatigued increases injury risk significantly"],
      },
    },
    cycling: {
      train_hard: {
        todayAdvice: "Push the watts - intervals or climbs",
        intensityTips: [
          "VO2max intervals",
          "Hill repeats at threshold",
          "Sprint training",
          "Race simulation",
        ],
        warmup: "Easy spin 10-15 min",
        duration: "60-120 min",
      },
      train_light: {
        todayAdvice: "Zone 2 spin - recovery ride",
        intensityTips: [
          "Flat routes preferred",
          "Keep cadence high (90+ rpm)",
          "Conversational effort",
          "Focus on pedaling technique",
        ],
        warmup: "Easy spin 5 min",
        duration: "30-45 min",
        cautionNotes: ["Avoid hills", "No sprints"],
      },
      rest: {
        todayAdvice: "Stay off the bike today",
        intensityTips: [
          "Stretching and mobility",
          "Foam roll legs",
          "Walk instead",
        ],
        warmup: "N/A",
        duration: "Rest day",
      },
    },
    weightlifting: {
      train_hard: {
        todayAdvice: "Heavy day - go for PRs",
        intensityTips: [
          "Work up to 85-100% 1RM",
          "Compound lifts: squat, deadlift, bench",
          "Lower reps (3-6)",
          "Full rest between sets (3-5 min)",
        ],
        warmup: "10 min cardio + empty bar sets",
        duration: "60-90 min",
      },
      train_light: {
        todayAdvice: "Deload day - technique focus",
        intensityTips: [
          "50-65% 1RM max",
          "Higher reps (10-15)",
          "Focus on form and mind-muscle connection",
          "Machines OK, skip heavy compounds",
        ],
        warmup: "Extended warm-up (15 min)",
        duration: "30-45 min",
        cautionNotes: ["No PRs", "No heavy compounds"],
      },
      rest: {
        todayAdvice: "Skip the gym - active recovery only",
        intensityTips: [
          "Light stretching",
          "Foam rolling",
          "Maybe a light walk",
        ],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Lifting fatigued = injury risk + poor gains"],
      },
    },
    crossfit: {
      train_hard: {
        todayAdvice: "Full WOD - send it",
        intensityTips: [
          "RX weights",
          "Push the conditioning",
          "Competition intensity OK",
          "Skill work at full speed",
        ],
        warmup: "Class warm-up + extra mobility",
        duration: "60-75 min class",
      },
      train_light: {
        todayAdvice: "Scale the WOD significantly",
        intensityTips: [
          "50-60% of RX weight",
          "Reduce reps/rounds",
          "Focus on movement quality",
          "Skip muscle-ups and heavy oly lifts",
        ],
        warmup: "Extended warm-up",
        duration: "45 min max",
        cautionNotes: ["Don't chase the leaderboard today"],
      },
      rest: {
        todayAdvice: "Skip CrossFit today",
        intensityTips: [
          "Light mobility work only",
          "Recovery stretching",
          "Walk or easy bike",
        ],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["CrossFit fatigued = high injury risk"],
      },
    },
    swimming: {
      train_hard: {
        todayAdvice: "Intervals and sprint sets",
        intensityTips: [
          "Sprint sets (50m/100m)",
          "Threshold intervals",
          "Technique drills at race pace",
          "Dive practice",
        ],
        warmup: "400m easy + drills",
        duration: "60-90 min / 2500-4000m",
      },
      train_light: {
        todayAdvice: "Easy laps - technique focus",
        intensityTips: [
          "Slow, steady pace",
          "Drill work",
          "Pull buoy sets",
          "Focus on breathing rhythm",
        ],
        warmup: "200m easy",
        duration: "30-45 min / 1500-2000m",
        cautionNotes: ["No sprints", "No flip turns if tired"],
      },
      rest: {
        todayAdvice: "Pool day off",
        intensityTips: [
          "Light stretching",
          "Maybe hot tub/sauna",
          "Visualization",
        ],
        warmup: "N/A",
        duration: "Rest day",
      },
    },
    yoga: {
      train_hard: {
        todayAdvice: "Power or Vinyasa flow",
        intensityTips: [
          "Challenging sequences",
          "Arm balances and inversions",
          "Hot yoga OK",
          "Push your edge in poses",
        ],
        warmup: "Sun salutations",
        duration: "60-90 min",
      },
      train_light: {
        todayAdvice: "Gentle or Yin yoga",
        intensityTips: [
          "Slow, restorative poses",
          "Focus on breath",
          "Props encouraged",
          "Skip intense inversions",
        ],
        warmup: "Seated breathing",
        duration: "30-60 min",
      },
      rest: {
        todayAdvice: "Restorative or skip",
        intensityTips: [
          "Savasana and breathing only",
          "Legs up the wall",
          "Meditation",
        ],
        warmup: "N/A",
        duration: "20-30 min or rest",
      },
    },
    soccer: {
      train_hard: {
        todayAdvice: "Full match intensity OK",
        intensityTips: [
          "11v11 or competitive 7v7",
          "Sprint drills",
          "Shooting practice at full power",
          "High-intensity possession games",
        ],
        warmup: "Rondos + dynamic stretches (15 min)",
        duration: "90 min match / 60-75 min training",
      },
      train_light: {
        todayAdvice: "Technical work only",
        intensityTips: [
          "Passing drills",
          "Light touch work",
          "Positional play (walking pace)",
          "No sprints or tackles",
        ],
        warmup: "Extended warm-up (15 min)",
        duration: "30-45 min",
        cautionNotes: ["Skip the match", "No slide tackles"],
      },
      rest: {
        todayAdvice: "No soccer today",
        intensityTips: [
          "Light juggling max",
          "Video analysis",
          "Stretching",
        ],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Soft tissue injuries common when fatigued"],
      },
    },
    tennis: {
      train_hard: {
        todayAdvice: "Match play or intense drills",
        intensityTips: [
          "Competitive sets",
          "Serve practice at full power",
          "Court sprints and footwork",
          "High-intensity rallies",
        ],
        warmup: "Mini-tennis + dynamic stretches (10 min)",
        duration: "60-120 min",
      },
      train_light: {
        todayAdvice: "Rally practice at 70%",
        intensityTips: [
          "Groundstroke technique",
          "Slow rallies, focus on placement",
          "No serving or light serves only",
          "Avoid aggressive movements",
        ],
        warmup: "Extended warm-up (15 min)",
        duration: "30-45 min",
        cautionNotes: ["No competitive sets", "Easy on the serve"],
      },
      rest: {
        todayAdvice: "Off court today",
        intensityTips: [
          "Stretching and foam rolling",
          "Shoulder/elbow mobility",
          "Watch match videos",
        ],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Tennis elbow/shoulder risk when tired"],
      },
    },
    golf: {
      train_hard: {
        todayAdvice: "Full round or intensive range session",
        intensityTips: [
          "18 holes walking",
          "Driver practice at full swing",
          "Course management focus",
          "Mental game training",
        ],
        warmup: "Dynamic stretches + putting green (15 min)",
        duration: "4 hrs (18 holes) or 60-90 min range",
      },
      train_light: {
        todayAdvice: "Short game focus",
        intensityTips: [
          "Putting and chipping only",
          "9 holes with cart",
          "Light irons, skip driver",
          "Focus on tempo",
        ],
        warmup: "Easy stretches (10 min)",
        duration: "30-60 min",
        cautionNotes: ["Skip the driver", "Take the cart"],
      },
      rest: {
        todayAdvice: "Skip golf today",
        intensityTips: [
          "Putting mat at home max",
          "Watch golf content",
          "Back/hip stretches",
        ],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Low back injury risk when fatigued"],
      },
    },
    hiking: {
      train_hard: {
        todayAdvice: "Challenging trail - elevation OK",
        intensityTips: [
          "Steep elevation gain",
          "Fast pace",
          "Heavy pack training",
          "Technical terrain",
        ],
        warmup: "5-10 min easy walking",
        duration: "3-6 hours",
      },
      train_light: {
        todayAdvice: "Easy trail, moderate distance",
        intensityTips: [
          "Flat or gentle incline",
          "Slow, steady pace",
          "Light or no pack",
          "Nature walk mindset",
        ],
        warmup: "Start slow",
        duration: "1-2 hours",
        cautionNotes: ["Avoid technical trails", "Bring extra water"],
      },
      rest: {
        todayAdvice: "Short walk only",
        intensityTips: [
          "Flat neighborhood walk",
          "20-30 min max",
          "No pack",
        ],
        warmup: "N/A",
        duration: "Rest day",
      },
    },
    climbing: {
      train_hard: {
        todayAdvice: "Project your limit grades",
        intensityTips: [
          "Work on hard projects",
          "Power endurance training",
          "Campus board OK",
          "Push your grades",
        ],
        warmup: "Easy climbs + finger warm-up (20 min)",
        duration: "2-3 hours",
      },
      train_light: {
        todayAdvice: "Volume at easy grades",
        intensityTips: [
          "2-3 grades below max",
          "Technique focus",
          "No crimps or pockets",
          "Slab and balance climbs",
        ],
        warmup: "Extended warm-up (25 min)",
        duration: "1-1.5 hours",
        cautionNotes: ["No campus board", "No limit bouldering"],
      },
      rest: {
        todayAdvice: "Rest those tendons",
        intensityTips: [
          "No climbing",
          "Antagonist exercises",
          "Finger stretches",
          "Watch beta videos",
        ],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Finger injuries happen when fatigued"],
      },
    },
    martial_arts: {
      train_hard: {
        todayAdvice: "Full sparring or hard drilling",
        intensityTips: [
          "Live sparring",
          "Full-speed technique drills",
          "Conditioning circuits",
          "Competition prep",
        ],
        warmup: "Full warm-up + shadow work (15 min)",
        duration: "60-90 min",
      },
      train_light: {
        todayAdvice: "Technical drilling only",
        intensityTips: [
          "Slow positional sparring",
          "Technique review",
          "Light flow rolling",
          "No striking at power",
        ],
        warmup: "Extended movement prep (15 min)",
        duration: "45-60 min",
        cautionNotes: ["No hard sparring", "Tap early, tap often"],
      },
      rest: {
        todayAdvice: "Off the mats today",
        intensityTips: [
          "Visualization",
          "Watch instructionals",
          "Light stretching",
        ],
        warmup: "N/A",
        duration: "Rest day",
        cautionNotes: ["Injuries happen when exhausted"],
      },
    },
    general: {
      train_hard: {
        todayAdvice: "Full intensity workout",
        intensityTips: [
          "Push yourself",
          "High effort",
          "Challenge your limits",
        ],
        warmup: "10-15 min",
        duration: "60-90 min",
      },
      train_light: {
        todayAdvice: "Light movement day",
        intensityTips: [
          "Easy effort",
          "Focus on form",
          "Stay in Zone 2",
        ],
        warmup: "10 min",
        duration: "30-45 min",
        cautionNotes: ["Don't push hard"],
      },
      rest: {
        todayAdvice: "Rest and recover",
        intensityTips: [
          "Light walking",
          "Stretching",
          "Recovery work",
        ],
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

  // Readiness reasoning
  if (data.readinessScore !== null) {
    if (data.readinessScore >= 85) {
      reasons.push(`Readiness score ${data.readinessScore} is excellent - body fully recovered`);
    } else if (data.readinessScore >= 70) {
      reasons.push(`Readiness score ${data.readinessScore} indicates good recovery status`);
    } else if (data.readinessScore >= 50) {
      reasons.push(`Readiness score ${data.readinessScore} is moderate - some fatigue present`);
    } else {
      reasons.push(`Readiness score ${data.readinessScore} is low - significant recovery needed`);
    }
  }

  // HRV reasoning
  if (data.hrvBalance !== null) {
    const diff = data.hrvBalance - 50;
    if (diff >= 10) {
      reasons.push(`HRV ${diff}% above baseline - parasympathetic nervous system strong`);
    } else if (diff >= 0) {
      reasons.push(`HRV at baseline - autonomic balance is normal`);
    } else if (diff >= -10) {
      reasons.push(`HRV ${Math.abs(diff)}% below baseline - mild stress on recovery systems`);
    } else {
      reasons.push(`HRV ${Math.abs(diff)}% below baseline - body under significant stress`);
    }
  }

  // Sleep reasoning
  if (data.sleepScore !== null) {
    if (data.sleepScore >= 85) {
      reasons.push(`Sleep score ${data.sleepScore} - excellent sleep quality supports hard training`);
    } else if (data.sleepScore >= 70) {
      reasons.push(`Sleep score ${data.sleepScore} - adequate sleep for training`);
    } else if (data.sleepScore >= 50) {
      reasons.push(`Sleep score ${data.sleepScore} - sleep debt may limit performance`);
    } else {
      reasons.push(`Sleep score ${data.sleepScore} - poor sleep, prioritize recovery`);
    }
  }

  // Verdict-specific summary
  if (verdict === "train_hard") {
    reasons.push("All indicators support high-intensity training today");
  } else if (verdict === "train_light") {
    reasons.push("Mixed signals - moderate activity recommended to aid recovery");
  } else {
    reasons.push("Multiple indicators suggest rest is the optimal choice");
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
    reasoning: buildReasoning(data, "rest"),
    intensityGuide: {
      cardio: "Zone 1 only, HR under 110 bpm",
      weights: "None recommended",
      duration: "20-30 min max (walking only)",
      rpe: "1-3 RPE",
    },
    sportGuide: sport ? getSportGuide(sport, "rest") : undefined,
  };
}

export function formatWorkoutCLI(decision: WorkoutDecision): string {
  const lines: string[] = [];

  lines.push("");
  lines.push(`  ${decision.emoji} ${decision.headline}`);
  lines.push("");
  lines.push(`  ${decision.subheadline}`);
  lines.push("");
  lines.push("  ─────────────────────────────────────");
  lines.push("");

  const { dataSummary } = decision;
  lines.push(
    `  Readiness: ${dataSummary.readiness.value ?? "N/A"} (${dataSummary.readiness.status})`
  );
  lines.push(`  HRV:       ${dataSummary.hrv.trend}`);
  lines.push(
    `  Sleep:     ${dataSummary.sleep.value ?? "N/A"} (${getScoreStatus(dataSummary.sleep.value)})`
  );
  lines.push("");

  // Why this verdict
  lines.push("  📊 Why this verdict:");
  decision.reasoning.forEach((reason) => {
    lines.push(`    • ${reason}`);
  });
  lines.push("");

  // Intensity Guide
  lines.push("  🎯 Intensity Guide:");
  if (decision.intensityGuide.cardio) {
    lines.push(`    Cardio:   ${decision.intensityGuide.cardio}`);
  }
  if (decision.intensityGuide.weights) {
    lines.push(`    Weights:  ${decision.intensityGuide.weights}`);
  }
  if (decision.intensityGuide.duration) {
    lines.push(`    Duration: ${decision.intensityGuide.duration}`);
  }
  if (decision.intensityGuide.rpe) {
    lines.push(`    Effort:   ${decision.intensityGuide.rpe}`);
  }
  lines.push("");

  // Sport-specific guide (if provided)
  if (decision.sportGuide) {
    const sg = decision.sportGuide;
    lines.push(`  🏀 ${sg.displayName} Guide:`);
    lines.push(`    ${sg.todayAdvice}`);
    lines.push("");
    lines.push("    Tips:");
    sg.intensityTips.forEach((tip) => {
      lines.push(`      • ${tip}`);
    });
    if (sg.warmup !== "N/A") {
      lines.push(`    Warm-up: ${sg.warmup}`);
    }
    lines.push(`    Duration: ${sg.duration}`);
    if (sg.cautionNotes && sg.cautionNotes.length > 0) {
      lines.push("");
      lines.push("    ⚠️  Caution:");
      sg.cautionNotes.forEach((note) => {
        lines.push(`      • ${note}`);
      });
    }
    lines.push("");
  }

  lines.push("  ✓ Recommended:");
  decision.recommendations.forEach((rec) => {
    lines.push(`    • ${rec}`);
  });

  if (decision.avoidList.length > 0) {
    lines.push("");
    lines.push("  ✗ Avoid:");
    decision.avoidList.forEach((item) => {
      lines.push(`    • ${item}`);
    });
  }

  if (decision.maxHeartRate) {
    lines.push("");
    lines.push(`  💓 Max HR: ${decision.maxHeartRate} bpm`);
  }

  lines.push("");
  lines.push("  ─────────────────────────────────────");
  lines.push("");
  lines.push(`  ⚠  Risk:     ${decision.recoveryRisk}`);
  lines.push(`  📅 Tomorrow: ${decision.tomorrowOutlook}`);
  lines.push("");

  return lines.join("\n");
}

export function formatWorkoutJSON(decision: WorkoutDecision): string {
  return JSON.stringify(decision, null, 2);
}

export function formatWorkoutCompact(decision: WorkoutDecision): string {
  const { dataSummary } = decision;
  return `${decision.emoji} ${decision.headline} | Readiness ${dataSummary.readiness.value ?? "?"} | HRV ${dataSummary.hrv.trend} | ${decision.recoveryRisk}`;
}
