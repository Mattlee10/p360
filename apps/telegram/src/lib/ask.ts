import Anthropic from "@anthropic-ai/sdk";
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

function getVerdictEmoji(verdict: string): string {
  if (verdict === "safe") return "🟢";
  if (verdict === "caution") return "🟡";
  return "🔴";
}

export function isAskAvailable(): boolean {
  return !!ANTHROPIC_API_KEY;
}

export async function getAskResponse(
  question: string,
  data: BiometricData,
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return "⚠️ <b>Ask feature not configured</b>\n\nServer admin needs to set ANTHROPIC_API_KEY.";
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
    return responseText;
  }

  // Format for Telegram (HTML)
  const lines: string[] = [];

  lines.push(`💬 ${nudge.answer}`);
  lines.push("");

  if (nudge.options.length > 0) {
    lines.push("<b>📊 Options:</b>");
    for (const opt of nudge.options) {
      const emoji = getVerdictEmoji(opt.verdict);
      lines.push(`  ${emoji} ${opt.label}: ${opt.impact}`);
    }
    lines.push("");
  }

  if (nudge.strategy) {
    lines.push("<b>📋 Strategy:</b>");
    lines.push(nudge.strategy);
    lines.push("");
  }

  if (nudge.dataSource) {
    lines.push(`📈 ${nudge.dataSource}`);
  }

  return lines.join("\n");
}
