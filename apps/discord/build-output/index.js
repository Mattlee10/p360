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
const discord_js_1 = require("discord.js");
const dotenv = __importStar(require("dotenv"));
const core_1 = require("@p360/core");
const data_1 = require("./lib/data");
const storage_1 = require("./lib/storage");
const format_1 = require("./lib/format");
dotenv.config();
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error("Error: DISCORD_BOT_TOKEN not set");
    console.log("Set it in .env or environment variables");
    process.exit(1);
}
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds],
});
// ============================================
// Helper Functions
// ============================================
async function getUserBiometricData(userId) {
    const token = (0, storage_1.getProviderToken)(userId);
    if (!token)
        return null;
    const provider = (0, storage_1.getProvider)(userId) || "oura";
    return (0, data_1.fetchBiometricData)(token, provider);
}
function notConnectedEmbed() {
    return new discord_js_1.EmbedBuilder()
        .setTitle("⚠️ Device Not Connected")
        .setDescription("Connect your wearable to use this feature.")
        .setColor(0xf59e0b)
        .addFields({
        name: "How to Connect",
        value: "**Oura:** `/connect device:Oura Ring token:YOUR_TOKEN`\n**WHOOP:** `/connect device:WHOOP token:YOUR_TOKEN`",
    });
}
// ============================================
// Command Handlers
// ============================================
async function handleWorkout(interaction) {
    const userId = interaction.user.id;
    const sportInput = interaction.options.getString("sport");
    if (!(0, storage_1.hasConnectedDevice)(userId)) {
        await interaction.reply({ embeds: [notConnectedEmbed()], ephemeral: true });
        return;
    }
    const sport = (0, core_1.parseSport)(sportInput || undefined);
    if (sportInput && !sport) {
        const sportList = (0, core_1.getSportList)().join(", ");
        await interaction.reply({
            content: `Unknown sport: "${sportInput}"\n\nSupported: ${sportList}`,
            ephemeral: true,
        });
        return;
    }
    await interaction.deferReply();
    try {
        const data = await getUserBiometricData(userId);
        if (!data) {
            await interaction.editReply({ embeds: [notConnectedEmbed()] });
            return;
        }
        const decision = (0, core_1.getWorkoutDecision)(data, sport);
        const embed = (0, format_1.formatWorkoutEmbed)(decision);
        (0, storage_1.updateLastCheck)(userId);
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        console.error("Workout error:", error);
        await interaction.editReply("❌ Error fetching your data. Try again later.");
    }
}
async function handleDrink(interaction) {
    const userId = interaction.user.id;
    const action = interaction.options.getString("action");
    const amount = interaction.options.getInteger("amount");
    if (!(0, storage_1.hasConnectedDevice)(userId)) {
        await interaction.reply({ embeds: [notConnectedEmbed()], ephemeral: true });
        return;
    }
    // Handle log action
    if (action === "log") {
        if (!amount) {
            await interaction.reply({
                content: "Please specify the number of drinks to log.",
                ephemeral: true,
            });
            return;
        }
        await interaction.deferReply();
        try {
            const data = await getUserBiometricData(userId);
            if (!data) {
                await interaction.editReply({ embeds: [notConnectedEmbed()] });
                return;
            }
            (0, storage_1.addDrinkLog)(userId, amount);
            const decision = (0, core_1.getDrinkDecision)(data);
            const impact = decision.impacts.find((i) => i.drinks === amount) ||
                decision.impacts[decision.impacts.length - 1];
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`✅ Logged: ${amount} drink${amount > 1 ? "s" : ""}`)
                .setColor(amount <= decision.greenLimit ? 0x22c55e : 0xf59e0b)
                .addFields({ name: "HRV Impact", value: impact.hrvDrop, inline: true }, { name: "Fatigue", value: impact.fatigue, inline: true }, { name: "Recovery", value: impact.recoveryTime, inline: true });
            if (amount > decision.greenLimit) {
                embed.setFooter({ text: "💤 Early bedtime will help recovery" });
            }
            else {
                embed.setFooter({ text: "👍 Within your safe limit - nice job!" });
            }
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error("Drink log error:", error);
            await interaction.editReply("❌ Error logging drinks.");
        }
        return;
    }
    // Handle history action
    if (action === "history") {
        const logs = (0, storage_1.getDrinkLogs)(userId);
        if (logs.length === 0) {
            await interaction.reply({
                content: "No drinking history yet. Use `/drink action:Log drinks amount:N` to start logging.",
                ephemeral: true,
            });
            return;
        }
        const history = (0, core_1.calculateDrinkHistory)(logs);
        const embed = (0, format_1.formatDrinkHistoryEmbed)(history);
        await interaction.reply({ embeds: [embed] });
        return;
    }
    // Handle social action
    if (action === "social") {
        await interaction.deferReply();
        try {
            const data = await getUserBiometricData(userId);
            if (!data) {
                await interaction.editReply({ embeds: [notConnectedEmbed()] });
                return;
            }
            const logs = (0, storage_1.getDrinkLogs)(userId);
            const history = logs.length > 0 ? (0, core_1.calculateDrinkHistory)(logs) : undefined;
            const decision = (0, core_1.getDrinkDecision)(data, history);
            const strategy = (0, core_1.getSocialStrategy)(decision);
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`🍻 ${strategy.headline}`)
                .setColor(0x3b82f6)
                .addFields({ name: "Tonight's Max", value: `${strategy.limit} drinks`, inline: true }, { name: "Strategy", value: strategy.tips.map((t, i) => `${i + 1}. ${t}`).join("\n"), inline: false });
            await interaction.editReply({ embeds: [embed] });
        }
        catch (error) {
            console.error("Drink social error:", error);
            await interaction.editReply("❌ Error getting strategy.");
        }
        return;
    }
    // Default: show recommendation
    await interaction.deferReply();
    try {
        const data = await getUserBiometricData(userId);
        if (!data) {
            await interaction.editReply({ embeds: [notConnectedEmbed()] });
            return;
        }
        const logs = (0, storage_1.getDrinkLogs)(userId);
        const history = logs.length > 0 ? (0, core_1.calculateDrinkHistory)(logs) : undefined;
        const decision = (0, core_1.getDrinkDecision)(data, history);
        const embed = (0, format_1.formatDrinkEmbed)(decision);
        (0, storage_1.updateLastCheck)(userId);
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        console.error("Drink error:", error);
        await interaction.editReply("❌ Error fetching your data.");
    }
}
async function handleWhy(interaction) {
    const userId = interaction.user.id;
    const feeling = interaction.options.getString("feeling");
    const score = interaction.options.getInteger("score");
    if (!(0, storage_1.hasConnectedDevice)(userId)) {
        await interaction.reply({ embeds: [notConnectedEmbed()], ephemeral: true });
        return;
    }
    const userInput = (0, core_1.parseWhyInput)(`/why ${feeling || ""} ${score || ""}`);
    await interaction.deferReply();
    try {
        const data = await getUserBiometricData(userId);
        if (!data) {
            await interaction.editReply({ embeds: [notConnectedEmbed()] });
            return;
        }
        const decision = (0, core_1.getWhyDecision)(data, userInput);
        const embed = (0, format_1.formatWhyEmbed)(decision);
        (0, storage_1.updateLastCheck)(userId);
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        console.error("Why error:", error);
        await interaction.editReply("❌ Error analyzing your data.");
    }
}
async function handleMood(interaction) {
    const userId = interaction.user.id;
    const score = interaction.options.getInteger("score");
    const action = interaction.options.getString("action");
    // History action
    if (action === "history") {
        const moodEntries = (0, storage_1.getMoodEntries)(userId);
        const recoveryHistory = (0, storage_1.getRecoveryHistory)(userId);
        const insight = (0, core_1.calculateMoodInsight)(moodEntries, recoveryHistory);
        const embed = (0, format_1.formatMoodHistoryEmbed)(insight);
        await interaction.reply({ embeds: [embed] });
        return;
    }
    // Need score for mood logging
    if (!score) {
        await interaction.reply({
            content: "**🎭 Mood Tracking**\n\nLog your mood (1-5):\n`/mood score:1` - Very low\n`/mood score:3` - Neutral\n`/mood score:5` - Great\n\nOr view patterns: `/mood action:View history`",
            ephemeral: true,
        });
        return;
    }
    if (!(0, storage_1.hasConnectedDevice)(userId)) {
        (0, storage_1.addMoodEntry)(userId, score);
        await interaction.reply({
            content: `✅ **Mood Logged: ${score}/5**\n\nConnect your device to get insights about why you feel this way.`,
            ephemeral: true,
        });
        return;
    }
    await interaction.deferReply();
    try {
        const data = await getUserBiometricData(userId);
        if (!data) {
            (0, storage_1.addMoodEntry)(userId, score);
            await interaction.editReply(`✅ Mood logged: ${score}/5\n\nCouldn't fetch device data.`);
            return;
        }
        if (data.readinessScore !== null) {
            (0, storage_1.addRecoveryScore)(userId, data.readinessScore);
        }
        const moodEntries = (0, storage_1.getMoodEntries)(userId);
        const recoveryHistory = (0, storage_1.getRecoveryHistory)(userId);
        const decision = (0, core_1.getMoodDecision)(data, score, moodEntries, recoveryHistory);
        (0, storage_1.addMoodEntry)(userId, score);
        const embed = (0, format_1.formatMoodEmbed)(decision);
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        console.error("Mood error:", error);
        (0, storage_1.addMoodEntry)(userId, score);
        await interaction.editReply(`✅ Mood logged: ${score}/5\n\nError analyzing data.`);
    }
}
async function handleConnect(interaction) {
    const userId = interaction.user.id;
    const device = interaction.options.getString("device", true);
    const token = interaction.options.getString("token", true);
    const displayName = (0, data_1.getProviderDisplayName)(device);
    await interaction.deferReply({ ephemeral: true });
    try {
        const isValid = await (0, data_1.validateToken)(token, device);
        if (!isValid) {
            await interaction.editReply(`❌ **${displayName} Connection Failed**\n\nThe token appears to be invalid. Please check:\n1. You copied the full token\n2. The token hasn't expired`);
            return;
        }
        (0, storage_1.setProvider)(userId, device, token);
        await interaction.editReply(`✅ **${displayName} Connected!**\n\nYou can now use /workout, /drink, /why, and /mood.`);
    }
    catch (error) {
        console.error("Connect error:", error);
        await interaction.editReply("❌ Connection failed. Please try again.");
    }
}
async function handleDisconnect(interaction) {
    const userId = interaction.user.id;
    (0, storage_1.setUser)(userId, { provider: undefined, providerToken: undefined });
    await interaction.reply({
        content: "🔓 **Device Disconnected**\n\nUse /connect to reconnect anytime.",
        ephemeral: true,
    });
}
async function handleStatus(interaction) {
    const userId = interaction.user.id;
    const user = (0, storage_1.getUser)(userId);
    const connected = (0, storage_1.hasConnectedDevice)(userId);
    const provider = (0, storage_1.getProvider)(userId);
    if (connected) {
        const displayName = (0, data_1.getProviderDisplayName)(provider);
        const lastCheck = user?.lastCheckAt
            ? `Last check: ${user.lastCheckAt.toLocaleString()}`
            : "No checks yet";
        await interaction.reply({
            content: `📊 **Status**\n\n${displayName}: ✅ Connected\n${lastCheck}\n\nReady to use /workout`,
            ephemeral: true,
        });
    }
    else {
        await interaction.reply({
            content: "📊 **Status**\n\nDevice: ❌ Not connected\n\nUse /connect to link your device.",
            ephemeral: true,
        });
    }
}
async function handleDemo(interaction) {
    const feature = interaction.options.getString("feature") || "workout";
    const data = (0, data_1.getRandomDemoData)();
    await interaction.deferReply();
    let embed;
    switch (feature) {
        case "drink": {
            const decision = (0, core_1.getDrinkDecision)(data);
            embed = (0, format_1.formatDrinkEmbed)(decision);
            break;
        }
        case "why": {
            const decision = (0, core_1.getWhyDecision)(data);
            embed = (0, format_1.formatWhyEmbed)(decision);
            break;
        }
        case "mood": {
            const score = Math.floor(Math.random() * 5) + 1;
            const decision = (0, core_1.getMoodDecision)(data, score);
            embed = (0, format_1.formatMoodEmbed)(decision);
            break;
        }
        case "cost": {
            const cost = (0, core_1.getRecoveryCost)(data, "beer", 3);
            embed = (0, format_1.formatCostEmbed)(cost);
            break;
        }
        default: {
            const decision = (0, core_1.getWorkoutDecision)(data);
            embed = (0, format_1.formatWorkoutEmbed)(decision);
        }
    }
    embed.setFooter({
        text: "📝 Demo data - Use /connect to see your real data",
    });
    await interaction.editReply({ embeds: [embed] });
}
// ============================================
// Cost Handler (P27 - Recovery Cost Simulator)
// ============================================
async function handleCost(interaction) {
    const userId = interaction.user.id;
    const substanceInput = interaction.options.getString("substance", true);
    const amount = interaction.options.getInteger("amount") || 1;
    if (!(0, storage_1.hasConnectedDevice)(userId)) {
        await interaction.reply({ embeds: [notConnectedEmbed()], ephemeral: true });
        return;
    }
    const substance = (0, core_1.parseSubstance)(substanceInput);
    if (!substance) {
        await interaction.reply({
            content: `Unknown substance: "${substanceInput}"`,
            ephemeral: true,
        });
        return;
    }
    await interaction.deferReply();
    try {
        const data = await getUserBiometricData(userId);
        if (!data) {
            await interaction.editReply({ embeds: [notConnectedEmbed()] });
            return;
        }
        const cost = (0, core_1.getRecoveryCost)(data, substance, amount);
        const embed = (0, format_1.formatCostEmbed)(cost);
        (0, storage_1.updateLastCheck)(userId);
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        console.error("Cost error:", error);
        await interaction.editReply("❌ Error calculating recovery cost.");
    }
}
// ============================================
// Event Handlers
// ============================================
client.once("ready", (c) => {
    console.log(`✅ Discord bot ready: ${c.user.tag}`);
    console.log("");
    console.log("Commands: /workout, /drink, /cost, /why, /mood, /connect, /demo");
    console.log("");
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    const { commandName } = interaction;
    try {
        switch (commandName) {
            case "workout":
                await handleWorkout(interaction);
                break;
            case "drink":
                await handleDrink(interaction);
                break;
            case "why":
                await handleWhy(interaction);
                break;
            case "mood":
                await handleMood(interaction);
                break;
            case "connect":
                await handleConnect(interaction);
                break;
            case "disconnect":
                await handleDisconnect(interaction);
                break;
            case "status":
                await handleStatus(interaction);
                break;
            case "cost":
                await handleCost(interaction);
                break;
            case "demo":
                await handleDemo(interaction);
                break;
            default:
                await interaction.reply({
                    content: "Unknown command",
                    ephemeral: true,
                });
        }
    }
    catch (error) {
        console.error(`Error handling /${commandName}:`, error);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply("❌ An error occurred.");
        }
        else {
            await interaction.reply({ content: "❌ An error occurred.", ephemeral: true });
        }
    }
});
// Start bot
console.log("🤖 P360 Discord Bot starting...");
client.login(BOT_TOKEN);
