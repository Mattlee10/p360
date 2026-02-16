import Anthropic from "@anthropic-ai/sdk";
import type { CausalityProfile } from "@p360/core";
import {
  prepareAsk,
  processAskResponse,
  collectEvent,
  getNudgeVerdictEmoji,
  createSupabaseEventStore,
  createSupabaseProfileStore,
} from "@p360/core";
import { fetchBiometricData, getRandomDemoData } from "../lib/oura";
import { getAnthropicApiKey } from "../lib/config";

interface AskOptions {
  demo?: boolean;
  json?: boolean;
}

export async function askCommand(
  question: string,
  options: AskOptions,
): Promise<void> {
  try {
    // No question = general readiness check
    const q = question && question.trim().length > 0
      ? question.trim()
      : "How am I doing today? What should I focus on?";

    const apiKey = getAnthropicApiKey();
    if (!apiKey) {
      console.log("");
      console.log("  ⚠️  Anthropic API key not found.");
      console.log("");
      console.log("  Set it up:");
      console.log("    export ANTHROPIC_API_KEY=sk-ant-...");
      console.log("  or:");
      console.log("    p360 login --anthropic sk-ant-...");
      console.log("");
      return;
    }

    // 1. Get biometric data
    const data = options.demo
      ? getRandomDemoData()
      : await fetchBiometricData();

    // 2. Load profile + prepare ask context
    const eventStore = createSupabaseEventStore();
    const userId = process.env.P360_USER_ID || "cli-default";

    let profile: CausalityProfile | undefined;
    const profileStore = createSupabaseProfileStore();
    if (profileStore) {
      try {
        const loaded = await profileStore.getProfile(userId);
        if (loaded) profile = loaded;
      } catch {
        // Profile loading failed, continue without it
      }
    }

    const prepared = prepareAsk({
      question: q,
      biometricData: data,
      userId,
      eventStore: eventStore ?? undefined,
      profile,
    });

    // 3. Call Claude API
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: prepared.systemPrompt,
      messages: [{ role: "user", content: prepared.question }],
    });

    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // 4. Process and display
    const result = processAskResponse(responseText, prepared);

    // 5. Collect causality event (fire-and-forget)
    collectEvent(prepared, result).catch((err) => {
      console.error("[ERROR] Failed to collect event:", err instanceof Error ? err.message : err);
    });

    if (options.json) {
      console.log(JSON.stringify(result.nudge || { raw: result.raw }, null, 2));
      return;
    }

    if (result.nudge) {
      console.log("");
      console.log(`  💬 ${result.nudge.answer}`);
      console.log("");

      if (result.nudge.options.length > 0) {
        console.log("  📊 Options:");
        for (const opt of result.nudge.options) {
          const emoji = getNudgeVerdictEmoji(opt.verdict);
          console.log(`    ${emoji} ${opt.label}: ${opt.impact}`);
        }
        console.log("");
      }

      if (result.nudge.strategy) {
        console.log("  📋 Strategy:");
        const lines = result.nudge.strategy.split("\n");
        for (const line of lines) {
          console.log(`    ${line}`);
        }
        console.log("");
      }

      if (result.nudge.dataSource) {
        console.log(`  📈 ${result.nudge.dataSource}`);
        console.log("");
      }
    } else {
      console.log("");
      console.log(`  ${result.raw}`);
      console.log("");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("401")) {
      console.error("  ❌ Invalid Anthropic API key. Check your key and try again.");
    } else {
      console.error("Error:", error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
