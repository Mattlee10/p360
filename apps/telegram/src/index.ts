import { Bot } from "grammy";
import * as dotenv from "dotenv";
import {
  handleStart,
  handleHelp,
  handleConnect,
  handleDisconnect,
  handleStatus,
  handleWorkout,
  handleSports,
  handleDemo,
  handleFeedback,
  handleDrink,
  handleDrinkDemo,
  handleWhy,
  handleWhyDemo,
  handleMood,
  handleMoodDemo,
  handleCost,
  handleCostDemo,
  handleAsk,
  handleAskDemo,
  handleStats,
  handleUnknown,
} from "./bot/handlers";

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

// Register command handlers
bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.command("connect", handleConnect);
bot.command("disconnect", handleDisconnect);
bot.command("status", handleStatus);
bot.command("workout", handleWorkout);
bot.command("w", handleWorkout); // shortcut
bot.command("sports", handleSports);
bot.command("demo", handleDemo);
bot.command("feedback", handleFeedback);
bot.command("drink", handleDrink);
bot.command("d", handleDrink); // shortcut
bot.command("drinkdemo", handleDrinkDemo);
bot.command("why", handleWhy);
bot.command("whydemo", handleWhyDemo);
bot.command("mood", handleMood);
bot.command("m", handleMood); // shortcut
bot.command("mooddemo", handleMoodDemo);
bot.command("cost", handleCost);
bot.command("c", handleCost); // shortcut
bot.command("costdemo", handleCostDemo);
bot.command("ask", handleAsk);
bot.command("askdemo", handleAskDemo);
bot.command("stats", handleStats); // admin only

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

// Start bot
console.log("🤖 P360 Telegram Bot starting...");
console.log("");

bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Bot started: @${botInfo.username}`);
    console.log("");
    console.log("Available commands:");
    console.log("  /workout          - Check workout readiness");
    console.log("  /workout bball    - Sport-specific guide");
    console.log("  /sports           - List available sports");
    console.log("  /drink            - Check drinking limit");
    console.log("  /drink log N      - Log drinks (e.g. /drink log 3)");
    console.log("  /drink history    - See your drinking patterns");
    console.log("  /drink social     - Social event strategy");
    console.log("  /why              - Mind vs Body analysis");
    console.log("  /why tired 4      - With keyword + score");
    console.log("  /mood N           - Log mood (1-5) + get insight");
    console.log("  /mood history     - See mood-recovery patterns");
    console.log("  /cost beer 3      - Recovery cost simulator");
    console.log("  /cost coffee 2    - Caffeine sleep impact");
    console.log("  /ask <question>   - Ask anything (AI-powered)");
    console.log("  /connect          - Link Oura/WHOOP");
    console.log("  /demo             - Try with demo data");
    console.log("  /help             - Show all commands");
    console.log("");
    console.log("Press Ctrl+C to stop");
  },
});
