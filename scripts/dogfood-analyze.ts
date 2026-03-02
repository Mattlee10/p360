/**
 * dogfood-analyze.ts
 *
 * Fetch 60 days of real Oura data → Claude Haiku analysis → personalConstants → save
 *
 * Usage:
 *   npx tsx scripts/dogfood-analyze.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { OuraProvider } from "../packages/core/src/providers/oura";
import { createSupabaseProfileStore } from "../packages/core/src/supabase-profile-store";
import type { CausalityProfile, PersonalPattern } from "../packages/core/src/causality";

// ============================================
// Config
// ============================================

const CONFIG_PATH = join(homedir(), ".p360", "config.json");
const USER_ID = "dogfood-matt";

interface P360Config {
  ouraTokens?: { accessToken?: string };
  anthropicApiKey?: string;
  personalProfile?: CausalityProfile;
}

function loadConfig(): P360Config {
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as P360Config;
}

function saveConfig(config: P360Config): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

// ============================================
// Analysis Response Type
// ============================================

interface AnalysisResult {
  workoutRecoveryThreshold: number;
  hrvBaselineMean: number;
  hrvNoiseFloor: number;
  typicalRecoveryDays: number;
  observations: string[];
}

// ============================================
// Main
// ============================================

async function main() {
  // 1. Load config
  console.log("📋 Loading config from", CONFIG_PATH);
  const config = loadConfig();

  const ouraToken = config.ouraTokens?.accessToken;
  // Prefer env var over config file (env is more likely to be current)
  const anthropicKey = process.env.ANTHROPIC_API_KEY || config.anthropicApiKey;

  if (!ouraToken) throw new Error("No Oura token found in config.json");
  if (!anthropicKey) throw new Error("No Anthropic API key found in config.json or ANTHROPIC_API_KEY env var");

  console.log("✅ Config loaded\n");

  // 2. Fetch 60-day Oura data
  console.log("📡 Fetching 60 days from Oura...");
  const provider = new OuraProvider();
  const biometricData = await provider.fetchBiometricData(ouraToken);

  const history = biometricData.history;
  if (!history || history.dates.length < 7) {
    throw new Error(`Not enough history data: got ${history?.dates.length ?? 0} days`);
  }

  const dayCount = history.dates.length;
  const oldest = history.dates[0];
  const newest = history.dates[dayCount - 1];
  console.log(`✅ Got ${dayCount} days (${oldest} ~ ${newest})\n`);

  // 3. Build history payload for Claude
  const historyPayload = history.dates.map((date, i) => ({
    date,
    hrv: history.hrvValues[i] ?? null,
    readiness: history.readinessValues[i] ?? null,
    sleep: history.sleepValues[i] ?? null,
  }));

  // 4. Call Claude Haiku
  console.log("🤖 Claude Haiku analyzing patterns...");
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const prompt = `You are a biometric data analyst. Analyze this person's Oura Ring data (${dayCount} days).

Find their PERSONAL patterns (not population averages):
1. HRV baseline mean and noise floor (standard deviation)
2. Typical recovery days: after HRV drops >10% below mean, how many days to return to baseline?
3. Workout/decision threshold: below what readiness score do next-day metrics worsen consistently?
4. Weekly patterns (which day of week has lowest/highest readiness on average?)
5. Sleep-readiness lag: does a sleep score drop show up in readiness same day or next day?

DATA:
${JSON.stringify(historyPayload, null, 2)}

Return ONLY valid JSON, no explanation:
{
  "workoutRecoveryThreshold": <number 40-90>,
  "hrvBaselineMean": <number>,
  "hrvNoiseFloor": <number, 1 SD>,
  "typicalRecoveryDays": <number 1-7>,
  "observations": [<exactly 5 specific insights with numbers from the data>]
}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  // 5. Parse result
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Claude returned non-JSON: ${rawText.slice(0, 200)}`);

  const analysis = JSON.parse(jsonMatch[0]) as AnalysisResult;

  console.log(`✅ HRV baseline: ${analysis.hrvBaselineMean.toFixed(1)} ± ${analysis.hrvNoiseFloor.toFixed(1)}ms`);
  console.log(`✅ Recovery: ${analysis.typicalRecoveryDays} days after HRV drops`);
  console.log(`✅ Workout threshold: ${analysis.workoutRecoveryThreshold} (population was: 70)`);
  console.log("\n📋 Observations:");
  analysis.observations.forEach((obs, i) => console.log(`  ${i + 1}. ${obs}`));

  // 6. Build CausalityProfile
  const patterns: PersonalPattern[] = analysis.observations.map((obs, i) => ({
    userId: USER_ID,
    domain: "general" as const,
    patternType: `observation_${i + 1}`,
    learnedValue: 0,
    populationDefault: 0,
    confidence: 0.7,
    dataPoints: dayCount,
    lastUpdated: new Date(),
    description: obs,
  }));

  const profile: CausalityProfile = {
    userId: USER_ID,
    totalEvents: 0,
    firstEventAt: new Date(oldest),
    lastEventAt: new Date(newest),
    personalConstants: {
      workoutRecoveryThreshold: analysis.workoutRecoveryThreshold,
    },
    patterns,
  };

  // 7. Save: try Supabase first, fallback to config.json
  const profileStore = createSupabaseProfileStore();
  if (profileStore) {
    try {
      await profileStore.saveProfile(profile);
      console.log("\n✅ Saved to Supabase");
    } catch (err) {
      console.warn("⚠️  Supabase save failed, falling back to config.json:", err);
      config.personalProfile = profile;
      saveConfig(config);
      console.log("✅ Saved to ~/.p360/config.json (personalProfile)");
    }
  } else {
    config.personalProfile = profile;
    saveConfig(config);
    console.log("\n✅ Saved to ~/.p360/config.json (personalProfile)");
  }

  console.log("\n📋 PersonalConstants:");
  console.log(JSON.stringify(profile.personalConstants, null, 2));
  console.log("\n🎉 Done! Run `p360 ask` to test with personal constants.");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
