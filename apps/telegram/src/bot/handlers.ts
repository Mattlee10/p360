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

// IANA timezone 유효성 검사
function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
import {
  fetchBiometricData,
  validateToken,
  getRandomDemoData,
  getProviderDisplayName,
} from "../lib/data";
import { getAskResponse, isAskAvailable } from "../lib/ask";
import { createSupabaseEventStore, createSupabaseProfileStore, resolveOutcomes, buildCausalityProfile } from "@p360/core";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

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
    const userTimezone = getUser(telegramId)?.timezone;

    const message = await getAskResponse(question, data, userId, eventStore, undefined, userTimezone);
    updateLastCheck(telegramId);

    // Resolve yesterday's pending outcomes → profile 자동 갱신 (fire-and-forget)
    if (eventStore && !demo) {
      resolveOutcomes(eventStore, userId, data).then(async (resolved) => {
        if (resolved > 0) {
          const profileStore = createSupabaseProfileStore();
          if (profileStore) {
            const allEvents = await eventStore.getByUser(userId, 500);
            const newProfile = buildCausalityProfile(userId, allEvents, data.history);
            await profileStore.saveProfile(newProfile);
            console.log(`[profile] Updated for ${userId}: ${resolved} outcomes resolved, ${newProfile.patterns.length} patterns`);
          }
        }
      }).catch(() => {});
    }

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

// /timezone command - set user's local timezone
export async function handleTimezone(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const text = ctx.message?.text || "";
  const parts = text.split(" ").filter((p) => p.trim());

  if (parts.length < 2) {
    const current = getUser(telegramId)?.timezone ?? "Not set (using UTC)";
    await reply(
      ctx,
      `🌍 <b>Timezone Settings</b>\n\nCurrent: <code>${current}</code>\n\nUsage: /timezone [IANA timezone]\n\nExamples:\n• /timezone Asia/Seoul\n• /timezone America/New_York\n• /timezone Europe/London\n• /timezone UTC`,
    );
    return;
  }

  const tz = parts[1].trim();
  if (!isValidTimezone(tz)) {
    await reply(
      ctx,
      `❌ Invalid timezone: <code>${tz}</code>\n\nUse IANA format. Examples:\n• Asia/Seoul\n• America/New_York\n• Europe/London`,
    );
    return;
  }

  setUser(telegramId, { timezone: tz });
  await reply(ctx, `✅ Timezone set to <code>${tz}</code>\n\nYour coffee/drink times will now be recorded in your local time.`);
}

// Handle unknown commands
export async function handleUnknown(ctx: Context) {
  await reply(
    ctx,
    `❓ Unknown command. Try /help to see available commands.`
  );
}

// /profile command - show causality learning progress + active personal constants
export async function handleProfile(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  if (!hasConnectedDevice(telegramId)) {
    await reply(ctx, MESSAGES.notConnected);
    return;
  }

  await ctx.reply("🔄 Loading your profile...");

  const userId = `tg-${telegramId}`;
  const MIN_FOR_PATTERN = 5;

  try {
    const profileStore = createSupabaseProfileStore();
    if (!profileStore || !eventStore) {
      await reply(ctx, "⚠️ Profile not available (Supabase not configured).");
      return;
    }

    const [profile, events] = await Promise.all([
      profileStore.getProfile(userId),
      eventStore.getByUser(userId, 200),
    ]);

    // Count useful events per domain (amount > 0 + outcome = eligible for pattern detection)
    const domainProgress: Record<string, { useful: number }> = {
      drink: { useful: 0 },
      coffee: { useful: 0 },
      workout: { useful: 0 },
    };

    for (const event of events) {
      const d = domainProgress[event.domain];
      if (!d) continue;
      const hasAmount = event.action.amount !== undefined && event.action.amount > 0;
      const hasTimes = event.action.times !== undefined && event.action.times.length > 0;
      const isCoffeeEligible = event.domain === "coffee" && (hasAmount || hasTimes);
      const isOtherEligible = event.domain !== "coffee" && hasAmount;
      if (event.outcome && (isCoffeeEligible || isOtherEligible)) {
        d.useful++;
      }
    }

    const totalEvents = events.filter((e) => e.domain !== "general").length;
    const totalWithOutcome = events.filter((e) => e.domain !== "general" && e.outcome).length;
    const lines: string[] = [];

    lines.push(`<b>📊 Your Causality Profile</b>`);
    lines.push(``);
    lines.push(`Events tracked: <b>${totalEvents}</b> | With outcome: <b>${totalWithOutcome}</b>`);
    lines.push(``);

    const constants = profile?.personalConstants ?? {};
    const hasConstants = Object.keys(constants).length > 0;

    if (hasConstants) {
      lines.push(`<b>⚙️ Your Personal Constants</b>`);
      lines.push(`<i>(Claude uses these instead of population averages)</i>`);
      lines.push(``);
      if (constants.alcoholHrvDropPerDrink !== undefined)
        lines.push(`  🍺 HRV drop/drink: <b>${constants.alcoholHrvDropPerDrink.toFixed(1)}%</b>  <i>avg: 4.5%</i>`);
      if (constants.alcoholRecoveryDropPerDrink !== undefined)
        lines.push(`  🍺 Recovery cost/drink: <b>${constants.alcoholRecoveryDropPerDrink.toFixed(1)} pts</b>  <i>avg: 4.2</i>`);
      if (constants.personalDrinkLimit !== undefined)
        lines.push(`  🍺 Safe drink limit: <b>${constants.personalDrinkLimit}</b>  <i>avg: 3</i>`);
      if (constants.caffeineSleepImpactPerCup !== undefined)
        lines.push(`  ☕ Sleep impact/cup: <b>${constants.caffeineSleepImpactPerCup.toFixed(1)} pts</b>  <i>avg: 4</i>`);
      if (constants.caffeineHalfLifeHours !== undefined)
        lines.push(`  ☕ Caffeine half-life: <b>${constants.caffeineHalfLifeHours}h</b>  <i>avg: 6h</i>`);
      if (constants.caffeineTimingCutoff !== undefined) {
        const h = Math.floor(constants.caffeineTimingCutoff);
        const m = constants.caffeineTimingCutoff % 1 === 0.5 ? "30" : "00";
        const ampm = h < 12 ? "AM" : "PM";
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        lines.push(`  ☕ Coffee cutoff: <b>${h}:${m}</b> (${h12}:${m} ${ampm})  <i>avg: 14:00 (2:00 PM)</i>`);
      }
      if (constants.workoutRecoveryThreshold !== undefined)
        lines.push(`  💪 Workout threshold: <b>${constants.workoutRecoveryThreshold}</b>  <i>avg: 70</i>`);

      if (profile?.patterns && profile.patterns.length > 0) {
        lines.push(``);
        lines.push(`<b>🔍 Discovered Patterns</b>`);
        profile.patterns.slice(0, 3).forEach((p) => {
          lines.push(`  • ${p.description}`);
        });
      }
      lines.push(``);
    } else {
      lines.push(`<b>⚙️ Personal constants:</b> not yet unlocked`);
      lines.push(`<i>Using population defaults for now</i>`);
      lines.push(``);
    }

    // Progress bars for unlocking patterns
    const domainEmoji: Record<string, string> = { drink: "🍺", coffee: "☕", workout: "💪" };
    const progressLines: string[] = [];
    for (const [domain, { useful }] of Object.entries(domainProgress)) {
      const emoji = domainEmoji[domain];
      if (useful >= MIN_FOR_PATTERN) {
        progressLines.push(`  ${emoji} ${domain}: ✅ unlocked (${useful} data points)`);
      } else {
        progressLines.push(`  ${emoji} ${domain}: ${useful}/${MIN_FOR_PATTERN}  ← ${MIN_FOR_PATTERN - useful} more needed`);
      }
    }

    lines.push(`<b>📈 Progress to personalization</b>`);
    lines.push(progressLines.join("\n"));
    lines.push(``);
    lines.push(`<i>Keep using /ask. Patterns unlock automatically once thresholds are hit.</i>`);

    await reply(ctx, lines.join("\n"));
  } catch (error) {
    console.error("profile error:", error);
    await reply(ctx, "❌ Error loading profile. Try again.");
  }
}
