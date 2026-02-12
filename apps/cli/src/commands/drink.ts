import { fetchBiometricData, getRandomDemoData } from "../lib/oura";
import { getDrinkHistory, addDrinkLog } from "../lib/config";
import {
  getDrinkDecision,
  getSocialStrategy,
  calculateDrinkHistory,
} from "@p360/core";
import type { DrinkLog } from "@p360/core";

interface DrinkOptions {
  demo?: boolean;
  json?: boolean;
}

export async function drinkCommand(options: DrinkOptions): Promise<void> {
  try {
    const data = options.demo
      ? getRandomDemoData()
      : await fetchBiometricData();

    const logs = getDrinkHistory();
    const history = logs.length > 0 ? calculateDrinkHistory(logs) : undefined;
    const decision = getDrinkDecision(data, history);

    if (options.json) {
      console.log(JSON.stringify(decision, null, 2));
      return;
    }

    console.log("");
    console.log(`  ${decision.emoji} ${decision.headline.toUpperCase()}`);
    console.log("");
    console.log(`  ${decision.subheadline}`);
    console.log("");

    // Limits
    console.log(`  🟢 Safe: ${decision.greenLimit} drinks`);
    console.log(`  🟡 Caution: ${decision.yellowLimit} drinks`);
    console.log(`  🔴 Stop: ${decision.redThreshold}+ drinks`);
    console.log("");

    // Impact table
    console.log("  Impact forecast:");
    decision.impacts.forEach((impact) => {
      const marker = impact.drinks <= decision.greenLimit ? "🟢"
        : impact.drinks <= decision.yellowLimit ? "🟡" : "🔴";
      console.log(`    ${marker} ${impact.drinks} drink${impact.drinks > 1 ? "s" : ""}: HRV ${impact.hrvDrop}, ${impact.recoveryTime}`);
    });
    console.log("");

    // Tips
    console.log("  Tips:");
    decision.tips.forEach((tip) => {
      console.log(`    • ${tip}`);
    });
    console.log("");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export async function drinkLogCommand(amount: string): Promise<void> {
  const drinks = parseInt(amount, 10);
  if (isNaN(drinks) || drinks < 1 || drinks > 20) {
    console.log("  ⚠️  Please provide a valid number (1-20)");
    return;
  }

  const log: DrinkLog = {
    date: new Date().toISOString().split("T")[0],
    amount: drinks,
    timestamp: new Date(),
  };

  addDrinkLog(log);
  console.log("");
  console.log(`  ✅ Logged ${drinks} drink${drinks > 1 ? "s" : ""} for today`);

  // Show impact
  const logs = getDrinkHistory();
  const recentCount = logs
    .filter((l) => {
      const daysAgo = Math.floor((Date.now() - new Date(l.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      return daysAgo <= 7;
    })
    .reduce((sum, l) => sum + l.amount, 0);

  console.log(`  📊 This week: ${recentCount} total drinks`);
  console.log("");
}

export async function drinkSocialCommand(options: DrinkOptions): Promise<void> {
  try {
    const data = options.demo
      ? getRandomDemoData()
      : await fetchBiometricData();

    const decision = getDrinkDecision(data);
    const strategy = getSocialStrategy(decision);

    console.log("");
    console.log(`  🎉 ${strategy.headline}`);
    console.log("");
    console.log(`  Tonight's limit: ${strategy.limit} drinks`);
    console.log("");
    strategy.tips.forEach((tip) => {
      console.log(`    • ${tip}`);
    });
    console.log("");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
