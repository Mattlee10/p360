import { Context } from "grammy";
import type { ProviderType } from "@p360/core";
import { MESSAGES } from "./messages";
import {
  getOuraToken,
  setOuraToken,
  getUser,
  setUser,
  updateLastCheck,
  addDrinkLog,
  getDrinkLogs,
  getBotStats,
  getCommandCounts,
  incrementCommandCount,
  setProvider,
  getProvider,
  getProviderToken,
  hasConnectedDevice,
  addMoodEntry,
  getMoodEntries,
  getTodayMoodEntry,
  addRecoveryScore,
  getRecoveryHistory,
} from "../lib/storage";
import {
  fetchBiometricData,
  validateToken,
  getRandomDemoData,
  getProviderDisplayName,
} from "../lib/data";
import {
  getMoodDecision,
  calculateMoodInsight,
} from "@p360/core";
import {
  getRecoveryCost,
  parseSubstance,
  getSubstanceList,
} from "@p360/core";
import { formatCostTelegram } from "../lib/cost";
import {
  formatMoodTelegram,
  formatMoodHistoryTelegram,
  formatMoodLoggedTelegram,
} from "../lib/mood";
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

// ============================================
// Domain Commands → Claude-first via /ask pipeline
// ============================================

// /workout command → Claude handles workout reasoning
export async function handleWorkout(ctx: Context) {
  const text = ctx.message?.text || "";
  const sportInput = text.replace(/^\/workout\s*/i, "").trim();
  const question = sportInput
    ? `Should I do ${sportInput} today? What intensity and duration?`
    : "Should I work out today? What intensity?";
  await routeThroughAsk(ctx, question, "workout");
}

// /demo command → workout demo via Claude
export async function handleDemo(ctx: Context) {
  const text = ctx.message?.text || "";
  const sportInput = text.replace(/^\/demo\s*/i, "").trim();
  const question = sportInput
    ? `Should I do ${sportInput} today? What intensity and duration?`
    : "Should I work out today? What intensity?";
  await routeThroughAsk(ctx, question, "demo", true);
}

// /sports command - list available sports (still useful)
export async function handleSports(ctx: Context) {
  const sports = [
    "basketball", "running", "cycling", "weightlifting", "crossfit",
    "swimming", "yoga", "soccer", "tennis", "golf", "hiking", "climbing",
    "martial arts",
  ];
  const formatted = sports.map((s) => `• ${s}`).join("\n");
  await reply(
    ctx,
    `<b>🏀 Available Sports</b>\n\n${formatted}\n\n<b>Usage:</b>\n/workout basketball\n/workout running\n/workout bjj`
  );
}

// /drink command → Claude handles drink reasoning
export async function handleDrink(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const text = ctx.message?.text || "";
  const parts = text.split(" ");

  // /drink log N — still record locally
  if (parts.length > 1 && parts[1].toLowerCase() === "log") {
    const amount = parseInt(parts[2], 10);
    if (isNaN(amount) || amount < 1 || amount > 20) {
      await reply(ctx, `⚠️ Please specify a valid number of drinks (1-20)\n\nExample: /drink log 3`);
      return;
    }
    addDrinkLog(telegramId, amount);
    await reply(ctx, `✅ <b>Logged: ${amount} drink${amount > 1 ? "s" : ""}</b>\n\nUse /ask to check tomorrow's impact.`);
    return;
  }

  // /drink history — show logged history
  if (parts.length > 1 && parts[1].toLowerCase() === "history") {
    const logs = getDrinkLogs(telegramId);
    if (logs.length === 0) {
      await reply(ctx, `📊 <b>No Drinking History</b>\n\nStart logging with /drink log N.\n\nExample: /drink log 3`);
      return;
    }
    const lines = ["📈 <b>Recent Drinking History</b>\n"];
    logs.slice(-10).reverse().forEach((log) => {
      lines.push(`  ${log.date}: ${log.amount} drinks`);
    });
    await reply(ctx, lines.join("\n"));
    return;
  }

  // Default: /drink → Claude-powered drink advice
  const question = "Should I drink alcohol tonight? What's my safe limit and what's the recovery cost?";
  await routeThroughAsk(ctx, question, "drink");
}

// /drink demo
export async function handleDrinkDemo(ctx: Context) {
  const question = "Should I drink alcohol tonight? What's my safe limit and recovery cost?";
  await routeThroughAsk(ctx, question, "drinkdemo", true);
}

// /why command → Claude handles fatigue reasoning
export async function handleWhy(ctx: Context) {
  const text = ctx.message?.text || "";
  const userInput = text.replace(/^\/why\s*/i, "").trim();
  const question = userInput
    ? `I'm feeling: ${userInput}. Is this physiological or psychological? What should I do?`
    : "Why am I feeling tired? Is it my body or my mind?";
  await routeThroughAsk(ctx, question, "why");
}

// /why demo
export async function handleWhyDemo(ctx: Context) {
  const text = ctx.message?.text || "";
  const userInput = text.replace(/^\/whydemo\s*/i, "").trim();
  const question = userInput
    ? `I'm feeling: ${userInput}. Is this physiological or psychological? What should I do?`
    : "Why am I feeling tired? Is it my body or my mind?";
  await routeThroughAsk(ctx, question, "whydemo", true);
}

// /feedback command - collect user feedback
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

export async function handleFeedback(ctx: Context) {
  const telegramId = ctx.from?.id;
  const username = ctx.from?.username || "unknown";

  const text = ctx.message?.text || "";
  const feedbackText = text.replace(/^\/feedback\s*/i, "").trim();

  if (!feedbackText) {
    await reply(
      ctx,
      `📝 <b>Send us feedback!</b>\n\nUsage: /feedback [your message]\n\nExample:\n/feedback I'd love to see Pilates added as a sport!`
    );
    return;
  }

  console.log(`📬 FEEDBACK from @${username} (${telegramId}): ${feedbackText}`);

  if (ADMIN_CHAT_ID && ctx.api) {
    try {
      await ctx.api.sendMessage(
        ADMIN_CHAT_ID,
        `📬 <b>New Feedback</b>\n\nFrom: @${username} (${telegramId})\n\n${feedbackText}`,
        { parse_mode: "HTML" }
      );
    } catch (e) {
      console.error("Failed to send feedback to admin:", e);
    }
  }

  await reply(
    ctx,
    `✅ <b>Thanks for your feedback!</b>\n\nWe read every message and it helps us improve. 🙏`
  );
}

// /stats command - admin only
export async function handleStats(ctx: Context) {
  const telegramId = ctx.from?.id;

  if (!ADMIN_CHAT_ID || String(telegramId) !== ADMIN_CHAT_ID) {
    await reply(ctx, `❓ Unknown command. Try /help to see available commands.`);
    return;
  }

  const stats = getBotStats();
  const counts = getCommandCounts();
  const uptime = process.uptime();
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);

  const message = `
📊 <b>Bot Stats</b>

<b>Users</b>
• Total: ${stats.totalUsers}
• Connected: ${stats.connectedUsers}
• Today new: ${stats.todayNewUsers}

<b>Commands (since restart)</b>
• /workout: ${counts.workout}
• /drink: ${counts.drink}
• /why: ${counts.why}
• /ask: ${counts.ask}
• /cost: ${counts.cost}
• /demo: ${counts.demo}

<b>Server</b>
• Uptime: ${uptimeHours}h ${uptimeMinutes}m
`.trim();

  await reply(ctx, message);
}

// ============================================
// Mood Commands (P17) — kept as-is (independent module)
// ============================================

export async function handleMood(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const text = ctx.message?.text || "";
  const parts = text.split(" ").filter((p) => p.trim());

  if (parts.length < 2) {
    await reply(
      ctx,
      `🎭 <b>Mood Tracking</b>

Log how you're feeling (1-5):
<code>/mood 1</code> - Very low
<code>/mood 2</code> - Low
<code>/mood 3</code> - Neutral
<code>/mood 4</code> - Good
<code>/mood 5</code> - Great

Other commands:
/mood history - See your mood-recovery patterns
/mooddemo - Try with demo data`
    );
    return;
  }

  const subcommand = parts[1].toLowerCase();

  if (subcommand === "history" || subcommand === "insight") {
    const moodEntries = getMoodEntries(telegramId);
    const recoveryHistory = getRecoveryHistory(telegramId);
    const insight = calculateMoodInsight(moodEntries, recoveryHistory);
    const message = formatMoodHistoryTelegram(insight);
    await reply(ctx, message);
    return;
  }

  const score = parseInt(subcommand, 10);
  if (isNaN(score) || score < 1 || score > 5) {
    await reply(ctx, `⚠️ Please enter a mood score from 1 to 5.\n\nExample: /mood 3\n\n1 = Very low, 5 = Great`);
    return;
  }

  if (!hasConnectedDevice(telegramId)) {
    addMoodEntry(telegramId, score);
    await reply(
      ctx,
      `✅ <b>Mood Logged: ${score}/5</b>\n\nConnect your device to get insights about why you feel this way.\n/connect TOKEN (Oura) or /connect whoop TOKEN`
    );
    return;
  }

  try {
    const data = await getUserBiometricData(telegramId);
    if (!data) {
      addMoodEntry(telegramId, score);
      await reply(ctx, `✅ Mood logged: ${score}/5\n\nCouldn't fetch device data for analysis.`);
      return;
    }

    if (data.readinessScore !== null) {
      addRecoveryScore(telegramId, data.readinessScore);
    }

    const moodEntries = getMoodEntries(telegramId);
    const recoveryHistory = getRecoveryHistory(telegramId);
    const decision = getMoodDecision(data, score, moodEntries, recoveryHistory);
    addMoodEntry(telegramId, score);

    const message = formatMoodTelegram(decision);
    await reply(ctx, message);
  } catch (error) {
    console.error("Mood check error:", error);
    addMoodEntry(telegramId, score);
    await reply(ctx, `✅ Mood logged: ${score}/5\n\nError analyzing data, but your mood was saved.`);
  }
}

export async function handleMoodDemo(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    setUser(telegramId, {});
  }

  console.log(`📊 /mooddemo from ${telegramId}`);

  const text = ctx.message?.text || "";
  const parts = text.split(" ").filter((p) => p.trim());

  let score = Math.floor(Math.random() * 5) + 1;
  if (parts.length >= 2) {
    const parsed = parseInt(parts[1], 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
      score = parsed;
    }
  }

  await ctx.reply("🎲 Generating random scenario...");

  const data = getRandomDemoData();
  const decision = getMoodDecision(data, score);
  const message = formatMoodTelegram(decision);

  const demoNote = `\n\n<i>📝 Demo: Mood ${score}/5 + random biometrics.\nUse /connect to see your real data.</i>`;
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

export async function handleAsk(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  incrementCommandCount("ask");
  console.log(`📊 /ask from ${telegramId}`);

  if (!isAskAvailable()) {
    await reply(ctx, "⚠️ <b>Ask feature not configured</b>\n\nServer admin needs to set ANTHROPIC_API_KEY.");
    return;
  }

  if (!hasConnectedDevice(telegramId)) {
    await reply(ctx, MESSAGES.notConnected);
    return;
  }

  const text = ctx.message?.text || "";
  const question = text.replace(/^\/ask\s*/i, "").trim();

  if (!question) {
    await reply(
      ctx,
      `💬 <b>Ask P360 Anything</b>

Ask about your body state in any language.

<b>Examples:</b>
<code>/ask 회식인데 소주 몇 잔까지 괜찮아?</code>
<code>/ask should I work out today?</code>
<code>/ask 커피 지금 마셔도 되나?</code>
<code>/ask I'm tired but need to keep working</code>

<b>Demo:</b> /askdemo 오늘 운동해도 돼?`
    );
    return;
  }

  await ctx.reply("🔄 Analyzing your data...");

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
    await reply(ctx, "❌ Error processing your question. Try again.");
  }
}

export async function handleAskDemo(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    setUser(telegramId, {});
  }

  incrementCommandCount("askdemo");
  console.log(`📊 /askdemo from ${telegramId}`);

  if (!isAskAvailable()) {
    await reply(ctx, "⚠️ <b>Ask feature not configured</b>\n\nServer admin needs to set ANTHROPIC_API_KEY.");
    return;
  }

  const text = ctx.message?.text || "";
  const question = text.replace(/^\/askdemo\s*/i, "").trim() || "오늘 운동해도 돼?";

  await ctx.reply("🎲 Generating with demo data...");

  try {
    const data = getRandomDemoData();
    const userId = telegramId ? `tg-${telegramId}` : "tg-demo";
    const message = await getAskResponse(question, data, userId, eventStore);
    const demoNote = `\n\n<i>📝 This is demo data. Use /connect to see your real data.</i>`;
    await reply(ctx, message + demoNote);
  } catch (error) {
    console.error("Ask demo error:", error);
    await reply(ctx, "❌ Error processing your question. Try again.");
  }
}

// Handle unknown commands
export async function handleUnknown(ctx: Context) {
  await reply(
    ctx,
    `❓ Unknown command. Try /help to see available commands.`
  );
}
