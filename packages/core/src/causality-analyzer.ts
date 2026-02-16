/**
 * Causality Analyzer — 축적된 이벤트에서 개인 패턴 발견
 *
 * mood.ts의 Pearson correlation 패턴을 확장하여:
 * - Linear regression으로 개인 민감도 계산
 * - 도메인별 패턴 추출 (alcohol, caffeine, workout)
 * - personalConstants 생성 → 알고리즘에 주입
 */

import type {
  CausalityEvent,
  PersonalPattern,
  PersonalConstants,
  CausalityProfile,
} from "./causality";

// ============================================
// Constants
// ============================================

const MIN_EVENTS_FOR_PATTERN = 5;
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
 * 축적된 이벤트에서 전체 CausalityProfile 생성
 *
 * 이 프로필의 personalConstants가 cost.ts, drink.ts 등에 주입됨
 */
export function buildCausalityProfile(
  userId: string,
  events: CausalityEvent[],
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

  const workout = analyzeWorkoutRecovery(events);
  if (workout) {
    patterns.push(workout);
    constants.workoutRecoveryThreshold = workout.learnedValue;
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
