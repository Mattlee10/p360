// Biometric data types
export interface BiometricData {
  sleepScore: number | null;
  readinessScore: number | null;
  hrvBalance: number | null;
  restingHR: number | null;
  date: string;
}

// Oura API response types
export interface OuraDailySleep {
  id: string;
  day: string;
  score: number | null;
  timestamp: string;
}

export interface OuraDailyReadiness {
  id: string;
  day: string;
  score: number | null;
  timestamp: string;
  contributors: {
    hrv_balance: number | null;
    resting_heart_rate: number | null;
  };
}

// User storage
export interface UserData {
  odatelegramId: number;
  ouraToken?: string;
  morningAlertTime?: string; // "07:00"
  timezone?: string;
  createdAt: Date;
  lastCheckAt?: Date;
}

// Workout decision types
export type WorkoutVerdict = "train_hard" | "train_light" | "rest";

export interface WorkoutDecision {
  verdict: WorkoutVerdict;
  confidence: number;
  emoji: string;
  headline: string;
  subheadline: string;
  recommendations: string[];
  avoidList: string[];
  maxHeartRate?: number;
  suggestedZone?: string;
  recoveryRisk: string;
  tomorrowOutlook: string;
  dataSummary: {
    readiness: { value: number | null; status: string };
    hrv: { value: number | null; trend: string };
    sleep: { value: number | null; hours?: string };
  };
}
