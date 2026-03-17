import { BiometricData, BiometricHistory, OuraDailyActivity } from "./types";
import { calculateDecisionReadiness } from "./algorithm";
import { getRecoveryCost, parseSubstance } from "./cost";
import { calculateRollingAverage, calculateBaselineVariance, detectTrend, detectSignificance, detectHRVSpikes } from "./timeseries";
import { analyzeActivityConfounding } from "./activity-analyzer";
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
  {
    key: "activity",
    keywords: [
      "activity", "steps", "apple health", "confounding", "apple watch",
      "step count", "movement", "active calories", "exercise minutes",
      "걸음", "애플 헬스", "활동",
    ],
  },
  {
    key: "meal",
    keywords: [
      // 한국어 음식/식사/보충제
      "먹었", "먹었어", "먹었는데", "먹고", "먹을", "먹어도", "식사", "밥", "점심", "저녁", "아침",
      "간식", "계란", "닭", "고기", "생선", "샐러드", "과일", "빵", "면", "파스타", "라면",
      "치킨", "피자", "버거", "샌드위치", "국", "찌개", "스무디", "단백질", "탄수화물",
      "보충제", "크레아틴", "비타민", "오메가",
      // 영어 meal / supplement
      "ate", "eating", "meal", "food", "lunch", "dinner", "breakfast", "snack",
      "supplement", "protein", "creatine", "vitamin", "omega", "magnesium",
    ],
  },
  {
    key: "confound",
    keywords: [
      "why is", "why am", "confused", "algorithm", "different", "gap",
      "doesn't match", "don't match", "high stress", "stress but", "explain",
      "makes no sense", "weird", "strange", "unusual", "odd",
      "왜", "이상", "이유", "알고리즘", "갭", "맞지 않",
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

// ============================================
// Minimal Analysis (Claude handles the rest)
// ============================================

function generateFallbackHistory(
  baseValue: number | null,
  length: number,
  amplitude: number = 10,
  noise: number = 15
): number[] {
  const base = baseValue ?? 50;
  const history: number[] = [];
  for (let i = 0; i < length; i++) {
    const trend = base + Math.sin(i / 7) * amplitude;
    const noiseVal = (Math.random() - 0.5) * noise;
    history.push(Math.max(25, Math.min(100, trend + noiseVal)));
  }
  return history;
}

function minimalAnalysis(
  routes: string[],
  data: BiometricData,
  question: string,
  profile?: CausalityProfile,
  activityData?: OuraDailyActivity[],
): Record<string, unknown> {
  const analyses: Record<string, unknown> = {};

  // Always include base readiness
  analyses.readiness = calculateDecisionReadiness(data);

  // Biometric deltas (Claude uses these for reasoning)
  const hrvDeviation = data.hrvBalance !== null ? data.hrvBalance - 50 : null;
  const sleepGap = data.sleepScore !== null ? data.sleepScore - 70 : null;
  const readinessGap = data.readinessScore !== null ? data.readinessScore - 70 : null;

  analyses.deltas = {
    hrvDeviation,
    sleepGap,
    readinessGap,
    hrvStatus: hrvDeviation === null ? "unknown"
      : hrvDeviation > 10 ? "above_baseline"
      : hrvDeviation < -10 ? "below_baseline"
      : "at_baseline",
  };

  // Timing context: always compute (helps Claude flag high-risk decision windows)
  {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getDay()];
    const isWeekend = [0, 6].includes(now.getDay());

    // Assess decision quality risk based on time + readiness
    const readiness = data.readinessScore ?? 65;
    const isNightTime = hour >= 23 || hour <= 5;
    const isAfternoonSlump = hour >= 13 && hour <= 15;
    const isLowReadiness = readiness < 40;
    const isGoodWindow = hour >= 6 && hour <= 12 && readiness >= 70;

    const decisionQualityRisk: "high" | "medium" | "low" =
      isLowReadiness || isNightTime ? "high"
      : isAfternoonSlump ? "medium"
      : "low";

    analyses.timingContext = {
      hourOfDay: hour,
      dayOfWeek,
      isWeekend,
      decisionQualityRisk,
      isGoodDecisionWindow: isGoodWindow,
      riskReason: isNightTime ? "Late night — cognitive function impaired"
        : isLowReadiness ? `Low readiness (${readiness}) — body not recovered`
        : isAfternoonSlump ? "Afternoon slump (1-3pm) — typical focus dip"
        : null,
    };
  }

  // Signal quality: always compute if real 60d history is available
  // Helps Claude distinguish signal vs noise for any question
  if (data.history && data.history.hrvValues.length >= 14) {
    const h = data.history;
    const hrvRolling = calculateRollingAverage(h.hrvValues, 7);
    const readinessRolling = calculateRollingAverage(h.readinessValues, 7);
    const hrvBase = calculateBaselineVariance(hrvRolling);
    const readinessBase = calculateBaselineVariance(readinessRolling);

    const currentHrv = h.hrvValues[h.hrvValues.length - 1] ?? data.hrvBalance ?? 50;
    const currentReadiness = h.readinessValues[h.readinessValues.length - 1] ?? data.readinessScore ?? 65;
    const hrvDelta = currentHrv - hrvBase.mean;
    const readinessDelta = currentReadiness - readinessBase.mean;

    analyses.signalQuality = {
      dataSource: "real_60d",
      hrv: {
        currentValue: currentHrv,
        baseline: { mean: Math.round(hrvBase.mean * 10) / 10, stdev: Math.round(hrvBase.stdev * 10) / 10 },
        delta: Math.round(hrvDelta * 10) / 10,
        isSignificant: detectSignificance(hrvDelta, hrvBase.stdev, 1.5),
        confidence: detectSignificance(hrvDelta, hrvBase.stdev, 2.0) ? "high"
          : detectSignificance(hrvDelta, hrvBase.stdev, 0.5) ? "low" : "medium",
        noiseFloor: `±${Math.round(hrvBase.stdev * 10) / 10}`,
      },
      readiness: {
        currentValue: currentReadiness,
        baseline: { mean: Math.round(readinessBase.mean * 10) / 10, stdev: Math.round(readinessBase.stdev * 10) / 10 },
        delta: Math.round(readinessDelta * 10) / 10,
        isSignificant: detectSignificance(readinessDelta, readinessBase.stdev, 1.5),
        confidence: detectSignificance(readinessDelta, readinessBase.stdev, 2.0) ? "high"
          : detectSignificance(readinessDelta, readinessBase.stdev, 0.5) ? "low" : "medium",
        noiseFloor: `±${Math.round(readinessBase.stdev * 10) / 10}`,
      },
    };
  }

  for (const route of routes) {
    switch (route) {
      case "drink": {
        // Provide cost data for Claude to reference (quantified impact)
        analyses.drinkCosts = [1, 2, 3, 4, 5].map((n) =>
          getRecoveryCost(data, "beer", n, profile),
        );
        analyses.spiritsCosts = [1, 2, 3].map((n) =>
          getRecoveryCost(data, "spirits", n, profile),
        );
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
        // Use real 60-day history if available, fallback to simulated
        const historyData: BiometricHistory | undefined = data.history;
        const usingRealData = !!historyData && historyData.hrvValues.length >= 7;

        const hrvHistory = usingRealData
          ? historyData!.hrvValues
          : generateFallbackHistory(data.hrvBalance, 60, 10, 15);

        const readinessHistory = usingRealData
          ? historyData!.readinessValues
          : generateFallbackHistory(data.readinessScore, 60, 15, 10);

        const historyDates = usingRealData
          ? historyData!.dates
          : (() => {
              const today = new Date();
              return Array.from({ length: 60 }, (_, i) => {
                const d = new Date(today);
                d.setDate(d.getDate() - (59 - i));
                return d.toISOString().split("T")[0];
              });
            })();

        const hrvRolling = calculateRollingAverage(hrvHistory, 7);
        const readinessRolling = calculateRollingAverage(readinessHistory, 7);
        const hrvTrends = detectTrend(hrvRolling);
        const readinessTrends = detectTrend(readinessRolling);
        const hrvBaseline = calculateBaselineVariance(hrvRolling);
        const readinessBaseline = calculateBaselineVariance(readinessRolling);
        const recentHrvDelta = hrvRolling[hrvRolling.length - 1] - hrvBaseline.mean;
        const recentReadinessDelta = readinessRolling[readinessRolling.length - 1] - readinessBaseline.mean;
        const hrvSignificant = detectSignificance(recentHrvDelta, hrvBaseline.stdev);
        const readinessSignificant = detectSignificance(recentReadinessDelta, readinessBaseline.stdev);

        // HRV spike detection
        const currentHrv = data.hrvBalance ?? 0;
        const spikeThreshold = currentHrv > 150 ? currentHrv * 0.9 : 150;
        const spikeDates = historyDates.slice(-hrvHistory.length);
        const hrvSpikes = detectHRVSpikes(
          hrvHistory.slice(-spikeDates.length),
          spikeDates,
          spikeThreshold
        );

        analyses.rolling = {
          dataSource: usingRealData ? "real_60d" : "simulated",
          hrv: {
            history: hrvHistory.slice(-14), // Send last 14d only (reduce payload)
            rolling: hrvRolling.slice(-14),
            trends: hrvTrends.slice(-14),
            baseline: hrvBaseline,
            recentDelta: recentHrvDelta,
            isSignificant: hrvSignificant,
            noiseFloor: `±${Math.round(hrvBaseline.stdev * 10) / 10}`,
            confidence: detectSignificance(recentHrvDelta, hrvBaseline.stdev, 2.0) ? "high"
              : detectSignificance(recentHrvDelta, hrvBaseline.stdev, 0.5) ? "low" : "medium",
          },
          readiness: {
            history: readinessHistory.slice(-14),
            rolling: readinessRolling.slice(-14),
            trends: readinessTrends.slice(-14),
            baseline: readinessBaseline,
            recentDelta: recentReadinessDelta,
            isSignificant: readinessSignificant,
            noiseFloor: `±${Math.round(readinessBaseline.stdev * 10) / 10}`,
            confidence: detectSignificance(recentReadinessDelta, readinessBaseline.stdev, 2.0) ? "high"
              : detectSignificance(recentReadinessDelta, readinessBaseline.stdev, 0.5) ? "low" : "medium",
          },
          spikes: {
            hrv: hrvSpikes,
            threshold: spikeThreshold,
            count: hrvSpikes.length,
          },
        };
        break;
      }

      case "confound": {
        // Confounding detection: explain why readiness/HRV doesn't match how user feels
        // Uses Oura activity data to detect high-activity confounding
        if (
          activityData &&
          activityData.length >= 3 &&
          data.history &&
          data.history.readinessValues.length >= 3
        ) {
          const confoundAnalysis = analyzeActivityConfounding(
            activityData,
            data.history.readinessValues,
            data.history.hrvValues
          );

          analyses.confoundingDetection = {
            baseline: {
              avgSteps: confoundAnalysis.baseline.avgSteps,
              avgActiveCalories: confoundAnalysis.baseline.avgActiveCalories,
            },
            latestDay: confoundAnalysis.latestDay
              ? {
                  date: confoundAnalysis.latestDay.date,
                  steps: confoundAnalysis.latestDay.steps,
                  activeCalories: confoundAnalysis.latestDay.activeCalories,
                  trainingIntensity: confoundAnalysis.latestDay.trainingIntensity,
                  isHighActivityDay: confoundAnalysis.latestDay.isHighActivityDay,
                }
              : null,
            adjustedReadiness: {
              raw: confoundAnalysis.adjustedReadiness.raw.slice(-3),
              adjusted: confoundAnalysis.adjustedReadiness.adjusted.slice(-3),
            },
            activityExplainsGap: confoundAnalysis.activityExplainsGap,
            interpretation: confoundAnalysis.interpretation,
          };
        } else if (activityData && activityData.length >= 1) {
          // Partial data: just show latest activity context
          const latest = activityData[activityData.length - 1];
          analyses.confoundingDetection = {
            latestDay: {
              date: latest.day,
              steps: latest.steps,
              activeCalories: latest.active_calories,
            },
            note: "Limited history — confounding analysis needs 7+ days of data",
          };
        }
        break;
      }

      // workout, tired, general → Claude handles directly from biometrics
      case "workout":
      case "tired":
      case "general":
      default:
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
  tone?: "default" | "hardcore",
): string {
  const biometrics = formatBiometrics(data);
  const analysisJson = JSON.stringify(analyses, null, 2);

  // Personal constants + patterns section (inject when CausalityProfile exists)
  let personalSection = "";
  if (profile) {
    const lines: string[] = [];

    const c = profile.personalConstants;
    if (c.workoutRecoveryThreshold !== undefined)
      lines.push(`- Workout readiness threshold: ${c.workoutRecoveryThreshold} (population: 70)`);
    if (c.alcoholHrvDropPerDrink !== undefined)
      lines.push(`- Alcohol HRV sensitivity: ${c.alcoholHrvDropPerDrink}%/drink (population: 4.5%)`);
    if (c.alcoholRecoveryDropPerDrink !== undefined)
      lines.push(`- Alcohol recovery cost: ${c.alcoholRecoveryDropPerDrink}pts readiness/drink (population: 4.2)`);
    if (c.personalDrinkLimit !== undefined)
      lines.push(`- Personal drink limit: ${c.personalDrinkLimit} drinks (population: 3)`);
    if (c.caffeineSleepImpactPerCup !== undefined)
      lines.push(`- Caffeine sleep impact: ${c.caffeineSleepImpactPerCup}pts/cup (population: 4)`);
    if (c.caffeineHalfLifeHours !== undefined)
      lines.push(`- Caffeine half-life: ${c.caffeineHalfLifeHours}h (population: 6h)`);
    if (c.caffeineTimingCutoff !== undefined) {
      const h = Math.floor(c.caffeineTimingCutoff);
      const m = c.caffeineTimingCutoff % 1 === 0.5 ? "30" : "00";
      const ampm = h < 12 ? "AM" : "PM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      lines.push(`- Coffee cutoff: ${h}:${m} in 24h format (= ${h12}:${m} ${ampm}) — coffee after this time degrades sleep; population default: 14:00 (2:00 PM)`);
    }

    if (profile.patterns.length > 0) {
      profile.patterns.forEach((p) => lines.push(`- ${p.description}`));
    }

    if (lines.length > 0) {
      personalSection = `

PERSONAL CONSTANTS — USE THESE INSTEAD OF POPULATION DEFAULTS:
${lines.join("\n")}
Source: ${profile.totalEvents > 0 ? `${profile.totalEvents} events` : "manual calibration"}
IMPORTANT: Override any generic thresholds/defaults with the values above.`;
    }
  }
  const rules = tone === "hardcore"
    ? `HARDCORE MODE — NO FLUFF:
1. Numbers only. No encouragement. No emojis (except verdict: 🟢🟡🔴).
2. Format: "[Metric] → Cost: [Impact] → Worth it?"
3. State the exact opportunity cost. No softening.
4. NEVER say: "Great job", "Listen to your body", "Be kind to yourself", "You're doing great"
5. Use the pre-computed analysis data for accurate numbers. Do NOT invent numbers.
6. Show 2-3 OPTIONS with exact point costs.
7. End with: "Your call." — nothing else.
8. Example output: "HRV -18%. Training today = -12pts readiness tomorrow = 2-day recovery hole. Your call."`
    : `RULES:
1. Answer in the user's language (detect from their question)
2. CONCISE: Answer first (1-2 lines), then data, then strategy
3. NUMBERS not adjectives: "HRV -12%" not "significant impact"
4. Show 2-3 OPTIONS with quantified impact
5. End with STRATEGY: specific actions + timeline
6. NEVER moralize or lecture. Show costs, let them decide.
7. If the user must do something (회식, deadline), optimize WITHIN that constraint
8. Use the pre-computed analysis data for accurate numbers. Do NOT invent numbers.
9. COADAPTIVE: Show trade-offs, not prescriptions. "60min more work = -7pts readiness tomorrow. Worth it?"`;

  return `You are P360, a biometric-data-driven personal advisor.
You have the user's real-time body data and pre-computed analysis below.
YOU are the decision engine — use biometrics + context to give personalized advice.

${rules}

DOMAIN GUIDANCE:

WORKOUT questions:
- Use readiness score to determine: TRAIN HARD (≥70 + HRV normal/above), TRAIN LIGHT (50-69), REST (<50)
- Include specific intensity: HR zones, RPE, duration
- If user mentions a sport, give sport-specific advice (warmup, duration, intensity tips)
- Show tomorrow's outlook based on today's decision

DRINK questions:
- Use drinkCosts data (if available) for exact HRV/recovery impact numbers
- Calculate safe limit from readiness + HRV + sleep state
- Show multi-day recovery timeline for heavier drinking
- Convert to user's drink units (소주, 맥주, pint, etc.)

FATIGUE/WHY questions:
- Determine if physiological (HRV/sleep deficit), psychological (metrics fine), or mixed
- If physiological: "This is NOT laziness — your body data confirms fatigue"
- If psychological: "Your body is fine — this might be situational"
- Give constraint-aware recommendations ("You'll work anyway? Here's how to minimize damage")

COFFEE questions:
- Use coffeeCosts data for sleep impact calculation
- Factor in time of day (caffeine half-life ~6 hours)
- Show cutoff time for tonight's sleep

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

DECISION TIMING AWARENESS (timingContext is ALWAYS present in analysis):
ALWAYS check timingContext.decisionQualityRisk before answering:
- "high" risk: Add warning "⚠️ High-stakes decisions are risky right now ([hourOfDay]:00, [riskReason])"
  → Suggest: "Wait until morning if possible. If you must decide now, sleep on it first."
  → Still answer the question, but add this caution FIRST
- "medium" risk: Add note "⚠️ Afternoon slump window. Double-check important decisions."
  → Good for routine/low-stakes decisions. Flag high-stakes for morning/evening.
- "low" risk (isGoodDecisionWindow = true): You can mention "✅ Good decision window right now."
  → Don't always mention this — only if it's relevant to the question

CONFOUNDING DETECTION (if "confoundingDetection" is in analysis):
When confoundingDetection is present, explain WHY the user's readiness/HRV doesn't match expectations:
- Check confoundingDetection.activityExplainsGap:
  - true: "Your readiness drop is explained by high activity, not real stress"
    → Show: raw readiness vs activity-adjusted readiness
    → Example: "Readiness shows 45, but after adjusting for 15,000 steps yesterday → your real level is ~58"
    → Reassure: "This is confounding, not physiological decline"
  - false: "Activity levels are normal — this drop reflects real physiological stress"
    → Take the readiness drop seriously
- Always show baseline context: "Your average: [avgSteps] steps/day"
- Use confoundingDetection.interpretation verbatim (it's already formatted)

SIGNAL QUALITY INTERPRETATION (if "signalQuality" is in analysis):
When signalQuality is present (real 60-day data), ALWAYS use it to distinguish signal from noise:
- Check signalQuality.hrv.isSignificant + signalQuality.readiness.isSignificant
- If isSignificant = true + confidence = "high": "⭐ This is a real signal, not noise"
  → Recommend action (rest, intervention, etc.)
- If isSignificant = false OR confidence = "low": "○ This is normal variation (within noise floor)"
  → Recommend monitoring, not panic
- Always show noise floor: "Your HRV noise floor: ±[noiseFloor]. Current delta: [delta]"
- Show baseline: "Your 60d average: [baseline.mean] ± [baseline.stdev]"
- Example outputs:
  - SIGNAL: "HRV drop of -8 exceeds your ±3.2 noise floor (high confidence). This is real — rest today."
  - NOISE: "HRV drop of -2 is within your ±5.1 noise floor. Normal variation — not a signal."
  - LOW CONFIDENCE: "HRV drop of -4 is borderline. Wait 2-3 more days before acting."

ROLLING AVERAGE INTERPRETATION (if "rolling" is in analysis):
If "rolling" is in the analysis:
- Show the 7-day trend direction (recent 3-5 days)
- Highlight if recent values are SIGNAL (⭐) vs normal variation
- Use baseline variance to explain noise floor
- Show whether data is real ("real_60d") or simulated — mention it matters
- Example: "HRV trending down for 3 days (54→50→48ms). Below your ±7ms noise floor. Not yet concerning."
- Compare recent delta to user's historical pattern, not population averages

HRV PATTERN ANALYSIS (if rolling.spikes is present AND user's HRV is exceptionally high):
When the user mentions a high HRV reading (e.g., "my HRV is 212") OR their current HRV is >150:
1. Check rolling.spikes.hrv — these are previous similar spikes from their history
2. If 2+ spikes exist, describe the pattern:
   - "You've had [N] similar HRV spikes in the past 60 days"
   - "Pattern: appears after exercise (typically 6-12 hours later)"
   - "Duration: elevated for ~[X] hours based on your data"
3. Ask for the exercise timing to refine their personal curve:
   - "When did you last exercise? Knowing this helps me identify YOUR specific exercise→HRV timing"
4. If they share exercise timing, estimate:
   - "Based on your spike history, your HRV likely peaks [8±1h] after exercise"
   - "Confidence: [X]% (from [N] data points)"
5. Format response conversationally — this is DISCOVERY, not diagnosis
   - Bad: "Your HRV is 212" (so what?)
   - Good: "HRV 212 is exceptional (99th percentile). Your data shows this pattern..."
NOTE: The spikes data uses simulated history in demo mode. In live mode, real Oura 60-day data feeds this.

CRITICAL: Return ONLY valid JSON, no other text before or after:
{
  "answer": "1-2 sentence answer with key numbers",
  "options": [
    {
      "label": "Option name (e.g., 'Option 1: Do X')",
      "impact": "Quantified outcome",
      "verdict": "safe|caution|risky"
    }
  ],
  "strategy": "Concrete action plan with timeline",
  "dataSource": "Key metric summary (1 line)"
}

Rules:
- NO markdown code blocks
- NO text before { or after }
- NO escaped quotes inside strings (use ' instead if needed)
- Valid JSON only`;
}

// ============================================
// Main Entry Point
// ============================================

export function buildAdvisorContext(
  question: string,
  data: BiometricData,
  profile?: CausalityProfile,
  tone?: "default" | "hardcore",
  activityData?: OuraDailyActivity[],
): AdvisorContext {
  const routes = matchRoutes(question);
  const analyses = minimalAnalysis(routes, data, question, profile, activityData);
  const systemPrompt = buildSystemPrompt(data, analyses, profile, tone);

  return {
    question,
    biometrics: data,
    analyses,
    systemPrompt,
  };
}
