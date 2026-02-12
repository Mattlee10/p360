import { fetchBiometricData, getRandomDemoData } from "../lib/oura";
import { getWhyDecision, parseWhyInput } from "@p360/core";

interface WhyOptions {
  demo?: boolean;
  json?: boolean;
  score?: string;
}

export async function whyCommand(keyword: string | undefined, options: WhyOptions): Promise<void> {
  try {
    const data = options.demo
      ? getRandomDemoData()
      : await fetchBiometricData();

    // Build input text from keyword + score
    let inputText = keyword || "";
    if (options.score) {
      inputText += ` ${options.score}`;
    }

    const userInput = inputText ? parseWhyInput(inputText) : undefined;
    const decision = getWhyDecision(data, userInput);

    if (options.json) {
      console.log(JSON.stringify(decision, null, 2));
      return;
    }

    console.log("");
    console.log(`  ${decision.emoji} ${decision.headline}`);
    console.log("");
    console.log(`  ${decision.subheadline}`);
    console.log("");

    // Gap analysis if available
    if (decision.gapAnalysis) {
      const gap = decision.gapAnalysis;
      console.log(`  You feel: ${gap.subjectiveScore}/10`);
      console.log(`  Body says: ${gap.objectiveScore}/10`);
      console.log(`  ${gap.explanation}`);
      console.log("");
    }

    // Explanation
    decision.explanation.split("\n").forEach((line) => {
      console.log(`  ${line}`);
    });
    console.log("");

    // Mind-body statement
    console.log(`  💡 ${decision.mindBodyStatement}`);
    console.log("");

    // Data
    const ds = decision.dataSummary;
    console.log(`  Readiness: ${ds.readiness.value ?? "N/A"} (${ds.readiness.status})`);
    console.log(`  HRV: ${ds.hrv.trend}`);
    console.log(`  Sleep: ${ds.sleep.value ?? "N/A"}`);
    console.log("");

    // Recommendations
    console.log("  What to do:");
    decision.recommendations.forEach((rec) => {
      console.log(`    • ${rec}`);
    });
    console.log("");

    console.log(`  ⚠️  ${decision.risk}`);
    console.log("");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
