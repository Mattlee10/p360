import { Context } from "grammy";
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
} from "../lib/storage";
import { fetchBiometricData, getRandomDemoData } from "../lib/oura";
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

// Helper to send HTML messages
async function reply(ctx: Context, text: string) {
  await ctx.reply(text, { parse_mode: "HTML" });
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

// /connect command
export async function handleConnect(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const text = ctx.message?.text || "";
  const parts = text.split(" ");

  if (parts.length < 2) {
    await reply(ctx, MESSAGES.connectInstructions);
    return;
  }

  const token = parts[1].trim();

  // Validate token
  await ctx.reply("🔄 Validating token...");

  try {
    const response = await fetch(
      "https://api.ouraring.com/v2/usercollection/personal_info",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      await reply(ctx, MESSAGES.connectFailed);
      return;
    }

    // Save token
    setOuraToken(telegramId, token);
    await reply(ctx, MESSAGES.connectSuccess);
  } catch (error) {
    console.error("Connect error:", error);
    await reply(ctx, MESSAGES.connectFailed);
  }
}

// /disconnect command
export async function handleDisconnect(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  setUser(telegramId, { ouraToken: undefined });
  await reply(ctx, MESSAGES.disconnected);
}

// /status command
export async function handleStatus(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = getUser(telegramId);
  const connected = !!user?.ouraToken;
  await reply(ctx, MESSAGES.status(connected, user?.lastCheckAt));
}

// /workout command - supports /workout or /workout basketball
export async function handleWorkout(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  incrementCommandCount("workout");
  console.log(`📊 /workout from ${telegramId}`);

  const token = getOuraToken(telegramId);

  if (!token) {
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
    const data = await fetchBiometricData(token);
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

  const token = getOuraToken(telegramId);

  if (!token) {
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
        const data = await fetchBiometricData(token);
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
        const data = await fetchBiometricData(token);
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
    const data = await fetchBiometricData(token);
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

  const token = getOuraToken(telegramId);

  if (!token) {
    await reply(ctx, MESSAGES.notConnected);
    return;
  }

  // Parse user input: /why tired 5, /why mood, /why 3, etc.
  const text = ctx.message?.text || "";
  const userInput = parseWhyInput(text);

  await ctx.reply("🔄 Analyzing your data...");

  try {
    const data = await fetchBiometricData(token);
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

// Handle unknown commands
export async function handleUnknown(ctx: Context) {
  await reply(
    ctx,
    `❓ Unknown command. Try /help to see available commands.`
  );
}
