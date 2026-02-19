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

  incrementCommandCount(commandName as keyof ReturnType<typeof getCommandCounts>);
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
  await reply(ctx, message + demoNote);
}

// ============================================
// Cost Commands (P27) — kept, uses cost.ts math
// ============================================

export async function handleCost(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  incrementCommandCount("cost");
  console.log(`📊 /cost from ${telegramId}`);

  if (!hasConnectedDevice(telegramId)) {
    await reply(ctx, MESSAGES.notConnected);
    return;
  }

  const text = ctx.message?.text || "";
  const parts = text.split(" ").filter((p) => p.trim());

  if (parts.length < 2) {
    await reply(
      ctx,
      `💰 <b>Recovery Cost Simulator</b>

See the cost BEFORE you drink.

<b>Usage:</b>
<code>/cost beer 3</code> - 3 beers recovery cost
<code>/cost coffee 2</code> - 2 coffees sleep impact
<code>/cost wine 1</code> - 1 wine recovery cost

<b>Supported:</b>
🍺 beer, 🍷 wine, 🥃 spirits/whiskey/vodka
☕ coffee/espresso/latte, 🍵 tea/matcha

<b>Demo:</b> /costdemo beer 3`
    );
    return;
  }

  const substance = parseSubstance(parts[1]);
  if (!substance) {
    const substances = getSubstanceList().join(", ");
    await reply(ctx, `⚠️ Unknown substance: "${parts[1]}"\n\n<b>Supported:</b> ${substances}\n\nExample: /cost beer 3`);
    return;
  }

  const amount = parts.length >= 3 ? parseInt(parts[2], 10) : 1;
  if (isNaN(amount) || amount < 1 || amount > 10) {
    await reply(ctx, `⚠️ Amount must be 1-10.\n\nExample: /cost ${parts[1]} 2`);
    return;
  }

  await ctx.reply("🔄 Calculating recovery cost...");

  try {
    const data = await getUserBiometricData(telegramId);
    if (!data) {
      await reply(ctx, MESSAGES.fetchError);
      return;
    }
    const cost = getRecoveryCost(data, substance, amount);
    const message = formatCostTelegram(cost);

    updateLastCheck(telegramId);
    await reply(ctx, message);
  } catch (error) {
    console.error("Cost check error:", error);
    await reply(ctx, MESSAGES.fetchError);
  }
}

export async function handleCostDemo(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    setUser(telegramId, {});
  }

  incrementCommandCount("costdemo");
  console.log(`📊 /costdemo from ${telegramId}`);

  const text = ctx.message?.text || "";
  const parts = text.split(" ").filter((p) => p.trim());

  const substance = parts.length >= 2 ? parseSubstance(parts[1]) : null;
  const substanceType = substance || "beer";
  const amount = parts.length >= 3 ? parseInt(parts[2], 10) || 2 : 2;
  const safeAmount = Math.max(1, Math.min(10, amount));

  await ctx.reply("🎲 Generating random scenario...");

  const data = getRandomDemoData();
  const cost = getRecoveryCost(data, substanceType, safeAmount);
  const message = formatCostTelegram(cost);

  const demoNote = `\n\n<i>📝 This is demo data. Use /connect to see your real data.\nTry: /costdemo coffee 3, /costdemo wine 2</i>`;
  await reply(ctx, message + demoNote);
}

// ============================================
// Ask Command (AI-powered - the main pipeline)
// ============================================

// /ask command - Claude-powered question handler
export async function handleAsk(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  incrementCommandCount("ask");
  console.log(`💬 /ask from ${telegramId}`);

  if (!isAskAvailable()) {
    await reply(ctx, "⚠️ <b>Ask feature not available</b>\n\nAdmin needs to set ANTHROPIC_API_KEY.");
    return;
  }

  if (!hasConnectedDevice(telegramId)) {
    await reply(ctx, MESSAGES.notConnected);
    return;
  }

  const text = ctx.message?.text || "";
  const question = text.replace(/^\/ask\s*/i, "").trim();

  if (!question) {
    await reply(ctx, `💬 <b>Ask anything about your health</b>\n\nExamples:\n• /ask Should I work out today?\n• /ask How much can I drink?\n• /ask Why am I tired?\n\nTry /demo first if you don't have a device connected.`);
    return;
  }

  await ctx.reply("🔄 Analyzing...");

  try {
    const data = await getUserBiometricData(telegramId);
    if (!data) {
      await reply(ctx, MESSAGES.fetchError);
      return;
    }

    const userId = `tg-${telegramId}`;
    const message = await getAskResponse(question, data, userId, eventStore);
    updateLastCheck(telegramId);
    await reply(ctx, message);
  } catch (error) {
    console.error("Ask error:", error);
    await reply(ctx, "❌ Error. Try again.");
  }
}

// /demo command - try without device
export async function handleAskDemo(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    setUser(telegramId, {});
  }

  console.log(`🎲 /demo from ${telegramId}`);

  if (!isAskAvailable()) {
    await reply(ctx, "⚠️ <b>Demo not available</b>\n\nAdmin needs to set ANTHROPIC_API_KEY.");
    return;
  }

  const text = ctx.message?.text || "";
  const question = text.replace(/^\/demo\s*/i, "").trim() || "Should I work out today?";

  await ctx.reply("🎲 Demo mode...");

  try {
    const data = getRandomDemoData();
    const userId = telegramId ? `tg-${telegramId}` : "tg-demo";
    const message = await getAskResponse(question, data, userId, eventStore);
    const demoNote = `\n\n<i>📝 Demo data. Use /connect to see your real biometrics.</i>`;
    await reply(ctx, message + demoNote);
  } catch (error) {
    console.error("Demo error:", error);
    await reply(ctx, "❌ Error. Try again.");
  }
}

// Handle unknown commands
export async function handleUnknown(ctx: Context) {
  await reply(
    ctx,
    `❓ Unknown command. Try /help to see available commands.`
  );
}
