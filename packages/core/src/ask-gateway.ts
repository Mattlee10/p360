import { BiometricData } from "./types";
import { buildAdvisorContext, matchRoutes } from "./advisor";
import type { NudgeResponse, AdvisorContext } from "./advisor";
import type { CausalityProfile, EventStore } from "./causality";
import { extractEventFromAsk } from "./causality-collector";

// ============================================
// Ask Gateway Types
// ============================================

export interface AskRequest {
  question?: string;
  domain?: string;
  biometricData: BiometricData;
  /** Phase 2: 개인화 프로필 (선택사항, 없으면 population defaults 사용) */
  profile?: CausalityProfile;
  /** Phase 2: userId for causality event tracking */
  userId?: string;
  /** Phase 2: EventStore for persisting causality events */
  eventStore?: EventStore;
  /** Tone override: "hardcore" = numbers only, no fluff (Shame Bot mode) */
  tone?: "default" | "hardcore";
  /** User's IANA timezone (e.g. "Asia/Seoul"). Falls back to server timezone if not set. */
  timezone?: string;
}

export interface AskPrepared {
  question: string;
  context: AdvisorContext;
  systemPrompt: string;
  /** Matched routes for event collection */
  routes: string[];
  /** Original request (for event collection after Claude response) */
  request: AskRequest;
}

export interface AskResult {
  domain: string;
  nudge: NudgeResponse | null;
  raw: string;
  analyses: Record<string, unknown>;
}

// ============================================
// Domain Detection
// ============================================

const DOMAIN_QUESTIONS: Record<string, string> = {
  drink: "Should I drink alcohol tonight? What's my limit?",
  workout: "Should I work out today? What intensity?",
  tired: "Why am I feeling tired? What should I do?",
  coffee: "Can I have coffee now? What's the impact?",
  cost: "What's the recovery cost of drinking tonight?",
};

// ============================================
// Response Parser (extracted from 3 duplicates)
// ============================================

export function parseNudgeResponse(text: string): NudgeResponse | null {
  try {
    // Remove markdown code blocks (```json ... ```)
    let cleanText = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "");

    // Find JSON object: first { to last }
    const openBrace = cleanText.indexOf("{");
    const closeBrace = cleanText.lastIndexOf("}");

    if (openBrace === -1 || closeBrace === -1 || closeBrace <= openBrace) {
      return null;
    }

    const jsonStr = cleanText.substring(openBrace, closeBrace + 1);
    const parsed = JSON.parse(jsonStr);

    return {
      answer: parsed.answer || "",
      options: Array.isArray(parsed.options) ? parsed.options : [],
      strategy: parsed.strategy || "",
      dataSource: parsed.dataSource || "",
    };
  } catch (err) {
    // Silent fail - will return raw text instead
    return null;
  }
}

// ============================================
// Gateway Functions
// ============================================

/**
 * Prepare an ask request — builds context and system prompt.
 * Does NOT call Claude (the core package has no Anthropic dependency).
 * Callers use the returned systemPrompt + question to call Claude themselves.
 */
export function prepareAsk(request: AskRequest): AskPrepared {
  const question = request.question
    || DOMAIN_QUESTIONS[request.domain || ""]
    || "How am I doing today? What should I focus on?";

  const routes = matchRoutes(question);
  const context = buildAdvisorContext(question, request.biometricData, request.profile, request.tone);

  return {
    question,
    context,
    systemPrompt: context.systemPrompt,
    routes,
    request,
  };
}

/**
 * Process Claude's raw response text into a structured AskResult.
 */
export function processAskResponse(
  rawText: string,
  prepared: AskPrepared,
): AskResult {
  const nudge = parseNudgeResponse(rawText);

  // Detect domain from analyses keys
  const analysisKeys = Object.keys(prepared.context.analyses);
  const domain = analysisKeys.find((k) =>
    ["drink", "workout", "why", "coffeeCosts", "readiness"].includes(k)
  ) || "general";

  return {
    domain,
    nudge,
    raw: rawText,
    analyses: prepared.context.analyses,
  };
}

// ============================================
// Verdict Helpers (extracted from 3 duplicates)
// ============================================

export function getNudgeVerdictEmoji(verdict: string): string {
  if (verdict === "safe") return "🟢";
  if (verdict === "caution") return "🟡";
  return "🔴";
}

export function getNudgeVerdictColor(verdict: string): number {
  if (verdict === "safe") return 0x22c55e;
  if (verdict === "caution") return 0xeab308;
  return 0xef4444;
}

// ============================================
// Causality Event Collection (Phase 2 pipeline — 현재 fire-and-forget)
// ============================================

/**
 * /ask 응답 후 자동으로 CausalityEvent 수집
 *
 * 사용법 (각 앱에서):
 * ```
 * const prepared = prepareAsk(request);
 * const rawText = await callClaude(prepared);
 * const result = processAskResponse(rawText, prepared);
 * await collectEvent(prepared, result);  // fire-and-forget
 * ```
 */
export async function collectEvent(
  prepared: AskPrepared,
  result: AskResult,
): Promise<void> {
  const { request, routes } = prepared;

  // userId와 eventStore 없으면 무시 (optional feature)
  if (!request.userId || !request.eventStore) {
    return;
  }

  const event = extractEventFromAsk(
    prepared.question,
    routes,
    result.analyses,
    request.biometricData,
    request.userId,
    request.timezone,
  );

  if (!event) {
    return;
  }

  // Claude 응답에서 recommendation 항상 설정
  // (extractRecommendation이 analyses 구조에 따라 null 반환할 수 있으므로 항상 덮어씀)
  if (result.nudge) {
    const claudeVerdict = result.nudge.options[0]?.verdict ?? "safe";
    // safe/caution/risky → green/yellow/red 매핑
    const verdictMap: Record<string, string> = {
      safe: "green",
      caution: "yellow",
      risky: "red",
    };
    const verdict = verdictMap[claudeVerdict] ?? claudeVerdict;

    event.recommendation = {
      verdict,
      domain: event.domain,
      ...(event.recommendation?.suggestedLimit !== undefined
        ? { suggestedLimit: event.recommendation.suggestedLimit }
        : {}),
    };
  }

  try {
    await request.eventStore.save(event);
  } catch (err) {
    // 이벤트 저장 실패는 /ask 응답에 영향 주지 않음 (fire-and-forget)
    console.error("[causality] Failed to save event:", err);
  }
}
