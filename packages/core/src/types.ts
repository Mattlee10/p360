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
// Oura API Types (re-exported from providers for backward compatibility)
// ============================================

export type {
  OuraDailySleep,
  OuraDailyReadiness,
  OuraSleepData,
  OuraReadinessData,
} from "./providers/oura.types";
