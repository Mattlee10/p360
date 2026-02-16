import {
  Client,
  GatewayIntentBits,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import * as dotenv from "dotenv";
import {
  getWorkoutDecision,
  getDrinkDecision,
  getSocialStrategy,
  calculateDrinkHistory,
  getWhyDecision,
  getMoodDecision,
  calculateMoodInsight,
  getRecoveryCost,
  parseSubstance,
  parseSport,
  getSportList,
  parseWhyInput,
  ProviderType,
  SubstanceType,
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
} from "./lib/storage";
import {
  formatWorkoutEmbed,
  formatDrinkEmbed,
  formatWhyEmbed,
  formatMoodEmbed,
  formatMoodHistoryEmbed,
  formatDrinkHistoryEmbed,
  formatCostEmbed,
} from "./lib/format";
import { getAskEmbed, isAskAvailable } from "./lib/ask";
import { createSupabaseEventStore } from "@p360/core";

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
    .setTitle("⚠️ Device Not Connected")
    .setDescription("Connect your wearable to use this feature.")
    .setColor(0xf59e0b)
    .addFields({
      name: "How to Connect",
      value:
        "**Oura:** `/connect device:Oura Ring token:YOUR_TOKEN`\n**WHOOP:** `/connect device:WHOOP token:YOUR_TOKEN`",
    });
}

// ============================================
// Command Handlers
// ============================================

async function handleWorkout(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  const sportInput = interaction.options.getString("sport");

  if (!hasConnectedDevice(userId)) {
    await interaction.reply({ embeds: [notConnectedEmbed()], ephemeral: true });
    return;
  }

  const sport = parseSport(sportInput || undefined);
  if (sportInput && !sport) {
    const sportList = getSportList().join(", ");
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
    const decision = getWorkoutDecision(data, sport);
    const embed = formatWorkoutEmbed(decision);
    updateLastCheck(userId);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Workout error:", error);
    await interaction.editReply("❌ Error fetching your data. Try again later.");
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
    await interaction.deferReply();
    try {
      const data = await getUserBiometricData(userId);
      if (!data) {
        await interaction.editReply({ embeds: [notConnectedEmbed()] });
        return;
      }
      addDrinkLog(userId, amount);
      const decision = getDrinkDecision(data);
      const impact = decision.impacts.find((i) => i.drinks === amount) ||
        decision.impacts[decision.impacts.length - 1];

      const embed = new EmbedBuilder()
        .setTitle(`✅ Logged: ${amount} drink${amount > 1 ? "s" : ""}`)
        .setColor(amount <= decision.greenLimit ? 0x22c55e : 0xf59e0b)
        .addFields(
          { name: "HRV Impact", value: impact.hrvDrop, inline: true },
          { name: "Fatigue", value: impact.fatigue, inline: true },
          { name: "Recovery", value: impact.recoveryTime, inline: true }
        );

      if (amount > decision.greenLimit) {
        embed.setFooter({ text: "💤 Early bedtime will help recovery" });
      } else {
        embed.setFooter({ text: "👍 Within your safe limit - nice job!" });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Drink log error:", error);
      await interaction.editReply("❌ Error logging drinks.");
    }
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
    const history = calculateDrinkHistory(logs);
    const embed = formatDrinkHistoryEmbed(history);
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
      const logs = getDrinkLogs(userId);
      const history = logs.length > 0 ? calculateDrinkHistory(logs) : undefined;
      const decision = getDrinkDecision(data, history);
      const strategy = getSocialStrategy(decision);

      const embed = new EmbedBuilder()
        .setTitle(`🍻 ${strategy.headline}`)
        .setColor(0x3b82f6)
        .addFields(
          { name: "Tonight's Max", value: `${strategy.limit} drinks`, inline: true },
          { name: "Strategy", value: strategy.tips.map((t, i) => `${i + 1}. ${t}`).join("\n"), inline: false }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
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
    const logs = getDrinkLogs(userId);
    const history = logs.length > 0 ? calculateDrinkHistory(logs) : undefined;
    const decision = getDrinkDecision(data, history);
    const embed = formatDrinkEmbed(decision);
    updateLastCheck(userId);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Drink error:", error);
    await interaction.editReply("❌ Error fetching your data.");
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

  const userInput = parseWhyInput(`/why ${feeling || ""} ${score || ""}`);

  await interaction.deferReply();

  try {
    const data = await getUserBiometricData(userId);
    if (!data) {
      await interaction.editReply({ embeds: [notConnectedEmbed()] });
      return;
    }
    const decision = getWhyDecision(data, userInput);
    const embed = formatWhyEmbed(decision);
    updateLastCheck(userId);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Why error:", error);
    await interaction.editReply("❌ Error analyzing your data.");
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
      content: "**🎭 Mood Tracking**\n\nLog your mood (1-5):\n`/mood score:1` - Very low\n`/mood score:3` - Neutral\n`/mood score:5` - Great\n\nOr view patterns: `/mood action:View history`",
      ephemeral: true,
    });
    return;
  }

  if (!hasConnectedDevice(userId)) {
    addMoodEntry(userId, score);
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
      addMoodEntry(userId, score);
      await interaction.editReply(`✅ Mood logged: ${score}/5\n\nCouldn't fetch device data.`);
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
    await interaction.editReply(`✅ Mood logged: ${score}/5\n\nError analyzing data.`);
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
        `❌ **${displayName} Connection Failed**\n\nThe token appears to be invalid. Please check:\n1. You copied the full token\n2. The token hasn't expired`
      );
      return;
    }

    setProvider(userId, device, token);
    await interaction.editReply(
      `✅ **${displayName} Connected!**\n\nYou can now use /workout, /drink, /why, and /mood.`
    );
  } catch (error) {
    console.error("Connect error:", error);
    await interaction.editReply("❌ Connection failed. Please try again.");
  }
}

async function handleDisconnect(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  setUser(userId, { provider: undefined, providerToken: undefined });
  await interaction.reply({
    content: "🔓 **Device Disconnected**\n\nUse /connect to reconnect anytime.",
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
      content: `📊 **Status**\n\n${displayName}: ✅ Connected\n${lastCheck}\n\nReady to use /workout`,
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: "📊 **Status**\n\nDevice: ❌ Not connected\n\nUse /connect to link your device.",
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
      const decision = getDrinkDecision(data);
      embed = formatDrinkEmbed(decision);
      break;
    }
    case "why": {
      const decision = getWhyDecision(data);
      embed = formatWhyEmbed(decision);
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
      const decision = getWorkoutDecision(data);
      embed = formatWorkoutEmbed(decision);
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
    await interaction.editReply("❌ Error calculating recovery cost.");
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
      content: "⚠️ Ask feature not configured. Server admin needs to set ANTHROPIC_API_KEY.",
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
    await interaction.editReply("❌ Error processing your question. Try again.");
  }
}

// ============================================
// Event Handlers
// ============================================

client.once("ready", (c) => {
  console.log(`✅ Discord bot ready: ${c.user.tag}`);
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
      await interaction.editReply("❌ An error occurred.");
    } else {
      await interaction.reply({ content: "❌ An error occurred.", ephemeral: true });
    }
  }
});

// Start bot
console.log("🤖 P360 Discord Bot starting...");
client.login(BOT_TOKEN);
