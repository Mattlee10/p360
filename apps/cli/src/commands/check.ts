import { fetchBiometricData, getRandomDemoData } from "../lib/oura";
import {
  calculateDecisionReadiness,
  getStatusEmoji,
  getVerdictEmoji,
  quickCheck,
} from "@p360/core";
import type { DecisionCategory } from "@p360/core";

const VALID_CATEGORIES: DecisionCategory[] = [
  "email", "meeting", "financial", "workout", "creative", "negotiation", "general",
];

interface CheckOptions {
  demo?: boolean;
  json?: boolean;
  category?: string;
  importance?: string;
}

export async function checkCommand(options: CheckOptions): Promise<void> {
  try {
    const data = options.demo
      ? getRandomDemoData()
      : await fetchBiometricData();

    // If category specified, do quick check
    if (options.category) {
      const cat = options.category.toLowerCase() as DecisionCategory;
      if (!VALID_CATEGORIES.includes(cat)) {
        console.log("");
        console.log(`  ⚠️  Unknown category: "${options.category}"`);
        console.log("");
        console.log("  Categories: " + VALID_CATEGORIES.join(", "));
        console.log("");
        return;
      }

      const importance = (options.importance as "low" | "medium" | "high" | "critical") || "medium";
      const insight = quickCheck(data, cat, importance);

      console.log("");
      console.log(`  ${getVerdictEmoji(insight.verdict)} ${insight.headline.toUpperCase()}`);
      console.log("");
      console.log(`  ${insight.action}`);
      console.log(`  ${insight.rationale}`);
      if (insight.risk) {
        console.log(`  ⚠️  ${insight.risk}`);
      }
      if (insight.retryIn) {
        console.log(`  ⏰ Retry: ${insight.retryIn}`);
      }
      console.log("");
      return;
    }

    // Full readiness check
    const result = calculateDecisionReadiness(data);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log("");
    console.log(`  ${getStatusEmoji(result.status)} READINESS: ${result.score}/100`);
    console.log("");
    console.log(`  ${result.message}`);
    console.log("");
    console.log(`  Sleep:     ${result.metrics.sleep.value ?? "N/A"} (${result.metrics.sleep.label})`);
    console.log(`  Readiness: ${result.metrics.readiness.value ?? "N/A"} (${result.metrics.readiness.label})`);
    console.log(`  HRV:       ${result.metrics.hrv.value ?? "N/A"} (${result.metrics.hrv.label})`);
    console.log("");
    console.log(`  ${result.recommendation}`);
    console.log("");
    console.log(`  ${getVerdictEmoji(result.insight.verdict)} ${result.insight.headline}`);
    console.log(`  ${result.insight.action}`);
    if (result.insight.risk) {
      console.log(`  ⚠️  ${result.insight.risk}`);
    }
    console.log("");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
