/**
 * PHASE 2 — extractEventFromAsk()만 Phase 1 ask-gateway.ts에서 사용
 *
 * Causality Collector: /ask 파이프라인에서 자동 이벤트 수집
 * InMemoryEventStore, resolveOutcomes()는 Phase 2에서 활성화
 *
 * Phase 2 활성화 시점: 3명 이상 active users 확보 후
 */

import type { BiometricData } from "./types";
import type {
  CausalityEvent,
  CausalityOutcome,
  CausalityDomain,
  CausalityAction,
  CausalityRecommendation,
  EventStore,
  BiometricSnapshot,
} from "./causality";
import { toBiometricSnapshot, calculateDelta } from "./causality";

// ============================================
// InMemoryEventStore (Phase 1 — Supabase 전 사용)
// ============================================

export class InMemoryEventStore implements EventStore {
  private events: CausalityEvent[] = [];

  async save(event: CausalityEvent): Promise<void> {
    this.events.push(event);
  }

  async getByUser(userId: string, limit = 100): Promise<CausalityEvent[]> {
    return this.events
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getByUserAndDomain(
    userId: string,
    domain: CausalityDomain,
    limit = 100,
  ): Promise<CausalityEvent[]> {
    return this.events
      .filter((e) => e.userId === userId && e.domain === domain)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getPendingOutcomes(userId: string): Promise<CausalityEvent[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.events.filter(
      (e) =>
        e.userId === userId &&
        !e.outcome &&
        e.timestamp < oneDayAgo,
    );
  }

  async updateOutcome(
    eventId: string,
    outcome: CausalityOutcome,
  ): Promise<void> {
    const event = this.events.find((e) => e.id === eventId);
    if (event) {
      event.outcome = outcome;
    }
  }

  // 테스트/디버깅용
  getAll(): CausalityEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}

// ============================================
// UUID 생성 (의존성 없이)
// ============================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================
// 질문에서 Action 자동 추출
// ============================================

const AMOUNT_PATTERNS = [
  // "맥주 3잔", "beer 3", "3 beers", "3잔"
  /(\d+)\s*(?:잔|병|cups?|glasses?|shots?|drinks?|beers?|bottles?)/i,
  // "3 맥주", numbers followed by substance
  /(\d+)\s*(?:맥주|소주|와인|커피|에스프레소|아메리카노)/i,
  // standalone number in drink/coffee context
  /(?:맥주|beer|soju|소주|wine|coffee|커피)\s*(\d+)/i,
];

const SUBSTANCE_KEYWORDS: Record<string, string> = {
  beer: "beer", 맥주: "beer", beers: "beer",
  wine: "wine", 와인: "wine",
  soju: "spirits", 소주: "spirits",
  whiskey: "spirits", 위스키: "spirits",
  vodka: "spirits", cocktail: "spirits", 칵테일: "spirits",
  spirits: "spirits", liquor: "spirits",
  coffee: "coffee", 커피: "coffee", espresso: "coffee",
  에스프레소: "coffee", 아메리카노: "coffee", latte: "coffee", 라떼: "coffee",
  tea: "tea", 차: "tea", matcha: "tea", 마차: "tea",
};

function extractAmount(question: string): number | undefined {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = question.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 20) return num;
    }
  }
  return undefined;
}

function extractSubstance(question: string): string | undefined {
  const lower = question.toLowerCase();
  for (const [keyword, substance] of Object.entries(SUBSTANCE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return substance;
    }
  }
  return undefined;
}

function extractSport(question: string): string | undefined {
  const sportKeywords: Record<string, string> = {
    basketball: "basketball", 농구: "basketball",
    running: "running", 달리기: "running", 러닝: "running",
    swimming: "swimming", 수영: "swimming",
    cycling: "cycling", 자전거: "cycling",
    yoga: "yoga", 요가: "yoga",
    crossfit: "crossfit",
    weightlifting: "weightlifting", 웨이트: "weightlifting",
    soccer: "soccer", 축구: "soccer",
    tennis: "tennis", 테니스: "tennis",
    hiking: "hiking", 등산: "hiking",
    climbing: "climbing", 클라이밍: "climbing",
    bjj: "martial_arts", 격투기: "martial_arts",
    golf: "golf", 골프: "golf",
  };

  const lower = question.toLowerCase();
  for (const [keyword, sport] of Object.entries(sportKeywords)) {
    if (lower.includes(keyword)) {
      return sport;
    }
  }
  return undefined;
}

// ============================================
// /ask 파이프라인에서 이벤트 자동 추출
// ============================================

/**
 * matchRoutes() 결과와 질문에서 CausalityEvent를 자동 생성
 *
 * advisor.ts의 buildAdvisorContext에서 호출:
 * ```
 * const event = extractEventFromAsk(question, routes, analyses, data, userId);
 * if (event) await store.save(event);
 * ```
 */
export function extractEventFromAsk(
  question: string,
  routes: string[],
  analyses: Record<string, unknown>,
  biometrics: BiometricData,
  userId: string,
): CausalityEvent | null {
  // "general" only route = 구체적 행동 아님 → 수집 안 함
  if (routes.length === 1 && routes[0] === "general") {
    return null;
  }

  const domain = mapRouteToDomain(routes[0]);
  const action = buildAction(domain, question, analyses);

  if (!action) return null;

  const recommendation = extractRecommendation(domain, analyses);

  return {
    id: generateId(),
    userId,
    domain,
    timestamp: new Date(),
    biometricsBefore: toBiometricSnapshot(biometrics),
    action,
    recommendation: recommendation ?? undefined,
  };
}

function mapRouteToDomain(route: string): CausalityDomain {
  const mapping: Record<string, CausalityDomain> = {
    drink: "drink",
    workout: "workout",
    coffee: "coffee",
    tired: "general",
    cost: "drink", // cost는 보통 drink 관련
  };
  return mapping[route] ?? "general";
}

function buildAction(
  domain: CausalityDomain,
  question: string,
  _analyses: Record<string, unknown>,
): CausalityAction | null {
  switch (domain) {
    case "drink": {
      const substance = extractSubstance(question);
      const amount = extractAmount(question);
      return {
        type: "drank",
        amount,
        detail: substance ?? "alcohol",
      };
    }

    case "workout": {
      const sport = extractSport(question);
      return {
        type: "worked_out",
        detail: sport ?? "general",
      };
    }

    case "coffee": {
      const amount = extractAmount(question);
      return {
        type: "drank_coffee",
        amount,
        detail: extractSubstance(question) ?? "coffee",
      };
    }

    default:
      return null;
  }
}

function extractRecommendation(
  domain: CausalityDomain,
  analyses: Record<string, unknown>,
): CausalityRecommendation | null {
  if (domain === "drink") {
    const drink = analyses.drink as { verdict?: string; greenLimit?: number } | undefined;
    if (drink?.verdict) {
      return {
        verdict: drink.verdict,
        suggestedLimit: drink.greenLimit,
        domain: "drink",
      };
    }
  }

  if (domain === "workout") {
    const workout = analyses.workout as { verdict?: string } | undefined;
    if (workout?.verdict) {
      return {
        verdict: workout.verdict,
        domain: "workout",
      };
    }
  }

  return null;
}

// ============================================
// Outcome 자동 해결 (다음날 바이오 데이터 수집 시)
// ============================================

/**
 * 매일 바이오 데이터 fetch할 때 호출
 * 어제의 이벤트에 오늘 바이오 데이터를 outcome으로 연결
 *
 * @returns 해결된 이벤트 수
 */
export async function resolveOutcomes(
  store: EventStore,
  userId: string,
  todayBiometrics: BiometricData,
): Promise<number> {
  const pending = await store.getPendingOutcomes(userId);

  if (pending.length === 0) return 0;

  const afterSnapshot: BiometricSnapshot = toBiometricSnapshot(todayBiometrics);
  let resolved = 0;

  for (const event of pending) {
    const delta = calculateDelta(event.biometricsBefore, afterSnapshot);

    const outcome: CausalityOutcome = {
      measuredAt: new Date(),
      after: afterSnapshot,
      delta,
    };

    await store.updateOutcome(event.id, outcome);
    resolved++;
  }

  return resolved;
}
