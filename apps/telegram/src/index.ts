import { Bot } from "grammy";
import * as dotenv from "dotenv";
import cron from "node-cron";
import {
  resolveOutcomes,
  createSupabaseEventStore,
  createSupabaseProfileStore,
  buildCausalityProfile,
} from "@p360/core";
import { OuraProvider } from "@p360/core";
import {
  handleStart,
  handleHelp,
  handleConnect,
  handleDisconnect,
  handleStatus,
  handleAsk,
  handleDemo,
  handleUnknown,
} from "./bot/handlers";
import { getConnectedUsers } from "./lib/storage";
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

      if (!eventStore) {
        console.log("[cron] Supabase not configured (missing SUPABASE_URL/SUPABASE_ANON_KEY)");
        return;
      }

      const ouraToken = process.env.OURA_API_KEY;
      if (!ouraToken) {
        console.log("[cron] Oura API token not configured");
        return;
      }

      const ouraProvider = new OuraProvider();
      const userId = process.env.P360_USER_ID || "cli-default";

      // Fetch today's biometric data from Oura
      const data = await ouraProvider.fetchBiometricData(ouraToken);

      if (!data) {
        console.log("[cron] No biometric data available for", userId);
        return;
      }

      // Resolve pending outcomes (24h+ old without outcome)
      const resolved = await resolveOutcomes(eventStore, userId, data);
      console.log(`[cron] ✅ Resolved ${resolved} pending outcomes for ${userId}`);

      // Check if we have 5+ events to build a profile
      const events = await eventStore.getByUser(userId, 100);

      if (events.length >= 5) {
        const profileStore = createSupabaseProfileStore();
        if (profileStore) {
          try {
            const profile = buildCausalityProfile(userId, events);
            await profileStore.saveProfile(profile);
            console.log(`[cron] ✅ Generated CausalityProfile for ${userId} (${events.length} events)`);
            console.log(`[cron]    - Personal HRV sensitivity: ${profile.personalConstants.alcoholHrvDropPerDrink}%`);
            console.log(`[cron]    - Personal drink limit: ${profile.personalConstants.personalDrinkLimit} drinks`);
          } catch (err) {
            console.error("[cron] Failed to save profile:", err instanceof Error ? err.message : err);
          }
        }
      }

      // Daily Shame Bot nudge: send opportunity cost report to all connected users
      const connectedUsers = getConnectedUsers();
      console.log(`[cron] Sending daily nudge to ${connectedUsers.length} connected users`);

      for (const user of connectedUsers) {
        try {
          const userProvider = new OuraProvider();
          const userData = await userProvider.fetchBiometricData(user.providerToken);
          if (!userData) {
            console.log(`[cron] No data for user ${user.telegramId}, skipping nudge`);
            continue;
          }

          const question = generateDailyDecisionQuestion(userData);
          const userIdStr = `tg-${user.telegramId}`;
          const nudgeResponse = await getAskResponse(
            question,
            userData,
            userIdStr,
            eventStore,
            undefined,
            "hardcore",
          );

          const header = formatDailyNudgeHeader(userData);
          const message = `${header}\n\n${nudgeResponse}`;

          await bot.api.sendMessage(user.telegramId, message, { parse_mode: "HTML" });
          console.log(`[cron] ✅ Daily nudge sent to user ${user.telegramId}`);
        } catch (err) {
          console.error(`[cron] Failed to send nudge to user ${user.telegramId}:`, err instanceof Error ? err.message : err);
        }
      }

    } catch (error) {
      console.error("[cron] Error resolving outcomes:", error instanceof Error ? error.message : error);
    }
  });

  console.log("[cron] ✅ Cron job scheduled: Daily outcome resolution at 00:00 UTC (09:00 KST)");
}

// Schedule cron jobs BEFORE starting bot
process.stdout.write("🤖 P360 Telegram Bot starting...\n");
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
