import Anthropic from "@anthropic-ai/sdk";
import type { BiometricData, EventStore, CausalityProfile } from "@p360/core";
import {
  prepareAsk,
  processAskResponse,
  collectEvent,
  getNudgeVerdictEmoji,
  createSupabaseProfileStore,
} from "@p360/core";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export function isAskAvailable(): boolean {
  return !!ANTHROPIC_API_KEY;
}

export async function getAskResponse(
  question: string,
  data: BiometricData,
  userId?: string,
  eventStore?: EventStore,
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    return "⚠️ <b>Ask feature not configured</b>\n\nServer admin needs to set ANTHROPIC_API_KEY.";
  }

  // 1. Load profile if available
  let profile: CausalityProfile | undefined;
  if (userId) {
    const profileStore = createSupabaseProfileStore();
    if (profileStore) {
      try {
        const loadedProfile = await profileStore.getProfile(userId);
        if (loadedProfile) {
          profile = loadedProfile;
        }
      } catch (err) {
        // Profile loading failed, continue without it
      }
    }
  }

  // 2. Prepare context (now includes profile if available)
  const prepared = prepareAsk({
    question,
    biometricData: data,
    userId,
    eventStore,
    profile,
  });

  // 3. Call Claude API
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
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

  // 4. Process response
  const result = processAskResponse(responseText, prepared);

  // 3.5. Collect causality event (fire-and-forget)
  collectEvent(prepared, result).catch(() => {});

  if (!result.nudge) {
    return result.raw;
  }

  // Helper to escape HTML special characters
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  // 4. Format for Telegram (HTML)
  const lines: string[] = [];

  lines.push(`💬 ${escapeHtml(result.nudge.answer)}`);
  lines.push("");

  if (result.nudge.options.length > 0) {
    lines.push("<b>📊 Options:</b>");
    for (const opt of result.nudge.options) {
      const emoji = getNudgeVerdictEmoji(opt.verdict);
      lines.push(`  ${emoji} ${escapeHtml(opt.label)}: ${escapeHtml(opt.impact)}`);
    }
    lines.push("");
  }

  if (result.nudge.strategy) {
    lines.push("<b>📋 Strategy:</b>");
    lines.push(escapeHtml(result.nudge.strategy));
    lines.push("");
  }

  if (result.nudge.dataSource) {
    lines.push(`📈 ${escapeHtml(result.nudge.dataSource)}`);
  }

  return lines.join("\n");
}
