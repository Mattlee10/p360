import Anthropic from "@anthropic-ai/sdk";
import { EmbedBuilder } from "discord.js";
import { buildAdvisorContext } from "@p360/core";
import type { BiometricData, NudgeResponse } from "@p360/core";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function parseNudgeResponse(text: string): NudgeResponse | null {
  try {
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

function getVerdictColor(verdict: string): number {
  if (verdict === "safe") return 0x22c55e;
  if (verdict === "caution") return 0xf59e0b;
  return 0xef4444;
}

function getVerdictEmoji(verdict: string): string {
  if (verdict === "safe") return "🟢";
  if (verdict === "caution") return "🟡";
  return "🔴";
}

export function isAskAvailable(): boolean {
  return !!ANTHROPIC_API_KEY;
}

export async function getAskEmbed(
  question: string,
  data: BiometricData,
): Promise<EmbedBuilder> {
  if (!ANTHROPIC_API_KEY) {
    return new EmbedBuilder()
      .setTitle("⚠️ Ask Not Configured")
      .setDescription("Server admin needs to set ANTHROPIC_API_KEY.")
      .setColor(0xf59e0b);
  }

  const context = buildAdvisorContext(question, data);

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
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

  const nudge = parseNudgeResponse(responseText);

  if (!nudge) {
    return new EmbedBuilder()
      .setTitle("💬 P360 Answer")
      .setDescription(responseText.slice(0, 4096))
      .setColor(0x3b82f6);
  }

  const embed = new EmbedBuilder()
    .setTitle("💬 P360 Ask")
    .setDescription(nudge.answer)
    .setColor(0x3b82f6);

  if (nudge.options.length > 0) {
    const optionsText = nudge.options
      .map((opt) => `${getVerdictEmoji(opt.verdict)} **${opt.label}**: ${opt.impact}`)
      .join("\n");
    embed.addFields({ name: "📊 Options", value: optionsText });
  }

  if (nudge.strategy) {
    embed.addFields({
      name: "📋 Strategy",
      value: nudge.strategy.slice(0, 1024),
    });
  }

  if (nudge.dataSource) {
    embed.setFooter({ text: `📈 ${nudge.dataSource}` });
  }

  return embed;
}
