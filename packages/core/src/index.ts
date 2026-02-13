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
// Workout
// ============================================

export type {
  WorkoutVerdict,
  WorkoutDecision,
  Sport,
  SportGuide,
  IntensityGuide,
} from "./workout";

export {
  getWorkoutDecision,
  getSportGuide,
  parseSport,
  getSportList,
  formatWorkoutCLI,
  formatWorkoutJSON,
  getVerdictEmoji as getWorkoutVerdictEmoji,
  getVerdictColor as getWorkoutVerdictColor,
} from "./workout";

// ============================================
// Drink
// ============================================

export type {
  DrinkLog,
  DrinkVerdict,
  DrinkImpact,
  DrinkDecision,
  DrinkHistory,
  SocialStrategy,
} from "./drink";

export {
  getDrinkDecision,
  getSocialStrategy,
  calculateDrinkHistory,
} from "./drink";

// ============================================
// Why (Mind vs Body Analysis)
// ============================================

export type {
  WhyCategory,
  WhyVerdict,
  GapDirection,
  WhyUserInput,
  GapAnalysis,
  WhyDataSummary,
  WhyDecision,
} from "./why";

export {
  getWhyDecision,
  parseWhyInput,
  analyzeGap,
} from "./why";

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
// Causality Engine (개인별 인과관계 독점 자산)
// ============================================

export type {
  CausalityDomain,
  CausalityAction,
  CausalityRecommendation,
  CausalityEvent,
  CausalityOutcome,
  BiometricSnapshot,
  PersonalPattern,
  PersonalConstants,
  CausalityProfile,
  EventStore,
} from "./causality";

export {
  toBiometricSnapshot,
  calculateDelta,
} from "./causality";

export {
  InMemoryEventStore,
  extractEventFromAsk,
  resolveOutcomes,
} from "./causality-collector";

export {
  linearRegression,
  analyzeAlcoholSensitivity,
  analyzeAlcoholRecovery,
  analyzeCaffeineSensitivity,
  analyzeWorkoutRecovery,
  analyzePersonalDrinkLimit,
  buildCausalityProfile,
} from "./causality-analyzer";

export type { RegressionResult } from "./causality-analyzer";

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
} from "./ask-gateway";

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
