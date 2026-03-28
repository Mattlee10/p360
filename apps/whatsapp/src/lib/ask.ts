import Anthropic from "@anthropic-ai/sdk";
import type { BiometricData, CausalityProfile } from "@p360/core";
import {
  prepareAsk,
  processAskResponse,
  collectEvent,
  createSupabaseProfileStore,
} from "@p360/core";
import { formatNudgeText, formatRawText } from "./format";

/**
 * Run the ask pipeline and return a plain text string for WhatsApp.
 * Mirrors the pattern in apps/discord/src/lib/ask.ts but returns string.
 */
export async function getAskText(
  question: string,
  data: BiometricData,
  userId?: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "ANTHROPIC_API_KEY not configured.";

  let profile: CausalityProfile | undefined;
  if (userId) {
    const profileStore = createSupabaseProfileStore();
    if (profileStore) {
      try {
        const loaded = await profileStore.getProfile(userId);
        if (loaded) profile = loaded;
      } catch {
        // continue without profile
      }
    }
  }

  const prepared = prepareAsk({
    question,
    biometricData: data,
    userId,
    profile,
  });

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

  const result = processAskResponse(responseText, prepared);

  collectEvent(prepared, result).catch(() => {});

  if (result.nudge) return formatNudgeText(result.nudge);
  return formatRawText(result.raw);
}
