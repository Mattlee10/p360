import {
  Client,
  GatewayIntentBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import * as dotenv from "dotenv";
import cron from "node-cron";
import {
  getMoodDecision,
  calculateMoodInsight,
  getRecoveryCost,
  parseSubstance,
  ProviderType,
  resolveOutcomes,
  createSupabaseProfileStore,
  buildCausalityProfile,
} from "@p360/core";
import {
  fetchBiometricData,
  validateToken,
  getRandomDemoData,
  getProviderDisplayName,
} from "./lib/data";
import {
  setUser,
  getUser,
  setProvider,
  getProvider,
  getProviderToken,
  hasConnectedDevice,
  updateLastCheck,
  addDrinkLog,
  getDrinkLogs,
  addMoodEntry,
  getMoodEntries,
  addRecoveryScore,
  getRecoveryHistory,
  type DrinkLog,
} from "./lib/storage";
import {
  formatMoodEmbed,
  formatMoodHistoryEmbed,
  formatCostEmbed,
} from "./lib/format";
import { getAskEmbed, isAskAvailable } from "./lib/ask";
import { createSupabaseEventStore, OuraProvider } from "@p360/core";

dotenv.config();

// Shared event store instance (null if Supabase not configured)
const eventStore = createSupabaseEventStore() ?? undefined;

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("Error: DISCORD_BOT_TOKEN not set");
  console.log("Set it in .env or environment variables");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ============================================
// Helper Functions
// ============================================

async function getUserBiometricData(userId: string) {
  const token = getProviderToken(userId);
  if (!token) return null;
  const provider = getProvider(userId) || "oura";
  return fetchBiometricData(token, provider);
}

function notConnectedEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("Device Not Connected")
    .setDescription("Connect your wearable to use this feature.")
    .setColor(0xf59e0b)
    .addFields({
      name: "How to Connect",
      value:
        "**Oura:** `/connect device:Oura Ring token:YOUR_TOKEN`\n**WHOOP:** `/connect device:WHOOP token:YOUR_TOKEN`",
    });
}

// ============================================
// Command Handlers (Claude-first architecture)
// ============================================

async function handleWorkout(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  const sportInput = interaction.options.getString("sport");

  if (!hasConnectedDevice(userId)) {
    await interaction.reply({ embeds: [notConnectedEmbed()], ephemeral: true });
    return;
  }

  if (!isAskAvailable()) {
    await interaction.reply({
      content: "Ask feature not configured. Server admin needs to set ANTHROPIC_API_KEY.",
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
    const question = sportInput
      ? `Should I work out today? Sport: ${sportInput}`
      : "Should I work out today?";
    const embed = await getAskEmbed(question, data, `dc-${userId}`, eventStore);
    updateLastCheck(userId);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Workout error:", error);
    await interaction.editReply("Error fetching your data. Try again later.");
  }
}

async function handleDrink(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  const action = interaction.options.getString("action");
  const amount = interaction.options.getInteger("amount");

  if (!hasConnectedDevice(userId)) {
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
    addDrinkLog(userId, amount);
    await interaction.reply({
      content: `Logged: ${amount} drink${amount > 1 ? "s" : ""}`,
      ephemeral: true,
    });
    return;
  }

  // Handle history action
  if (action === "history") {
    const logs = getDrinkLogs(userId);
    if (logs.length === 0) {
      await interaction.reply({
        content: "No drinking history yet. Use `/drink action:Log drinks amount:N` to start logging.",
        ephemeral: true,
      });
      return;
    }
    const totalDrinks = logs.reduce((sum: number, l: DrinkLog) => sum + l.amount, 0);
    const avgPerSession = logs.length > 0 ? (totalDrinks / logs.length).toFixed(1) : "0";
    const embed = new EmbedBuilder()
      .setTitle("Your Drinking History")
      .setColor(0x3b82f6)
      .addFields(
        { name: "Sessions logged", value: `${logs.length}`, inline: true },
        { name: "Total drinks", value: `${totalDrinks}`, inline: true },
        { name: "Avg per session", value: avgPerSession, inline: true }
      );
    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (!isAskAvailable()) {
    await interaction.reply({
      content: "Ask feature not configured. Server admin needs to set ANTHROPIC_API_KEY.",
      ephemeral: true,
    });
    return;
  }

  // Handle social action - route through /ask
  if (action === "social") {
    await interaction.deferReply();
    try {
      const data = await getUserBiometricData(userId);
      if (!data) {
        await interaction.editReply({ embeds: [notConnectedEmbed()] });
        return;
      }
      const embed = await getAskEmbed(
        "I have a social event tonight. How many drinks can I have and what's my strategy?",
        data,
        `dc-${userId}`,
        eventStore
      );
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Drink social error:", error);
      await interaction.editReply("Error getting strategy.");
    }
    return;
  }

  // Default: show recommendation via /ask
  await interaction.deferReply();
  try {
    const data = await getUserBiometricData(userId);
    if (!data) {
      await interaction.editReply({ embeds: [notConnectedEmbed()] });
      return;
    }
    const embed = await getAskEmbed(
      "Should I drink alcohol tonight? What's my safe limit?",
      data,
      `dc-${userId}`,
      eventStore
    );
    updateLastCheck(userId);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Drink error:", error);
    await interaction.editReply("Error fetching your data.");
  }
}

async function handleWhy(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  const feeling = interaction.options.getString("feeling");
  const score = interaction.options.getInteger("score");

  if (!hasConnectedDevice(userId)) {
    await interaction.reply({ embeds: [notConnectedEmbed()], ephemeral: true });
    return;
  }

  if (!isAskAvailable()) {
    await interaction.reply({
      content: "Ask feature not configured. Server admin needs to set ANTHROPIC_API_KEY.",
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
    const parts = ["Why do I feel this way?"];
    if (feeling) parts.push(`I'm feeling: ${feeling}`);
    if (score) parts.push(`My energy score: ${score}/10`);
    const question = parts.join(" ");
    const embed = await getAskEmbed(question, data, `dc-${userId}`, eventStore);
    updateLastCheck(userId);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Why error:", error);
    await interaction.editReply("Error analyzing your data.");
  }
}

async function handleMood(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  const score = interaction.options.getInteger("score");
  const action = interaction.options.getString("action");

  // History action
  if (action === "history") {
    const moodEntries = getMoodEntries(userId);
    const recoveryHistory = getRecoveryHistory(userId);
    const insight = calculateMoodInsight(moodEntries, recoveryHistory);
    const embed = formatMoodHistoryEmbed(insight);
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Need score for mood logging
  if (!score) {
    await interaction.reply({
      content: "**Mood Tracking**\n\nLog your mood (1-5):\n`/mood score:1` - Very low\n`/mood score:3` - Neutral\n`/mood score:5` - Great\n\nOr view patterns: `/mood action:View history`",
      ephemeral: true,
    });
    return;
  }

  if (!hasConnectedDevice(userId)) {
    addMoodEntry(userId, score);
    await interaction.reply({
      content: `**Mood Logged: ${score}/5**\n\nConnect your device to get insights about why you feel this way.`,
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  try {
    const data = await getUserBiometricData(userId);
    if (!data) {
      addMoodEntry(userId, score);
      await interaction.editReply(`Mood logged: ${score}/5\n\nCouldn't fetch device data.`);
      return;
    }

    if (data.readinessScore !== null) {
      addRecoveryScore(userId, data.readinessScore);
    }

    const moodEntries = getMoodEntries(userId);
    const recoveryHistory = getRecoveryHistory(userId);
    const decision = getMoodDecision(data, score, moodEntries, recoveryHistory);

    addMoodEntry(userId, score);

    const embed = formatMoodEmbed(decision);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Mood error:", error);
    addMoodEntry(userId, score);
    await interaction.editReply(`Mood logged: ${score}/5\n\nError analyzing data.`);
  }
}

async function handleConnect(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  const device = interaction.options.getString("device", true) as ProviderType;
  const token = interaction.options.getString("token", true);

  const displayName = getProviderDisplayName(device);
  await interaction.deferReply({ ephemeral: true });

  try {
    const isValid = await validateToken(token, device);
    if (!isValid) {
      await interaction.editReply(
        `**${displayName} Connection Failed**\n\nThe token appears to be invalid. Please check:\n1. You copied the full token\n2. The token hasn't expired`
      );
      return;
    }

    setProvider(userId, device, token);
    await interaction.editReply(
      `**${displayName} Connected!**\n\nYou can now use /workout, /drink, /why, and /mood.`
    );
  } catch (error) {
    console.error("Connect error:", error);
    await interaction.editReply("Connection failed. Please try again.");
  }
}

async function handleDisconnect(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  setUser(userId, { provider: undefined, providerToken: undefined });
  await interaction.reply({
    content: "**Device Disconnected**\n\nUse /connect to reconnect anytime.",
    ephemeral: true,
  });
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  const user = getUser(userId);
  const connected = hasConnectedDevice(userId);
  const provider = getProvider(userId);

  if (connected) {
    const displayName = getProviderDisplayName(provider!);
    const lastCheck = user?.lastCheckAt
      ? `Last check: ${user.lastCheckAt.toLocaleString()}`
      : "No checks yet";

    await interaction.reply({
      content: `**Status**\n\n${displayName}: Connected\n${lastCheck}\n\nReady to use /workout`,
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: "**Status**\n\nDevice: Not connected\n\nUse /connect to link your device.",
      ephemeral: true,
    });
  }
}

async function handleDemo(interaction: ChatInputCommandInteraction) {
  const feature = interaction.options.getString("feature") || "workout";
  const data = getRandomDemoData();

  await interaction.deferReply();

  let embed: EmbedBuilder;

  switch (feature) {
    case "drink": {
      if (isAskAvailable()) {
        embed = await getAskEmbed(
          "Should I drink alcohol tonight? What's my safe limit?",
          data,
          undefined,
          undefined
        );
      } else {
        embed = new EmbedBuilder()
          .setTitle("Drink Demo")
          .setDescription("Set ANTHROPIC_API_KEY to enable AI-powered drink recommendations.")
          .setColor(0xf59e0b);
      }
      break;
    }
    case "why": {
      if (isAskAvailable()) {
        embed = await getAskEmbed(
          "Why do I feel this way? My energy score is 4/10.",
          data,
          undefined,
          undefined
        );
      } else {
        embed = new EmbedBuilder()
          .setTitle("Why Demo")
          .setDescription("Set ANTHROPIC_API_KEY to enable AI-powered analysis.")
          .setColor(0xf59e0b);
      }
      break;
    }
    case "mood": {
      const score = Math.floor(Math.random() * 5) + 1;
      const decision = getMoodDecision(data, score);
      embed = formatMoodEmbed(decision);
      break;
    }
    case "cost": {
      const cost = getRecoveryCost(data, "beer", 3);
      embed = formatCostEmbed(cost);
      break;
    }
    default: {
      if (isAskAvailable()) {
        embed = await getAskEmbed(
          "Should I work out today?",
          data,
          undefined,
          undefined
        );
      } else {
        embed = new EmbedBuilder()
          .setTitle("Workout Demo")
          .setDescription("Set ANTHROPIC_API_KEY to enable AI-powered workout recommendations.")
          .setColor(0xf59e0b);
      }
    }
  }

  embed.setFooter({
    text: "Demo data - Use /connect to see your real data",
  });

  await interaction.editReply({ embeds: [embed] });
}

// ============================================
// Cost Handler (P27 - Recovery Cost Simulator)
// ============================================

async function handleCost(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  const substanceInput = interaction.options.getString("substance", true);
  const amount = interaction.options.getInteger("amount") || 1;

  if (!hasConnectedDevice(userId)) {
    await interaction.reply({ embeds: [notConnectedEmbed()], ephemeral: true });
    return;
  }

  const substance = parseSubstance(substanceInput);
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
    const cost = getRecoveryCost(data, substance, amount);
    const embed = formatCostEmbed(cost);
    updateLastCheck(userId);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Cost error:", error);
    await interaction.editReply("Error calculating recovery cost.");
  }
}

// ============================================
// Ask Handler (AI-powered contextual nudges)
// ============================================

async function handleAsk(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  const question = interaction.options.getString("question", true);

  if (!isAskAvailable()) {
    await interaction.reply({
      content: "Ask feature not configured. Server admin needs to set ANTHROPIC_API_KEY.",
      ephemeral: true,
    });
    return;
  }

  if (!hasConnectedDevice(userId)) {
    await interaction.reply({ embeds: [notConnectedEmbed()], ephemeral: true });
    return;
  }

  await interaction.deferReply();

  try {
    const data = await getUserBiometricData(userId);
    if (!data) {
      await interaction.editReply({ embeds: [notConnectedEmbed()] });
      return;
    }
    const embed = await getAskEmbed(question, data, `dc-${userId}`, eventStore);
    updateLastCheck(userId);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Ask error:", error);
    await interaction.editReply("Error processing your question. Try again.");
  }
}

// ============================================
// Event Handlers
// ============================================

client.once("ready", (c) => {
  console.log(`Discord bot ready: ${c.user.tag}`);
  console.log("");
  console.log("Commands: /workout, /drink, /cost, /why, /mood, /ask, /connect, /demo");
  console.log("");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

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
      case "ask":
        await handleAsk(interaction);
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
  } catch (error) {
    console.error(`Error handling /${commandName}:`, error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply("An error occurred.");
    } else {
      await interaction.reply({ content: "An error occurred.", ephemeral: true });
    }
  }
});

// ============================================
// Cron Job: Daily Outcome Resolution (9 AM KST = 0 AM UTC)
// ============================================

function scheduleCronJobs() {
  // Run every day at 00:00 UTC (09:00 KST)
  cron.schedule("0 0 * * *", async () => {
    console.log("[cron] Starting daily outcome resolution at", new Date().toISOString());

    try {
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
      const userId = process.env.P360_USER_ID || "discord-default";

      // Fetch today's biometric data from Oura
      const data = await ouraProvider.fetchBiometricData(ouraToken);

      if (!data) {
        console.log("[cron] No biometric data available for", userId);
        return;
      }

      // Resolve pending outcomes (24h+ old without outcome)
      const resolved = await resolveOutcomes(eventStore, userId, data);
      console.log(`[cron] Resolved ${resolved} pending outcomes for ${userId}`);

      // Check if we have 5+ events to build a profile
      const events = await eventStore.getByUser(userId, 100);

      if (events.length >= 5) {
        const profileStore = createSupabaseProfileStore();
        if (profileStore) {
          try {
            const profile = buildCausalityProfile(userId, events);
            await profileStore.saveProfile(profile);
            console.log(`[cron] Generated CausalityProfile for ${userId} (${events.length} events)`);
            console.log(`[cron]    - Personal HRV sensitivity: ${profile.personalConstants.alcoholHrvDropPerDrink}%`);
            console.log(`[cron]    - Personal drink limit: ${profile.personalConstants.personalDrinkLimit} drinks`);
          } catch (err) {
            console.error("[cron] Failed to save profile:", err instanceof Error ? err.message : err);
          }
        }
      }

    } catch (error) {
      console.error("[cron] Error resolving outcomes:", error instanceof Error ? error.message : error);
    }
  });

  console.log("[cron] Cron job scheduled: Daily outcome resolution at 00:00 UTC (09:00 KST)");
}

// Start bot
process.stdout.write("P360 Discord Bot starting...\n");
process.stdout.write("[cron] Initializing cron scheduling...\n");
scheduleCronJobs();
process.stdout.write("[cron] Cron initialization complete\n");
process.stdout.write("\n");
client.login(BOT_TOKEN);
