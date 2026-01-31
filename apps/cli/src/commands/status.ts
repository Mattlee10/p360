import { isLoggedIn, getConfigPath } from "../lib/config";
import { fetchBiometricData } from "../lib/oura";

export async function statusCommand(): Promise<void> {
  console.log("");
  console.log("  📊 P360 Status");
  console.log("");
  console.log("  ─────────────────────────────────────");
  console.log("");

  // Check login status
  const loggedIn = isLoggedIn();
  console.log(`  Oura Connected: ${loggedIn ? "✅ Yes" : "❌ No"}`);
  console.log(`  Config Path:    ${getConfigPath()}`);

  if (loggedIn) {
    console.log("");
    console.log("  Fetching latest data...");

    try {
      const data = await fetchBiometricData();
      console.log("");
      console.log(`  Date:           ${data.date}`);
      console.log(`  Sleep Score:    ${data.sleepScore ?? "N/A"}`);
      console.log(`  Readiness:      ${data.readinessScore ?? "N/A"}`);
      console.log(`  HRV Balance:    ${data.hrvBalance ?? "N/A"}`);
      console.log(`  Resting HR:     ${data.restingHR ?? "N/A"}`);
    } catch (error) {
      console.log("");
      console.log(
        `  ❌ Error fetching data: ${error instanceof Error ? error.message : error}`
      );
    }
  } else {
    console.log("");
    console.log("  Run 'p360 login' to connect your Oura Ring");
  }

  console.log("");
}
