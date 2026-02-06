/**
 * Deploy slash commands to Discord
 *
 * Run with: npm run deploy
 *
 * Note: Global commands take up to 1 hour to propagate.
 * For development, use DISCORD_GUILD_ID for instant updates.
 */

import { REST, Routes, SlashCommandBuilder } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName("workout")
    .setDescription("Check if you should train today")
    .addStringOption((option) =>
      option
        .setName("sport")
        .setDescription("Optional: specific sport (basketball, bjj, running, etc.)")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("drink")
    .setDescription("Check how much you can drink tonight")
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Optional: log, history, or social")
        .setRequired(false)
        .addChoices(
          { name: "Log drinks", value: "log" },
          { name: "View history", value: "history" },
          { name: "Social event strategy", value: "social" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of drinks to log (for log action)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(20)
    ),

  new SlashCommandBuilder()
    .setName("why")
    .setDescription("Understand why you feel a certain way (Mind vs Body)")
    .addStringOption((option) =>
      option
        .setName("feeling")
        .setDescription("How are you feeling? (tired, mood, energy, focus)")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("score")
        .setDescription("Rate how you feel 1-10")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  new SlashCommandBuilder()
    .setName("mood")
    .setDescription("Log your mood and get recovery-based insights")
    .addIntegerOption((option) =>
      option
        .setName("score")
        .setDescription("Your mood score (1-5)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(5)
    )
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("View history or insights")
        .setRequired(false)
        .addChoices({ name: "View history", value: "history" })
    ),

  new SlashCommandBuilder()
    .setName("connect")
    .setDescription("Connect your wearable device")
    .addStringOption((option) =>
      option
        .setName("device")
        .setDescription("Your device type")
        .setRequired(true)
        .addChoices(
          { name: "Oura Ring", value: "oura" },
          { name: "WHOOP", value: "whoop" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("token")
        .setDescription("Your device access token")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("disconnect")
    .setDescription("Disconnect your wearable device"),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Check your connection status"),

  new SlashCommandBuilder()
    .setName("cost")
    .setDescription("See recovery cost before you drink or caffeinate")
    .addStringOption((option) =>
      option
        .setName("substance")
        .setDescription("What you're having")
        .setRequired(true)
        .addChoices(
          { name: "Beer", value: "beer" },
          { name: "Wine", value: "wine" },
          { name: "Spirits", value: "spirits" },
          { name: "Coffee", value: "coffee" },
          { name: "Tea", value: "tea" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("How many (default: 1)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),

  new SlashCommandBuilder()
    .setName("demo")
    .setDescription("Try P360 with demo data")
    .addStringOption((option) =>
      option
        .setName("feature")
        .setDescription("Which feature to demo")
        .setRequired(false)
        .addChoices(
          { name: "Workout", value: "workout" },
          { name: "Drink", value: "drink" },
          { name: "Why", value: "why" },
          { name: "Mood", value: "mood" },
          { name: "Cost", value: "cost" }
        )
    ),
];

async function deploy() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !clientId) {
    console.error("Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID");
    process.exit(1);
  }

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    console.log("🚀 Deploying slash commands...");

    const commandData = commands.map((cmd) => cmd.toJSON());

    if (guildId) {
      // Guild-specific (instant)
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandData,
      });
      console.log(`✅ Deployed ${commands.length} commands to guild ${guildId}`);
    } else {
      // Global (takes up to 1 hour)
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandData,
      });
      console.log(`✅ Deployed ${commands.length} commands globally`);
      console.log("⏳ Note: Global commands take up to 1 hour to propagate");
    }
  } catch (error) {
    console.error("Failed to deploy commands:", error);
    process.exit(1);
  }
}

deploy();
