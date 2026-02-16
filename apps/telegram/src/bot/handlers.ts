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
import { getWorkoutDecision, formatWorkoutTelegram, parseSport, getSportList } from "../lib/workout";
import {
  getDrinkDecision,
  formatDrinkTelegram,
  formatDrinkLogTelegram,
  formatDrinkHistoryTelegram,
  formatSocialStrategyTelegram,
  getSocialStrategy,
  calculateDrinkHistory,
} from "../lib/drink";
import {
  getWhyDecision,
  formatWhyTelegram,
  parseWhyInput,
} from "../lib/why";
import {
  getMoodDecision,
  calculateMoodInsight,
  formatMoodTelegram,
  formatMoodHistoryTelegram,
  formatMoodLoggedTelegram,
} from "../lib/mood";
import {
  getRecoveryCost,
  parseSubstance,
  getSubstanceList,
  formatCostTelegram,
} from "../lib/cost";
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
// Usage: /connect TOKEN (defaults to Oura)
//        /connect oura TOKEN
//        /connect whoop TOKEN
export async function handleConnect(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const text = ctx.message?.text || "";
  const parts = text.split(" ").filter((p) => p.trim());

  if (parts.length < 2) {
    await reply(ctx, MESSAGES.connectInstructions);
    return;
  }

  // Parse provider and token
  let provider: ProviderType = "oura";
  let token: string;

  if (parts.length >= 3) {
    // /connect oura TOKEN or /connect whoop TOKEN
    const providerArg = parts[1].toLowerCase();
    if (providerArg === "whoop") {
      provider = "whoop";
    } else if (providerArg === "oura") {
      provider = "oura";
    } else {
      // Unknown provider, treat as token for backward compatibility
      token = parts[1].trim();
      await validateAndConnect(ctx, telegramId, token, provider);
      return;
    }
    token = parts[2].trim();
  } else {
    // /connect TOKEN (default to Oura)
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

    // Save provider and token
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

// /workout command - supports /workout or /workout basketball
export async function handleWorkout(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  incrementCommandCount("workout");
  console.log(`📊 /workout from ${telegramId}`);

  if (!hasConnectedDevice(telegramId)) {
    await reply(ctx, MESSAGES.notConnected);
    return;
  }

  // Parse sport from command: /workout basketball
  const text = ctx.message?.text || "";
  const parts = text.split(" ");
  const sportInput = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
  const sport = parseSport(sportInput);

  // If user provided unknown sport, show list
  if (sportInput && !sport) {
    const sportList = getSportList().join(", ");
    await reply(
      ctx,
      `⚠️ Unknown sport: "${sportInput}"\n\n<b>Supported sports:</b>\n${sportList}\n\nExample: /workout basketball`
    );
    return;
  }

  await ctx.reply("🔄 Fetching your data...");

  try {
    const data = await getUserBiometricData(telegramId);
    if (!data) {
      await reply(ctx, MESSAGES.fetchError);
      return;
    }
    const decision = getWorkoutDecision(data, sport);
    const message = formatWorkoutTelegram(decision);

    updateLastCheck(telegramId);
    await reply(ctx, message);
  } catch (error) {
    console.error("Workout check error:", error);
    await reply(ctx, MESSAGES.fetchError);
  }
}

// /sports command - list available sports
export async function handleSports(ctx: Context) {
  const sportList = getSportList();
  const formatted = sportList.map((s) => `• ${s}`).join("\n");
  await reply(
    ctx,
    `<b>🏀 Available Sports</b>\n\n${formatted}\n\n<b>Usage:</b>\n/workout basketball\n/workout running\n/workout bjj`
  );
}

// /demo command - supports /demo or /demo basketball
export async function handleDemo(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    setUser(telegramId, {});
  }

  incrementCommandCount("demo");
  console.log(`📊 /demo from ${telegramId}`);

  // Parse sport from command
  const text = ctx.message?.text || "";
  const parts = text.split(" ");
  const sportInput = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
  const sport = parseSport(sportInput);

  await ctx.reply("🎲 Generating random scenario...");

  const data = getRandomDemoData();
  const decision = getWorkoutDecision(data, sport);
  const message = formatWorkoutTelegram(decision);

  const demoNote = `\n\n<i>📝 This is demo data. Use /connect to see your real Oura data.</i>`;

  await reply(ctx, message + demoNote);
}

// /feedback command - collect user feedback
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID; // Your Telegram ID for receiving feedback

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

  // Log feedback
  console.log(`📬 FEEDBACK from @${username} (${telegramId}): ${feedbackText}`);

  // Send to admin if configured
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

// /drink command - get drink recommendation
export async function handleDrink(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  incrementCommandCount("drink");
  console.log(`📊 /drink from ${telegramId}`);

  if (!hasConnectedDevice(telegramId)) {
    await reply(ctx, MESSAGES.notConnected);
    return;
  }

  // Check for subcommands: /drink log 3, /drink history, /drink social
  const text = ctx.message?.text || "";
  const parts = text.split(" ");

  if (parts.length > 1) {
    const subcommand = parts[1].toLowerCase();

    // /drink log N
    if (subcommand === "log") {
      const amount = parseInt(parts[2], 10);
      if (isNaN(amount) || amount < 1 || amount > 20) {
        await reply(
          ctx,
          `⚠️ Please specify a valid number of drinks (1-20)\n\nExample: /drink log 3`
        );
        return;
      }

      try {
        const data = await getUserBiometricData(telegramId);
        if (!data) {
          await reply(ctx, MESSAGES.fetchError);
          return;
        }
        const decision = getDrinkDecision(data);
        addDrinkLog(telegramId, amount);

        const message = formatDrinkLogTelegram(amount, decision);
        await reply(ctx, message);
      } catch (error) {
        console.error("Drink log error:", error);
        await reply(ctx, MESSAGES.fetchError);
      }
      return;
    }

    // /drink history
    if (subcommand === "history") {
      const logs = getDrinkLogs(telegramId);
      if (logs.length === 0) {
        await reply(
          ctx,
          `📊 <b>No Drinking History</b>\n\nStart logging with /drink log N after drinking.\n\nExample: /drink log 3`
        );
        return;
      }

      const history = calculateDrinkHistory(logs);
      const message = formatDrinkHistoryTelegram(history);
      await reply(ctx, message);
      return;
    }

    // /drink social
    if (subcommand === "social" || subcommand === "event") {
      try {
        const data = await getUserBiometricData(telegramId);
        if (!data) {
          await reply(ctx, MESSAGES.fetchError);
          return;
        }
        const logs = getDrinkLogs(telegramId);
        const history = logs.length > 0 ? calculateDrinkHistory(logs) : undefined;
        const decision = getDrinkDecision(data, history);
        const strategy = getSocialStrategy(decision);

        const message = formatSocialStrategyTelegram(strategy);
        await reply(ctx, message);
      } catch (error) {
        console.error("Drink social error:", error);
        await reply(ctx, MESSAGES.fetchError);
      }
      return;
    }
  }

  // Default: /drink - show today's recommendation
  await ctx.reply("🔄 Checking your condition...");

  try {
    const data = await getUserBiometricData(telegramId);
    if (!data) {
      await reply(ctx, MESSAGES.fetchError);
      return;
    }
    const logs = getDrinkLogs(telegramId);
    const history = logs.length > 0 ? calculateDrinkHistory(logs) : undefined;
    const decision = getDrinkDecision(data, history);
    const message = formatDrinkTelegram(decision);

    updateLastCheck(telegramId);
    await reply(ctx, message);
  } catch (error) {
    console.error("Drink check error:", error);
    await reply(ctx, MESSAGES.fetchError);
  }
}

// /drink demo - try with demo data
export async function handleDrinkDemo(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    setUser(telegramId, {});
  }

  incrementCommandCount("drinkdemo");
  console.log(`📊 /drinkdemo from ${telegramId}`);

  await ctx.reply("🎲 Generating random scenario...");

  const data = getRandomDemoData();
  const decision = getDrinkDecision(data);
  const message = formatDrinkTelegram(decision);

  const demoNote = `\n\n<i>📝 This is demo data. Use /connect to see your real Oura data.</i>`;

  await reply(ctx, message + demoNote);
}

// /stats command - admin only stats
export async function handleStats(ctx: Context) {
  const telegramId = ctx.from?.id;

  // Only allow admin to see stats
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
• Oura connected: ${stats.connectedUsers}
• Used /drink: ${stats.drinkUsers}
• Today new: ${stats.todayNewUsers}

<b>Commands (since restart)</b>
• /workout: ${counts.workout}
• /drink: ${counts.drink}
• /why: ${counts.why}
• /demo: ${counts.demo}
• /drinkdemo: ${counts.drinkdemo}
• /whydemo: ${counts.whydemo}
• /cost: ${counts.cost}
• /costdemo: ${counts.costdemo}

<b>Server</b>
• Uptime: ${uptimeHours}h ${uptimeMinutes}m
`.trim();

  await reply(ctx, message);
}

// /why command - explain why you feel a certain way
export async function handleWhy(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  incrementCommandCount("why");
  console.log(`📊 /why from ${telegramId}`);

  if (!hasConnectedDevice(telegramId)) {
    await reply(ctx, MESSAGES.notConnected);
    return;
  }

  // Parse user input: /why tired 5, /why mood, /why 3, etc.
  const text = ctx.message?.text || "";
  const userInput = parseWhyInput(text);

  await ctx.reply("🔄 Analyzing your data...");

  try {
    const data = await getUserBiometricData(telegramId);
    if (!data) {
      await reply(ctx, MESSAGES.fetchError);
      return;
    }
    const decision = getWhyDecision(data, userInput);
    const message = formatWhyTelegram(decision, userInput);

    updateLastCheck(telegramId);
    await reply(ctx, message);
  } catch (error) {
    console.error("Why check error:", error);
    await reply(ctx, MESSAGES.fetchError);
  }
}

// /why demo - try with demo data
export async function handleWhyDemo(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    setUser(telegramId, {});
  }

  incrementCommandCount("whydemo");
  console.log(`📊 /whydemo from ${telegramId}`);

  // Parse user input
  const text = ctx.message?.text || "";
  const userInput = parseWhyInput(text.replace(/^\/whydemo/i, "/why"));

  await ctx.reply("🎲 Generating random scenario...");

  const data = getRandomDemoData();
  const decision = getWhyDecision(data, userInput);
  const message = formatWhyTelegram(decision, userInput);

  const demoNote = `\n\n<i>📝 This is demo data. Use /connect to see your real Oura data.</i>`;

  await reply(ctx, message + demoNote);
}

// ============================================
// Mood Commands (P17)
// ============================================

// /mood command - log mood and get attribution
// Usage: /mood N (1-5), /mood history, /mood insight
export async function handleMood(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const text = ctx.message?.text || "";
  const parts = text.split(" ").filter((p) => p.trim());

  // /mood without args - show help
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

  // /mood history
  if (subcommand === "history" || subcommand === "insight") {
    const moodEntries = getMoodEntries(telegramId);
    const recoveryHistory = getRecoveryHistory(telegramId);

    const insight = calculateMoodInsight(moodEntries, recoveryHistory);
    const message = formatMoodHistoryTelegram(insight);
    await reply(ctx, message);
    return;
  }

  // /mood N - log mood score
  const score = parseInt(subcommand, 10);
  if (isNaN(score) || score < 1 || score > 5) {
    await reply(
      ctx,
      `⚠️ Please enter a mood score from 1 to 5.

Example: /mood 3

1 = Very low, 5 = Great`
    );
    return;
  }

  // Need connected device for attribution
  if (!hasConnectedDevice(telegramId)) {
    // Log mood anyway but can't provide attribution
    addMoodEntry(telegramId, score);
    await reply(
      ctx,
      `✅ <b>Mood Logged: ${score}/5</b>

Connect your device to get insights about why you feel this way.
/connect TOKEN (Oura) or /connect whoop TOKEN`
    );
    return;
  }

  // Fetch biometric data for attribution
  try {
    const data = await getUserBiometricData(telegramId);
    if (!data) {
      addMoodEntry(telegramId, score);
      await reply(ctx, `✅ Mood logged: ${score}/5\n\nCouldn't fetch device data for analysis.`);
      return;
    }

    // Save recovery score for history
    if (data.readinessScore !== null) {
      addRecoveryScore(telegramId, data.readinessScore);
    }

    // Get mood attribution
    const moodEntries = getMoodEntries(telegramId);
    const recoveryHistory = getRecoveryHistory(telegramId);
    const decision = getMoodDecision(data, score, moodEntries, recoveryHistory);

    // Log the mood entry
    addMoodEntry(telegramId, score);

    // Format and send response
    const message = formatMoodTelegram(decision);
    await reply(ctx, message);
  } catch (error) {
    console.error("Mood check error:", error);
    addMoodEntry(telegramId, score);
    await reply(ctx, `✅ Mood logged: ${score}/5\n\nError analyzing data, but your mood was saved.`);
  }
}

// /mooddemo - try mood feature with demo data
export async function handleMoodDemo(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    setUser(telegramId, {});
  }

  console.log(`📊 /mooddemo from ${telegramId}`);

  const text = ctx.message?.text || "";
  const parts = text.split(" ").filter((p) => p.trim());

  // Random mood score if not provided
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
// Cost Commands (P27 - Recovery Cost Simulator)
// ============================================

// /cost command - show recovery cost of a substance
// Usage: /cost beer 3, /cost coffee 2, /cost wine 1
export async function handleCost(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  incrementCommandCount("cost");
  console.log(`📊 /cost from ${telegramId}`);

  if (!hasConnectedDevice(telegramId)) {
    await reply(ctx, MESSAGES.notConnected);
    return;
  }

  // Parse: /cost beer 3, /cost coffee 2
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
    await reply(
      ctx,
      `⚠️ Unknown substance: "${parts[1]}"\n\n<b>Supported:</b> ${substances}\n\nExample: /cost beer 3`
    );
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

// /costdemo command - try with demo data
export async function handleCostDemo(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    setUser(telegramId, {});
  }

  incrementCommandCount("costdemo");
  console.log(`📊 /costdemo from ${telegramId}`);

  // Parse: /costdemo beer 3 (default: beer 2)
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
// Ask Command (AI-powered contextual nudges)
// ============================================

// /ask command - natural language question
// Usage: /ask 회식인데 소주 몇 잔까지 괜찮아?
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

// /askdemo - try ask with demo data
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
