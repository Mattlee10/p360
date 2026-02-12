import Anthropic from "@anthropic-ai/sdk";
import { buildAdvisorContext } from "@p360/core";
import type { NudgeResponse } from "@p360/core";
import { fetchBiometricData, getRandomDemoData } from "../lib/oura";
import { getAnthropicApiKey } from "../lib/config";

interface AskOptions {
  demo?: boolean;
  json?: boolean;
}

function parseNudgeResponse(text: string): NudgeResponse | null {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      answer: parsed.answer || "",
      options: Array.isArray(parsed.options) ? parsed.options : [],
      strategy: parsed.strategy || "",
      dataSource: parsed.dataSource || "",
    };
  } catch {
    return null;
  }
}

function getVerdictEmoji(verdict: string): string {
  if (verdict === "safe") return "🟢";
  if (verdict === "caution") return "🟡";
  return "🔴";
}

export async function askCommand(
  question: string,
  options: AskOptions,
): Promise<void> {
  try {
    if (!question || question.trim().length === 0) {
      console.log("");
      console.log("  Usage: p360 ask \"your question\"");
      console.log("");
      console.log("  Examples:");
      console.log("    p360 ask \"회식인데 맥주 몇 잔까지 괜찮아?\"");
      console.log("    p360 ask \"should I work out today?\"");
      console.log("    p360 ask \"커피 지금 마셔도 되나?\"");
      console.log("    p360 ask \"I'm tired but need to keep working\"");
      console.log("");
      return;
    }

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

    // 2. Build advisor context (keyword router + core analyses)
    const context = buildAdvisorContext(question, data);

    // 3. Call Claude API
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: context.systemPrompt,
      messages: [{ role: "user", content: question }],
    });

    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // 4. Parse and display
    const nudge = parseNudgeResponse(responseText);

    if (options.json) {
      console.log(JSON.stringify(nudge || { raw: responseText }, null, 2));
      return;
    }

    if (nudge) {
      // Formatted output
      console.log("");
      console.log(`  💬 ${nudge.answer}`);
      console.log("");

      if (nudge.options.length > 0) {
        console.log("  📊 Options:");
        for (const opt of nudge.options) {
          const emoji = getVerdictEmoji(opt.verdict);
          console.log(`    ${emoji} ${opt.label}: ${opt.impact}`);
        }
        console.log("");
      }

      if (nudge.strategy) {
        console.log("  📋 Strategy:");
        const lines = nudge.strategy.split("\n");
        for (const line of lines) {
          console.log(`    ${line}`);
        }
        console.log("");
      }

      if (nudge.dataSource) {
        console.log(`  📈 ${nudge.dataSource}`);
        console.log("");
      }
    } else {
      // Fallback: raw text
      console.log("");
      console.log(`  ${responseText}`);
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
