"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  OuraProvider: () => OuraProvider,
  WhoopProvider: () => WhoopProvider,
  analyzeGap: () => analyzeGap,
  calculateDecisionReadiness: () => calculateDecisionReadiness,
  calculateDrinkHistory: () => calculateDrinkHistory,
  calculateMoodInsight: () => calculateMoodInsight,
  calculatePearsonCorrelation: () => calculatePearsonCorrelation,
  formatWorkoutCLI: () => formatWorkoutCLI,
  formatWorkoutJSON: () => formatWorkoutJSON,
  getDemoData: () => getDemoData,
  getDemoScenario: () => getDemoScenario,
  getDrinkDecision: () => getDrinkDecision,
  getMoodAttribution: () => getMoodAttribution,
  getMoodDecision: () => getMoodDecision,
  getRandomDemoData: () => getRandomDemoData,
  getRecoveryCost: () => getRecoveryCost,
  getSocialStrategy: () => getSocialStrategy,
  getSportGuide: () => getSportGuide,
  getSportList: () => getSportList,
  getStatusColor: () => getStatusColor,
  getStatusEmoji: () => getStatusEmoji,
  getSubstanceCategory: () => getSubstanceCategory,
  getSubstanceList: () => getSubstanceList,
  getVerdictColor: () => getVerdictColor,
  getVerdictEmoji: () => getVerdictEmoji,
  getWhyDecision: () => getWhyDecision,
  getWorkoutDecision: () => getWorkoutDecision,
  getWorkoutVerdictColor: () => getVerdictColor2,
  getWorkoutVerdictEmoji: () => getVerdictEmoji2,
  parseSport: () => parseSport,
  parseSubstance: () => parseSubstance,
  parseWhyInput: () => parseWhyInput,
  quickCheck: () => quickCheck
});
module.exports = __toCommonJS(index_exports);

// src/providers/oura.ts
var OURA_API_BASE = "https://api.ouraring.com/v2";
var OuraProvider = class {
  constructor() {
    this.name = "oura";
    this.displayName = "Oura Ring";
  }
  /**
   * Fetch today's biometric data from Oura API
   */
  async fetchBiometricData(token) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 864e5).toISOString().split("T")[0];
    const [sleepData, readinessData] = await Promise.all([
      this.fetchSleepData(token, yesterday, today),
      this.fetchReadinessData(token, yesterday, today)
    ]);
    return this.parseBiometricData(sleepData, readinessData);
  }
  /**
   * Validate that the token is working by hitting the personal_info endpoint
   */
  async validateToken(token) {
    try {
      const response = await fetch(
        `${OURA_API_BASE}/usercollection/personal_info`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
  async fetchSleepData(token, startDate, endDate) {
    const url = `${OURA_API_BASE}/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error(`Oura API error: HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  }
  async fetchReadinessData(token, startDate, endDate) {
    const url = `${OURA_API_BASE}/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error(`Oura API error: HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  }
  parseBiometricData(sleepData, readinessData) {
    const latestSleep = sleepData[sleepData.length - 1];
    const latestReadiness = readinessData[readinessData.length - 1];
    return {
      sleepScore: latestSleep?.score ?? null,
      readinessScore: latestReadiness?.score ?? null,
      hrvBalance: latestReadiness?.contributors?.hrv_balance ?? null,
      restingHR: latestReadiness?.contributors?.resting_heart_rate ?? null,
      date: latestReadiness?.day ?? latestSleep?.day ?? (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
  }
};

// src/providers/whoop.ts
var WHOOP_API_BASE = "https://api.prod.whoop.com/developer";
var WhoopProvider = class {
  constructor() {
    this.name = "whoop";
    this.displayName = "WHOOP";
  }
  /**
   * Normalize WHOOP HRV (milliseconds) to 0-100 scale
   * WHOOP raw RMSSD is typically 20-150ms
   * Using 60ms as baseline (50 on our scale)
   */
  normalizeHrv(hrvRmssdMilli) {
    return Math.min(100, Math.max(0, Math.round(hrvRmssdMilli / 1.2)));
  }
  async fetchBiometricData(token) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const [recoveryData, sleepData] = await Promise.all([
      this.fetchRecovery(token),
      this.fetchSleep(token)
    ]);
    let readinessScore = null;
    let hrvBalance = null;
    let restingHR = null;
    if (recoveryData?.score) {
      readinessScore = recoveryData.score.recovery_score;
      hrvBalance = this.normalizeHrv(recoveryData.score.hrv_rmssd_milli);
      restingHR = recoveryData.score.resting_heart_rate;
    }
    let sleepScore = null;
    if (sleepData?.score) {
      sleepScore = sleepData.score.sleep_performance_percentage;
    }
    return {
      sleepScore,
      readinessScore,
      hrvBalance,
      restingHR,
      date: today
    };
  }
  async validateToken(token) {
    try {
      const response = await fetch(`${WHOOP_API_BASE}/v1/user/profile/basic`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  async fetchRecovery(token) {
    try {
      const response = await fetch(
        `${WHOOP_API_BASE}/v1/recovery?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!response.ok) {
        console.error("WHOOP recovery fetch failed:", response.status);
        return null;
      }
      const data = await response.json();
      return data.records[0] || null;
    } catch (error) {
      console.error("WHOOP recovery fetch error:", error);
      return null;
    }
  }
  async fetchSleep(token) {
    try {
      const response = await fetch(
        `${WHOOP_API_BASE}/v1/activity/sleep?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (!response.ok) {
        console.error("WHOOP sleep fetch failed:", response.status);
        return null;
      }
      const data = await response.json();
      return data.records[0] || null;
    } catch (error) {
      console.error("WHOOP sleep fetch error:", error);
      return null;
    }
  }
};

// src/algorithm.ts
function calculateBaseScore(data) {
  let baseScore = data.readinessScore ?? data.sleepScore ?? 50;
  if (data.hrvBalance !== null) {
    const hrvModifier = (data.hrvBalance - 50) * 0.1;
    baseScore = Math.round(baseScore + hrvModifier);
  }
  return Math.max(0, Math.min(100, baseScore));
}
function getStatusFromScore(score) {
  if (score >= 70) return "excellent";
  if (score >= 50) return "good";
  if (score >= 30) return "caution";
  return "poor";
}
function getActionVerdict(score, context) {
  const { importance } = context;
  const thresholds = {
    low: { proceed: 30, caution: 20, wait: 10 },
    medium: { proceed: 50, caution: 35, wait: 20 },
    high: { proceed: 65, caution: 50, wait: 35 },
    critical: { proceed: 75, caution: 60, wait: 45 }
  };
  const t = thresholds[importance];
  if (score >= t.proceed) return "proceed";
  if (score >= t.caution) return "proceed_with_caution";
  if (score >= t.wait) return "wait";
  return "stop";
}
var INSIGHT_TEMPLATES = {
  email: {
    proceed: {
      headline: "Clear to send",
      action: "Your state supports clear communication. Send when ready.",
      rationale: "High cognitive clarity and emotional regulation detected."
    },
    proceed_with_caution: {
      headline: "Review before sending",
      action: "Read your email once more. Check tone and clarity.",
      rationale: "Slightly below optimal state. Minor tone issues possible.",
      fallback: "If urgent, have someone review it first."
    },
    wait: {
      headline: "Don't send yet",
      action: "Save as draft. Revisit in 2-3 hours.",
      rationale: "Current state increases risk of unclear or emotional messaging.",
      retryIn: "2-3 hours",
      risk: "Sending now: 40% higher chance of regret."
    },
    stop: {
      headline: "Do not send",
      action: "Close the email. This is not the time.",
      rationale: "Your body signals significant fatigue or stress. Communication errors likely.",
      retryIn: "Tomorrow morning",
      risk: "Sending now: High probability of damaging the relationship.",
      fallback: "If truly urgent, delegate to someone else."
    }
  },
  meeting: {
    proceed: {
      headline: "Good for meetings",
      action: "You're ready for focused discussions and decisions.",
      rationale: "Cognitive performance and attention span are optimal."
    },
    proceed_with_caution: {
      headline: "Meetings okay, limit decisions",
      action: "Attend but defer major commitments to a follow-up.",
      rationale: "You can engage, but decision quality may be compromised.",
      fallback: "Take notes, decide later."
    },
    wait: {
      headline: "Reschedule if possible",
      action: "Move to tomorrow morning if the meeting is important.",
      rationale: "Current state suggests reduced focus and patience.",
      retryIn: "Tomorrow AM",
      risk: "You may agree to things you'll regret."
    },
    stop: {
      headline: "Cancel or delegate",
      action: "This is not a good time for important meetings.",
      rationale: "High fatigue detected. Performance will suffer.",
      retryIn: "After full recovery",
      fallback: "Send a brief message to reschedule."
    }
  },
  financial: {
    proceed: {
      headline: "Safe to decide",
      action: "Your judgment is clear. Proceed with financial decisions.",
      rationale: "Impulse control and analytical thinking are optimal."
    },
    proceed_with_caution: {
      headline: "Decide, but set limits",
      action: "Proceed with planned purchases only. No impulse decisions.",
      rationale: "Slightly elevated risk of emotional spending.",
      fallback: "Wait 24 hours for anything over your set threshold."
    },
    wait: {
      headline: "Hold off on spending",
      action: "Do not make purchases over $100 today.",
      rationale: "Impulse control is compromised. Regret probability elevated.",
      retryIn: "Tomorrow",
      risk: "Today's 'great deal' may not look so great tomorrow."
    },
    stop: {
      headline: "No financial decisions today",
      action: "Log off shopping sites. Do not open investment apps.",
      rationale: "Your state strongly correlates with impulsive decisions.",
      retryIn: "After recovery (1-2 days)",
      risk: "Purchases made now have 60% higher return rate."
    }
  },
  workout: {
    proceed: {
      headline: "Train hard",
      action: "Your body is ready for high-intensity work.",
      rationale: "Recovery is complete. Adaptation potential is high."
    },
    proceed_with_caution: {
      headline: "Train, but listen to your body",
      action: "Start with 70% intensity. Increase only if feeling good.",
      rationale: "Slightly under-recovered. Risk of injury if pushed too hard.",
      fallback: "Consider mobility work or light cardio instead."
    },
    wait: {
      headline: "Active recovery only",
      action: "Walking, stretching, or light yoga. No intense training.",
      rationale: "Pushing now risks 3+ days of forced recovery.",
      retryIn: "Tomorrow",
      risk: "Training today: 60% chance of needing extra recovery days."
    },
    stop: {
      headline: "Rest day",
      action: "No training. Focus on sleep, hydration, and nutrition.",
      rationale: "Your body is demanding recovery. Listen to it.",
      retryIn: "When readiness returns above 50",
      risk: "Training now significantly increases injury and illness risk."
    }
  },
  creative: {
    proceed: {
      headline: "Creative window open",
      action: "Tackle your hardest creative problems now.",
      rationale: "Cognitive flexibility and focus are elevated."
    },
    proceed_with_caution: {
      headline: "Creative work okay, not ideal",
      action: "Work on structured tasks. Avoid open-ended brainstorming.",
      rationale: "You can execute, but breakthrough thinking is less likely.",
      fallback: "Do research and preparation instead."
    },
    wait: {
      headline: "Not the time for creative work",
      action: "Do administrative tasks or take input (reading, watching).",
      rationale: "Creative output quality will be below your standards.",
      retryIn: "After rest or tomorrow morning"
    },
    stop: {
      headline: "Creative work will frustrate you",
      action: "Consume, don't create. Watch, read, rest.",
      rationale: "Low energy + creative work = frustration and poor output.",
      retryIn: "After full recovery"
    }
  },
  negotiation: {
    proceed: {
      headline: "Ready to negotiate",
      action: "Your emotional regulation and clarity support tough conversations.",
      rationale: "Optimal state for assertive yet measured communication."
    },
    proceed_with_caution: {
      headline: "Negotiate, but stay alert",
      action: "Proceed with planned points. Don't improvise under pressure.",
      rationale: "Slightly reduced patience. Stick to your script.",
      fallback: "Take breaks if tensions rise."
    },
    wait: {
      headline: "Postpone difficult conversations",
      action: "Reschedule negotiations to a better time.",
      rationale: "Risk of saying things you'll regret is elevated.",
      retryIn: "Tomorrow",
      risk: "Negotiations today: Higher chance of suboptimal outcomes."
    },
    stop: {
      headline: "Do not engage",
      action: "Avoid all difficult conversations today.",
      rationale: "Emotional regulation is compromised. Conflict likely.",
      retryIn: "After full recovery",
      risk: "High probability of relationship damage.",
      fallback: "If unavoidable, bring a trusted ally for support."
    }
  },
  general: {
    proceed: {
      headline: "Good state for decisions",
      action: "Your body signals optimal decision-making capacity.",
      rationale: "High readiness score indicates clear thinking."
    },
    proceed_with_caution: {
      headline: "Proceed carefully",
      action: "Make routine decisions. Hold on bigger ones if possible.",
      rationale: "Below optimal, but functional.",
      fallback: "Sleep on major decisions."
    },
    wait: {
      headline: "Delay important decisions",
      action: "Handle only urgent matters. Postpone the rest.",
      rationale: "Decision quality is compromised.",
      retryIn: "3-4 hours or tomorrow",
      risk: "Decisions made now have higher regret probability."
    },
    stop: {
      headline: "Avoid decisions today",
      action: "Maintain status quo. Do not commit to anything new.",
      rationale: "Your body signals significant impairment.",
      retryIn: "After recovery",
      risk: "Major decisions today will likely be regretted."
    }
  }
};
function generateInsight(score, context) {
  const verdict = getActionVerdict(score, context);
  const template = INSIGHT_TEMPLATES[context.category][verdict];
  return {
    verdict,
    headline: template.headline,
    action: template.action,
    rationale: template.rationale,
    retryIn: template.retryIn,
    fallback: template.fallback,
    risk: template.risk
  };
}
function getMetricLabel(value) {
  if (value === null) return "N/A";
  if (value >= 85) return "Excellent";
  if (value >= 70) return "Good";
  if (value >= 50) return "Fair";
  return "Low";
}
function getHrvLabel(value) {
  if (value === null) return "N/A";
  if (value >= 70) return "High";
  if (value >= 40) return "Normal";
  return "Low";
}
function getStatusMessage(status) {
  const messages = {
    excellent: "Great time for important decisions",
    good: "Good state for most decisions",
    caution: "Consider waiting for big decisions",
    poor: "Not recommended for major decisions"
  };
  return messages[status];
}
function getGenericRecommendation(status) {
  const recommendations = {
    excellent: "Your body is in optimal state. Perfect time for negotiations, important emails, or strategic planning.",
    good: "You're in a good state for everyday decisions. Proceed with confidence on routine matters.",
    caution: "Your readiness is below optimal. If possible, delay important decisions by a few hours or until tomorrow.",
    poor: "Your body signals suggest fatigue or stress. Avoid making significant commitments. Focus on recovery."
  };
  return recommendations[status];
}
function calculateDecisionReadiness(data, context = { category: "general", importance: "medium" }) {
  const score = calculateBaseScore(data);
  const status = getStatusFromScore(score);
  const insight = generateInsight(score, context);
  return {
    score,
    status,
    message: getStatusMessage(status),
    recommendation: getGenericRecommendation(status),
    metrics: {
      sleep: {
        value: data.sleepScore,
        label: getMetricLabel(data.sleepScore)
      },
      readiness: {
        value: data.readinessScore,
        label: getMetricLabel(data.readinessScore)
      },
      hrv: {
        value: data.hrvBalance,
        label: getHrvLabel(data.hrvBalance)
      }
    },
    insight
  };
}
function quickCheck(data, category, importance = "medium") {
  const score = calculateBaseScore(data);
  return generateInsight(score, { category, importance });
}
function getStatusEmoji(status) {
  const emojis = {
    excellent: "\u{1F7E2}",
    good: "\u{1F535}",
    caution: "\u{1F7E1}",
    poor: "\u{1F534}"
  };
  return emojis[status];
}
function getVerdictEmoji(verdict) {
  const emojis = {
    proceed: "\u2705",
    proceed_with_caution: "\u26A0\uFE0F",
    wait: "\u23F3",
    stop: "\u{1F6D1}"
  };
  return emojis[verdict];
}
function getStatusColor(status) {
  const colors = {
    excellent: "#10B981",
    good: "#3B82F6",
    caution: "#F59E0B",
    poor: "#EF4444"
  };
  return colors[status];
}
function getVerdictColor(verdict) {
  const colors = {
    proceed: "#10B981",
    proceed_with_caution: "#F59E0B",
    wait: "#F59E0B",
    stop: "#EF4444"
  };
  return colors[verdict];
}

// src/workout.ts
var SPORT_GUIDES = {
  basketball: {
    train_hard: {
      todayAdvice: "Great day for full-court games and explosive plays",
      intensityTips: ["Go all out on fast breaks", "Full-intensity scrimmages OK", "Practice shots at game speed"],
      warmup: "Dynamic stretches + shooting (10 min)",
      duration: "60-90 min"
    },
    train_light: {
      todayAdvice: "Stick to shooting drills and half-court",
      intensityTips: ["Focus on shooting form", "Half-court 3v3 max", "Avoid full sprints"],
      warmup: "Extended warm-up (15 min)",
      duration: "30-45 min",
      cautionNotes: ["Skip fast breaks", "Sub out frequently"]
    },
    rest: {
      todayAdvice: "Skip basketball today",
      intensityTips: ["Light shooting only", "No running or jumping"],
      warmup: "N/A",
      duration: "Rest day",
      cautionNotes: ["High injury risk if you play tired"]
    }
  },
  running: {
    train_hard: {
      todayAdvice: "Great day for tempo or intervals",
      intensityTips: ["Tempo run at threshold", "400m/800m repeats", "Hill sprints OK"],
      warmup: "Easy jog + stretches (10 min)",
      duration: "45-75 min"
    },
    train_light: {
      todayAdvice: "Easy recovery run only",
      intensityTips: ["Conversational pace", "Zone 2 heart rate", "Walk breaks fine"],
      warmup: "Walk 5 min first",
      duration: "20-30 min",
      cautionNotes: ["No speed work"]
    },
    rest: {
      todayAdvice: "Walking only today",
      intensityTips: ["20-30 min walk max", "Foam rolling"],
      warmup: "N/A",
      duration: "Rest day",
      cautionNotes: ["Running fatigued = injury risk"]
    }
  },
  cycling: {
    train_hard: {
      todayAdvice: "Push the watts - intervals or climbs",
      intensityTips: ["VO2max intervals", "Hill repeats", "Sprint training"],
      warmup: "Easy spin 10-15 min",
      duration: "60-120 min"
    },
    train_light: {
      todayAdvice: "Zone 2 recovery ride",
      intensityTips: ["Flat routes", "High cadence (90+ rpm)", "Easy effort"],
      warmup: "Easy spin 5 min",
      duration: "30-45 min",
      cautionNotes: ["Avoid hills"]
    },
    rest: {
      todayAdvice: "Stay off the bike",
      intensityTips: ["Stretching", "Walk instead"],
      warmup: "N/A",
      duration: "Rest day"
    }
  },
  weightlifting: {
    train_hard: {
      todayAdvice: "Heavy day - go for PRs",
      intensityTips: ["85-100% 1RM", "Compound lifts", "3-6 reps"],
      warmup: "10 min cardio + empty bar",
      duration: "60-90 min"
    },
    train_light: {
      todayAdvice: "Deload - technique focus",
      intensityTips: ["50-65% 1RM", "10-15 reps", "Machines OK"],
      warmup: "Extended warm-up (15 min)",
      duration: "30-45 min",
      cautionNotes: ["No PRs", "No heavy compounds"]
    },
    rest: {
      todayAdvice: "Skip the gym",
      intensityTips: ["Light stretching", "Foam rolling"],
      warmup: "N/A",
      duration: "Rest day",
      cautionNotes: ["Lifting tired = poor gains"]
    }
  },
  crossfit: {
    train_hard: {
      todayAdvice: "Full WOD - send it",
      intensityTips: ["RX weights", "Competition intensity"],
      warmup: "Class warm-up + mobility",
      duration: "60-75 min"
    },
    train_light: {
      todayAdvice: "Scale significantly",
      intensityTips: ["50-60% RX", "Focus on quality"],
      warmup: "Extended warm-up",
      duration: "45 min max",
      cautionNotes: ["Skip the leaderboard"]
    },
    rest: {
      todayAdvice: "Skip CrossFit",
      intensityTips: ["Light mobility only"],
      warmup: "N/A",
      duration: "Rest day",
      cautionNotes: ["High injury risk when tired"]
    }
  },
  swimming: {
    train_hard: {
      todayAdvice: "Intervals and sprints",
      intensityTips: ["Sprint sets (50m/100m)", "Threshold intervals"],
      warmup: "400m easy + drills",
      duration: "60-90 min"
    },
    train_light: {
      todayAdvice: "Easy laps - technique",
      intensityTips: ["Slow pace", "Drill work"],
      warmup: "200m easy",
      duration: "30-45 min",
      cautionNotes: ["No sprints"]
    },
    rest: {
      todayAdvice: "Pool day off",
      intensityTips: ["Stretching", "Sauna/hot tub OK"],
      warmup: "N/A",
      duration: "Rest day"
    }
  },
  yoga: {
    train_hard: {
      todayAdvice: "Power or Vinyasa flow",
      intensityTips: ["Challenging sequences", "Inversions OK"],
      warmup: "Sun salutations",
      duration: "60-90 min"
    },
    train_light: {
      todayAdvice: "Gentle or Yin yoga",
      intensityTips: ["Restorative poses", "Focus on breath"],
      warmup: "Seated breathing",
      duration: "30-60 min"
    },
    rest: {
      todayAdvice: "Restorative only",
      intensityTips: ["Savasana", "Meditation"],
      warmup: "N/A",
      duration: "20-30 min"
    }
  },
  soccer: {
    train_hard: {
      todayAdvice: "Full match intensity OK",
      intensityTips: ["11v11 or 7v7", "Sprint drills"],
      warmup: "Rondos + stretches (15 min)",
      duration: "90 min match"
    },
    train_light: {
      todayAdvice: "Technical work only",
      intensityTips: ["Passing drills", "No sprints"],
      warmup: "Extended warm-up",
      duration: "30-45 min",
      cautionNotes: ["Skip the match"]
    },
    rest: {
      todayAdvice: "No soccer today",
      intensityTips: ["Light juggling max", "Stretching"],
      warmup: "N/A",
      duration: "Rest day",
      cautionNotes: ["Soft tissue injury risk"]
    }
  },
  tennis: {
    train_hard: {
      todayAdvice: "Match play or intense drills",
      intensityTips: ["Competitive sets", "Full power serves"],
      warmup: "Mini-tennis + stretches (10 min)",
      duration: "60-120 min"
    },
    train_light: {
      todayAdvice: "Rally practice at 70%",
      intensityTips: ["Groundstroke technique", "Light serves"],
      warmup: "Extended warm-up",
      duration: "30-45 min",
      cautionNotes: ["Easy on serve"]
    },
    rest: {
      todayAdvice: "Off court today",
      intensityTips: ["Shoulder mobility", "Stretching"],
      warmup: "N/A",
      duration: "Rest day",
      cautionNotes: ["Tennis elbow risk"]
    }
  },
  golf: {
    train_hard: {
      todayAdvice: "Full round or range session",
      intensityTips: ["18 holes walking", "Full swing driver"],
      warmup: "Stretches + putting (15 min)",
      duration: "4 hrs or 60-90 min range"
    },
    train_light: {
      todayAdvice: "Short game focus",
      intensityTips: ["Putting/chipping only", "9 holes with cart"],
      warmup: "Easy stretches",
      duration: "30-60 min",
      cautionNotes: ["Skip driver"]
    },
    rest: {
      todayAdvice: "Skip golf",
      intensityTips: ["Putting mat at home", "Back stretches"],
      warmup: "N/A",
      duration: "Rest day",
      cautionNotes: ["Low back risk"]
    }
  },
  hiking: {
    train_hard: {
      todayAdvice: "Challenging trail OK",
      intensityTips: ["Steep elevation", "Heavy pack OK"],
      warmup: "5-10 min easy walking",
      duration: "3-6 hours"
    },
    train_light: {
      todayAdvice: "Easy trail",
      intensityTips: ["Flat/gentle incline", "Light pack"],
      warmup: "Start slow",
      duration: "1-2 hours",
      cautionNotes: ["Avoid technical trails"]
    },
    rest: {
      todayAdvice: "Short walk only",
      intensityTips: ["Flat neighborhood walk", "20-30 min"],
      warmup: "N/A",
      duration: "Rest day"
    }
  },
  climbing: {
    train_hard: {
      todayAdvice: "Project your limit grades",
      intensityTips: ["Hard projects", "Campus board OK"],
      warmup: "Easy climbs + fingers (20 min)",
      duration: "2-3 hours"
    },
    train_light: {
      todayAdvice: "Volume at easy grades",
      intensityTips: ["2-3 grades below max", "No crimps"],
      warmup: "Extended warm-up (25 min)",
      duration: "1-1.5 hours",
      cautionNotes: ["No limit bouldering"]
    },
    rest: {
      todayAdvice: "Rest those tendons",
      intensityTips: ["Antagonist exercises", "Finger stretches"],
      warmup: "N/A",
      duration: "Rest day",
      cautionNotes: ["Finger injuries when tired"]
    }
  },
  martial_arts: {
    train_hard: {
      todayAdvice: "Full sparring OK",
      intensityTips: ["Live sparring", "Full-speed drills"],
      warmup: "Full warm-up + shadow (15 min)",
      duration: "60-90 min"
    },
    train_light: {
      todayAdvice: "Technical drilling only",
      intensityTips: ["Slow positional work", "Light flow"],
      warmup: "Extended movement prep",
      duration: "45-60 min",
      cautionNotes: ["No hard sparring", "Tap early"]
    },
    rest: {
      todayAdvice: "Off the mats",
      intensityTips: ["Watch instructionals", "Light stretching"],
      warmup: "N/A",
      duration: "Rest day",
      cautionNotes: ["Injuries happen when exhausted"]
    }
  },
  general: {
    train_hard: {
      todayAdvice: "Full intensity",
      intensityTips: ["Push yourself", "High effort"],
      warmup: "10-15 min",
      duration: "60-90 min"
    },
    train_light: {
      todayAdvice: "Light movement",
      intensityTips: ["Easy effort", "Zone 2"],
      warmup: "10 min",
      duration: "30-45 min",
      cautionNotes: ["Don't push hard"]
    },
    rest: {
      todayAdvice: "Rest and recover",
      intensityTips: ["Walking", "Stretching"],
      warmup: "N/A",
      duration: "Rest day"
    }
  }
};
var SPORT_DISPLAY_NAMES = {
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
  general: "General"
};
function calculateBaseScore2(data) {
  let baseScore = data.readinessScore ?? data.sleepScore ?? 50;
  if (data.hrvBalance !== null) {
    const hrvModifier = (data.hrvBalance - 50) * 0.1;
    baseScore = Math.round(baseScore + hrvModifier);
  }
  return Math.max(0, Math.min(100, baseScore));
}
function getHrvTrend(data) {
  if (data.hrvBalance === null) return "unknown";
  if (data.hrvBalance >= 60) return "above_baseline";
  if (data.hrvBalance >= 40) return "normal";
  return "below_baseline";
}
function getHrvTrendText(data) {
  if (data.hrvBalance === null) return "N/A";
  const diff = data.hrvBalance - 50;
  if (diff > 0) return `+${diff}%`;
  if (diff < 0) return `${diff}%`;
  return "baseline";
}
function getScoreStatus(score) {
  if (score === null) return "N/A";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Low";
}
function getSportGuide(sport, verdict) {
  const guide = SPORT_GUIDES[sport][verdict];
  return {
    sport,
    displayName: SPORT_DISPLAY_NAMES[sport],
    ...guide
  };
}
function buildReasoning(data, _verdict) {
  const reasons = [];
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
function getWorkoutDecision(data, sport) {
  const score = calculateBaseScore2(data);
  const hrvTrend = getHrvTrend(data);
  const dataSummary = {
    readiness: {
      value: data.readinessScore,
      status: getScoreStatus(data.readinessScore)
    },
    hrv: {
      value: data.hrvBalance,
      trend: getHrvTrendText(data)
    },
    sleep: {
      value: data.sleepScore,
      hours: void 0
    }
  };
  if (score >= 70 && (hrvTrend === "above_baseline" || hrvTrend === "normal")) {
    return {
      verdict: "train_hard",
      confidence: Math.min(95, score),
      emoji: "\u{1F7E2}",
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
        rpe: "8-10 RPE"
      },
      sportGuide: sport ? getSportGuide(sport, "train_hard") : void 0
    };
  }
  if (score >= 50 || score >= 40 && hrvTrend !== "below_baseline") {
    return {
      verdict: "train_light",
      confidence: Math.min(85, score + 10),
      emoji: "\u{1F7E1}",
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
        rpe: "4-6 RPE"
      },
      sportGuide: sport ? getSportGuide(sport, "train_light") : void 0
    };
  }
  return {
    verdict: "rest",
    confidence: Math.min(90, 100 - score),
    emoji: "\u{1F534}",
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
      rpe: "1-3 RPE"
    },
    sportGuide: sport ? getSportGuide(sport, "rest") : void 0
  };
}
var VALID_SPORTS = [
  "basketball",
  "running",
  "cycling",
  "weightlifting",
  "crossfit",
  "swimming",
  "yoga",
  "soccer",
  "tennis",
  "golf",
  "hiking",
  "climbing",
  "martial_arts"
];
var SPORT_ALIASES = {
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
  judo: "martial_arts"
};
function parseSport(input) {
  if (!input) return void 0;
  const normalized = input.toLowerCase().replace(/[-\s]/g, "_");
  if (SPORT_ALIASES[normalized]) return SPORT_ALIASES[normalized];
  if (VALID_SPORTS.includes(normalized)) return normalized;
  return void 0;
}
function getSportList() {
  return VALID_SPORTS.map((s) => s.replace(/_/g, " "));
}
function formatWorkoutCLI(decision) {
  const lines = [];
  lines.push(`${decision.emoji} ${decision.headline}`);
  lines.push("");
  lines.push(decision.subheadline);
  lines.push("");
  const { dataSummary } = decision;
  lines.push(`Readiness: ${dataSummary.readiness.value ?? "N/A"} (${dataSummary.readiness.status})`);
  lines.push(`HRV: ${dataSummary.hrv.trend}`);
  lines.push(`Sleep: ${dataSummary.sleep.value ?? "N/A"}`);
  lines.push("");
  lines.push("Recommended:");
  decision.recommendations.forEach((rec) => {
    lines.push(`  - ${rec}`);
  });
  if (decision.avoidList.length > 0) {
    lines.push("");
    lines.push("Avoid:");
    decision.avoidList.forEach((item) => {
      lines.push(`  - ${item}`);
    });
  }
  lines.push("");
  lines.push(`Risk: ${decision.recoveryRisk}`);
  lines.push(`Tomorrow: ${decision.tomorrowOutlook}`);
  return lines.join("\n");
}
function formatWorkoutJSON(decision) {
  return JSON.stringify(decision, null, 2);
}
function getVerdictEmoji2(verdict) {
  const emojis = {
    train_hard: "\u{1F7E2}",
    train_light: "\u{1F7E1}",
    rest: "\u{1F534}"
  };
  return emojis[verdict];
}
function getVerdictColor2(verdict) {
  const colors = {
    train_hard: "#10B981",
    train_light: "#F59E0B",
    rest: "#EF4444"
  };
  return colors[verdict];
}

// src/drink.ts
function getScoreStatus2(score) {
  if (score === null) return "N/A";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Low";
}
function getHrvTrendText2(hrvBalance) {
  if (hrvBalance === null) return "N/A";
  const diff = hrvBalance - 50;
  if (diff > 0) return `+${diff}%`;
  if (diff < 0) return `${diff}%`;
  return "baseline";
}
function getBaselineDeviation(hrvBalance) {
  if (hrvBalance === null) return 0;
  return hrvBalance - 50;
}
function getDrinkDecision(data, history) {
  const baselineDeviation = getBaselineDeviation(data.hrvBalance);
  const sleepScore = data.sleepScore ?? 50;
  const readinessScore = data.readinessScore ?? 50;
  let baseLimit = 3;
  const reasoning = [];
  if (baselineDeviation < -15) {
    baseLimit -= 1;
    reasoning.push(`HRV ${baselineDeviation}% below baseline - limit reduced`);
  } else if (baselineDeviation >= 10) {
    reasoning.push(`HRV above baseline - body is recovered`);
  } else {
    reasoning.push(`HRV at baseline`);
  }
  if (sleepScore < 60) {
    baseLimit -= 1;
    reasoning.push(`Sleep score ${sleepScore} - poor recovery`);
  } else if (sleepScore < 70) {
    reasoning.push(`Sleep score ${sleepScore} - moderate`);
  } else {
    reasoning.push(`Sleep score ${sleepScore} - adequate`);
  }
  if (readinessScore < 50) {
    baseLimit -= 1;
    reasoning.push(`Readiness ${readinessScore} - body stressed`);
  } else if (readinessScore >= 70) {
    reasoning.push(`Readiness ${readinessScore} - good condition`);
  }
  if (history && history.logs.length > 0) {
    const recentHeavy = history.logs.some((log) => {
      const daysAgo = Math.floor(
        (Date.now() - log.timestamp.getTime()) / (1e3 * 60 * 60 * 24)
      );
      return log.amount >= 4 && daysAgo < 3;
    });
    if (recentHeavy) {
      baseLimit -= 1;
      reasoning.push(`Recent heavy drinking - still recovering`);
    }
  }
  baseLimit = Math.max(1, baseLimit);
  const impacts = [];
  for (let drinks = 1; drinks <= 5; drinks++) {
    let hrvDrop;
    let recoveryTime;
    let fatigue;
    const conditionMultiplier = baselineDeviation < -10 ? 1.3 : baselineDeviation > 10 ? 0.8 : 1;
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
  const tips = [];
  tips.push("Alternate with water between drinks");
  if (sleepScore < 70) {
    tips.push("Sleep deficit makes alcohol hit harder");
  }
  if (baselineDeviation < -10) {
    tips.push("Your body is already stressed - go easy");
  }
  tips.push("Eat before/during drinking to slow absorption");
  let verdict;
  let emoji;
  let headline;
  let subheadline;
  if (baseLimit >= 3) {
    verdict = "green";
    emoji = "\u{1F7E2}";
    headline = "good night to drink";
    subheadline = "your body can handle moderate drinking tonight";
  } else if (baseLimit >= 2) {
    verdict = "yellow";
    emoji = "\u{1F7E1}";
    headline = "light drinks only";
    subheadline = "your body needs some recovery - keep it light";
  } else {
    verdict = "red";
    emoji = "\u{1F534}";
    headline = "maybe skip it";
    subheadline = "your body's already stressed - not a great night for drinking";
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
        status: getScoreStatus2(data.readinessScore)
      },
      hrv: {
        value: data.hrvBalance,
        trend: getHrvTrendText2(data.hrvBalance)
      },
      sleep: {
        value: data.sleepScore
      }
    },
    reasoning
  };
}
function getSocialStrategy(decision) {
  const { greenLimit, yellowLimit } = decision;
  const tips = [
    `Pace yourself - first ${greenLimit} drinks slowly`,
    `After drink ${greenLimit}, switch to soft drinks or water`,
    "Keep eating throughout",
    "Leave before the late rounds"
  ];
  if (decision.verdict === "red") {
    tips.unshift("Consider being the designated driver tonight");
  }
  return {
    headline: "Social Event Strategy",
    limit: yellowLimit,
    tips,
    reminderIntervals: [30, 60]
    // reminder every 30 or 60 minutes
  };
}
function calculateDrinkHistory(logs) {
  const now = /* @__PURE__ */ new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
  const recentLogs = logs.filter((log) => log.timestamp >= thirtyDaysAgo);
  const sessionsPerWeek = recentLogs.length / 4.3;
  const totalDrinks = recentLogs.reduce((sum, log) => sum + log.amount, 0);
  const avgPerSession = recentLogs.length > 0 ? totalDrinks / recentLogs.length : 0;
  const patternMap = /* @__PURE__ */ new Map();
  recentLogs.forEach((log) => {
    const bucket = Math.min(log.amount, 5);
    const existing = patternMap.get(bucket) || {
      count: 0,
      hrvDropSum: 0,
      recoverySum: 0
    };
    const estimatedHrvDrop = bucket * 5 + Math.random() * 5;
    const estimatedRecovery = bucket <= 2 ? 0.5 : bucket <= 4 ? 1 : 2;
    patternMap.set(bucket, {
      count: existing.count + 1,
      hrvDropSum: existing.hrvDropSum + estimatedHrvDrop,
      recoverySum: existing.recoverySum + estimatedRecovery
    });
  });
  const patterns = Array.from(patternMap.entries()).map(([drinks, data]) => ({
    drinks,
    avgHrvDrop: Math.round(data.hrvDropSum / data.count),
    avgRecoveryDays: Math.round(data.recoverySum / data.count * 10) / 10
  })).sort((a, b) => a.drinks - b.drinks);
  let personalSafeLimit;
  if (patterns.length >= 3) {
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
    patterns
  };
}

// src/why.ts
var CATEGORY_KEYWORDS = {
  mood: ["mood", "\uAE30\uBD84", "\uC6B0\uC6B8", "depressed", "sad", "anxious", "\uBD88\uC548", "\uC9DC\uC99D", "irritable"],
  energy: ["energy", "\uC5D0\uB108\uC9C0", "\uD53C\uACE4", "tired", "exhausted", "fatigue", "\uC878\uB824", "sleepy"],
  focus: ["focus", "\uC9D1\uC911", "concentrate", "brain fog", "\uBA38\uB9AC", "\uC0B0\uB9CC", "distracted"],
  willpower: ["willpower", "\uC758\uC9C0", "motivation", "\uB3D9\uAE30", "lazy", "\uAC8C\uC73C\uB978", "\uBBF8\uB8E8", "procrastinate"],
  general: []
};
var CATEGORY_EXPLANATIONS = {
  mood: {
    physiological: "HRV drop indicates autonomic nervous system imbalance.\nThis directly affects your mood regulation ability.\nFeeling down or irritable may be a reflection of your body state.",
    mixed: "Your body state is contributing to your mood,\nbut external factors may also be involved.",
    psychological: "Your biometrics look stable.\nYour mood may be influenced by external circumstances or thoughts."
  },
  energy: {
    physiological: `Sleep deficit + HRV drop = cellular-level fatigue.
You can't "willpower" your way through this.
Your body simply needs rest.`,
    mixed: "Your body is somewhat fatigued,\nbut caffeine or stress might be masking or amplifying it.",
    psychological: "Your body metrics look fine.\nYour tiredness might be mental fatigue or boredom."
  },
  focus: {
    physiological: "REM sleep deficit directly impacts memory and concentration.\nHRV drop correlates with reduced prefrontal cortex function.\nYour brain is running on low fuel.",
    mixed: "Your body is partially recovered,\nbut deep focus work may still be challenging.",
    psychological: "Your body is ready for focus work.\nDistractions may be environmental or task-related."
  },
  willpower: {
    physiological: `Willpower depends on prefrontal cortex glucose consumption.
Sleep deficit + HRV drop = prefrontal function decline.
"I'm lazy" \u2192 Actually "My brain is out of fuel."`,
    mixed: "Your physiology is partly limiting your willpower,\nbut habits and environment also play a role.",
    psychological: "Your body has energy available.\nConsider whether it's about habits, interest, or task clarity."
  },
  general: {
    physiological: "Your biometrics indicate your body is under stress.\nThis affects energy, mood, focus, and decision-making.\nWhat you're feeling is a physical response, not a mental weakness.",
    mixed: "Your body is somewhat stressed,\nand other factors may also be contributing.",
    psychological: "Your biometrics look good.\nWhat you're experiencing may be situational or psychological."
  }
};
var MIND_BODY_STATEMENTS = {
  physiological: "This is NOT laziness, lack of discipline, or a character flaw.",
  mixed: "Your physiology is contributing, but other factors may be involved too.",
  psychological: "Your biometrics look good. This might be situational or psychological."
};
function getRecommendations(verdict, category) {
  const base = {
    physiological: [
      "Routine tasks only today",
      "Consider a 20min power nap before 2pm",
      "Early bedtime tonight",
      "Postpone important decisions if possible"
    ],
    mixed: [
      "Be selective with demanding tasks",
      "Take regular breaks",
      "Monitor your energy levels",
      "Prioritize sleep tonight"
    ],
    psychological: [
      "Your body can handle challenging work",
      "Consider if environment needs adjustment",
      "Break tasks into smaller pieces",
      "Check if task clarity is the issue"
    ]
  };
  const categorySpecific = {
    mood: {
      physiological: ["Light exercise or walk may help", "Avoid difficult conversations today"],
      mixed: ["Journaling might help sort thoughts"],
      psychological: ["Talk to someone you trust"]
    },
    energy: {
      physiological: ["No caffeine after 2pm", "10min walk every 2 hours"],
      mixed: ["Moderate caffeine OK"],
      psychological: ["Change of scenery might help"]
    },
    focus: {
      physiological: ["Use Pomodoro with longer breaks", "No multitasking today"],
      mixed: ["Block distractions", "Single-task mode"],
      psychological: ["Deep work sessions OK", "Tackle hardest task first"]
    },
    willpower: {
      physiological: ["Remove decisions - set defaults", "Use environment design"],
      mixed: ["Commit to just 5 minutes", "Reward small wins"],
      psychological: ["Check task clarity", "Reconnect with purpose"]
    }
  };
  const recommendations = [...base[verdict]];
  const specific = categorySpecific[category]?.[verdict];
  if (specific) {
    recommendations.unshift(...specific);
  }
  return recommendations.slice(0, 4);
}
function getRisk(verdict) {
  const risks = {
    physiological: "Pushing through risks poor decisions + 2-3 day recovery debt",
    mixed: "Overexertion may extend recovery time",
    psychological: "Low risk from body perspective - mental strategies may help more"
  };
  return risks[verdict];
}
function getScoreStatus3(score) {
  if (score === null) return "N/A";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Below baseline";
  return "Low";
}
function getHrvTrend2(hrvBalance) {
  if (hrvBalance === null) return "N/A";
  const diff = hrvBalance - 50;
  if (diff >= 10) return `+${diff}% above baseline`;
  if (diff <= -10) return `${diff}% below baseline`;
  return "At baseline";
}
function calculateObjectiveScore(data) {
  const readiness = data.readinessScore ?? 50;
  return Math.round(readiness / 10);
}
function calculateBaselineGap(readinessScore) {
  if (readinessScore === null) return 0;
  return readinessScore - 70;
}
function calculatePhysiologicalScore(data) {
  const readinessGap = Math.abs(calculateBaselineGap(data.readinessScore));
  const hrvDeviation = data.hrvBalance ? Math.abs(data.hrvBalance - 50) : 0;
  const sleepGap = data.sleepScore ? Math.max(0, 70 - data.sleepScore) : 0;
  return readinessGap * 0.4 + hrvDeviation * 0.4 + sleepGap * 0.2;
}
function parseWhyInput(text) {
  const input = text.replace(/^\/why\s*/i, "").trim();
  const scoreMatch = input.match(/\((\d+)\)$/) || input.match(/\b(\d+)$/);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : void 0;
  let category;
  const lowerInput = input.toLowerCase();
  for (const [cat, keywords2] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === "general") continue;
    if (keywords2.some((k) => lowerInput.includes(k))) {
      category = cat;
      break;
    }
  }
  const keywords = input.replace(/\(\d+\)$/, "").replace(/\d+$/, "").split(/\s+/).filter((w) => w.length > 1);
  return {
    category,
    subjectiveScore: score && score >= 1 && score <= 10 ? score : void 0,
    keywords,
    rawText: input
  };
}
function analyzeGap(subjectiveScore, data) {
  const objectiveScore = calculateObjectiveScore(data);
  const diff = subjectiveScore - objectiveScore;
  let direction;
  let explanation;
  if (Math.abs(diff) <= 2) {
    direction = "aligned";
    explanation = "Your feeling matches your body state.";
  } else if (diff > 2) {
    direction = "body-worse";
    explanation = "You feel better than your body metrics suggest.\nWatch for energy crash later today.";
  } else {
    direction = "mind-worse";
    explanation = "Your body looks fine.\nThis might be situational or psychological.";
  }
  return {
    direction,
    subjectiveScore,
    objectiveScore,
    explanation
  };
}
function getWhyDecision(data, userInput) {
  const category = userInput?.category || "general";
  const physiologicalScore = calculatePhysiologicalScore(data);
  let verdict;
  if (physiologicalScore > 15) {
    verdict = "physiological";
  } else if (physiologicalScore > 8) {
    verdict = "mixed";
  } else {
    verdict = "psychological";
  }
  let gapAnalysis;
  if (userInput?.subjectiveScore) {
    gapAnalysis = analyzeGap(userInput.subjectiveScore, data);
    if (gapAnalysis.direction === "body-worse" && verdict === "psychological") {
      verdict = "mixed";
    } else if (gapAnalysis.direction === "mind-worse" && verdict === "physiological") {
      verdict = "mixed";
    }
  }
  let emoji;
  let headline;
  let subheadline;
  if (gapAnalysis) {
    switch (gapAnalysis.direction) {
      case "aligned":
        emoji = verdict === "physiological" ? "\u{1F9E0}" : "\u2705";
        headline = verdict === "physiological" ? "IT'S YOUR BODY, NOT YOUR MIND" : "YOU'RE IN SYNC";
        subheadline = verdict === "physiological" ? "Your feeling matches your body - this fatigue is real." : "Your feeling matches your body state.";
        break;
      case "body-worse":
        emoji = "\u26A0\uFE0F";
        headline = "BODY WORSE THAN YOU FEEL";
        subheadline = "You feel okay, but your body is stressed.";
        break;
      case "mind-worse":
        emoji = "\u{1F914}";
        headline = "YOUR BODY IS FINE";
        subheadline = "Your metrics look good - this might be mental.";
        break;
    }
  } else {
    switch (verdict) {
      case "physiological":
        emoji = "\u{1F9E0}";
        headline = "IT'S YOUR BODY, NOT YOUR MIND";
        subheadline = "What you're feeling is physiological, not psychological.";
        break;
      case "mixed":
        emoji = "\u{1F504}";
        headline = "BODY + MIND BOTH PLAYING A ROLE";
        subheadline = "Your physiology is a factor, but not the whole story.";
        break;
      case "psychological":
        emoji = "\u2705";
        headline = "YOUR BODY IS READY";
        subheadline = "Your biometrics look good today.";
        break;
    }
  }
  const reasoning = [];
  if (data.readinessScore !== null) {
    const gap = calculateBaselineGap(data.readinessScore);
    if (gap < -10) {
      reasoning.push(`Readiness ${data.readinessScore} - below baseline`);
    } else if (gap > 10) {
      reasoning.push(`Readiness ${data.readinessScore} - above baseline`);
    } else {
      reasoning.push(`Readiness ${data.readinessScore} - at baseline`);
    }
  }
  if (data.hrvBalance !== null) {
    const hrvDiff = data.hrvBalance - 50;
    if (hrvDiff < -10) {
      reasoning.push(`HRV ${hrvDiff}% below baseline - nervous system stressed`);
    } else if (hrvDiff > 10) {
      reasoning.push(`HRV +${hrvDiff}% above baseline - well recovered`);
    } else {
      reasoning.push(`HRV at baseline`);
    }
  }
  if (data.sleepScore !== null) {
    if (data.sleepScore < 60) {
      reasoning.push(`Sleep score ${data.sleepScore} - poor recovery`);
    } else if (data.sleepScore < 70) {
      reasoning.push(`Sleep score ${data.sleepScore} - moderate`);
    } else {
      reasoning.push(`Sleep score ${data.sleepScore} - good`);
    }
  }
  return {
    verdict,
    emoji,
    headline,
    subheadline,
    gapAnalysis,
    explanation: CATEGORY_EXPLANATIONS[category][verdict],
    mindBodyStatement: MIND_BODY_STATEMENTS[verdict],
    dataSummary: {
      readiness: {
        value: data.readinessScore,
        status: getScoreStatus3(data.readinessScore)
      },
      hrv: {
        value: data.hrvBalance,
        trend: getHrvTrend2(data.hrvBalance)
      },
      sleep: {
        value: data.sleepScore
      }
    },
    recommendations: getRecommendations(verdict, category),
    risk: getRisk(verdict),
    reasoning
  };
}

// src/mood.ts
var RECOVERY_THRESHOLD_LOW = 60;
var RECOVERY_THRESHOLD_HIGH = 70;
var MOOD_THRESHOLD_LOW = 3;
var MOOD_THRESHOLD_HIGH = 4;
var SCENARIO_DATA = {
  A: {
    emoji: "\u{1F9E0}",
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
      "Early bedtime tonight"
    ],
    isPhysiological: true
  },
  B: {
    emoji: "\u{1F914}",
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
      "Light exercise could boost mood"
    ],
    isPhysiological: false
  },
  C: {
    emoji: "\u26A0\uFE0F",
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
      "Prioritize sleep tonight"
    ],
    isPhysiological: true
  },
  D: {
    emoji: "\u{1F680}",
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
      "Enjoy the momentum!"
    ],
    isPhysiological: false
  }
};
function getRecoveryStatus(readiness) {
  if (readiness === null) return "moderate";
  if (readiness < RECOVERY_THRESHOLD_LOW) return "low";
  if (readiness >= RECOVERY_THRESHOLD_HIGH) return "high";
  return "moderate";
}
function getMoodStatus(score) {
  if (score < MOOD_THRESHOLD_LOW) return "low";
  if (score >= MOOD_THRESHOLD_HIGH) return "high";
  return "moderate";
}
function determineScenario(recoveryStatus, moodStatus) {
  const isRecoveryLow = recoveryStatus === "low";
  const isMoodLow = moodStatus === "low";
  if (isRecoveryLow && isMoodLow) return "A";
  if (!isRecoveryLow && isMoodLow) return "B";
  if (isRecoveryLow && !isMoodLow) return "C";
  return "D";
}
function getMoodAttribution(data, moodScore) {
  const recoveryStatus = getRecoveryStatus(data.readinessScore);
  const moodStatus = getMoodStatus(moodScore);
  const scenario = determineScenario(recoveryStatus, moodStatus);
  return {
    scenario,
    ...SCENARIO_DATA[scenario]
  };
}
function calculatePearsonCorrelation(x, y) {
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
function calculateMoodInsight(moodEntries, recoveryScores) {
  const dataPoints = Math.min(moodEntries.length, recoveryScores.length);
  if (dataPoints < 5) {
    return {
      correlation: null,
      dataPoints,
      trend: "insufficient_data",
      summary: `Not enough data yet (${dataPoints}/5 days needed)`,
      insight: "Log your mood for 5+ days to see your personal patterns."
    };
  }
  const moodScores = moodEntries.slice(-dataPoints).map((e) => e.score);
  const recovery = recoveryScores.slice(-dataPoints);
  const correlation = calculatePearsonCorrelation(recovery, moodScores);
  let trend;
  let summary;
  let insight;
  if (correlation === null) {
    trend = "insufficient_data";
    summary = "Unable to calculate correlation";
    insight = "More varied data points needed.";
  } else if (correlation > 0.5) {
    trend = "positive";
    summary = `Strong correlation (r=${correlation.toFixed(2)})`;
    insight = "Your mood strongly tracks your recovery. When tired, expect lower mood - it's physiological, not personal.";
  } else if (correlation > 0.2) {
    trend = "positive";
    summary = `Moderate correlation (r=${correlation.toFixed(2)})`;
    insight = "Your mood is somewhat linked to recovery. Physical state matters, but other factors too.";
  } else if (correlation < -0.2) {
    trend = "negative";
    summary = `Inverse correlation (r=${correlation.toFixed(2)})`;
    insight = "Interesting: your mood tends to move opposite to recovery. External factors may dominate.";
  } else {
    trend = "neutral";
    summary = `Weak correlation (r=${correlation.toFixed(2)})`;
    insight = "Your mood seems independent of physical recovery. External factors likely play a bigger role.";
  }
  return {
    correlation,
    dataPoints,
    trend,
    summary,
    insight
  };
}
function getMoodDecision(data, moodScore, moodHistory, recoveryHistory) {
  const attribution = getMoodAttribution(data, moodScore);
  const recoveryStatus = getRecoveryStatus(data.readinessScore);
  const moodStatus = getMoodStatus(moodScore);
  let moodInsight;
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
      moodStatus
    },
    moodHistory: moodInsight
  };
}

// src/cost.ts
var ALCOHOL_PER_DRINK = {
  recoveryDrop: 4.2,
  hrvDropPercent: 4.5,
  // ~2.4ms on 53ms avg = ~4.5%
  rhrIncrease: 1.3
};
var ALCOHOL_DECAY = [1, 0.29, 0.19, 0.08];
var CAFFEINE_PER_CUP = {
  sleepScoreDrop: 4,
  // estimated per cup
  hrvDropPercent: 1.5
};
var CAFFEINE_HALF_LIFE_HOURS = 6;
var SUBSTANCE_INFO = {
  beer: { category: "alcohol", standardUnits: 1, emoji: "\u{1F37A}", label: "beer" },
  wine: { category: "alcohol", standardUnits: 1.5, emoji: "\u{1F377}", label: "wine" },
  spirits: { category: "alcohol", standardUnits: 1.5, emoji: "\u{1F943}", label: "spirits" },
  coffee: { category: "caffeine", standardUnits: 1, emoji: "\u2615", label: "coffee" },
  tea: { category: "caffeine", standardUnits: 0.5, emoji: "\u{1F375}", label: "tea" }
};
function getScoreStatus4(score) {
  if (score === null) return "N/A";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Low";
}
function getHrvTrendText3(hrvBalance) {
  if (hrvBalance === null) return "N/A";
  const diff = hrvBalance - 50;
  if (diff > 0) return `+${diff}%`;
  if (diff < 0) return `${diff}%`;
  return "baseline";
}
function getConditionMultiplier(hrvBalance) {
  if (hrvBalance === null) return 1;
  const deviation = hrvBalance - 50;
  if (deviation < -15) return 1.4;
  if (deviation < -10) return 1.3;
  if (deviation < 0) return 1.1;
  if (deviation > 10) return 0.8;
  return 1;
}
function getWorkoutCapacity(recoveryDrop) {
  if (recoveryDrop >= 20) return "none";
  if (recoveryDrop >= 12) return "light only";
  if (recoveryDrop >= 6) return "moderate";
  return "full";
}
function parseSubstance(input) {
  const normalized = input.toLowerCase().trim();
  const aliases = {
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
    matcha: "tea"
  };
  return aliases[normalized] || null;
}
function calculateAlcoholCost(data, substance, amount) {
  const info = SUBSTANCE_INFO[substance];
  const standardDrinks = amount * info.standardUnits;
  const multiplier = getConditionMultiplier(data.hrvBalance);
  const timeline = [];
  let totalRecoveryDays = 0;
  for (let day = 0; day < ALCOHOL_DECAY.length; day++) {
    const decayFactor = ALCOHOL_DECAY[day];
    const hrvChange = -Math.round(
      ALCOHOL_PER_DRINK.hrvDropPercent * standardDrinks * multiplier * decayFactor
    );
    const recoveryDrop = Math.round(
      ALCOHOL_PER_DRINK.recoveryDrop * standardDrinks * multiplier * decayFactor
    );
    if (Math.abs(hrvChange) < 1 && recoveryDrop < 1) break;
    const label = day === 0 ? "tonight" : day === 1 ? "tomorrow" : `day ${day + 1}`;
    timeline.push({
      day,
      label,
      hrvChange,
      recoveryDrop,
      workoutCapacity: getWorkoutCapacity(recoveryDrop)
    });
    if (recoveryDrop >= 6) {
      totalRecoveryDays = day + 1;
    }
  }
  if (totalRecoveryDays === 0 && standardDrinks > 0) {
    totalRecoveryDays = 1;
  }
  let emoji;
  let headline;
  let subheadline;
  const peakDrop = timeline[0]?.recoveryDrop || 0;
  if (peakDrop >= 25) {
    emoji = "\u{1F534}";
    headline = "heavy cost";
    subheadline = `${amount} ${info.label}${amount > 1 ? "s" : ""} will wreck your recovery for ${totalRecoveryDays} days`;
  } else if (peakDrop >= 15) {
    emoji = "\u{1F7E1}";
    headline = "moderate cost";
    subheadline = `${amount} ${info.label}${amount > 1 ? "s" : ""} will cost you ${totalRecoveryDays} day${totalRecoveryDays > 1 ? "s" : ""} of reduced performance`;
  } else {
    emoji = "\u{1F7E2}";
    headline = "low cost";
    subheadline = `${amount} ${info.label}${amount > 1 ? "s" : ""} should be fine - back to normal by tomorrow`;
  }
  const lostWorkoutDays = timeline.filter(
    (d) => d.workoutCapacity === "none" || d.workoutCapacity === "light only"
  ).length;
  const tradeoff = lostWorkoutDays > 0 ? `${amount} ${info.label}${amount > 1 ? "s" : ""} = ${lostWorkoutDays} lost workout day${lostWorkoutDays > 1 ? "s" : ""}` : `${amount} ${info.label}${amount > 1 ? "s" : ""} = minimal workout impact`;
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
        status: getScoreStatus4(data.readinessScore)
      },
      hrv: {
        value: data.hrvBalance,
        trend: getHrvTrendText3(data.hrvBalance)
      },
      sleep: {
        value: data.sleepScore
      }
    }
  };
}
function calculateCaffeineCost(data, substance, amount) {
  const info = SUBSTANCE_INFO[substance];
  const standardCups = amount * info.standardUnits;
  const hour = (/* @__PURE__ */ new Date()).getHours();
  const hoursUntilSleep = Math.max(0, 22 - hour);
  const halfLives = hoursUntilSleep / CAFFEINE_HALF_LIFE_HOURS;
  const caffeineAtSleep = Math.pow(0.5, halfLives);
  const sleepImpact = Math.round(
    CAFFEINE_PER_CUP.sleepScoreDrop * standardCups * caffeineAtSleep
  );
  const hrvDrop = Math.round(
    CAFFEINE_PER_CUP.hrvDropPercent * standardCups
  );
  const timeline = [];
  if (sleepImpact >= 1 || hrvDrop >= 1) {
    timeline.push({
      day: 0,
      label: "tonight",
      hrvChange: -hrvDrop,
      recoveryDrop: sleepImpact,
      workoutCapacity: "full",
      // caffeine doesn't block today's workout
      sleepImpact: sleepImpact > 0 ? `sleep score -${sleepImpact}` : void 0
    });
  }
  if (sleepImpact >= 4) {
    const tomorrowDrop = Math.round(sleepImpact * 0.7);
    timeline.push({
      day: 1,
      label: "tomorrow",
      hrvChange: -Math.round(hrvDrop * 0.3),
      recoveryDrop: tomorrowDrop,
      workoutCapacity: getWorkoutCapacity(tomorrowDrop)
    });
  }
  const totalRecoveryDays = timeline.length > 0 && sleepImpact >= 4 ? 1 : 0;
  const cutoffHour = 22 - Math.ceil(CAFFEINE_HALF_LIFE_HOURS * 2);
  const cutoffTime = cutoffHour <= 12 ? `${cutoffHour}am` : `${cutoffHour - 12}pm`;
  let emoji;
  let headline;
  let subheadline;
  if (sleepImpact >= 8) {
    emoji = "\u{1F534}";
    headline = "bad timing";
    subheadline = `${amount} ${info.label}${amount > 1 ? "s" : ""} now will cost you -${sleepImpact} sleep score tonight`;
  } else if (sleepImpact >= 4) {
    emoji = "\u{1F7E1}";
    headline = "some cost";
    subheadline = `${amount} ${info.label}${amount > 1 ? "s" : ""} now will impact tonight's sleep by -${sleepImpact}`;
  } else {
    emoji = "\u{1F7E2}";
    headline = "you're fine";
    subheadline = `${amount} ${info.label}${amount > 1 ? "s" : ""} at this time has minimal sleep impact`;
  }
  const tradeoff = sleepImpact >= 4 ? `cutoff time: ${cutoffTime} (based on 10pm sleep)` : `${amount} ${info.label}${amount > 1 ? "s" : ""} = no significant sleep impact`;
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
        status: getScoreStatus4(data.readinessScore)
      },
      hrv: {
        value: data.hrvBalance,
        trend: getHrvTrendText3(data.hrvBalance)
      },
      sleep: {
        value: data.sleepScore
      }
    }
  };
}
function getRecoveryCost(data, substance, amount) {
  const info = SUBSTANCE_INFO[substance];
  if (info.category === "alcohol") {
    return calculateAlcoholCost(data, substance, amount);
  }
  return calculateCaffeineCost(data, substance, amount);
}
function getSubstanceList() {
  return Object.keys(SUBSTANCE_INFO);
}
function getSubstanceCategory(substance) {
  return SUBSTANCE_INFO[substance].category;
}

// src/demo.ts
var DEMO_DATA = {
  sleepScore: 72,
  readinessScore: 65,
  hrvBalance: 45,
  restingHR: 58,
  date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
};
function getDemoData() {
  return {
    ...DEMO_DATA,
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  };
}
function getRandomDemoData() {
  const scenarios = [
    { sleepScore: 88, readinessScore: 85, hrvBalance: 65, restingHR: 52 },
    // Excellent
    { sleepScore: 75, readinessScore: 72, hrvBalance: 55, restingHR: 55 },
    // Good
    { sleepScore: 65, readinessScore: 58, hrvBalance: 45, restingHR: 58 },
    // Moderate
    { sleepScore: 55, readinessScore: 42, hrvBalance: 35, restingHR: 62 },
    // Poor
    { sleepScore: 45, readinessScore: 28, hrvBalance: 25, restingHR: 68 }
    // Very poor
  ];
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  return {
    ...scenario,
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  };
}
function getDemoScenario(index) {
  const scenarios = [
    { sleepScore: 88, readinessScore: 85, hrvBalance: 65, restingHR: 52 },
    { sleepScore: 75, readinessScore: 72, hrvBalance: 55, restingHR: 55 },
    { sleepScore: 65, readinessScore: 58, hrvBalance: 45, restingHR: 58 },
    { sleepScore: 55, readinessScore: 42, hrvBalance: 35, restingHR: 62 },
    { sleepScore: 45, readinessScore: 28, hrvBalance: 25, restingHR: 68 }
  ];
  const safeIndex = Math.max(0, Math.min(4, index));
  return {
    ...scenarios[safeIndex],
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OuraProvider,
  WhoopProvider,
  analyzeGap,
  calculateDecisionReadiness,
  calculateDrinkHistory,
  calculateMoodInsight,
  calculatePearsonCorrelation,
  formatWorkoutCLI,
  formatWorkoutJSON,
  getDemoData,
  getDemoScenario,
  getDrinkDecision,
  getMoodAttribution,
  getMoodDecision,
  getRandomDemoData,
  getRecoveryCost,
  getSocialStrategy,
  getSportGuide,
  getSportList,
  getStatusColor,
  getStatusEmoji,
  getSubstanceCategory,
  getSubstanceList,
  getVerdictColor,
  getVerdictEmoji,
  getWhyDecision,
  getWorkoutDecision,
  getWorkoutVerdictColor,
  getWorkoutVerdictEmoji,
  parseSport,
  parseSubstance,
  parseWhyInput,
  quickCheck
});
