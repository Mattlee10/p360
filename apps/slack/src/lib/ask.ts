import Anthropic from "@anthropic-ai/sdk";
import type {
  BiometricData,
  EventStore,
  CausalityProfile,
} from "@p360/core";
import {
  prepareAsk,
  processAskResponse,
  collectEvent,
  createSupabaseProfileStore,
} from "@p360/core";
import { formatAskBlocks } from "./format";
import type { KnownBlock } from "@slack/types";

export function isAskAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function getAskBlocks(
  question: string,
  data: BiometricData,
  userId?: string,
  eventStore?: EventStore
): Promise<KnownBlock[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "⚠️ *Ask Not Configured*\nServer admin needs to set ANTHROPIC_API_KEY.",
        },
      },
    ];
  }

  // 1. Load profile if available
  let profile: CausalityProfile | undefined;
  if (userId) {
    const profileStore = createSupabaseProfileStore();
    if (profileStore) {
      try {
        const loaded = await profileStore.getProfile(userId);
        if (loaded) profile = loaded;
      } catch {
        // Profile loading failed, continue without it
      }
    }
  }

  // 2. Prepare context (includes profile if available)
  const prepared = prepareAsk({
    question,
    biometricData: data,
    userId,
    eventStore,
    profile,
  });

  // 3. Call Claude API
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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

  // 5. Collect causality event (fire-and-forget)
  collectEvent(prepared, result).catch(() => {});

  // 6. Format for Slack blocks
  if (!result.nudge) {
    return [
      {
        type: "header",
        text: { type: "plain_text", text: "💬 P360 Answer" },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: result.raw.slice(0, 3000) },
      },
    ];
  }

  return formatAskBlocks(result.nudge);
}
