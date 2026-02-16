/**
 * Causality Engine — 개인별 인과관계 데이터 독점 자산
 *
 * /ask 파이프라인에서 자동 수집 → 패턴 발견 → 알고리즘 개인화
 *
 * Flow:
 * 1. 유저가 /ask "맥주 3잔 마셔도 돼?" →
 * 2. matchRoutes() → domain: "drink" →
 * 3. CausalityEvent 자동 기록 (biometrics before + action) →
 * 4. 다음날 바이오 fetch → outcome 자동 연결 →
 * 5. 패턴 축적 → personalConstants 학습
 */

import type { BiometricData } from "./types";

// ============================================
// Domain Types
// ============================================

export type CausalityDomain = "drink" | "workout" | "coffee" | "sleep" | "work" | "general";

// ============================================
// Event: 행동 기록 (/ask에서 자동 추출)
// ============================================

export interface CausalityAction {
  type: string;       // "drank", "worked_out", "drank_coffee", "asked_about"
  amount?: number;    // 3 (drinks), 60 (minutes), 2 (cups)
  detail?: string;    // "beer", "basketball", "espresso"
}

export interface CausalityRecommendation {
  verdict: string;    // "green", "yellow", "red", "train_hard", etc.
  suggestedLimit?: number;
  domain: string;
}

export interface CausalityEvent {
  id: string;
  userId: string;
  domain: CausalityDomain;
  timestamp: Date;

  // 이벤트 시점의 바이오 상태
  biometricsBefore: BiometricSnapshot;

  // 실제 행동 (/ask 질문에서 자동 추출)
  action: CausalityAction;

  // p360이 뭐라고 추천했는가
  recommendation?: CausalityRecommendation;

  // 결과 (다음날 바이오 데이터로 자동 채움)
  outcome?: CausalityOutcome;
}

// ============================================
// Outcome: 다음날 결과 (자동 수집)
// ============================================

export interface BiometricSnapshot {
  sleepScore: number | null;
  readinessScore: number | null;
  hrvBalance: number | null;
  restingHR: number | null;
}

export interface CausalityOutcome {
  measuredAt: Date;
  after: BiometricSnapshot;

  // before → after 델타 (자동 계산)
  delta: {
    sleepChange: number | null;
    readinessChange: number | null;
    hrvChange: number | null;       // percentage point change
    rhrChange: number | null;
  };
}

// ============================================
// Personal Pattern: 발견된 개인 민감도
// ============================================

export interface PersonalPattern {
  userId: string;
  domain: CausalityDomain;
  patternType: string;          // "alcohol_hrv_sensitivity", "caffeine_sleep_impact"

  learnedValue: number;         // 이 유저의 실측값 (예: -6.2)
  populationDefault: number;    // 현재 static constant (예: -4.5)

  confidence: number;           // 0-1
  dataPoints: number;
  lastUpdated: Date;

  description: string;          // "Your HRV drops 6.2% per drink (38% more sensitive than average)"
}

// ============================================
// Profile: 알고리즘에 주입할 개인 상수
// ============================================

export interface PersonalConstants {
  // Alcohol
  alcoholHrvDropPerDrink?: number;        // default: 4.5
  alcoholRecoveryDropPerDrink?: number;   // default: 4.2
  personalDrinkLimit?: number;            // default: 3

  // Caffeine
  caffeineSleepImpactPerCup?: number;     // default: 4
  caffeineHalfLifeHours?: number;         // default: 6

  // Workout
  workoutRecoveryThreshold?: number;      // default: 70
}

export interface CausalityProfile {
  userId: string;
  totalEvents: number;
  firstEventAt?: Date;
  lastEventAt?: Date;

  personalConstants: PersonalConstants;
  patterns: PersonalPattern[];
}

// ============================================
// EventStore Interface (저장소 추상화)
// ============================================

export interface EventStore {
  save(event: CausalityEvent): Promise<void>;
  getByUser(userId: string, limit?: number): Promise<CausalityEvent[]>;
  getByUserAndDomain(userId: string, domain: CausalityDomain, limit?: number): Promise<CausalityEvent[]>;
  getPendingOutcomes(userId: string): Promise<CausalityEvent[]>;
  updateOutcome(eventId: string, outcome: CausalityOutcome): Promise<void>;
}

// ============================================
// Helper: BiometricData → BiometricSnapshot
// ============================================

export function toBiometricSnapshot(data: BiometricData): BiometricSnapshot {
  return {
    sleepScore: data.sleepScore,
    readinessScore: data.readinessScore,
    hrvBalance: data.hrvBalance,
    restingHR: data.restingHR,
  };
}

// ============================================
// Helper: 두 snapshot 사이의 delta 계산
// ============================================

export function calculateDelta(
  before: BiometricSnapshot,
  after: BiometricSnapshot,
): CausalityOutcome["delta"] {
  return {
    sleepChange: before.sleepScore !== null && after.sleepScore !== null
      ? after.sleepScore - before.sleepScore
      : null,
    readinessChange: before.readinessScore !== null && after.readinessScore !== null
      ? after.readinessScore - before.readinessScore
      : null,
    hrvChange: before.hrvBalance !== null && after.hrvBalance !== null
      ? after.hrvBalance - before.hrvBalance
      : null,
    rhrChange: before.restingHR !== null && after.restingHR !== null
      ? after.restingHR - before.restingHR
      : null,
  };
}
