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
// Demo Data
// ============================================

export {
  getDemoData,
  getRandomDemoData,
  getDemoScenario,
} from "./demo";
