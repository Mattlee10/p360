import {
  BiometricData,
  DecisionContext,
  DecisionReadiness,
  ReadinessStatus,
  ActionableInsight,
  ActionVerdict,
  DecisionCategory,
  DecisionImportance,
} from "./types";

// ============================================
// Score Calculation
// ============================================

/**
 * Calculate base decision readiness score from biometrics
 */
function calculateBaseScore(data: BiometricData): number {
  // Primary: Oura Readiness Score
  // Fallback: Sleep Score
  let baseScore = data.readinessScore ?? data.sleepScore ?? 50;

  // HRV Balance modifier (±5 points)
  if (data.hrvBalance !== null) {
    const hrvModifier = (data.hrvBalance - 50) * 0.1;
    baseScore = Math.round(baseScore + hrvModifier);
  }

  // Clamp between 0-100
  return Math.max(0, Math.min(100, baseScore));
}

function getStatusFromScore(score: number): ReadinessStatus {
  if (score >= 70) return "excellent";
  if (score >= 50) return "good";
  if (score >= 30) return "caution";
  return "poor";
}

// ============================================
// Action Verdict Logic
// ============================================

/**
 * Determine action verdict based on score and context
 */
function getActionVerdict(
  score: number,
  context: DecisionContext
): ActionVerdict {
  const { importance } = context;

  // Score thresholds adjusted by importance
  const thresholds = {
    low: { proceed: 30, caution: 20, wait: 10 },
    medium: { proceed: 50, caution: 35, wait: 20 },
    high: { proceed: 65, caution: 50, wait: 35 },
    critical: { proceed: 75, caution: 60, wait: 45 },
  };

  const t = thresholds[importance];

  if (score >= t.proceed) return "proceed";
  if (score >= t.caution) return "proceed_with_caution";
  if (score >= t.wait) return "wait";
  return "stop";
}

// ============================================
// Insight Generation - The Core P1 Solution
// ============================================

interface InsightTemplate {
  headline: string;
  action: string;
  rationale: string;
  retryIn?: string;
  fallback?: string;
  risk?: string;
}

type CategoryInsights = Record<ActionVerdict, InsightTemplate>;

/**
 * Context-specific insight templates
 * This is where "Data → Action" translation happens
 */
const INSIGHT_TEMPLATES: Record<DecisionCategory, CategoryInsights> = {
  email: {
    proceed: {
      headline: "Clear to send",
      action: "Your state supports clear communication. Send when ready.",
      rationale: "High cognitive clarity and emotional regulation detected.",
    },
    proceed_with_caution: {
      headline: "Review before sending",
      action: "Read your email once more. Check tone and clarity.",
      rationale: "Slightly below optimal state. Minor tone issues possible.",
      fallback: "If urgent, have someone review it first.",
    },
    wait: {
      headline: "Don't send yet",
      action: "Save as draft. Revisit in 2-3 hours.",
      rationale: "Current state increases risk of unclear or emotional messaging.",
      retryIn: "2-3 hours",
      risk: "Sending now: 40% higher chance of regret.",
    },
    stop: {
      headline: "Do not send",
      action: "Close the email. This is not the time.",
      rationale: "Your body signals significant fatigue or stress. Communication errors likely.",
      retryIn: "Tomorrow morning",
      risk: "Sending now: High probability of damaging the relationship.",
      fallback: "If truly urgent, delegate to someone else.",
    },
  },

  meeting: {
    proceed: {
      headline: "Good for meetings",
      action: "You're ready for focused discussions and decisions.",
      rationale: "Cognitive performance and attention span are optimal.",
    },
    proceed_with_caution: {
      headline: "Meetings okay, limit decisions",
      action: "Attend but defer major commitments to a follow-up.",
      rationale: "You can engage, but decision quality may be compromised.",
      fallback: "Take notes, decide later.",
    },
    wait: {
      headline: "Reschedule if possible",
      action: "Move to tomorrow morning if the meeting is important.",
      rationale: "Current state suggests reduced focus and patience.",
      retryIn: "Tomorrow AM",
      risk: "You may agree to things you'll regret.",
    },
    stop: {
      headline: "Cancel or delegate",
      action: "This is not a good time for important meetings.",
      rationale: "High fatigue detected. Performance will suffer.",
      retryIn: "After full recovery",
      fallback: "Send a brief message to reschedule.",
    },
  },

  financial: {
    proceed: {
      headline: "Safe to decide",
      action: "Your judgment is clear. Proceed with financial decisions.",
      rationale: "Impulse control and analytical thinking are optimal.",
    },
    proceed_with_caution: {
      headline: "Decide, but set limits",
      action: "Proceed with planned purchases only. No impulse decisions.",
      rationale: "Slightly elevated risk of emotional spending.",
      fallback: "Wait 24 hours for anything over your set threshold.",
    },
    wait: {
      headline: "Hold off on spending",
      action: "Do not make purchases over $100 today.",
      rationale: "Impulse control is compromised. Regret probability elevated.",
      retryIn: "Tomorrow",
      risk: "Today's 'great deal' may not look so great tomorrow.",
    },
    stop: {
      headline: "No financial decisions today",
      action: "Log off shopping sites. Do not open investment apps.",
      rationale: "Your state strongly correlates with impulsive decisions.",
      retryIn: "After recovery (1-2 days)",
      risk: "Purchases made now have 60% higher return rate.",
    },
  },

  workout: {
    proceed: {
      headline: "Train hard",
      action: "Your body is ready for high-intensity work.",
      rationale: "Recovery is complete. Adaptation potential is high.",
    },
    proceed_with_caution: {
      headline: "Train, but listen to your body",
      action: "Start with 70% intensity. Increase only if feeling good.",
      rationale: "Slightly under-recovered. Risk of injury if pushed too hard.",
      fallback: "Consider mobility work or light cardio instead.",
    },
    wait: {
      headline: "Active recovery only",
      action: "Walking, stretching, or light yoga. No intense training.",
      rationale: "Pushing now risks 3+ days of forced recovery.",
      retryIn: "Tomorrow",
      risk: "Training today: 60% chance of needing extra recovery days.",
    },
    stop: {
      headline: "Rest day",
      action: "No training. Focus on sleep, hydration, and nutrition.",
      rationale: "Your body is demanding recovery. Listen to it.",
      retryIn: "When readiness returns above 50",
      risk: "Training now significantly increases injury and illness risk.",
    },
  },

  creative: {
    proceed: {
      headline: "Creative window open",
      action: "Tackle your hardest creative problems now.",
      rationale: "Cognitive flexibility and focus are elevated.",
    },
    proceed_with_caution: {
      headline: "Creative work okay, not ideal",
      action: "Work on structured tasks. Avoid open-ended brainstorming.",
      rationale: "You can execute, but breakthrough thinking is less likely.",
      fallback: "Do research and preparation instead.",
    },
    wait: {
      headline: "Not the time for creative work",
      action: "Do administrative tasks or take input (reading, watching).",
      rationale: "Creative output quality will be below your standards.",
      retryIn: "After rest or tomorrow morning",
    },
    stop: {
      headline: "Creative work will frustrate you",
      action: "Consume, don't create. Watch, read, rest.",
      rationale: "Low energy + creative work = frustration and poor output.",
      retryIn: "After full recovery",
    },
  },

  negotiation: {
    proceed: {
      headline: "Ready to negotiate",
      action: "Your emotional regulation and clarity support tough conversations.",
      rationale: "Optimal state for assertive yet measured communication.",
    },
    proceed_with_caution: {
      headline: "Negotiate, but stay alert",
      action: "Proceed with planned points. Don't improvise under pressure.",
      rationale: "Slightly reduced patience. Stick to your script.",
      fallback: "Take breaks if tensions rise.",
    },
    wait: {
      headline: "Postpone difficult conversations",
      action: "Reschedule negotiations to a better time.",
      rationale: "Risk of saying things you'll regret is elevated.",
      retryIn: "Tomorrow",
      risk: "Negotiations today: Higher chance of suboptimal outcomes.",
    },
    stop: {
      headline: "Do not engage",
      action: "Avoid all difficult conversations today.",
      rationale: "Emotional regulation is compromised. Conflict likely.",
      retryIn: "After full recovery",
      risk: "High probability of relationship damage.",
      fallback: "If unavoidable, bring a trusted ally for support.",
    },
  },

  general: {
    proceed: {
      headline: "Good state for decisions",
      action: "Your body signals optimal decision-making capacity.",
      rationale: "High readiness score indicates clear thinking.",
    },
    proceed_with_caution: {
      headline: "Proceed carefully",
      action: "Make routine decisions. Hold on bigger ones if possible.",
      rationale: "Below optimal, but functional.",
      fallback: "Sleep on major decisions.",
    },
    wait: {
      headline: "Delay important decisions",
      action: "Handle only urgent matters. Postpone the rest.",
      rationale: "Decision quality is compromised.",
      retryIn: "3-4 hours or tomorrow",
      risk: "Decisions made now have higher regret probability.",
    },
    stop: {
      headline: "Avoid decisions today",
      action: "Maintain status quo. Do not commit to anything new.",
      rationale: "Your body signals significant impairment.",
      retryIn: "After recovery",
      risk: "Major decisions today will likely be regretted.",
    },
  },
};

/**
 * Generate actionable insight based on score and context
 */
function generateInsight(
  score: number,
  context: DecisionContext
): ActionableInsight {
  const verdict = getActionVerdict(score, context);
  const template = INSIGHT_TEMPLATES[context.category][verdict];

  return {
    verdict,
    headline: template.headline,
    action: template.action,
    rationale: template.rationale,
    retryIn: template.retryIn,
    fallback: template.fallback,
    risk: template.risk,
  };
}

// ============================================
// Metric Labels
// ============================================

function getMetricLabel(value: number | null): string {
  if (value === null) return "N/A";
  if (value >= 85) return "Excellent";
  if (value >= 70) return "Good";
  if (value >= 50) return "Fair";
  return "Low";
}

function getHrvLabel(value: number | null): string {
  if (value === null) return "N/A";
  if (value >= 70) return "High";
  if (value >= 40) return "Normal";
  return "Low";
}

function getStatusMessage(status: ReadinessStatus): string {
  const messages: Record<ReadinessStatus, string> = {
    excellent: "Great time for important decisions",
    good: "Good state for most decisions",
    caution: "Consider waiting for big decisions",
    poor: "Not recommended for major decisions",
  };
  return messages[status];
}

function getGenericRecommendation(status: ReadinessStatus): string {
  const recommendations: Record<ReadinessStatus, string> = {
    excellent: "Your body is in optimal state. Perfect time for negotiations, important emails, or strategic planning.",
    good: "You're in a good state for everyday decisions. Proceed with confidence on routine matters.",
    caution: "Your readiness is below optimal. If possible, delay important decisions by a few hours or until tomorrow.",
    poor: "Your body signals suggest fatigue or stress. Avoid making significant commitments. Focus on recovery.",
  };
  return recommendations[status];
}

// ============================================
// Main Export Functions
// ============================================

/**
 * Calculate decision readiness with actionable insights
 *
 * @param data - Biometric data from Oura or other source
 * @param context - Optional decision context for tailored insights
 * @returns DecisionReadiness with score, status, and actionable insight
 */
export function calculateDecisionReadiness(
  data: BiometricData,
  context: DecisionContext = { category: "general", importance: "medium" }
): DecisionReadiness {
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
        label: getMetricLabel(data.sleepScore),
      },
      readiness: {
        value: data.readinessScore,
        label: getMetricLabel(data.readinessScore),
      },
      hrv: {
        value: data.hrvBalance,
        label: getHrvLabel(data.hrvBalance),
      },
    },
    insight,
  };
}

/**
 * Quick check for a specific decision category
 * Returns just the actionable insight without full metrics
 */
export function quickCheck(
  data: BiometricData,
  category: DecisionCategory,
  importance: DecisionImportance = "medium"
): ActionableInsight {
  const score = calculateBaseScore(data);
  return generateInsight(score, { category, importance });
}

/**
 * Get status emoji for display
 */
export function getStatusEmoji(status: ReadinessStatus): string {
  const emojis: Record<ReadinessStatus, string> = {
    excellent: "🟢",
    good: "🔵",
    caution: "🟡",
    poor: "🔴",
  };
  return emojis[status];
}

/**
 * Get verdict emoji for display
 */
export function getVerdictEmoji(verdict: ActionVerdict): string {
  const emojis: Record<ActionVerdict, string> = {
    proceed: "✅",
    proceed_with_caution: "⚠️",
    wait: "⏳",
    stop: "🛑",
  };
  return emojis[verdict];
}

/**
 * Get status color (hex)
 */
export function getStatusColor(status: ReadinessStatus): string {
  const colors: Record<ReadinessStatus, string> = {
    excellent: "#10B981",
    good: "#3B82F6",
    caution: "#F59E0B",
    poor: "#EF4444",
  };
  return colors[status];
}

/**
 * Get verdict color (hex)
 */
export function getVerdictColor(verdict: ActionVerdict): string {
  const colors: Record<ActionVerdict, string> = {
    proceed: "#10B981",
    proceed_with_caution: "#F59E0B",
    wait: "#F59E0B",
    stop: "#EF4444",
  };
  return colors[verdict];
}
