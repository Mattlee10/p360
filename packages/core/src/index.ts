// ============================================
// Types
// ============================================

export type {
  BiometricData,
  DecisionContext,
  DecisionCategory,
  DecisionImportance,
  DecisionReadiness,
  ReadinessStatus,
  ActionableInsight,
  ActionVerdict,
  // Oura types (re-exported for backward compatibility)
  OuraDailySleep,
  OuraDailyReadiness,
  OuraSleepData,
  OuraReadinessData,
} from "./types";

// ============================================
// Providers
// ============================================

export type { BiometricProvider, ProviderType } from "./providers/provider";
export { OuraProvider } from "./providers/oura";
export { WhoopProvider } from "./providers/whoop";
export type {
  WhoopRecovery,
  WhoopSleep,
  WhoopCycle,
  WhoopListResponse,
} from "./providers/whoop.types";

// ============================================
// Algorithm Functions
// ============================================

export {
  calculateDecisionReadiness,
  quickCheck,
  getStatusEmoji,
  getVerdictEmoji,
  getStatusColor,
  getVerdictColor,
} from "./algorithm";

// ============================================
// Domain Logic (drink, workout, why) — REMOVED
// Claude-first architecture: Claude handles all domain reasoning
// See advisor.ts buildSystemPrompt() for domain guidance
// ============================================

// ============================================
// Mood (P17 - Recovery → Mood Attribution)
// ============================================

export type {
  MoodEntry,
  MoodScenario,
  MoodAttribution,
  MoodInsight,
  MoodDecision,
} from "./mood";

export {
  getMoodAttribution,
  getMoodDecision,
  calculateMoodInsight,
  calculatePearsonCorrelation,
} from "./mood";

// ============================================
// Cost (P27 - Recovery Cost Simulator)
// ============================================

export type {
  SubstanceType,
  SubstanceCategory,
  DayCost,
  RecoveryCost,
} from "./cost";

export {
  getRecoveryCost,
  parseSubstance,
  getSubstanceList,
  getSubstanceCategory,
} from "./cost";

// ============================================
// Advisor (AI-powered contextual nudges)
// ============================================

export type {
  NudgeOption,
  NudgeResponse,
  AdvisorContext,
} from "./advisor";

export {
  buildAdvisorContext,
  buildSystemPrompt,
  matchRoutes,
} from "./advisor";

// ============================================
// Causality Engine (Phase 1: types + collectEvent pipeline only)
// Phase 2에서 개별 분석 함수 활성화 예정
// ============================================

export type {
  CausalityProfile,
  EventStore,
} from "./causality";

// Phase 2 pipeline: apps cron job에서 사용 중
export { resolveOutcomes } from "./causality-collector";
export { buildCausalityProfile } from "./causality-analyzer";

// Phase 2: 개별 분석/수집 함수 (현재 앱에서 미사용)
// export type { CausalityDomain, CausalityAction, ... } from "./causality";
// export { InMemoryEventStore } from "./causality-collector";
// export { linearRegression, analyzeAlcoholSensitivity, ... } from "./causality-analyzer";
// export type { RegressionResult } from "./causality-analyzer";

// ============================================
// Ask Gateway (unified ask pipeline)
// ============================================

export type {
  AskRequest,
  AskPrepared,
  AskResult,
} from "./ask-gateway";

export {
  prepareAsk,
  processAskResponse,
  parseNudgeResponse,
  getNudgeVerdictEmoji,
  getNudgeVerdictColor,
  collectEvent,
} from "./ask-gateway";

// ============================================
// Supabase Stores (Phase 2: 앱에서 사용 중, factory만 export)
// ============================================

export { createSupabaseEventStore } from "./supabase-event-store";
export { createSupabaseProfileStore } from "./supabase-profile-store";

// Phase 2: 클래스/인터페이스 직접 export (현재 앱에서 미사용)
// export { SupabaseEventStore } from "./supabase-event-store";
// export type { ProfileStore } from "./supabase-profile-store";
// export { SupabaseProfileStore } from "./supabase-profile-store";

// ============================================
// Time-Series Analysis
// ============================================

export type { TimesSeriesPeakValley } from "./timeseries";

export {
  calculateRollingAverage,
  calculateBaselineVariance,
  detectSignificance,
  detectTrend,
  calculatePercentChange,
  findPeaksAndValleys,
} from "./timeseries";

// ============================================
// Confound Filtering
// ============================================

export type { ConfoundFlags, ConfoundAdjustment } from "./confound-filter";

export {
  applyConfoundAdjustment,
  applyConfoundFiltering,
  estimateConfoundPenalty,
} from "./confound-filter";

// ============================================
// Demo Data
// ============================================

export {
  getDemoData,
  getRandomDemoData,
  getDemoScenario,
} from "./demo";
