import Anthropic from "@anthropic-ai/sdk";
import {
  prepareAsk,
  processAskResponse,
  getNudgeVerdictEmoji,
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

    // 2. Prepare ask context (keyword router + core analyses)
    const prepared = prepareAsk({ question: q, biometricData: data });

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
