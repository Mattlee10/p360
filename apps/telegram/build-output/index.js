"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const dotenv = __importStar(require("dotenv"));
const handlers_1 = require("./bot/handlers");
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
const bot = new grammy_1.Bot(BOT_TOKEN);
// Register command handlers
bot.command("start", handlers_1.handleStart);
bot.command("help", handlers_1.handleHelp);
bot.command("connect", handlers_1.handleConnect);
bot.command("disconnect", handlers_1.handleDisconnect);
bot.command("status", handlers_1.handleStatus);
bot.command("workout", handlers_1.handleWorkout);
bot.command("w", handlers_1.handleWorkout); // shortcut
bot.command("sports", handlers_1.handleSports);
bot.command("demo", handlers_1.handleDemo);
bot.command("feedback", handlers_1.handleFeedback);
bot.command("drink", handlers_1.handleDrink);
bot.command("d", handlers_1.handleDrink); // shortcut
bot.command("drinkdemo", handlers_1.handleDrinkDemo);
bot.command("why", handlers_1.handleWhy);
bot.command("whydemo", handlers_1.handleWhyDemo);
bot.command("mood", handlers_1.handleMood);
bot.command("m", handlers_1.handleMood); // shortcut
bot.command("mooddemo", handlers_1.handleMoodDemo);
bot.command("cost", handlers_1.handleCost);
bot.command("c", handlers_1.handleCost); // shortcut
bot.command("costdemo", handlers_1.handleCostDemo);
bot.command("stats", handlers_1.handleStats); // admin only
// Handle unknown commands
bot.on("message:text", (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith("/")) {
        (0, handlers_1.handleUnknown)(ctx);
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
        console.log("  /connect          - Link Oura/WHOOP");
        console.log("  /demo             - Try with demo data");
        console.log("  /help             - Show all commands");
        console.log("");
        console.log("Press Ctrl+C to stop");
    },
});
