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

export interface OuraTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Workout decision types
export type WorkoutVerdict = "train_hard" | "train_light" | "rest";

// Supported sports
export type Sport =
  | "basketball"
  | "running"
  | "cycling"
  | "weightlifting"
  | "crossfit"
  | "swimming"
  | "yoga"
  | "soccer"
  | "tennis"
  | "golf"
  | "hiking"
  | "climbing"
  | "martial_arts"
  | "general";

export interface SportGuide {
  sport: Sport;
  displayName: string;
  todayAdvice: string;
  intensityTips: string[];
  warmup: string;
  duration: string;
  cautionNotes?: string[];
}

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
  // New fields
  reasoning: string[];           // Why this verdict
  intensityGuide: {
    cardio?: string;             // e.g., "Zone 4-5, HR 160-180"
    weights?: string;            // e.g., "85-95% 1RM, 3-5 reps"
    duration?: string;           // e.g., "45-90 min"
    rpe?: string;                // e.g., "8-10 RPE"
  };
  sportGuide?: SportGuide;       // Sport-specific guidance
}
