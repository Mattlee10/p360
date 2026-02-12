import { fetchBiometricData, getRandomDemoData } from "../lib/oura";
import {
  getWorkoutDecision,
  formatWorkoutCLI,
  formatWorkoutJSON,
  parseSport,
  getSportList,
} from "@p360/core";

interface WorkoutOptions {
  json?: boolean;
  demo?: boolean;
  sport?: string;
}

export async function workoutCommand(options: WorkoutOptions): Promise<void> {
  try {
    const sport = parseSport(options.sport);

    if (options.sport && !sport) {
      console.log("");
      console.log(`  ⚠️  Unknown sport: "${options.sport}"`);
      console.log("");
      console.log("  Supported sports:");
      getSportList().forEach((s) => {
        console.log(`    • ${s}`);
      });
      console.log("");
      return;
    }

    const data = options.demo
      ? getRandomDemoData()
      : await fetchBiometricData();

    const decision = getWorkoutDecision(data, sport);

    if (options.json) {
      console.log(formatWorkoutJSON(decision));
    } else {
      console.log(formatWorkoutCLI(decision));
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
