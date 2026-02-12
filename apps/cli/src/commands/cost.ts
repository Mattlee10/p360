import { fetchBiometricData, getRandomDemoData } from "../lib/oura";
import {
  getRecoveryCost,
  parseSubstance,
  getSubstanceList,
} from "@p360/core";

interface CostOptions {
  demo?: boolean;
  json?: boolean;
}

export async function costCommand(
  substance: string | undefined,
  amount: string | undefined,
  options: CostOptions,
): Promise<void> {
  try {
    if (!substance) {
      console.log("");
      console.log("  Usage: p360 cost <substance> [amount]");
      console.log("");
      console.log("  Substances: " + getSubstanceList().join(", "));
      console.log("");
      console.log("  Examples:");
      console.log("    p360 cost beer 3");
      console.log("    p360 cost coffee 2");
      console.log("    p360 cost wine");
      console.log("");
      return;
    }

    const parsed = parseSubstance(substance);
    if (!parsed) {
      console.log("");
      console.log(`  ⚠️  Unknown substance: "${substance}"`);
      console.log("  Available: " + getSubstanceList().join(", "));
      console.log("");
      return;
    }

    const count = amount ? parseInt(amount, 10) : 1;
    if (isNaN(count) || count < 1 || count > 20) {
      console.log("  ⚠️  Amount must be 1-20");
      return;
    }

    const data = options.demo
      ? getRandomDemoData()
      : await fetchBiometricData();

    const result = getRecoveryCost(data, parsed, count);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log("");
    console.log(`  ${result.emoji} ${result.headline.toUpperCase()}`);
    console.log("");
    console.log(`  ${result.subheadline}`);
    console.log("");

    // Timeline
    console.log("  Recovery timeline:");
    result.timeline.forEach((day) => {
      const capacity = day.workoutCapacity === "full" ? "🟢 full"
        : day.workoutCapacity === "moderate" ? "🟡 moderate"
        : day.workoutCapacity === "light only" ? "🟠 light only"
        : "🔴 none";
      const sleep = day.sleepImpact ? ` | ${day.sleepImpact}` : "";
      console.log(`    ${day.label}: HRV ${day.hrvChange}% | recovery -${day.recoveryDrop}% | workout: ${capacity}${sleep}`);
    });
    console.log("");

    // Tradeoff summary
    console.log(`  💡 ${result.tradeoff}`);
    console.log(`  📅 Total recovery: ${result.totalRecoveryDays} day${result.totalRecoveryDays !== 1 ? "s" : ""}`);
    console.log("");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
