/**
 * PHASE 2 — buildCausalityProfile()만 Phase 1 앱에서 사용
 *
 * Causality Analyzer: 축적된 이벤트에서 개인 패턴 발견
 * 개별 분석 함수 (analyzeAlcohol*, analyzeCaffeine* 등)는
 * index.ts에서 export하지 않음 (내부 사용만)
 *
 * Phase 2 활성화 시점: 3명 이상 active users 확보 후
 */

import type {
  CausalityEvent,
  PersonalPattern,
  PersonalConstants,
  CausalityProfile,
} from "./causality";
import type { BiometricHistory } from "./types";

// ============================================
// Constants
// ============================================

const MIN_EVENTS_FOR_PATTERN = 3;
const MIN_EVENTS_FOR_HIGH_CONFIDENCE = 15;

// Population defaults (현재 cost.ts, drink.ts의 static constants)
const POPULATION_DEFAULTS = {
  alcoholHrvDropPerDrink: 4.5,       // cost.ts:47
  alcoholRecoveryDropPerDrink: 4.2,  // cost.ts:46
  personalDrinkLimit: 3,             // drink.ts:101
  caffeineSleepImpactPerCup: 4,      // cost.ts:56
  caffeineHalfLifeHours: 6,          // cost.ts:60
  workoutRecoveryThreshold: 70,      // workout.ts threshold
};

// ============================================
// Linear Regression (핵심 수학)
// ============================================

export interface RegressionResult {
  slope: number;       // 기울기 = 개인 민감도
  intercept: number;   // y절편
  r2: number;          // 결정계수 (0-1, 높을수록 설명력 좋음)
}

/**
 * Simple linear regression: y = slope * x + intercept
 *
 * @param x - 독립 변수 (예: drink amount)
 * @param y - 종속 변수 (예: HRV change)
 * @returns regression result or null if insufficient data
 */
export function linearRegression(
  x: number[],
  y: number[],
): RegressionResult | null {
  if (x.length !== y.length || x.length < MIN_EVENTS_FOR_PATTERN) {
    return null;
  }

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // R² calculation
  const meanY = sumY / n;
  const ssTotal = sumY2 - n * meanY * meanY;
  const ssResidual = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + (yi - predicted) ** 2;
  }, 0);

  const r2 = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

  return { slope, intercept, r2 };
}

// ============================================
// Domain-Specific Pattern Analyzers
// ============================================

/**
 * 개인 알코올 민감도 분석
 *
 * Input: drink 이벤트 (amount + outcome의 HRV delta)
 * Output: 주당 HRV 하락 % (population default: 4.5%)
 *
 * 예: slope = -5.8 → "이 유저는 주 1잔당 HRV -5.8% (평균 대비 29% 민감)"
 */
export function analyzeAlcoholSensitivity(
  events: CausalityEvent[],
): PersonalPattern | null {
  // outcome이 있는 drink 이벤트만 + amount가 있는 것만
  const valid = events.filter(
    (e) =>
      e.domain === "drink" &&
      e.action.amount !== undefined &&
      e.action.amount > 0 &&
      e.outcome?.delta.hrvChange !== null,
  );

  if (valid.length < MIN_EVENTS_FOR_PATTERN) return null;

  const x = valid.map((e) => e.action.amount!);
  const y = valid.map((e) => e.outcome!.delta.hrvChange!);

  const result = linearRegression(x, y);
  if (!result) return null;

  // slope은 음수 (음주 → HRV 하락)이므로 절대값 사용
  const learnedDrop = Math.abs(result.slope);
  const popDefault = POPULATION_DEFAULTS.alcoholHrvDropPerDrink;
  const ratio = learnedDrop / popDefault;
  const ratioPercent = Math.round((ratio - 1) * 100);
  const moreOrLess = ratioPercent >= 0 ? "more" : "less";

  return {
    userId: valid[0].userId,
    domain: "drink",
    patternType: "alcohol_hrv_sensitivity",
    learnedValue: learnedDrop,
    populationDefault: popDefault,
    confidence: calculateConfidence(valid.length, result.r2),
    dataPoints: valid.length,
    lastUpdated: new Date(),
    description: `Your HRV drops ${learnedDrop.toFixed(1)}% per drink (${Math.abs(ratioPercent)}% ${moreOrLess} sensitive than average)`,
  };
}

/**
 * 개인 알코올 회복 영향 분석
 *
 * Input: drink 이벤트 (amount + outcome의 readiness delta)
 * Output: 주당 readiness 하락 (population default: 4.2)
 */
export function analyzeAlcoholRecovery(
  events: CausalityEvent[],
): PersonalPattern | null {
  const valid = events.filter(
    (e) =>
      e.domain === "drink" &&
      e.action.amount !== undefined &&
      e.action.amount > 0 &&
      e.outcome?.delta.readinessChange !== null,
  );

  if (valid.length < MIN_EVENTS_FOR_PATTERN) return null;

  const x = valid.map((e) => e.action.amount!);
  const y = valid.map((e) => e.outcome!.delta.readinessChange!);

  const result = linearRegression(x, y);
  if (!result) return null;

  const learnedDrop = Math.abs(result.slope);
  const popDefault = POPULATION_DEFAULTS.alcoholRecoveryDropPerDrink;

  return {
    userId: valid[0].userId,
    domain: "drink",
    patternType: "alcohol_recovery_sensitivity",
    learnedValue: learnedDrop,
    populationDefault: popDefault,
    confidence: calculateConfidence(valid.length, result.r2),
    dataPoints: valid.length,
    lastUpdated: new Date(),
    description: `Your readiness drops ${learnedDrop.toFixed(1)} points per drink (avg: ${popDefault})`,
  };
}

/**
 * 개인 카페인 민감도 분석
 *
 * Input: coffee 이벤트 (cups + outcome의 sleep delta)
 * Output: 잔당 수면 점수 하락 (population default: 4)
 */
export function analyzeCaffeineSensitivity(
  events: CausalityEvent[],
): PersonalPattern | null {
  const valid = events.filter(
    (e) =>
      e.domain === "coffee" &&
      e.action.amount !== undefined &&
      e.action.amount > 0 &&
      e.outcome?.delta.sleepChange !== null,
  );

  if (valid.length < MIN_EVENTS_FOR_PATTERN) return null;

  const x = valid.map((e) => e.action.amount!);
  const y = valid.map((e) => e.outcome!.delta.sleepChange!);

  const result = linearRegression(x, y);
  if (!result) return null;

  const learnedImpact = Math.abs(result.slope);
  const popDefault = POPULATION_DEFAULTS.caffeineSleepImpactPerCup;

  return {
    userId: valid[0].userId,
    domain: "coffee",
    patternType: "caffeine_sleep_impact",
    learnedValue: learnedImpact,
    populationDefault: popDefault,
    confidence: calculateConfidence(valid.length, result.r2),
    dataPoints: valid.length,
    lastUpdated: new Date(),
    description: `Coffee costs you ${learnedImpact.toFixed(1)} sleep points per cup (avg: ${popDefault})`,
  };
}

/**
 * 개인 카페인 타이밍 분석 (amount 없어도 동작)
 *
 * Input: coffee 이벤트의 마지막 음용 시간(times[]) + outcome의 sleep delta
 * Output: 수면에 영향을 주기 시작하는 커피 시간 (cutoff)
 *
 * 예: cutoff=13.5 → "오후 1:30 이후 커피는 수면 -X점"
 */
export function analyzeCaffeineTimingImpact(
  events: CausalityEvent[],
): PersonalPattern | null {
  const valid = events.filter((e) => {
    // coffee/tea detail만 포함 (noodle 등 음식 이벤트 제외)
    if (!(e.domain === "coffee" || e.domain === "drink")) return false;
    if (!(e.action.detail === "coffee" || e.action.detail === "tea")) return false;
    if (!e.action.times?.length) return false;
    if (!e.outcome || e.outcome.delta.sleepChange === null) return false;
    // 오전 7시 이전 커피는 타이밍 분석에서 제외 (새벽 입력 노이즈)
    const lastTime = e.action.times[e.action.times.length - 1];
    const lastHour = parseInt(lastTime.split(":")[0], 10);
    return lastHour >= 7;
  });

  if (valid.length < MIN_EVENTS_FOR_PATTERN) return null;

  // 마지막 커피 시간을 소수점 시간으로 변환 (예: 15:30 → 15.5)
  const x = valid.map((e) => {
    const times = e.action.times!;
    const lastTime = times[times.length - 1];
    const [h, m] = lastTime.split(":").map(Number);
    return h + m / 60;
  });
  const y = valid.map((e) => e.outcome!.delta.sleepChange!);

  const result = linearRegression(x, y);
  if (!result) return null;

  // y = 0 지점 = 수면 영향 없는 마지막 시간 (cutoff)
  let cutoffHour = 14; // population default: 오후 2시
  if (result.slope !== 0) {
    const crossover = -result.intercept / result.slope;
    if (crossover >= 8 && crossover <= 22) {
      cutoffHour = Math.round(crossover * 2) / 2; // 30분 단위
    }
  }

  const cutoffFormatted = `${Math.floor(cutoffHour)}:${cutoffHour % 1 === 0.5 ? "30" : "00"}`;

  return {
    userId: valid[0].userId,
    domain: "coffee",
    patternType: "caffeine_timing_cutoff",
    learnedValue: cutoffHour,
    populationDefault: 14,
    confidence: calculateConfidence(valid.length, result.r2),
    dataPoints: valid.length,
    lastUpdated: new Date(),
    description: `Your coffee cutoff: ${cutoffFormatted} (later → worse sleep, slope=${result.slope.toFixed(2)})`,
  };
}

/**
 * 개인 운동 회복 분석
 *
 * workout 이벤트가 있는 날 vs 없는 날의 다음날 readiness 비교
 * → 이 유저에게 최적의 운동 readiness 임계값 발견
 */
export function analyzeWorkoutRecovery(
  events: CausalityEvent[],
): PersonalPattern | null {
  const valid = events.filter(
    (e) =>
      e.domain === "workout" &&
      e.outcome?.delta.readinessChange !== null &&
      e.biometricsBefore.readinessScore !== null,
  );

  if (valid.length < MIN_EVENTS_FOR_PATTERN) return null;

  // readiness before → readiness change 관계 분석
  // 높은 readiness에서 운동하면 회복 잘 됨, 낮으면 더 떨어짐
  const x = valid.map((e) => e.biometricsBefore.readinessScore!);
  const y = valid.map((e) => e.outcome!.delta.readinessChange!);

  const result = linearRegression(x, y);
  if (!result) return null;

  // readiness change가 0이 되는 지점 = 최적 임계값
  // y = slope * x + intercept, when y = 0: x = -intercept / slope
  let optimalThreshold = POPULATION_DEFAULTS.workoutRecoveryThreshold;
  if (result.slope !== 0) {
    const crossover = -result.intercept / result.slope;
    // 합리적 범위 내에서만 사용 (40-90)
    if (crossover >= 40 && crossover <= 90) {
      optimalThreshold = Math.round(crossover);
    }
  }

  const popDefault = POPULATION_DEFAULTS.workoutRecoveryThreshold;

  return {
    userId: valid[0].userId,
    domain: "workout",
    patternType: "workout_recovery_threshold",
    learnedValue: optimalThreshold,
    populationDefault: popDefault,
    confidence: calculateConfidence(valid.length, result.r2),
    dataPoints: valid.length,
    lastUpdated: new Date(),
    description: `Your optimal workout threshold is readiness ${optimalThreshold} (default: ${popDefault})`,
  };
}

/**
 * 개인 음주 안전 한계 분석
 *
 * 다음날 readiness가 baseline 대비 10% 이상 떨어지지 않는 최대 음주량
 */
export function analyzePersonalDrinkLimit(
  events: CausalityEvent[],
): PersonalPattern | null {
  const valid = events.filter(
    (e) =>
      e.domain === "drink" &&
      e.action.amount !== undefined &&
      e.action.amount > 0 &&
      e.outcome?.delta.readinessChange !== null,
  );

  if (valid.length < MIN_EVENTS_FOR_PATTERN) return null;

  // amount별 평균 readiness change 계산
  const buckets = new Map<number, number[]>();
  for (const e of valid) {
    const amount = e.action.amount!;
    const change = e.outcome!.delta.readinessChange!;
    const existing = buckets.get(amount) ?? [];
    existing.push(change);
    buckets.set(amount, existing);
  }

  // 평균 readiness drop이 -10 이하가 되는 첫 번째 amount 찾기
  let safeLimit = POPULATION_DEFAULTS.personalDrinkLimit;
  const sorted = Array.from(buckets.entries()).sort((a, b) => a[0] - b[0]);

  for (const [amount, changes] of sorted) {
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    if (avgChange <= -10) {
      safeLimit = Math.max(1, amount - 1);
      break;
    }
  }

  return {
    userId: valid[0].userId,
    domain: "drink",
    patternType: "personal_drink_limit",
    learnedValue: safeLimit,
    populationDefault: POPULATION_DEFAULTS.personalDrinkLimit,
    confidence: calculateConfidence(valid.length, 0.5), // bucket analysis는 r2 대신 고정값
    dataPoints: valid.length,
    lastUpdated: new Date(),
    description: `Your safe drink limit is ${safeLimit} (default: ${POPULATION_DEFAULTS.personalDrinkLimit})`,
  };
}

/**
 * 취침 시간 → deep sleep 영향 분석 (history 기반, event 파이프라인 불필요)
 *
 * Input:  BiometricHistory.bedtimeHours + deepSleepMinutes (60일 배열)
 * Output: 이 유저의 최적 취침 시간 (deep sleep 최대화 지점)
 *
 * 로직:
 *   - 취침 시간(X) vs deep sleep 분(Y) 선형 회귀
 *   - slope가 음수면 늦게 잘수록 deep sleep 감소 (예상 패턴)
 *   - 회귀선이 유저 평균 deep sleep을 유지하는 마지막 시간 = 최적 취침 시간
 */
export function analyzeBedtimeImpact(
  userId: string,
  history: BiometricHistory,
): PersonalPattern | null {
  if (!history.bedtimeHours || !history.deepSleepMinutes) return null;

  // (bedtimeHour, deepSleepMinutes) 쌍 중 유효한 것만
  const pairs: { bedtime: number; deepSleep: number }[] = [];
  for (let i = 0; i < history.bedtimeHours.length; i++) {
    const bedtime = history.bedtimeHours[i];
    const deepSleep = history.deepSleepMinutes[i];
    if (
      bedtime !== null &&
      bedtime >= 18 &&   // 6 PM 이후만 (낮잠 제외)
      bedtime <= 28 &&   // 4 AM 이전만 (24+는 다음날 새벽)
      deepSleep !== null &&
      deepSleep > 0
    ) {
      pairs.push({ bedtime, deepSleep });
    }
  }

  if (pairs.length < MIN_EVENTS_FOR_PATTERN) return null;

  const x = pairs.map((p) => p.bedtime);
  const y = pairs.map((p) => p.deepSleep);

  const result = linearRegression(x, y);
  if (!result) return null;

  // 최적 취침 시간: 회귀선이 유저 평균 deep sleep을 교차하는 지점
  // y = slope * x + intercept, y = meanDeepSleep → x = (mean - intercept) / slope
  const meanDeepSleep = y.reduce((a, b) => a + b, 0) / y.length;
  const POPULATION_BEDTIME_DEFAULT = 23; // population default: 11 PM

  let optimalHour = POPULATION_BEDTIME_DEFAULT;
  if (result.slope < 0 && result.slope !== 0) {
    // 음수 기울기: 늦게 잘수록 deep sleep 감소 (정상 패턴)
    const crossover = (meanDeepSleep - result.intercept) / result.slope;
    if (crossover >= 20 && crossover <= 26) {
      optimalHour = Math.round(crossover * 2) / 2; // 30분 단위 반올림
    }
  }

  // 표시용 포맷 (24h+ 정규화)
  const displayHour = optimalHour >= 24 ? optimalHour - 24 : optimalHour;
  const h = Math.floor(displayHour);
  const m = displayHour % 1 === 0.5 ? "30" : "00";
  const suffix = optimalHour >= 24 ? " (next day AM)" : "";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h >= 12 && h < 24 ? "PM" : "AM";

  return {
    userId,
    domain: "sleep",
    patternType: "optimal_bedtime",
    learnedValue: optimalHour,
    populationDefault: POPULATION_BEDTIME_DEFAULT,
    confidence: calculateConfidence(pairs.length, result.r2),
    dataPoints: pairs.length,
    lastUpdated: new Date(),
    description: `Optimal bedtime: ${h}:${m} (${h12}:${m} ${ampm}${suffix}) — ${Math.abs(result.slope).toFixed(1)} min deep sleep lost per hour later (${pairs.length} nights)`,
  };
}

// ============================================
// Confidence Calculation
// ============================================

function calculateConfidence(dataPoints: number, r2: number): number {
  // 데이터 양에 따른 신뢰도 (0-0.6)
  const dataConfidence = Math.min(
    0.6,
    dataPoints / MIN_EVENTS_FOR_HIGH_CONFIDENCE * 0.6,
  );

  // 모델 적합도에 따른 신뢰도 (0-0.4)
  const modelConfidence = Math.max(0, r2) * 0.4;

  return Math.min(1, dataConfidence + modelConfidence);
}

// ============================================
// Profile Builder (모든 패턴 종합)
// ============================================

/**
 * 축적된 이벤트 + 바이오 히스토리에서 전체 CausalityProfile 생성
 *
 * history를 넘기면 취침 시간 → deep sleep 패턴도 포함됨 (event 파이프라인 불필요)
 * 이 프로필의 personalConstants가 advisor.ts 시스템 프롬프트에 주입됨
 */
export function buildCausalityProfile(
  userId: string,
  events: CausalityEvent[],
  history?: BiometricHistory,
): CausalityProfile {
  const patterns: PersonalPattern[] = [];
  const constants: PersonalConstants = {};

  // 도메인별 분석 실행
  const alcoholHrv = analyzeAlcoholSensitivity(events);
  if (alcoholHrv) {
    patterns.push(alcoholHrv);
    constants.alcoholHrvDropPerDrink = alcoholHrv.learnedValue;
  }

  const alcoholRecovery = analyzeAlcoholRecovery(events);
  if (alcoholRecovery) {
    patterns.push(alcoholRecovery);
    constants.alcoholRecoveryDropPerDrink = alcoholRecovery.learnedValue;
  }

  const drinkLimit = analyzePersonalDrinkLimit(events);
  if (drinkLimit) {
    patterns.push(drinkLimit);
    constants.personalDrinkLimit = drinkLimit.learnedValue;
  }

  const caffeine = analyzeCaffeineSensitivity(events);
  if (caffeine) {
    patterns.push(caffeine);
    constants.caffeineSleepImpactPerCup = caffeine.learnedValue;
  }

  const caffeineTiming = analyzeCaffeineTimingImpact(events);
  if (caffeineTiming) {
    patterns.push(caffeineTiming);
    constants.caffeineTimingCutoff = caffeineTiming.learnedValue;
  }

  const workout = analyzeWorkoutRecovery(events);
  if (workout) {
    patterns.push(workout);
    constants.workoutRecoveryThreshold = workout.learnedValue;
  }

  // History-based analysis (no event pipeline needed)
  if (history) {
    const bedtime = analyzeBedtimeImpact(userId, history);
    if (bedtime) {
      patterns.push(bedtime);
      constants.optimalBedtimeHour = bedtime.learnedValue;
    }
  }

  // 이벤트 메타데이터
  const sortedByTime = events
    .filter((e) => e.domain !== "general")
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return {
    userId,
    totalEvents: sortedByTime.length,
    firstEventAt: sortedByTime[0]?.timestamp,
    lastEventAt: sortedByTime[sortedByTime.length - 1]?.timestamp,
    personalConstants: constants,
    patterns,
  };
}
