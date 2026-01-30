import { fetchBiometricData, getRandomDemoData } from "../lib/oura";
import {
  getWorkoutDecision,
  formatWorkoutCLI,
  formatWorkoutJSON,
  formatWorkoutCompact,
} from "../lib/workout";

interface WorkoutOptions {
  json?: boolean;
  compact?: boolean;
  demo?: boolean;
}

export async function workoutCommand(options: WorkoutOptions): Promise<void> {
  try {
    // Fetch biometric data
    const data = options.demo
      ? getRandomDemoData()
      : await fetchBiometricData();

    // Get workout decision
    const decision = getWorkoutDecision(data);

    // Output based on format
    if (options.json) {
      console.log(formatWorkoutJSON(decision));
    } else if (options.compact) {
      console.log(formatWorkoutCompact(decision));
    } else {
      console.log(formatWorkoutCLI(decision));
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
