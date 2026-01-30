// ============================================
// Biometric Data Types
// ============================================

export interface BiometricData {
  sleepScore: number | null;
  readinessScore: number | null;
  hrvBalance: number | null;
  restingHR: number | null;
  date: string;
  // Optional: baseline comparison
  hrvBaseline?: number | null;
  sleepBaseline?: number | null;
}

// ============================================
// Decision Context Types
// ============================================

export type DecisionCategory =
  | "email"           // Sending important emails
  | "meeting"         // Scheduling/attending meetings
  | "financial"       // Financial decisions, purchases
  | "workout"         // Physical training decisions
  | "creative"        // Creative work, problem-solving
  | "negotiation"     // Negotiations, difficult conversations
  | "general";        // General decision-making

export type DecisionImportance = "low" | "medium" | "high" | "critical";

export interface DecisionContext {
  category: DecisionCategory;
  importance: DecisionImportance;
  description?: string;
}

// ============================================
// Readiness Status
// ============================================

export type ReadinessStatus = "excellent" | "good" | "caution" | "poor";

// ============================================
// Actionable Output Types
// ============================================

export type ActionVerdict = "proceed" | "proceed_with_caution" | "wait" | "stop";

export interface ActionableInsight {
  // Core verdict
  verdict: ActionVerdict;

  // Primary message (short, actionable)
  headline: string;

  // Specific action to take
  action: string;

  // Why this recommendation (data-backed)
  rationale: string;

  // When to revisit (if waiting)
  retryIn?: string;

  // Alternative action if they must proceed
  fallback?: string;

  // Impact of ignoring this advice
  risk?: string;
}

export interface DecisionReadiness {
  // Numerical score (0-100)
  score: number;

  // Status category
  status: ReadinessStatus;

  // Generic message (for backward compatibility)
  message: string;

  // Generic recommendation
  recommendation: string;

  // Detailed metrics
  metrics: {
    sleep: { value: number | null; label: string };
    readiness: { value: number | null; label: string };
    hrv: { value: number | null; label: string };
  };

  // NEW: Context-aware actionable insight
  insight: ActionableInsight;
}

// ============================================
// Oura API Types
// ============================================

export interface OuraDailySleep {
  id: string;
  day: string;
  score: number | null;
  timestamp: string;
  contributors: {
    deep_sleep: number | null;
    efficiency: number | null;
    latency: number | null;
    rem_sleep: number | null;
    restfulness: number | null;
    timing: number | null;
    total_sleep: number | null;
  };
}

export interface OuraDailyReadiness {
  id: string;
  day: string;
  score: number | null;
  timestamp: string;
  contributors: {
    activity_balance: number | null;
    body_temperature: number | null;
    hrv_balance: number | null;
    previous_day_activity: number | null;
    previous_night: number | null;
    recovery_index: number | null;
    resting_heart_rate: number | null;
    sleep_balance: number | null;
  };
}

export interface OuraSleepData {
  data: OuraDailySleep[];
}

export interface OuraReadinessData {
  data: OuraDailyReadiness[];
}
