import { Context } from "grammy";
import type { ProviderType } from "@p360/core";
import { MESSAGES } from "./messages";
import {
  getUser,
  setUser,
  updateLastCheck,
  incrementCommandCount,
  setProvider,
  getProvider,
  getProviderToken,
  hasConnectedDevice,
} from "../lib/storage";
import {
  fetchBiometricData,
  validateToken,
  getRandomDemoData,
  getProviderDisplayName,
} from "../lib/data";
import { getAskResponse, isAskAvailable } from "../lib/ask";
import { createSupabaseEventStore } from "@p360/core";

// Shared event store instance (null if Supabase not configured)
const eventStore = createSupabaseEventStore() ?? undefined;

// Helper to send HTML messages
async function reply(ctx: Context, text: string) {
  await ctx.reply(text, { parse_mode: "HTML" });
}

// Helper to get user's biometric data (provider-aware)
async function getUserBiometricData(telegramId: number) {
  const token = getProviderToken(telegramId);
  if (!token) return null;

  const provider = getProvider(telegramId) || "oura";
  return fetchBiometricData(token, provider);
}

// ============================================
// Claude-first: route domain commands through /ask
// ============================================

async function routeThroughAsk(
  ctx: Context,
  question: string,
  commandName: string,
  demo = false,
) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  incrementCommandCount(commandName as any);
  console.log(`📊 /${commandName} from ${telegramId}`);

  if (!isAskAvailable()) {
    await reply(ctx, "⚠️ <b>Feature not configured</b>\n\nServer admin needs to set ANTHROPIC_API_KEY.");
    return;
  }

  if (!demo && !hasConnectedDevice(telegramId)) {
    await reply(ctx, MESSAGES.notConnected);
    return;
  }

  await ctx.reply("🔄 Analyzing your data...");

  try {
    const data = demo
      ? getRandomDemoData()
      : await getUserBiometricData(telegramId);
    if (!data) {
      await reply(ctx, MESSAGES.fetchError);
      return;
    }

    const userId = `tg-${telegramId}`;
    const message = await getAskResponse(question, data, userId, eventStore);
    updateLastCheck(telegramId);

    const demoNote = demo
      ? `\n\n<i>📝 This is demo data. Use /connect to see your real data.</i>`
      : "";
    await reply(ctx, message + demoNote);
  } catch (error) {
    console.error(`${commandName} error:`, error);
    await reply(ctx, "❌ Error processing your request. Try again.");
  }
}

// /start command
export async function handleStart(ctx: Context) {
  const telegramId = ctx.from?.id;
  const username = ctx.from?.username || "unknown";
  if (telegramId) {
    setUser(telegramId, {});
    console.log(`🆕 New user: @${username} (${telegramId})`);
  }
  await reply(ctx, MESSAGES.welcome);
}

// /help command
export async function handleHelp(ctx: Context) {
  await reply(ctx, MESSAGES.help);
}

// /connect command - supports multiple devices
export async function handleConnect(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const text = ctx.message?.text || "";
  const parts = text.split(" ").filter((p) => p.trim());

  if (parts.length < 2) {
    await reply(ctx, MESSAGES.connectInstructions);
    return;
  }

  let provider: ProviderType = "oura";
  let token: string;

  if (parts.length >= 3) {
    const providerArg = parts[1].toLowerCase();
    if (providerArg === "whoop") {
      provider = "whoop";
    } else if (providerArg === "oura") {
      provider = "oura";
    } else {
      token = parts[1].trim();
      await validateAndConnect(ctx, telegramId, token, provider);
      return;
    }
    token = parts[2].trim();
  } else {
    token = parts[1].trim();
  }

  await validateAndConnect(ctx, telegramId, token, provider);
}

async function validateAndConnect(
  ctx: Context,
  telegramId: number,
  token: string,
  provider: ProviderType
): Promise<void> {
  const displayName = getProviderDisplayName(provider);
  await ctx.reply(`🔄 Validating ${displayName} token...`);

  try {
    const isValid = await validateToken(token, provider);

    if (!isValid) {
      await reply(ctx, MESSAGES.connectFailed(provider));
      return;
    }

    setProvider(telegramId, provider, token);
    await reply(ctx, MESSAGES.connectSuccess(provider));
  } catch (error) {
    console.error("Connect error:", error);
    await reply(ctx, MESSAGES.connectFailed(provider));
  }
}

// /disconnect command
export async function handleDisconnect(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  setUser(telegramId, { ouraToken: undefined, provider: undefined, providerToken: undefined });
  await reply(ctx, MESSAGES.disconnected);
}

// /status command
export async function handleStatus(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = getUser(telegramId);
  const connected = hasConnectedDevice(telegramId);
  const provider = getProvider(telegramId);
  await reply(ctx, MESSAGES.status(connected, user?.lastCheckAt, provider));
}

// /ask command - universal question handler
export async function handleAsk(ctx: Context) {
  const text = ctx.message?.text || "";
  const question = text.replace(/^\/ask\s*/i, "").trim();

  if (!question) {
    await reply(ctx, `💬 <b>Ask anything!</b>\n\nExamples:\n• /ask Should I work out today?\n• /ask How much can I drink tonight?\n• /ask Why am I so tired?\n• /ask Is now a good time to start coding?`);
    return;
  }

  await routeThroughAsk(ctx, question, "ask");
}

// /demo command - try without device connection
export async function handleDemo(ctx: Context) {
  const text = ctx.message?.text || "";
  const question = text.replace(/^\/demo\s*/i, "").trim();

  if (!question) {
    await reply(ctx, `📝 <b>Try a demo question!</b>\n\nUsage: /demo [your question]\n\nExamples:\n• /demo Should I work out today?\n• /demo How much can I drink tonight?\n• /demo Why am I feeling tired?`);
    return;
  }

  await routeThroughAsk(ctx, question, "demo", true);
}

// Handle unknown commands
export async function handleUnknown(ctx: Context) {
  await reply(
    ctx,
    `❓ Unknown command. Try /help to see available commands.`
  );
}
