import { fetchBiometricData, getRandomDemoData } from "../lib/oura";
import {
  getWorkoutDecision,
  formatWorkoutCLI,
  formatWorkoutJSON,
  formatWorkoutCompact,
} from "../lib/workout";
import { Sport } from "../lib/types";

const VALID_SPORTS: Sport[] = [
  "basketball",
  "running",
  "cycling",
  "weightlifting",
  "crossfit",
  "swimming",
  "yoga",
  "soccer",
  "tennis",
  "golf",
  "hiking",
  "climbing",
  "martial_arts",
];

interface WorkoutOptions {
  json?: boolean;
  compact?: boolean;
  demo?: boolean;
  sport?: string;
}

function parseSport(input?: string): Sport | undefined {
  if (!input) return undefined;

  const normalized = input.toLowerCase().replace(/[-\s]/g, "_");

  // Handle aliases
  const aliases: Record<string, Sport> = {
    bball: "basketball",
    hoops: "basketball",
    run: "running",
    jog: "running",
    bike: "cycling",
    weights: "weightlifting",
    lifting: "weightlifting",
    gym: "weightlifting",
    cf: "crossfit",
    swim: "swimming",
    football: "soccer",
    futbol: "soccer",
    hike: "hiking",
    climb: "climbing",
    bouldering: "climbing",
    bjj: "martial_arts",
    mma: "martial_arts",
    jiu_jitsu: "martial_arts",
    boxing: "martial_arts",
    muay_thai: "martial_arts",
    karate: "martial_arts",
    judo: "martial_arts",
  };

  if (aliases[normalized]) {
    return aliases[normalized];
  }

  if (VALID_SPORTS.includes(normalized as Sport)) {
    return normalized as Sport;
  }

  return undefined;
}

export async function workoutCommand(options: WorkoutOptions): Promise<void> {
  try {
    // Parse sport if provided
    const sport = parseSport(options.sport);

    if (options.sport && !sport) {
      console.log("");
      console.log(`  ⚠️  Unknown sport: "${options.sport}"`);
      console.log("");
      console.log("  Supported sports:");
      VALID_SPORTS.forEach((s) => {
        console.log(`    • ${s.replace(/_/g, " ")}`);
      });
      console.log("");
      return;
    }

    // Fetch biometric data
    const data = options.demo
      ? getRandomDemoData()
      : await fetchBiometricData();

    // Get workout decision
    const decision = getWorkoutDecision(data, sport);

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
