import Anthropic from "@anthropic-ai/sdk";
import { EmbedBuilder } from "discord.js";
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

export async function getAskEmbed(
  question: string,
  data: BiometricData,
  userId?: string,
  eventStore?: EventStore,
): Promise<EmbedBuilder> {
  if (!ANTHROPIC_API_KEY) {
    return new EmbedBuilder()
      .setTitle("⚠️ Ask Not Configured")
      .setDescription("Server admin needs to set ANTHROPIC_API_KEY.")
      .setColor(0xf59e0b);
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

  // 2. Call Claude API
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

  // 3. Process response
  const result = processAskResponse(responseText, prepared);

  // 3.5. Collect causality event (fire-and-forget)
  collectEvent(prepared, result).catch(() => {});

  if (!result.nudge) {
    return new EmbedBuilder()
      .setTitle("💬 P360 Answer")
      .setDescription(result.raw.slice(0, 4096))
      .setColor(0x3b82f6);
  }

  // 4. Format for Discord embed
  const embed = new EmbedBuilder()
    .setTitle("💬 P360 Ask")
    .setDescription(result.nudge.answer)
    .setColor(0x3b82f6);

  if (result.nudge.options.length > 0) {
    const optionsText = result.nudge.options
      .map((opt) => `${getNudgeVerdictEmoji(opt.verdict)} **${opt.label}**: ${opt.impact}`)
      .join("\n");
    embed.addFields({ name: "📊 Options", value: optionsText });
  }

  if (result.nudge.strategy) {
    embed.addFields({
      name: "📋 Strategy",
      value: result.nudge.strategy.slice(0, 1024),
    });
  }

  if (result.nudge.dataSource) {
    embed.setFooter({ text: `📈 ${result.nudge.dataSource}` });
  }

  return embed;
}
