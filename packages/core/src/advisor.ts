import { BiometricData } from "./types";
import { calculateDecisionReadiness } from "./algorithm";
import { getDrinkDecision, getSocialStrategy } from "./drink";
import { getRecoveryCost, parseSubstance } from "./cost";
import { getWhyDecision, parseWhyInput } from "./why";
import { getWorkoutDecision, parseSport } from "./workout";
import { calculateRollingAverage, calculateBaselineVariance, detectTrend, detectSignificance } from "./timeseries";
import type { CausalityProfile } from "./causality";

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
  {
    key: "rolling",
    keywords: [
      "rolling", "trend", "추세", "7-day", "7일", "average", "평균", "smooth",
      "signal", "신호", "noise", "노이즈", "pattern", "패턴", "history", "역사",
    ],
  },
];

export function matchRoutes(question: string): string[] {
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
  profile?: CausalityProfile,
): Record<string, unknown> {
  const analyses: Record<string, unknown> = {};

  // Always include base readiness
  analyses.readiness = calculateDecisionReadiness(data);

  for (const route of routes) {
    switch (route) {
      case "drink": {
        analyses.drink = getDrinkDecision(data, undefined, profile);
        analyses.socialStrategy = getSocialStrategy(getDrinkDecision(data, undefined, profile));

        // Run cost for common drink amounts (with personal constants)
        analyses.drinkCosts = [1, 2, 3, 4, 5].map((n) =>
          getRecoveryCost(data, "beer", n, profile),
        );

        // Also add spirits cost for soju/cocktail context
        analyses.spiritsCosts = [1, 2, 3].map((n) =>
          getRecoveryCost(data, "spirits", n, profile),
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
          getRecoveryCost(data, "coffee", n, profile),
        );

        analyses.teaCosts = [1, 2, 3].map((n) =>
          getRecoveryCost(data, "tea", n, profile),
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
              getRecoveryCost(data, sub, n, profile),
            );
            break;
          }
        }
        break;
      }

      case "rolling": {
        // Time-series analysis with rolling averages
        // Generate synthetic historical data for demo purposes
        // In production, this would come from Oura API historical fetch

        const historyLength = 60;
        const hrvHistory: number[] = [];
        const readinessHistory: number[] = [];

        // Generate realistic synthetic history
        for (let i = 0; i < historyLength; i++) {
          const baseHrv = (data.hrvBalance ?? 50) + Math.sin(i / 7) * 10;
          const noiseHrv = (Math.random() - 0.5) * 15;
          hrvHistory.push(Math.max(25, baseHrv + noiseHrv));

          const baseReadiness = (data.readinessScore ?? 65) + Math.sin(i / 7) * 15;
          const noiseReadiness = (Math.random() - 0.5) * 10;
          readinessHistory.push(Math.max(0, Math.min(100, baseReadiness + noiseReadiness)));
        }

        // Calculate rolling averages (7-day default)
        const hrvRolling = calculateRollingAverage(hrvHistory, 7);
        const readinessRolling = calculateRollingAverage(readinessHistory, 7);

        // Detect trends
        const hrvTrends = detectTrend(hrvRolling);
        const readinessTrends = detectTrend(readinessRolling);

        // Calculate baselines
        const hrvBaseline = calculateBaselineVariance(hrvRolling);
        const readinessBaseline = calculateBaselineVariance(readinessRolling);

        // Detect recent peaks
        const recentHrvDelta = hrvRolling[hrvRolling.length - 1] - hrvBaseline.mean;
        const recentReadinessDelta = readinessRolling[readinessRolling.length - 1] - readinessBaseline.mean;

        const hrvSignificant = detectSignificance(recentHrvDelta, hrvBaseline.stdev);
        const readinessSignificant = detectSignificance(recentReadinessDelta, readinessBaseline.stdev);

        analyses.rolling = {
          hrv: {
            history: hrvHistory,
            rolling: hrvRolling,
            trends: hrvTrends,
            baseline: hrvBaseline,
            recentDelta: recentHrvDelta,
            isSignificant: hrvSignificant,
          },
          readiness: {
            history: readinessHistory,
            rolling: readinessRolling,
            trends: readinessTrends,
            baseline: readinessBaseline,
            recentDelta: recentReadinessDelta,
            isSignificant: readinessSignificant,
          },
        };
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
  profile?: CausalityProfile,
): string {
  const biometrics = formatBiometrics(data);
  const analysisJson = JSON.stringify(analyses, null, 2);

  // Personal patterns section (only if patterns exist)
  let personalSection = "";
  if (profile && profile.patterns.length > 0) {
    const patternLines = profile.patterns.map((p) => `- ${p.description}`).join("\n");
    personalSection = `

PERSONAL PATTERNS (learned from ${profile.totalEvents} historical events):
${patternLines}
IMPORTANT: These are THIS user's actual measured sensitivities, not population averages.
The pre-computed analysis already uses these personal values. Reference them in your response.`;
  }

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
${analysisJson}${personalSection}

ROLLING AVERAGE INTERPRETATION (if present in analysis):
If "rolling" is in the analysis:
- Show the 7-day trend direction (recent 3-5 days)
- Highlight if recent values are SIGNAL (⭐) vs normal variation
- Use baseline variance to explain noise floor
- Example: "HRV trending down for 3 days (54→50→48ms). Below your ±7ms noise floor. Not yet concerning."
- Compare recent delta to user's historical pattern, not population averages

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
  profile?: CausalityProfile,
): AdvisorContext {
  const routes = matchRoutes(question);
  const analyses = runAnalyses(routes, data, question, profile);
  const systemPrompt = buildSystemPrompt(data, analyses, profile);

  return {
    question,
    biometrics: data,
    analyses,
    systemPrompt,
  };
}
