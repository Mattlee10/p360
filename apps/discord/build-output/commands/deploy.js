"use strict";
/**
 * Deploy slash commands to Discord
 *
 * Run with: npm run deploy
 *
 * Note: Global commands take up to 1 hour to propagate.
 * For development, use DISCORD_GUILD_ID for instant updates.
 */
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
const discord_js_1 = require("discord.js");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const commands = [
    new discord_js_1.SlashCommandBuilder()
        .setName("workout")
        .setDescription("Check if you should train today")
        .addStringOption((option) => option
        .setName("sport")
        .setDescription("Optional: specific sport (basketball, bjj, running, etc.)")
        .setRequired(false)),
    new discord_js_1.SlashCommandBuilder()
        .setName("drink")
        .setDescription("Check how much you can drink tonight")
        .addStringOption((option) => option
        .setName("action")
        .setDescription("Optional: log, history, or social")
        .setRequired(false)
        .addChoices({ name: "Log drinks", value: "log" }, { name: "View history", value: "history" }, { name: "Social event strategy", value: "social" }))
        .addIntegerOption((option) => option
        .setName("amount")
        .setDescription("Number of drinks to log (for log action)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(20)),
    new discord_js_1.SlashCommandBuilder()
        .setName("why")
        .setDescription("Understand why you feel a certain way (Mind vs Body)")
        .addStringOption((option) => option
        .setName("feeling")
        .setDescription("How are you feeling? (tired, mood, energy, focus)")
        .setRequired(false))
        .addIntegerOption((option) => option
        .setName("score")
        .setDescription("Rate how you feel 1-10")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)),
    new discord_js_1.SlashCommandBuilder()
        .setName("mood")
        .setDescription("Log your mood and get recovery-based insights")
        .addIntegerOption((option) => option
        .setName("score")
        .setDescription("Your mood score (1-5)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(5))
        .addStringOption((option) => option
        .setName("action")
        .setDescription("View history or insights")
        .setRequired(false)
        .addChoices({ name: "View history", value: "history" })),
    new discord_js_1.SlashCommandBuilder()
        .setName("connect")
        .setDescription("Connect your wearable device")
        .addStringOption((option) => option
        .setName("device")
        .setDescription("Your device type")
        .setRequired(true)
        .addChoices({ name: "Oura Ring", value: "oura" }, { name: "WHOOP", value: "whoop" }))
        .addStringOption((option) => option
        .setName("token")
        .setDescription("Your device access token")
        .setRequired(true)),
    new discord_js_1.SlashCommandBuilder()
        .setName("disconnect")
        .setDescription("Disconnect your wearable device"),
    new discord_js_1.SlashCommandBuilder()
        .setName("status")
        .setDescription("Check your connection status"),
    new discord_js_1.SlashCommandBuilder()
        .setName("cost")
        .setDescription("See recovery cost before you drink or caffeinate")
        .addStringOption((option) => option
        .setName("substance")
        .setDescription("What you're having")
        .setRequired(true)
        .addChoices({ name: "Beer", value: "beer" }, { name: "Wine", value: "wine" }, { name: "Spirits", value: "spirits" }, { name: "Coffee", value: "coffee" }, { name: "Tea", value: "tea" }))
        .addIntegerOption((option) => option
        .setName("amount")
        .setDescription("How many (default: 1)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)),
    new discord_js_1.SlashCommandBuilder()
        .setName("demo")
        .setDescription("Try P360 with demo data")
        .addStringOption((option) => option
        .setName("feature")
        .setDescription("Which feature to demo")
        .setRequired(false)
        .addChoices({ name: "Workout", value: "workout" }, { name: "Drink", value: "drink" }, { name: "Why", value: "why" }, { name: "Mood", value: "mood" }, { name: "Cost", value: "cost" })),
];
async function deploy() {
    const token = process.env.DISCORD_BOT_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DISCORD_GUILD_ID;
    if (!token || !clientId) {
        console.error("Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID");
        process.exit(1);
    }
    const rest = new discord_js_1.REST({ version: "10" }).setToken(token);
    try {
        console.log("🚀 Deploying slash commands...");
        const commandData = commands.map((cmd) => cmd.toJSON());
        if (guildId) {
            // Guild-specific (instant)
            await rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, guildId), {
                body: commandData,
            });
            console.log(`✅ Deployed ${commands.length} commands to guild ${guildId}`);
        }
        else {
            // Global (takes up to 1 hour)
            await rest.put(discord_js_1.Routes.applicationCommands(clientId), {
                body: commandData,
            });
            console.log(`✅ Deployed ${commands.length} commands globally`);
            console.log("⏳ Note: Global commands take up to 1 hour to propagate");
        }
    }
    catch (error) {
        console.error("Failed to deploy commands:", error);
        process.exit(1);
    }
}
deploy();
