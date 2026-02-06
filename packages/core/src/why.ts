import { BiometricData } from "./types";

// ============================================
// Why Analysis Types
// ============================================

export type WhyCategory = "mood" | "energy" | "focus" | "willpower" | "general";

export type WhyVerdict = "physiological" | "mixed" | "psychological";

export type GapDirection = "aligned" | "body-worse" | "mind-worse";

export interface WhyUserInput {
  category?: WhyCategory;
  subjectiveScore?: number; // 1-10
  keywords: string[];
  rawText: string;
}

export interface GapAnalysis {
  direction: GapDirection;
  subjectiveScore: number;
  objectiveScore: number;
  explanation: string;
}

export interface WhyDataSummary {
  readiness: { value: number | null; status: string };
  hrv: { value: number | null; trend: string };
  sleep: { value: number | null };
}

export interface WhyDecision {
  verdict: WhyVerdict;
  emoji: string;
  headline: string;
  subheadline: string;
  gapAnalysis?: GapAnalysis;
  explanation: string;
  mindBodyStatement: string;
  dataSummary: WhyDataSummary;
  recommendations: string[];
  risk: string;
  reasoning: string[];
}

// ============================================
// Category Keyword Mapping
// ============================================

const CATEGORY_KEYWORDS: Record<WhyCategory, string[]> = {
  mood: ["mood", "기분", "우울", "depressed", "sad", "anxious", "불안", "짜증", "irritable"],
  energy: ["energy", "에너지", "피곤", "tired", "exhausted", "fatigue", "졸려", "sleepy"],
  focus: ["focus", "집중", "concentrate", "brain fog", "머리", "산만", "distracted"],
  willpower: ["willpower", "의지", "motivation", "동기", "lazy", "게으른", "미루", "procrastinate"],
  general: [],
};

// ============================================
// Category-Specific Explanations
// ============================================

const CATEGORY_EXPLANATIONS: Record<WhyCategory, { physiological: string; mixed: string; psychological: string }> = {
  mood: {
    physiological:
      "HRV drop indicates autonomic nervous system imbalance.\nThis directly affects your mood regulation ability.\nFeeling down or irritable may be a reflection of your body state.",
    mixed:
      "Your body state is contributing to your mood,\nbut external factors may also be involved.",
    psychological:
      "Your biometrics look stable.\nYour mood may be influenced by external circumstances or thoughts.",
  },
  energy: {
    physiological:
      "Sleep deficit + HRV drop = cellular-level fatigue.\nYou can't \"willpower\" your way through this.\nYour body simply needs rest.",
    mixed:
      "Your body is somewhat fatigued,\nbut caffeine or stress might be masking or amplifying it.",
    psychological:
      "Your body metrics look fine.\nYour tiredness might be mental fatigue or boredom.",
  },
  focus: {
    physiological:
      "REM sleep deficit directly impacts memory and concentration.\nHRV drop correlates with reduced prefrontal cortex function.\nYour brain is running on low fuel.",
    mixed:
      "Your body is partially recovered,\nbut deep focus work may still be challenging.",
    psychological:
      "Your body is ready for focus work.\nDistractions may be environmental or task-related.",
  },
  willpower: {
    physiological:
      "Willpower depends on prefrontal cortex glucose consumption.\nSleep deficit + HRV drop = prefrontal function decline.\n\"I'm lazy\" → Actually \"My brain is out of fuel.\"",
    mixed:
      "Your physiology is partly limiting your willpower,\nbut habits and environment also play a role.",
    psychological:
      "Your body has energy available.\nConsider whether it's about habits, interest, or task clarity.",
  },
  general: {
    physiological:
      "Your biometrics indicate your body is under stress.\nThis affects energy, mood, focus, and decision-making.\nWhat you're feeling is a physical response, not a mental weakness.",
    mixed:
      "Your body is somewhat stressed,\nand other factors may also be contributing.",
    psychological:
      "Your biometrics look good.\nWhat you're experiencing may be situational or psychological.",
  },
};

// ============================================
// Mind-Body Statements
// ============================================

const MIND_BODY_STATEMENTS: Record<WhyVerdict, string> = {
  physiological: "This is NOT laziness, lack of discipline, or a character flaw.",
  mixed: "Your physiology is contributing, but other factors may be involved too.",
  psychological: "Your biometrics look good. This might be situational or psychological.",
};

// ============================================
// Recommendations by Verdict and Category
// ============================================

function getRecommendations(verdict: WhyVerdict, category: WhyCategory): string[] {
  const base: Record<WhyVerdict, string[]> = {
    physiological: [
      "Routine tasks only today",
      "Consider a 20min power nap before 2pm",
      "Early bedtime tonight",
      "Postpone important decisions if possible",
    ],
    mixed: [
      "Be selective with demanding tasks",
      "Take regular breaks",
      "Monitor your energy levels",
      "Prioritize sleep tonight",
    ],
    psychological: [
      "Your body can handle challenging work",
      "Consider if environment needs adjustment",
      "Break tasks into smaller pieces",
      "Check if task clarity is the issue",
    ],
  };

  const categorySpecific: Partial<Record<WhyCategory, Record<WhyVerdict, string[]>>> = {
    mood: {
      physiological: ["Light exercise or walk may help", "Avoid difficult conversations today"],
      mixed: ["Journaling might help sort thoughts"],
      psychological: ["Talk to someone you trust"],
    },
    energy: {
      physiological: ["No caffeine after 2pm", "10min walk every 2 hours"],
      mixed: ["Moderate caffeine OK"],
      psychological: ["Change of scenery might help"],
    },
    focus: {
      physiological: ["Use Pomodoro with longer breaks", "No multitasking today"],
      mixed: ["Block distractions", "Single-task mode"],
      psychological: ["Deep work sessions OK", "Tackle hardest task first"],
    },
    willpower: {
      physiological: ["Remove decisions - set defaults", "Use environment design"],
      mixed: ["Commit to just 5 minutes", "Reward small wins"],
      psychological: ["Check task clarity", "Reconnect with purpose"],
    },
  };

  const recommendations = [...base[verdict]];
  const specific = categorySpecific[category]?.[verdict];
  if (specific) {
    recommendations.unshift(...specific);
  }

  return recommendations.slice(0, 4);
}

// ============================================
// Risk Messages
// ============================================

function getRisk(verdict: WhyVerdict): string {
  const risks: Record<WhyVerdict, string> = {
    physiological: "Pushing through risks poor decisions + 2-3 day recovery debt",
    mixed: "Overexertion may extend recovery time",
    psychological: "Low risk from body perspective - mental strategies may help more",
  };
  return risks[verdict];
}

// ============================================
// Helper Functions
// ============================================

function getScoreStatus(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 50) return "Below baseline";
  return "Low";
}

function getHrvTrend(hrvBalance: number | null): string {
  if (hrvBalance === null) return "N/A";
  const diff = hrvBalance - 50; // 50 is baseline in Oura
  if (diff >= 10) return `+${diff}% above baseline`;
  if (diff <= -10) return `${diff}% below baseline`;
  return "At baseline";
}

function calculateObjectiveScore(data: BiometricData): number {
  // Convert readiness (0-100) to 1-10 scale
  const readiness = data.readinessScore ?? 50;
  return Math.round(readiness / 10);
}

function calculateBaselineGap(readinessScore: number | null): number {
  if (readinessScore === null) return 0;
  return readinessScore - 70; // 70 is considered baseline
}

function calculatePhysiologicalScore(data: BiometricData): number {
  const readinessGap = Math.abs(calculateBaselineGap(data.readinessScore));
  const hrvDeviation = data.hrvBalance ? Math.abs(data.hrvBalance - 50) : 0;
  const sleepGap = data.sleepScore ? Math.max(0, 70 - data.sleepScore) : 0;

  return readinessGap * 0.4 + hrvDeviation * 0.4 + sleepGap * 0.2;
}

// ============================================
// Parse User Input
// ============================================

export function parseWhyInput(text: string): WhyUserInput {
  const input = text.replace(/^\/why\s*/i, "").trim();

  // Extract score (last number or number in parentheses)
  const scoreMatch = input.match(/\((\d+)\)$/) || input.match(/\b(\d+)$/);
  const score = scoreMatch ? parseInt(scoreMatch[1], 10) : undefined;

  // Find category from keywords
  let category: WhyCategory | undefined;
  const lowerInput = input.toLowerCase();

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === "general") continue;
    if (keywords.some((k) => lowerInput.includes(k))) {
      category = cat as WhyCategory;
      break;
    }
  }

  // Extract keywords (simple tokenization)
  const keywords = input
    .replace(/\(\d+\)$/, "")
    .replace(/\d+$/, "")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  return {
    category,
    subjectiveScore: score && score >= 1 && score <= 10 ? score : undefined,
    keywords,
    rawText: input,
  };
}

// ============================================
// Gap Analysis
// ============================================

export function analyzeGap(subjectiveScore: number, data: BiometricData): GapAnalysis {
  const objectiveScore = calculateObjectiveScore(data);
  const diff = subjectiveScore - objectiveScore;

  let direction: GapDirection;
  let explanation: string;

  if (Math.abs(diff) <= 2) {
    direction = "aligned";
    explanation = "Your feeling matches your body state.";
  } else if (diff > 2) {
    direction = "body-worse";
    explanation = "You feel better than your body metrics suggest.\nWatch for energy crash later today.";
  } else {
    direction = "mind-worse";
    explanation = "Your body looks fine.\nThis might be situational or psychological.";
  }

  return {
    direction,
    subjectiveScore,
    objectiveScore,
    explanation,
  };
}

// ============================================
// Main Why Decision Algorithm
// ============================================

export function getWhyDecision(
  data: BiometricData,
  userInput?: WhyUserInput
): WhyDecision {
  const category: WhyCategory = userInput?.category || "general";
  const physiologicalScore = calculatePhysiologicalScore(data);

  // Determine verdict
  let verdict: WhyVerdict;
  if (physiologicalScore > 15) {
    verdict = "physiological";
  } else if (physiologicalScore > 8) {
    verdict = "mixed";
  } else {
    verdict = "psychological";
  }

  // If user provided subjective score, analyze gap
  let gapAnalysis: GapAnalysis | undefined;
  if (userInput?.subjectiveScore) {
    gapAnalysis = analyzeGap(userInput.subjectiveScore, data);

    // Adjust verdict based on gap
    if (gapAnalysis.direction === "body-worse" && verdict === "psychological") {
      verdict = "mixed"; // Body is worse than they feel
    } else if (gapAnalysis.direction === "mind-worse" && verdict === "physiological") {
      verdict = "mixed"; // They feel worse than body suggests
    }
  }

  // Build headlines based on verdict and gap
  let emoji: string;
  let headline: string;
  let subheadline: string;

  if (gapAnalysis) {
    switch (gapAnalysis.direction) {
      case "aligned":
        emoji = verdict === "physiological" ? "🧠" : "✅";
        headline = verdict === "physiological" ? "IT'S YOUR BODY, NOT YOUR MIND" : "YOU'RE IN SYNC";
        subheadline =
          verdict === "physiological"
            ? "Your feeling matches your body - this fatigue is real."
            : "Your feeling matches your body state.";
        break;
      case "body-worse":
        emoji = "⚠️";
        headline = "BODY WORSE THAN YOU FEEL";
        subheadline = "You feel okay, but your body is stressed.";
        break;
      case "mind-worse":
        emoji = "🤔";
        headline = "YOUR BODY IS FINE";
        subheadline = "Your metrics look good - this might be mental.";
        break;
    }
  } else {
    // No subjective input - default messages
    switch (verdict) {
      case "physiological":
        emoji = "🧠";
        headline = "IT'S YOUR BODY, NOT YOUR MIND";
        subheadline = "What you're feeling is physiological, not psychological.";
        break;
      case "mixed":
        emoji = "🔄";
        headline = "BODY + MIND BOTH PLAYING A ROLE";
        subheadline = "Your physiology is a factor, but not the whole story.";
        break;
      case "psychological":
        emoji = "✅";
        headline = "YOUR BODY IS READY";
        subheadline = "Your biometrics look good today.";
        break;
    }
  }

  // Build reasoning
  const reasoning: string[] = [];
  if (data.readinessScore !== null) {
    const gap = calculateBaselineGap(data.readinessScore);
    if (gap < -10) {
      reasoning.push(`Readiness ${data.readinessScore} - below baseline`);
    } else if (gap > 10) {
      reasoning.push(`Readiness ${data.readinessScore} - above baseline`);
    } else {
      reasoning.push(`Readiness ${data.readinessScore} - at baseline`);
    }
  }

  if (data.hrvBalance !== null) {
    const hrvDiff = data.hrvBalance - 50;
    if (hrvDiff < -10) {
      reasoning.push(`HRV ${hrvDiff}% below baseline - nervous system stressed`);
    } else if (hrvDiff > 10) {
      reasoning.push(`HRV +${hrvDiff}% above baseline - well recovered`);
    } else {
      reasoning.push(`HRV at baseline`);
    }
  }

  if (data.sleepScore !== null) {
    if (data.sleepScore < 60) {
      reasoning.push(`Sleep score ${data.sleepScore} - poor recovery`);
    } else if (data.sleepScore < 70) {
      reasoning.push(`Sleep score ${data.sleepScore} - moderate`);
    } else {
      reasoning.push(`Sleep score ${data.sleepScore} - good`);
    }
  }

  return {
    verdict,
    emoji,
    headline,
    subheadline,
    gapAnalysis,
    explanation: CATEGORY_EXPLANATIONS[category][verdict],
    mindBodyStatement: MIND_BODY_STATEMENTS[verdict],
    dataSummary: {
      readiness: {
        value: data.readinessScore,
        status: getScoreStatus(data.readinessScore),
      },
      hrv: {
        value: data.hrvBalance,
        trend: getHrvTrend(data.hrvBalance),
      },
      sleep: {
        value: data.sleepScore,
      },
    },
    recommendations: getRecommendations(verdict, category),
    risk: getRisk(verdict),
    reasoning,
  };
}
