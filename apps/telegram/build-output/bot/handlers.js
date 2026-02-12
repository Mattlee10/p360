"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStart = handleStart;
exports.handleHelp = handleHelp;
exports.handleConnect = handleConnect;
exports.handleDisconnect = handleDisconnect;
exports.handleStatus = handleStatus;
exports.handleWorkout = handleWorkout;
exports.handleSports = handleSports;
exports.handleDemo = handleDemo;
exports.handleFeedback = handleFeedback;
exports.handleDrink = handleDrink;
exports.handleDrinkDemo = handleDrinkDemo;
exports.handleStats = handleStats;
exports.handleWhy = handleWhy;
exports.handleWhyDemo = handleWhyDemo;
exports.handleMood = handleMood;
exports.handleMoodDemo = handleMoodDemo;
exports.handleCost = handleCost;
exports.handleCostDemo = handleCostDemo;
exports.handleUnknown = handleUnknown;
const messages_1 = require("./messages");
const storage_1 = require("../lib/storage");
const data_1 = require("../lib/data");
const workout_1 = require("../lib/workout");
const drink_1 = require("../lib/drink");
const why_1 = require("../lib/why");
const mood_1 = require("../lib/mood");
const cost_1 = require("../lib/cost");
// Helper to send HTML messages
async function reply(ctx, text) {
    await ctx.reply(text, { parse_mode: "HTML" });
}
// Helper to get user's biometric data (provider-aware)
async function getUserBiometricData(telegramId) {
    const token = (0, storage_1.getProviderToken)(telegramId);
    if (!token)
        return null;
    const provider = (0, storage_1.getProvider)(telegramId) || "oura";
    return (0, data_1.fetchBiometricData)(token, provider);
}
// /start command
async function handleStart(ctx) {
    const telegramId = ctx.from?.id;
    const username = ctx.from?.username || "unknown";
    if (telegramId) {
        (0, storage_1.setUser)(telegramId, {});
        console.log(`🆕 New user: @${username} (${telegramId})`);
    }
    await reply(ctx, messages_1.MESSAGES.welcome);
}
// /help command
async function handleHelp(ctx) {
    await reply(ctx, messages_1.MESSAGES.help);
}
// /connect command - supports multiple devices
// Usage: /connect TOKEN (defaults to Oura)
//        /connect oura TOKEN
//        /connect whoop TOKEN
async function handleConnect(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    const text = ctx.message?.text || "";
    const parts = text.split(" ").filter((p) => p.trim());
    if (parts.length < 2) {
        await reply(ctx, messages_1.MESSAGES.connectInstructions);
        return;
    }
    // Parse provider and token
    let provider = "oura";
    let token;
    if (parts.length >= 3) {
        // /connect oura TOKEN or /connect whoop TOKEN
        const providerArg = parts[1].toLowerCase();
        if (providerArg === "whoop") {
            provider = "whoop";
        }
        else if (providerArg === "oura") {
            provider = "oura";
        }
        else {
            // Unknown provider, treat as token for backward compatibility
            token = parts[1].trim();
            await validateAndConnect(ctx, telegramId, token, provider);
            return;
        }
        token = parts[2].trim();
    }
    else {
        // /connect TOKEN (default to Oura)
        token = parts[1].trim();
    }
    await validateAndConnect(ctx, telegramId, token, provider);
}
async function validateAndConnect(ctx, telegramId, token, provider) {
    const displayName = (0, data_1.getProviderDisplayName)(provider);
    await ctx.reply(`🔄 Validating ${displayName} token...`);
    try {
        const isValid = await (0, data_1.validateToken)(token, provider);
        if (!isValid) {
            await reply(ctx, messages_1.MESSAGES.connectFailed(provider));
            return;
        }
        // Save provider and token
        (0, storage_1.setProvider)(telegramId, provider, token);
        await reply(ctx, messages_1.MESSAGES.connectSuccess(provider));
    }
    catch (error) {
        console.error("Connect error:", error);
        await reply(ctx, messages_1.MESSAGES.connectFailed(provider));
    }
}
// /disconnect command
async function handleDisconnect(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    (0, storage_1.setUser)(telegramId, { ouraToken: undefined, provider: undefined, providerToken: undefined });
    await reply(ctx, messages_1.MESSAGES.disconnected);
}
// /status command
async function handleStatus(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    const user = (0, storage_1.getUser)(telegramId);
    const connected = (0, storage_1.hasConnectedDevice)(telegramId);
    const provider = (0, storage_1.getProvider)(telegramId);
    await reply(ctx, messages_1.MESSAGES.status(connected, user?.lastCheckAt, provider));
}
// /workout command - supports /workout or /workout basketball
async function handleWorkout(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    (0, storage_1.incrementCommandCount)("workout");
    console.log(`📊 /workout from ${telegramId}`);
    if (!(0, storage_1.hasConnectedDevice)(telegramId)) {
        await reply(ctx, messages_1.MESSAGES.notConnected);
        return;
    }
    // Parse sport from command: /workout basketball
    const text = ctx.message?.text || "";
    const parts = text.split(" ");
    const sportInput = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
    const sport = (0, workout_1.parseSport)(sportInput);
    // If user provided unknown sport, show list
    if (sportInput && !sport) {
        const sportList = (0, workout_1.getSportList)().join(", ");
        await reply(ctx, `⚠️ Unknown sport: "${sportInput}"\n\n<b>Supported sports:</b>\n${sportList}\n\nExample: /workout basketball`);
        return;
    }
    await ctx.reply("🔄 Fetching your data...");
    try {
        const data = await getUserBiometricData(telegramId);
        if (!data) {
            await reply(ctx, messages_1.MESSAGES.fetchError);
            return;
        }
        const decision = (0, workout_1.getWorkoutDecision)(data, sport);
        const message = (0, workout_1.formatWorkoutTelegram)(decision);
        (0, storage_1.updateLastCheck)(telegramId);
        await reply(ctx, message);
    }
    catch (error) {
        console.error("Workout check error:", error);
        await reply(ctx, messages_1.MESSAGES.fetchError);
    }
}
// /sports command - list available sports
async function handleSports(ctx) {
    const sportList = (0, workout_1.getSportList)();
    const formatted = sportList.map((s) => `• ${s}`).join("\n");
    await reply(ctx, `<b>🏀 Available Sports</b>\n\n${formatted}\n\n<b>Usage:</b>\n/workout basketball\n/workout running\n/workout bjj`);
}
// /demo command - supports /demo or /demo basketball
async function handleDemo(ctx) {
    const telegramId = ctx.from?.id;
    if (telegramId) {
        (0, storage_1.setUser)(telegramId, {});
    }
    (0, storage_1.incrementCommandCount)("demo");
    console.log(`📊 /demo from ${telegramId}`);
    // Parse sport from command
    const text = ctx.message?.text || "";
    const parts = text.split(" ");
    const sportInput = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
    const sport = (0, workout_1.parseSport)(sportInput);
    await ctx.reply("🎲 Generating random scenario...");
    const data = (0, data_1.getRandomDemoData)();
    const decision = (0, workout_1.getWorkoutDecision)(data, sport);
    const message = (0, workout_1.formatWorkoutTelegram)(decision);
    const demoNote = `\n\n<i>📝 This is demo data. Use /connect to see your real Oura data.</i>`;
    await reply(ctx, message + demoNote);
}
// /feedback command - collect user feedback
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID; // Your Telegram ID for receiving feedback
async function handleFeedback(ctx) {
    const telegramId = ctx.from?.id;
    const username = ctx.from?.username || "unknown";
    const text = ctx.message?.text || "";
    const feedbackText = text.replace(/^\/feedback\s*/i, "").trim();
    if (!feedbackText) {
        await reply(ctx, `📝 <b>Send us feedback!</b>\n\nUsage: /feedback [your message]\n\nExample:\n/feedback I'd love to see Pilates added as a sport!`);
        return;
    }
    // Log feedback
    console.log(`📬 FEEDBACK from @${username} (${telegramId}): ${feedbackText}`);
    // Send to admin if configured
    if (ADMIN_CHAT_ID && ctx.api) {
        try {
            await ctx.api.sendMessage(ADMIN_CHAT_ID, `📬 <b>New Feedback</b>\n\nFrom: @${username} (${telegramId})\n\n${feedbackText}`, { parse_mode: "HTML" });
        }
        catch (e) {
            console.error("Failed to send feedback to admin:", e);
        }
    }
    await reply(ctx, `✅ <b>Thanks for your feedback!</b>\n\nWe read every message and it helps us improve. 🙏`);
}
// /drink command - get drink recommendation
async function handleDrink(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    (0, storage_1.incrementCommandCount)("drink");
    console.log(`📊 /drink from ${telegramId}`);
    if (!(0, storage_1.hasConnectedDevice)(telegramId)) {
        await reply(ctx, messages_1.MESSAGES.notConnected);
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
                await reply(ctx, `⚠️ Please specify a valid number of drinks (1-20)\n\nExample: /drink log 3`);
                return;
            }
            try {
                const data = await getUserBiometricData(telegramId);
                if (!data) {
                    await reply(ctx, messages_1.MESSAGES.fetchError);
                    return;
                }
                const decision = (0, drink_1.getDrinkDecision)(data);
                (0, storage_1.addDrinkLog)(telegramId, amount);
                const message = (0, drink_1.formatDrinkLogTelegram)(amount, decision);
                await reply(ctx, message);
            }
            catch (error) {
                console.error("Drink log error:", error);
                await reply(ctx, messages_1.MESSAGES.fetchError);
            }
            return;
        }
        // /drink history
        if (subcommand === "history") {
            const logs = (0, storage_1.getDrinkLogs)(telegramId);
            if (logs.length === 0) {
                await reply(ctx, `📊 <b>No Drinking History</b>\n\nStart logging with /drink log N after drinking.\n\nExample: /drink log 3`);
                return;
            }
            const history = (0, drink_1.calculateDrinkHistory)(logs);
            const message = (0, drink_1.formatDrinkHistoryTelegram)(history);
            await reply(ctx, message);
            return;
        }
        // /drink social
        if (subcommand === "social" || subcommand === "event") {
            try {
                const data = await getUserBiometricData(telegramId);
                if (!data) {
                    await reply(ctx, messages_1.MESSAGES.fetchError);
                    return;
                }
                const logs = (0, storage_1.getDrinkLogs)(telegramId);
                const history = logs.length > 0 ? (0, drink_1.calculateDrinkHistory)(logs) : undefined;
                const decision = (0, drink_1.getDrinkDecision)(data, history);
                const strategy = (0, drink_1.getSocialStrategy)(decision);
                const message = (0, drink_1.formatSocialStrategyTelegram)(strategy);
                await reply(ctx, message);
            }
            catch (error) {
                console.error("Drink social error:", error);
                await reply(ctx, messages_1.MESSAGES.fetchError);
            }
            return;
        }
    }
    // Default: /drink - show today's recommendation
    await ctx.reply("🔄 Checking your condition...");
    try {
        const data = await getUserBiometricData(telegramId);
        if (!data) {
            await reply(ctx, messages_1.MESSAGES.fetchError);
            return;
        }
        const logs = (0, storage_1.getDrinkLogs)(telegramId);
        const history = logs.length > 0 ? (0, drink_1.calculateDrinkHistory)(logs) : undefined;
        const decision = (0, drink_1.getDrinkDecision)(data, history);
        const message = (0, drink_1.formatDrinkTelegram)(decision);
        (0, storage_1.updateLastCheck)(telegramId);
        await reply(ctx, message);
    }
    catch (error) {
        console.error("Drink check error:", error);
        await reply(ctx, messages_1.MESSAGES.fetchError);
    }
}
// /drink demo - try with demo data
async function handleDrinkDemo(ctx) {
    const telegramId = ctx.from?.id;
    if (telegramId) {
        (0, storage_1.setUser)(telegramId, {});
    }
    (0, storage_1.incrementCommandCount)("drinkdemo");
    console.log(`📊 /drinkdemo from ${telegramId}`);
    await ctx.reply("🎲 Generating random scenario...");
    const data = (0, data_1.getRandomDemoData)();
    const decision = (0, drink_1.getDrinkDecision)(data);
    const message = (0, drink_1.formatDrinkTelegram)(decision);
    const demoNote = `\n\n<i>📝 This is demo data. Use /connect to see your real Oura data.</i>`;
    await reply(ctx, message + demoNote);
}
// /stats command - admin only stats
async function handleStats(ctx) {
    const telegramId = ctx.from?.id;
    // Only allow admin to see stats
    if (!ADMIN_CHAT_ID || String(telegramId) !== ADMIN_CHAT_ID) {
        await reply(ctx, `❓ Unknown command. Try /help to see available commands.`);
        return;
    }
    const stats = (0, storage_1.getBotStats)();
    const counts = (0, storage_1.getCommandCounts)();
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
async function handleWhy(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    (0, storage_1.incrementCommandCount)("why");
    console.log(`📊 /why from ${telegramId}`);
    if (!(0, storage_1.hasConnectedDevice)(telegramId)) {
        await reply(ctx, messages_1.MESSAGES.notConnected);
        return;
    }
    // Parse user input: /why tired 5, /why mood, /why 3, etc.
    const text = ctx.message?.text || "";
    const userInput = (0, why_1.parseWhyInput)(text);
    await ctx.reply("🔄 Analyzing your data...");
    try {
        const data = await getUserBiometricData(telegramId);
        if (!data) {
            await reply(ctx, messages_1.MESSAGES.fetchError);
            return;
        }
        const decision = (0, why_1.getWhyDecision)(data, userInput);
        const message = (0, why_1.formatWhyTelegram)(decision, userInput);
        (0, storage_1.updateLastCheck)(telegramId);
        await reply(ctx, message);
    }
    catch (error) {
        console.error("Why check error:", error);
        await reply(ctx, messages_1.MESSAGES.fetchError);
    }
}
// /why demo - try with demo data
async function handleWhyDemo(ctx) {
    const telegramId = ctx.from?.id;
    if (telegramId) {
        (0, storage_1.setUser)(telegramId, {});
    }
    (0, storage_1.incrementCommandCount)("whydemo");
    console.log(`📊 /whydemo from ${telegramId}`);
    // Parse user input
    const text = ctx.message?.text || "";
    const userInput = (0, why_1.parseWhyInput)(text.replace(/^\/whydemo/i, "/why"));
    await ctx.reply("🎲 Generating random scenario...");
    const data = (0, data_1.getRandomDemoData)();
    const decision = (0, why_1.getWhyDecision)(data, userInput);
    const message = (0, why_1.formatWhyTelegram)(decision, userInput);
    const demoNote = `\n\n<i>📝 This is demo data. Use /connect to see your real Oura data.</i>`;
    await reply(ctx, message + demoNote);
}
// ============================================
// Mood Commands (P17)
// ============================================
// /mood command - log mood and get attribution
// Usage: /mood N (1-5), /mood history, /mood insight
async function handleMood(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    const text = ctx.message?.text || "";
    const parts = text.split(" ").filter((p) => p.trim());
    // /mood without args - show help
    if (parts.length < 2) {
        await reply(ctx, `🎭 <b>Mood Tracking</b>

Log how you're feeling (1-5):
<code>/mood 1</code> - Very low
<code>/mood 2</code> - Low
<code>/mood 3</code> - Neutral
<code>/mood 4</code> - Good
<code>/mood 5</code> - Great

Other commands:
/mood history - See your mood-recovery patterns
/mooddemo - Try with demo data`);
        return;
    }
    const subcommand = parts[1].toLowerCase();
    // /mood history
    if (subcommand === "history" || subcommand === "insight") {
        const moodEntries = (0, storage_1.getMoodEntries)(telegramId);
        const recoveryHistory = (0, storage_1.getRecoveryHistory)(telegramId);
        const insight = (0, mood_1.calculateMoodInsight)(moodEntries, recoveryHistory);
        const message = (0, mood_1.formatMoodHistoryTelegram)(insight);
        await reply(ctx, message);
        return;
    }
    // /mood N - log mood score
    const score = parseInt(subcommand, 10);
    if (isNaN(score) || score < 1 || score > 5) {
        await reply(ctx, `⚠️ Please enter a mood score from 1 to 5.

Example: /mood 3

1 = Very low, 5 = Great`);
        return;
    }
    // Need connected device for attribution
    if (!(0, storage_1.hasConnectedDevice)(telegramId)) {
        // Log mood anyway but can't provide attribution
        (0, storage_1.addMoodEntry)(telegramId, score);
        await reply(ctx, `✅ <b>Mood Logged: ${score}/5</b>

Connect your device to get insights about why you feel this way.
/connect TOKEN (Oura) or /connect whoop TOKEN`);
        return;
    }
    // Fetch biometric data for attribution
    try {
        const data = await getUserBiometricData(telegramId);
        if (!data) {
            (0, storage_1.addMoodEntry)(telegramId, score);
            await reply(ctx, `✅ Mood logged: ${score}/5\n\nCouldn't fetch device data for analysis.`);
            return;
        }
        // Save recovery score for history
        if (data.readinessScore !== null) {
            (0, storage_1.addRecoveryScore)(telegramId, data.readinessScore);
        }
        // Get mood attribution
        const moodEntries = (0, storage_1.getMoodEntries)(telegramId);
        const recoveryHistory = (0, storage_1.getRecoveryHistory)(telegramId);
        const decision = (0, mood_1.getMoodDecision)(data, score, moodEntries, recoveryHistory);
        // Log the mood entry
        (0, storage_1.addMoodEntry)(telegramId, score);
        // Format and send response
        const message = (0, mood_1.formatMoodTelegram)(decision);
        await reply(ctx, message);
    }
    catch (error) {
        console.error("Mood check error:", error);
        (0, storage_1.addMoodEntry)(telegramId, score);
        await reply(ctx, `✅ Mood logged: ${score}/5\n\nError analyzing data, but your mood was saved.`);
    }
}
// /mooddemo - try mood feature with demo data
async function handleMoodDemo(ctx) {
    const telegramId = ctx.from?.id;
    if (telegramId) {
        (0, storage_1.setUser)(telegramId, {});
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
    const data = (0, data_1.getRandomDemoData)();
    const decision = (0, mood_1.getMoodDecision)(data, score);
    const message = (0, mood_1.formatMoodTelegram)(decision);
    const demoNote = `\n\n<i>📝 Demo: Mood ${score}/5 + random biometrics.\nUse /connect to see your real data.</i>`;
    await reply(ctx, message + demoNote);
}
// ============================================
// Cost Commands (P27 - Recovery Cost Simulator)
// ============================================
// /cost command - show recovery cost of a substance
// Usage: /cost beer 3, /cost coffee 2, /cost wine 1
async function handleCost(ctx) {
    const telegramId = ctx.from?.id;
    if (!telegramId)
        return;
    (0, storage_1.incrementCommandCount)("cost");
    console.log(`📊 /cost from ${telegramId}`);
    if (!(0, storage_1.hasConnectedDevice)(telegramId)) {
        await reply(ctx, messages_1.MESSAGES.notConnected);
        return;
    }
    // Parse: /cost beer 3, /cost coffee 2
    const text = ctx.message?.text || "";
    const parts = text.split(" ").filter((p) => p.trim());
    if (parts.length < 2) {
        await reply(ctx, `💰 <b>Recovery Cost Simulator</b>

See the cost BEFORE you drink.

<b>Usage:</b>
<code>/cost beer 3</code> - 3 beers recovery cost
<code>/cost coffee 2</code> - 2 coffees sleep impact
<code>/cost wine 1</code> - 1 wine recovery cost

<b>Supported:</b>
🍺 beer, 🍷 wine, 🥃 spirits/whiskey/vodka
☕ coffee/espresso/latte, 🍵 tea/matcha

<b>Demo:</b> /costdemo beer 3`);
        return;
    }
    const substance = (0, cost_1.parseSubstance)(parts[1]);
    if (!substance) {
        const substances = (0, cost_1.getSubstanceList)().join(", ");
        await reply(ctx, `⚠️ Unknown substance: "${parts[1]}"\n\n<b>Supported:</b> ${substances}\n\nExample: /cost beer 3`);
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
            await reply(ctx, messages_1.MESSAGES.fetchError);
            return;
        }
        const cost = (0, cost_1.getRecoveryCost)(data, substance, amount);
        const message = (0, cost_1.formatCostTelegram)(cost);
        (0, storage_1.updateLastCheck)(telegramId);
        await reply(ctx, message);
    }
    catch (error) {
        console.error("Cost check error:", error);
        await reply(ctx, messages_1.MESSAGES.fetchError);
    }
}
// /costdemo command - try with demo data
async function handleCostDemo(ctx) {
    const telegramId = ctx.from?.id;
    if (telegramId) {
        (0, storage_1.setUser)(telegramId, {});
    }
    (0, storage_1.incrementCommandCount)("costdemo");
    console.log(`📊 /costdemo from ${telegramId}`);
    // Parse: /costdemo beer 3 (default: beer 2)
    const text = ctx.message?.text || "";
    const parts = text.split(" ").filter((p) => p.trim());
    const substance = parts.length >= 2 ? (0, cost_1.parseSubstance)(parts[1]) : null;
    const substanceType = substance || "beer";
    const amount = parts.length >= 3 ? parseInt(parts[2], 10) || 2 : 2;
    const safeAmount = Math.max(1, Math.min(10, amount));
    await ctx.reply("🎲 Generating random scenario...");
    const data = (0, data_1.getRandomDemoData)();
    const cost = (0, cost_1.getRecoveryCost)(data, substanceType, safeAmount);
    const message = (0, cost_1.formatCostTelegram)(cost);
    const demoNote = `\n\n<i>📝 This is demo data. Use /connect to see your real data.\nTry: /costdemo coffee 3, /costdemo wine 2</i>`;
    await reply(ctx, message + demoNote);
}
// Handle unknown commands
async function handleUnknown(ctx) {
    await reply(ctx, `❓ Unknown command. Try /help to see available commands.`);
}
