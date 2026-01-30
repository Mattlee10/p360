import { Context } from "grammy";
import { MESSAGES } from "./messages";
import {
  getOuraToken,
  setOuraToken,
  getUser,
  setUser,
  updateLastCheck,
} from "../lib/storage";
import { fetchBiometricData, getRandomDemoData } from "../lib/oura";
import { getWorkoutDecision, formatWorkoutTelegram } from "../lib/workout";

// Helper to send HTML messages
async function reply(ctx: Context, text: string) {
  await ctx.reply(text, { parse_mode: "HTML" });
}

// /start command
export async function handleStart(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    setUser(telegramId, {});
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

// /workout command
export async function handleWorkout(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const token = getOuraToken(telegramId);

  if (!token) {
    await reply(ctx, MESSAGES.notConnected);
    return;
  }

  await ctx.reply("🔄 Fetching your data...");

  try {
    const data = await fetchBiometricData(token);
    const decision = getWorkoutDecision(data);
    const message = formatWorkoutTelegram(decision);

    updateLastCheck(telegramId);
    await reply(ctx, message);
  } catch (error) {
    console.error("Workout check error:", error);
    await reply(ctx, MESSAGES.fetchError);
  }
}

// /demo command
export async function handleDemo(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (telegramId) {
    setUser(telegramId, {});
  }

  await ctx.reply("🎲 Generating random scenario...");

  const data = getRandomDemoData();
  const decision = getWorkoutDecision(data);
  const message = formatWorkoutTelegram(decision);

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
