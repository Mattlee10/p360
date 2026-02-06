import { BiometricData } from "./types";

/**
 * Default demo data for testing without a wearable device
 */
const DEMO_DATA: BiometricData = {
  sleepScore: 72,
  readinessScore: 65,
  hrvBalance: 45,
  restingHR: 58,
  date: new Date().toISOString().split("T")[0],
};

/**
 * Get static demo data
 */
export function getDemoData(): BiometricData {
  return {
    ...DEMO_DATA,
    date: new Date().toISOString().split("T")[0],
  };
}

/**
 * Get random demo data from 5 realistic scenarios
 * - Scenario 1: Excellent recovery (green light)
 * - Scenario 2: Good recovery (proceed)
 * - Scenario 3: Moderate recovery (caution)
 * - Scenario 4: Poor recovery (rest recommended)
 * - Scenario 5: Very poor recovery (rest required)
 */
export function getRandomDemoData(): BiometricData {
  const scenarios: Omit<BiometricData, "date">[] = [
    { sleepScore: 88, readinessScore: 85, hrvBalance: 65, restingHR: 52 }, // Excellent
    { sleepScore: 75, readinessScore: 72, hrvBalance: 55, restingHR: 55 }, // Good
    { sleepScore: 65, readinessScore: 58, hrvBalance: 45, restingHR: 58 }, // Moderate
    { sleepScore: 55, readinessScore: 42, hrvBalance: 35, restingHR: 62 }, // Poor
    { sleepScore: 45, readinessScore: 28, hrvBalance: 25, restingHR: 68 }, // Very poor
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

  return {
    ...scenario,
    date: new Date().toISOString().split("T")[0],
  };
}

/**
 * Get specific demo scenario by index (0-4)
 * Useful for testing specific conditions
 */
export function getDemoScenario(index: number): BiometricData {
  const scenarios: Omit<BiometricData, "date">[] = [
    { sleepScore: 88, readinessScore: 85, hrvBalance: 65, restingHR: 52 },
    { sleepScore: 75, readinessScore: 72, hrvBalance: 55, restingHR: 55 },
    { sleepScore: 65, readinessScore: 58, hrvBalance: 45, restingHR: 58 },
    { sleepScore: 55, readinessScore: 42, hrvBalance: 35, restingHR: 62 },
    { sleepScore: 45, readinessScore: 28, hrvBalance: 25, restingHR: 68 },
  ];

  const safeIndex = Math.max(0, Math.min(4, index));
  return {
    ...scenarios[safeIndex],
    date: new Date().toISOString().split("T")[0],
  };
}
