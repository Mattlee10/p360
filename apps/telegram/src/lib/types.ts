// Re-export core types
export type {
  BiometricData,
  OuraDailySleep,
  OuraDailyReadiness,
} from "@p360/core";

// Local types
export type { DrinkLog } from "./drink";

// Telegram-specific types (not in core)
export interface UserData {
  telegramId: number;
  ouraToken?: string;
  morningAlertTime?: string;
  timezone?: string;
  createdAt: Date;
  lastCheckAt?: Date;
  drinkLogs?: import("./drink").DrinkLog[];
}
