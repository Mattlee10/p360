// Re-export core types
export type {
  BiometricData,
  OuraDailySleep,
  OuraDailyReadiness,
  WorkoutVerdict,
  WorkoutDecision,
  Sport,
  SportGuide,
  IntensityGuide,
  DrinkLog,
  DrinkVerdict,
  DrinkDecision,
  DrinkHistory,
  DrinkImpact,
  SocialStrategy,
  WhyCategory,
  WhyVerdict,
  WhyUserInput,
  WhyDecision,
  GapAnalysis,
  GapDirection,
} from "@p360/core";

// Telegram-specific types (not in core)
export interface UserData {
  telegramId: number;
  ouraToken?: string;
  morningAlertTime?: string;
  timezone?: string;
  createdAt: Date;
  lastCheckAt?: Date;
  drinkLogs?: import("@p360/core").DrinkLog[];
}
