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
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    return this.events.filter(
      (e) =>
        e.userId === userId &&
        !e.outcome &&
        e.timestamp < startOfToday,
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
  // Generate UUID v4 without external dependency
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================
// 질문에서 Action 자동 추출
// ============================================

// ============================================
// 시간 파싱 (로컬 시간 기준, timezone 자동 감지)
// ============================================

/**
 * 질문에서 시간 목록을 추출. 모두 24시간 "HH:MM" 형식으로 반환.
 * 지원 패턴:
 *   한국어: "9시", "오전 9시", "오후 1시", "13시 30분"
 *   영어:   "9am", "1pm", "9:00am", "13:00", "9 AM"
 *
 * 규칙:
 *   1. 한국어/영어 am/pm 표시가 있는 시간을 우선 추출
 *   2. 명시적 표시 시간이 없을 때만 24h 형식 사용 (오탐 방지)
 *   3. 최대 3개 (과다 추출 방지)
 */
function extractTimes(question: string): string[] | undefined {
  const markedTimes: string[] = [];

  // 한국어 패턴: "오전 9시", "오후 1시 30분", "9시", "13시"
  const krPattern = /(?:(오전|오후)\s*)?(\d{1,2})시(?:\s*(\d{1,2})분)?/g;
  let m: RegExpExecArray | null;
  while ((m = krPattern.exec(question)) !== null) {
    let hour = parseInt(m[2], 10);
    const minute = m[3] ? parseInt(m[3], 10) : 0;
    if (m[1] === "오후" && hour < 12) hour += 12;
    if (m[1] === "오전" && hour === 12) hour = 0;
    if (hour >= 0 && hour <= 23) {
      markedTimes.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }

  // 영어 패턴: "9am", "1pm", "9:30am", "9 AM"
  const enPattern = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi;
  while ((m = enPattern.exec(question)) !== null) {
    let hour = parseInt(m[1], 10);
    const minute = m[2] ? parseInt(m[2], 10) : 0;
    const meridiem = m[3].toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    if (hour >= 0 && hour <= 23) {
      markedTimes.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }

  // 24시간 형식 (am/pm 없음): "13:00", "09:30"
  // 명시적 표시 시간이 없을 때만 사용 (오탐 방지)
  const times: string[] = [...markedTimes];
  if (markedTimes.length === 0) {
    const h24Pattern = /\b([01]\d|2[0-3]):([0-5]\d)\b/g;
    while ((m = h24Pattern.exec(question)) !== null) {
      const candidate = `${m[1]}:${m[2]}`;
      if (!times.includes(candidate)) {
        times.push(candidate);
      }
    }
  }

  // 중복 제거 후 시간순 정렬, 최대 3개
  const unique = [...new Set(times)];
  unique.sort();
  const result = unique.slice(0, 3);
  return result.length > 0 ? result : undefined;
}

/**
 * 시스템 timezone을 IANA 형식으로 반환.
 * Node.js 환경에서 Intl.DateTimeFormat 사용.
 */
function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

const FOOD_SUBSTANCES = new Set([
  "egg", "chicken", "meat", "beef", "pork", "fish",
  "salad", "rice", "bread", "noodle", "pasta", "ramen",
  "pizza", "burger", "fruit", "smoothie",
  "protein", "creatine", "vitamin", "omega3", "magnesium", "supplement",
]);

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
  // 음식
  계란: "egg", egg: "egg", eggs: "egg",
  닭: "chicken", chicken: "chicken",
  고기: "meat", meat: "meat", beef: "beef", pork: "pork",
  생선: "fish", fish: "fish",
  샐러드: "salad", salad: "salad",
  밥: "rice", rice: "rice",
  빵: "bread", bread: "bread",
  면: "noodle", pasta: "pasta", 파스타: "pasta", 라면: "ramen", ramen: "ramen",
  치킨: "chicken", 피자: "pizza", pizza: "pizza",
  버거: "burger", burger: "burger",
  과일: "fruit", fruit: "fruit",
  스무디: "smoothie", smoothie: "smoothie",
  // 보충제
  단백질: "protein", protein: "protein",
  크레아틴: "creatine", creatine: "creatine",
  비타민: "vitamin", vitamin: "vitamin",
  오메가: "omega3", omega: "omega3",
  마그네슘: "magnesium", magnesium: "magnesium",
  보충제: "supplement", supplement: "supplement",
};

const KOREAN_NUMERALS: Record<string, number> = {
  한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10,
};

function extractAmount(question: string): number | undefined {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = question.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 20) return num;
    }
  }
  // 한국어 수관형사: "한잔", "두 잔", "세 잔"
  const koreanMatch = question.match(/(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*(?:잔|병|컵|cup)/);
  if (koreanMatch) {
    return KOREAN_NUMERALS[koreanMatch[1]];
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
    "incline walk": "incline_walking", "incline walking": "incline_walking",
    "incline treadmill": "incline_walking",
    walking: "walking", walk: "walking", 걷기: "walking", 산책: "walking",
    basketball: "basketball", 농구: "basketball",
    running: "running", 달리기: "running", 러닝: "running", jog: "running", jogging: "running",
    swimming: "swimming", 수영: "swimming",
    cycling: "cycling", 자전거: "cycling", bike: "cycling", biking: "cycling",
    yoga: "yoga", 요가: "yoga",
    crossfit: "crossfit",
    weightlifting: "weightlifting", 웨이트: "weightlifting", weights: "weightlifting", lifting: "weightlifting",
    soccer: "soccer", 축구: "soccer", football: "soccer",
    tennis: "tennis", 테니스: "tennis",
    hiking: "hiking", 등산: "hiking",
    climbing: "climbing", 클라이밍: "climbing",
    bjj: "martial_arts", 격투기: "martial_arts", boxing: "boxing", 복싱: "boxing",
    golf: "golf", 골프: "golf",
    pilates: "pilates", 필라테스: "pilates",
    stretch: "stretching", stretching: "stretching",
  };

  const lower = question.toLowerCase();
  // Multi-word sports checked first (longer match wins)
  const sortedKeywords = Object.entries(sportKeywords).sort(
    ([a], [b]) => b.length - a.length
  );
  for (const [keyword, sport] of sortedKeywords) {
    if (lower.includes(keyword)) {
      return sport;
    }
  }
  return undefined;
}

/**
 * Extract planned sleep duration in hours from question text
 * Examples: "7시간", "8 hours", "6.5시간"
 */
function extractSleepDurationHours(question: string): number | undefined {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*시간/,
    /(\d+(?:\.\d+)?)\s*hours?/i,
  ];
  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match) {
      const num = parseFloat(match[1]);
      if (num >= 3 && num <= 12) return num;
    }
  }
  return undefined;
}

/**
 * Extract exercise duration in minutes from question text
 * Examples: "40min walk", "walked for 30 minutes", "1 hour run"
 */
function extractDuration(question: string): number | undefined {
  const patterns = [
    /(\d+)\s*(?:min(?:utes?)?|분)/i,           // "40min", "40 minutes", "40분"
    /(\d+)\s*(?:hour|hr|시간)/i,               // "1 hour", "1hr", "1시간" → multiply ×60
    /for\s+(\d+)\s*(?:min|minutes?)/i,         // "for 30 min"
  ];

  const lower = question.toLowerCase();
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      // Detect if it's hours
      if (/hour|hr|시간/.test(pattern.source)) {
        return num * 60;
      }
      if (num >= 1 && num <= 360) return num;
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
  userTimezone?: string,
): CausalityEvent | null {
  // Resolve effective routes: even if route is "general", capture exercise events.
  // e.g. "My HRV is 212, I did incline walk" → routes=["tired"] → still save as workout
  let effectiveRoutes = routes;
  if (routes.length === 1 && routes[0] === "general") {
    if (extractSport(question) !== undefined) {
      effectiveRoutes = ["workout"];
    }
    // general 도메인도 저장 (buildAction default case가 처리)
  }

  const domain = mapRouteToDomain(effectiveRoutes[0]);

  // If domain is "general" (e.g. routes=["tired"]) but question mentions exercise, override
  let resolvedDomain: CausalityDomain =
    domain === "general" && extractSport(question) !== undefined
      ? "workout"
      : domain;

  // If domain resolved to "drink" but substance is food/coffee/tea, reclassify
  if (resolvedDomain === "drink") {
    const substance = extractSubstance(question);
    if (substance && FOOD_SUBSTANCES.has(substance)) {
      resolvedDomain = "meal";
    } else if (substance === "coffee" || substance === "tea") {
      resolvedDomain = "coffee";
    }
  }

  const action = buildAction(resolvedDomain, question, analyses, userTimezone);

  if (!action) return null;

  const recommendation = extractRecommendation(resolvedDomain, analyses);

  return {
    id: generateId(),
    userId,
    domain: resolvedDomain,
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
    meal: "meal",
    sleep: "sleep",
    tired: "general",
    cost: "drink", // cost는 보통 drink 관련
  };
  return mapping[route] ?? "general";
}

function buildAction(
  domain: CausalityDomain,
  question: string,
  _analyses: Record<string, unknown>,
  userTimezone?: string,
): CausalityAction | null {
  const timezone = userTimezone || getLocalTimezone();

  switch (domain) {
    case "drink": {
      const substance = extractSubstance(question);
      const amount = extractAmount(question);
      const times = extractTimes(question);
      return {
        type: "drank",
        amount,
        detail: substance ?? "alcohol",
        ...(times ? { times, timezone } : {}),
      };
    }

    case "workout": {
      const sport = extractSport(question);
      const duration = extractDuration(question);
      const times = extractTimes(question);
      return {
        type: "worked_out",
        detail: sport ?? "general",
        ...(duration !== undefined ? { amount: duration } : {}),
        ...(times ? { times, timezone } : {}),
      };
    }

    case "coffee": {
      const amount = extractAmount(question);
      const times = extractTimes(question);
      return {
        type: "drank_coffee",
        amount,
        detail: extractSubstance(question) ?? "coffee",
        ...(times ? { times, timezone } : {}),
      };
    }

    case "meal": {
      const substance = extractSubstance(question);
      const amount = extractAmount(question);
      const times = extractTimes(question);
      return {
        type: "ate",
        detail: substance ?? "meal",
        ...(amount !== undefined ? { amount } : {}),
        ...(times ? { times, timezone } : {}),
      };
    }

    case "sleep": {
      const times = extractTimes(question);
      const durationHours = extractSleepDurationHours(question);
      // bedtime이나 duration 중 하나라도 있어야 저장 가치 있음
      if (!times && durationHours === undefined) return null;
      return {
        type: "planned_sleep",
        ...(durationHours !== undefined ? { amount: durationHours } : {}),
        ...(times ? { times, timezone } : {}),
      };
    }

    default: {
      // general 도메인은 causality 분석에 불필요 — null 반환
      return null;
    }
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
 * 각 pending event에 대해 "event 날짜 + 1일"의 바이오 데이터를 outcome으로 연결
 *
 * history가 있으면 날짜별 정확한 데이터 lookup (delta=0 방지)
 * history 없으면 todayBiometrics fallback
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

  const history = todayBiometrics.history;
  let resolved = 0;

  for (const event of pending) {
    // event 발생 다음날 날짜 계산 (UTC 기준)
    const eventDateStr = event.timestamp.toISOString().split("T")[0];
    const nextDate = new Date(eventDateStr + "T00:00:00Z");
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    const nextDateStr = nextDate.toISOString().split("T")[0];

    let afterSnapshot: BiometricSnapshot;

    if (history && history.dates.length > 0) {
      const idx = history.dates.indexOf(nextDateStr);
      if (idx === -1) {
        // 다음날 데이터 아직 없음 — Oura 미업데이트, skip
        continue;
      }
      afterSnapshot = {
        sleepScore: history.sleepValues[idx] || null,
        readinessScore: history.readinessValues[idx] || null,
        hrvBalance: history.hrvValues[idx] || null,
        restingHR: null, // BiometricHistory에 RHR 미포함
        deepSleepMinutes: history.deepSleepMinutes?.[idx] ?? null,
      };
    } else {
      // history 없으면 todayBiometrics fallback
      afterSnapshot = toBiometricSnapshot(todayBiometrics);
    }

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
