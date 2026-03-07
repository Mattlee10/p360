import { Bot } from "grammy";
import * as dotenv from "dotenv";
import cron from "node-cron";
import {
  resolveOutcomes,
  createSupabaseEventStore,
  createSupabaseProfileStore,
  buildCausalityProfile,
  OuraProvider,
} from "@p360/core";
import {
  handleStart,
  handleHelp,
  handleConnect,
  handleDisconnect,
  handleStatus,
  handleAsk,
  handleDemo,
  handleTimezone,
  handleUnknown,
} from "./bot/handlers";
import { getConnectedUsers, preloadUsers } from "./lib/storage";
import { loadAllUsersFromSupabase } from "./lib/supabase-user-store";
import { getAskResponse } from "./lib/ask";
import { generateDailyDecisionQuestion, formatDailyNudgeHeader } from "./lib/daily-nudge";

// Load environment variables
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN not set in environment");
  console.log("");
  console.log("To get a bot token:");
  console.log("1. Open Telegram and search for @BotFather");
  console.log("2. Send /newbot and follow instructions");
  console.log("3. Copy the token and set it:");
  console.log("   export TELEGRAM_BOT_TOKEN=your_token");
  console.log("");
  process.exit(1);
}

// Create bot instance
const bot = new Bot(BOT_TOKEN);

// ============================================
// Minimal Command Set (Claude-first)
// ============================================

// Essential commands
bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.command("ask", handleAsk);
bot.command("demo", handleDemo);

// Device management
bot.command("connect", handleConnect);
bot.command("status", handleStatus);
bot.command("disconnect", handleDisconnect);
bot.command("timezone", handleTimezone);

// Handle unknown commands
bot.on("message:text", (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith("/")) {
    handleUnknown(ctx);
  }
});

// Error handler
bot.catch((err) => {
  console.error("Bot error:", err);
});

// ============================================
// Cron Job: Daily Outcome Resolution (9 AM KST = 0 AM UTC)
// ============================================

function scheduleCronJobs() {
  // Run every day at 00:00 UTC (09:00 KST)
  cron.schedule("0 0 * * *", async () => {
    console.log("[cron] Starting daily outcome resolution at", new Date().toISOString());

    try {
      const eventStore = createSupabaseEventStore();
      const profileStore = createSupabaseProfileStore();

      if (!eventStore) {
        console.log("[cron] Supabase not configured (missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)");
        return;
      }

      const connectedUsers = getConnectedUsers();
      console.log(`[cron] Processing ${connectedUsers.length} connected users`);

      for (const user of connectedUsers) {
        const userId = `tg-${user.telegramId}`;
        try {
          const userProvider = new OuraProvider();
          const userData = await userProvider.fetchBiometricData(user.providerToken);
          if (!userData) {
            console.log(`[cron] No data for user ${user.telegramId}, skipping`);
            continue;
          }

          // 1. Resolve pending outcomes
          const resolved = await resolveOutcomes(eventStore, userId, userData);
          if (resolved > 0) {
            console.log(`[cron] ✅ Resolved ${resolved} pending outcomes for ${userId}`);
          }

          // 2. Build profile if 5+ events
          if (profileStore) {
            const events = await eventStore.getByUser(userId, 100);
            if (events.length >= 5) {
              try {
                const profile = buildCausalityProfile(userId, events);
                await profileStore.saveProfile(profile);
                console.log(`[cron] ✅ Profile updated for ${userId} (${events.length} events)`);
              } catch (err) {
                console.error(`[cron] Failed to save profile for ${userId}:`, err instanceof Error ? err.message : err);
              }
            }
          }

          // 3. Send daily nudge (no eventStore — cron questions must not be saved as causality events)
          const question = generateDailyDecisionQuestion(userData);
          const nudgeResponse = await getAskResponse(
            question,
            userData,
            userId,
            undefined,
            "hardcore",
          );

          const header = formatDailyNudgeHeader(userData);
          await bot.api.sendMessage(user.telegramId, `${header}\n\n${nudgeResponse}`, { parse_mode: "HTML" });
          console.log(`[cron] ✅ Daily nudge sent to user ${user.telegramId}`);
        } catch (err) {
          console.error(`[cron] Failed to process user ${user.telegramId}:`, err instanceof Error ? err.message : err);
        }
      }

    } catch (error) {
      console.error("[cron] Error in daily cron:", error instanceof Error ? error.message : error);
    }
  });

  console.log("[cron] ✅ Cron job scheduled: Daily outcome resolution at 00:00 UTC (09:00 KST)");
}

// Preload users from Supabase before starting bot
async function initAndStart() {
  process.stdout.write("🤖 P360 Telegram Bot starting...\n");

  // Railway 재시작 후 유저 데이터 복원
  try {
    const persistedUsers = await loadAllUsersFromSupabase();
    preloadUsers(persistedUsers);
  } catch (err) {
    console.warn("[startup] Failed to preload users from Supabase (continuing):", err);
  }

  // Schedule cron jobs BEFORE starting bot
  process.stdout.write("[cron] Initializing cron scheduling...\n");
  scheduleCronJobs();
  process.stdout.write("[cron] Cron initialization complete\n");
  process.stdout.write("\n");

  bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Bot started: @${botInfo.username}`);
    console.log("");
    console.log("Available commands:");
    console.log("  /ask <question>   - Ask anything (AI-powered)");
    console.log("  /demo             - Try with demo data");
    console.log("  /connect          - Link your Oura Ring or WHOOP");
    console.log("  /status           - Check connection status");
    console.log("  /disconnect       - Remove device connection");
    console.log("  /help             - Show all commands");
    console.log("");
    console.log("Press Ctrl+C to stop");
  },
  });
}

initAndStart().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
