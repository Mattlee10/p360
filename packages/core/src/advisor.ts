import { BiometricData } from "./types";
import { calculateDecisionReadiness } from "./algorithm";
import { getDrinkDecision, getSocialStrategy } from "./drink";
import { getRecoveryCost, parseSubstance } from "./cost";
import { getWhyDecision, parseWhyInput } from "./why";
import { getWorkoutDecision, parseSport } from "./workout";

// ============================================
// Advisor Types
// ============================================

export interface NudgeOption {
  label: string;
  impact: string;
  verdict: "safe" | "caution" | "risky";
}

export interface NudgeResponse {
  answer: string;
  options: NudgeOption[];
  strategy: string;
  dataSource: string;
}

export interface AdvisorContext {
  question: string;
  biometrics: BiometricData;
  analyses: Record<string, unknown>;
  systemPrompt: string;
}

// ============================================
// Keyword Router
// ============================================

interface RouteMatch {
  key: string;
  keywords: string[];
}

const ROUTES: RouteMatch[] = [
  {
    key: "drink",
    keywords: [
      "drink", "beer", "wine", "soju", "alcohol", "술", "맥주", "소주", "와인",
      "회식", "회식인데", "마셔", "마실", "한잔", "잔", "칵테일", "cocktail",
      "whiskey", "위스키", "vodka", "rum", "gin", "tequila", "막걸리",
      "소맥", "폭탄주", "pub", "bar", "drinking",
    ],
  },
  {
    key: "workout",
    keywords: [
      "workout", "exercise", "gym", "운동", "train", "training", "run", "running",
      "basketball", "농구", "soccer", "축구", "swim", "swimming", "수영",
      "cycling", "자전거", "yoga", "요가", "crossfit", "weights", "lifting",
      "tennis", "테니스", "golf", "골프", "hiking", "등산", "climbing", "클라이밍",
      "bjj", "martial", "무술", "격투기", "복싱", "boxing", "마라톤", "marathon",
    ],
  },
  {
    key: "tired",
    keywords: [
      "tired", "fatigue", "exhausted", "피곤", "졸려", "sleepy", "energy",
      "에너지", "집중", "focus", "brain fog", "기분", "mood", "우울",
      "의지", "willpower", "motivation", "동기", "why", "왜",
      "눈", "두통", "headache", "머리", "무기력",
    ],
  },
  {
    key: "coffee",
    keywords: [
      "coffee", "커피", "caffeine", "카페인", "espresso", "에스프레소",
      "latte", "라떼", "americano", "아메리카노", "tea", "차", "matcha", "마차",
    ],
  },
  {
    key: "cost",
    keywords: [
      "cost", "recovery", "회복", "impact", "영향", "얼마나", "how much",
      "what if", "만약", "forecast", "예측",
    ],
  },
];

function matchRoutes(question: string): string[] {
  const lower = question.toLowerCase();
  const matched: string[] = [];

  for (const route of ROUTES) {
    if (route.keywords.some((kw) => lower.includes(kw))) {
      matched.push(route.key);
    }
  }

  return matched.length > 0 ? matched : ["general"];
}

// ============================================
// Analysis Runner
// ============================================

function runAnalyses(
  routes: string[],
  data: BiometricData,
  question: string,
): Record<string, unknown> {
  const analyses: Record<string, unknown> = {};

  // Always include base readiness
  analyses.readiness = calculateDecisionReadiness(data);

  for (const route of routes) {
    switch (route) {
      case "drink": {
        analyses.drink = getDrinkDecision(data);
        analyses.socialStrategy = getSocialStrategy(getDrinkDecision(data));

        // Run cost for common drink amounts
        analyses.drinkCosts = [1, 2, 3, 4, 5].map((n) =>
          getRecoveryCost(data, "beer", n),
        );

        // Also add spirits cost for soju/cocktail context
        analyses.spiritsCosts = [1, 2, 3].map((n) =>
          getRecoveryCost(data, "spirits", n),
        );
        break;
      }

      case "workout": {
        // Try to detect sport from question
        const sportWords = question.toLowerCase().split(/\s+/);
        let sport = undefined;
        for (const word of sportWords) {
          const parsed = parseSport(word);
          if (parsed) {
            sport = parsed;
            break;
          }
        }
        analyses.workout = getWorkoutDecision(data, sport);
        break;
      }

      case "tired": {
        const whyInput = parseWhyInput(question);
        analyses.why = getWhyDecision(data, whyInput);
        break;
      }

      case "coffee": {
        analyses.coffeeCosts = [1, 2, 3].map((n) =>
          getRecoveryCost(data, "coffee", n),
        );

        analyses.teaCosts = [1, 2, 3].map((n) =>
          getRecoveryCost(data, "tea", n),
        );
        break;
      }

      case "cost": {
        // Try to find substance in question
        const words = question.toLowerCase().split(/\s+/);
        for (const word of words) {
          const sub = parseSubstance(word);
          if (sub) {
            analyses[`${sub}Costs`] = [1, 2, 3, 4, 5].map((n) =>
              getRecoveryCost(data, sub, n),
            );
            break;
          }
        }
        break;
      }

      case "general":
      default:
        // readiness already included above
        break;
    }
  }

  return analyses;
}

// ============================================
// System Prompt Builder
// ============================================

function formatBiometrics(data: BiometricData): string {
  const sleep = data.sleepScore ?? "N/A";
  const sleepStatus = data.sleepScore === null ? "unknown"
    : data.sleepScore >= 85 ? "Excellent"
    : data.sleepScore >= 70 ? "Good"
    : data.sleepScore >= 60 ? "Fair"
    : "Low";

  const readiness = data.readinessScore ?? "N/A";
  const readinessStatus = data.readinessScore === null ? "unknown"
    : data.readinessScore >= 85 ? "Excellent"
    : data.readinessScore >= 70 ? "Good"
    : data.readinessScore >= 50 ? "Fair"
    : "Low";

  const hrvDiff = data.hrvBalance !== null ? data.hrvBalance - 50 : null;
  const hrvTrend = hrvDiff === null ? "unknown"
    : hrvDiff > 10 ? `+${hrvDiff}% above baseline`
    : hrvDiff < -10 ? `${hrvDiff}% below baseline`
    : "at baseline";

  return [
    `Sleep: ${sleep}/100 (${sleepStatus})`,
    `Readiness: ${readiness}/100 (${readinessStatus})`,
    `HRV balance: ${data.hrvBalance ?? "N/A"} (${hrvTrend})`,
    `Date: ${data.date}`,
  ].join("\n");
}

export function buildSystemPrompt(
  data: BiometricData,
  analyses: Record<string, unknown>,
): string {
  const biometrics = formatBiometrics(data);
  const analysisJson = JSON.stringify(analyses, null, 2);

  return `You are P360, a biometric-data-driven personal advisor.
You have the user's real-time body data and pre-computed analysis below.

RULES:
1. Answer in the user's language (detect from their question)
2. CONCISE: Answer first (1-2 lines), then data, then strategy
3. NUMBERS not adjectives: "HRV -12%" not "significant impact"
4. Show 2-3 OPTIONS with quantified impact
5. End with STRATEGY: specific actions + timeline
6. NEVER moralize or lecture. Show costs, let them decide.
7. If the user must do something (회식, deadline), optimize WITHIN that constraint
8. Use the pre-computed analysis data for accurate numbers. Do NOT invent numbers.

DRINK UNIT CONVERSION:
When the user mentions drinks, convert to standard drinks for impact calculation.
Use the pre-computed analysis data (which is in standard drink units) and
translate back to the user's actual drink types/sizes in your response.
Examples:
- 소주 1잔 (50ml, 16%) ≈ 0.6 standard drinks
- 소주 1병 (360ml) ≈ 4.3 standard drinks
- 맥주 500cc (5%) ≈ 1.4 standard drinks
- 맥주 330ml (5%) ≈ 1.0 standard drinks
- a pint of IPA (568ml, 6%) ≈ 1.9 standard drinks
- a glass of wine (150ml, 13%) ≈ 1.5 standard drinks
Always respond in the user's drink units, not standard drinks.

BODY STATE:
${biometrics}

PRE-COMPUTED ANALYSIS:
${analysisJson}

Respond in this JSON format:
{
  "answer": "Direct answer with key numbers (1-2 sentences)",
  "options": [
    { "label": "Option name", "impact": "Quantified impact", "verdict": "safe|caution|risky" }
  ],
  "strategy": "Step-by-step action plan with timeline",
  "dataSource": "Key metrics summary (1 line)"
}`;
}

// ============================================
// Main Entry Point
// ============================================

export function buildAdvisorContext(
  question: string,
  data: BiometricData,
): AdvisorContext {
  const routes = matchRoutes(question);
  const analyses = runAnalyses(routes, data, question);
  const systemPrompt = buildSystemPrompt(data, analyses);

  return {
    question,
    biometrics: data,
    analyses,
    systemPrompt,
  };
}
