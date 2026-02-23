import { Context } from "grammy";
import type { ProviderType } from "@p360/core";
import { AppleHealthXMLParser, ActivityConfoundingAnalyzer } from "@p360/core";
import { MESSAGES } from "./messages";
import {
  getUser,
  setUser,
  updateLastCheck,
  incrementCommandCount,
  setProvider,
  getProvider,
  getProviderToken,
  hasConnectedDevice,
  setAppleHealthRecords,
  getAppleHealthRecords,
} from "../lib/storage";
import {
  fetchBiometricData,
  validateToken,
  getRandomDemoData,
  getProviderDisplayName,
} from "../lib/data";
import { getAskResponse, isAskAvailable } from "../lib/ask";
import { createSupabaseEventStore } from "@p360/core";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

// Shared event store instance (null if Supabase not configured)
const eventStore = createSupabaseEventStore() ?? undefined;

// Helper to send HTML messages
async function reply(ctx: Context, text: string) {
  await ctx.reply(text, { parse_mode: "HTML" });
}

// Helper to get user's biometric data (provider-aware)
async function getUserBiometricData(telegramId: number) {
  const token = getProviderToken(telegramId);
  if (!token) return null;

  const provider = getProvider(telegramId) || "oura";
  return fetchBiometricData(token, provider);
}

// ============================================
// Claude-first: route domain commands through /ask
// ============================================

async function routeThroughAsk(
  ctx: Context,
  question: string,
  commandName: string,
  demo = false,
) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  incrementCommandCount(commandName as any);
  console.log(`📊 /${commandName} from ${telegramId}`);

  if (!isAskAvailable()) {
    await reply(ctx, "⚠️ <b>Feature not configured</b>\n\nServer admin needs to set ANTHROPIC_API_KEY.");
    return;
  }

  if (!demo && !hasConnectedDevice(telegramId)) {
    await reply(ctx, MESSAGES.notConnected);
    return;
  }

  await ctx.reply("🔄 Analyzing your data...");

  try {
    const data = demo
      ? getRandomDemoData()
      : await getUserBiometricData(telegramId);
    if (!data) {
      await reply(ctx, MESSAGES.fetchError);
      return;
    }

    const userId = `tg-${telegramId}`;

    // Load Apple Health confounding if available
    let activityConfounding;
    if (!demo && data.readinessScore !== null) {
      const appleRecords = getAppleHealthRecords(telegramId);
      if (appleRecords.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        // Use today's record or the most recent one
        const record = appleRecords.find((r) => r.date === today)
          ?? appleRecords[appleRecords.length - 1];
        if (record) {
          const confoundAnalyzer = new ActivityConfoundingAnalyzer();
          activityConfounding = confoundAnalyzer.analyze(
            data.readinessScore,
            null, // activityBalance not in BiometricData (Phase 2 precision)
            record.steps,
          );
        }
      }
    }

    const message = await getAskResponse(question, data, userId, eventStore, activityConfounding);
    updateLastCheck(telegramId);

    const demoNote = demo
      ? `\n\n<i>📝 This is demo data. Use /connect to see your real data.</i>`
      : "";
    await reply(ctx, message + demoNote);
  } catch (error) {
    console.error(`${commandName} error:`, error);
    await reply(ctx, "❌ Error processing your request. Try again.");
  }
}

// /start command
export async function handleStart(ctx: Context) {
  const telegramId = ctx.from?.id;
  const username = ctx.from?.username || "unknown";
  if (telegramId) {
    setUser(telegramId, {});
    console.log(`🆕 New user: @${username} (${telegramId})`);
  }
  await reply(ctx, MESSAGES.welcome);
}

// /help command
export async function handleHelp(ctx: Context) {
  await reply(ctx, MESSAGES.help);
}

// /connect command - supports multiple devices
export async function handleConnect(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const text = ctx.message?.text || "";
  const parts = text.split(" ").filter((p) => p.trim());

  if (parts.length < 2) {
    await reply(ctx, MESSAGES.connectInstructions);
    return;
  }

  let provider: ProviderType = "oura";
  let token: string;

  if (parts.length >= 3) {
    const providerArg = parts[1].toLowerCase();
    if (providerArg === "whoop") {
      provider = "whoop";
    } else if (providerArg === "oura") {
      provider = "oura";
    } else {
      token = parts[1].trim();
      await validateAndConnect(ctx, telegramId, token, provider);
      return;
    }
    token = parts[2].trim();
  } else {
    token = parts[1].trim();
  }

  await validateAndConnect(ctx, telegramId, token, provider);
}

async function validateAndConnect(
  ctx: Context,
  telegramId: number,
  token: string,
  provider: ProviderType
): Promise<void> {
  const displayName = getProviderDisplayName(provider);
  await ctx.reply(`🔄 Validating ${displayName} token...`);

  try {
    const isValid = await validateToken(token, provider);

    if (!isValid) {
      await reply(ctx, MESSAGES.connectFailed(provider));
      return;
    }

    setProvider(telegramId, provider, token);
    await reply(ctx, MESSAGES.connectSuccess(provider));
  } catch (error) {
    console.error("Connect error:", error);
    await reply(ctx, MESSAGES.connectFailed(provider));
  }
}

// /disconnect command
export async function handleDisconnect(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  setUser(telegramId, { ouraToken: undefined, provider: undefined, providerToken: undefined });
  await reply(ctx, MESSAGES.disconnected);
}

// /status command
export async function handleStatus(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = getUser(telegramId);
  const connected = hasConnectedDevice(telegramId);
  const provider = getProvider(telegramId);
  await reply(ctx, MESSAGES.status(connected, user?.lastCheckAt, provider));
}

// /ask command - universal question handler
export async function handleAsk(ctx: Context) {
  const text = ctx.message?.text || "";
  const question = text.replace(/^\/ask\s*/i, "").trim();

  if (!question) {
    await reply(ctx, `💬 <b>Ask anything!</b>\n\nExamples:\n• /ask Should I work out today?\n• /ask How much can I drink tonight?\n• /ask Why am I so tired?\n• /ask Is now a good time to start coding?`);
    return;
  }

  await routeThroughAsk(ctx, question, "ask");
}

// /demo command - try without device connection
export async function handleDemo(ctx: Context) {
  const text = ctx.message?.text || "";
  const question = text.replace(/^\/demo\s*/i, "").trim();

  if (!question) {
    await reply(ctx, `📝 <b>Try a demo question!</b>\n\nUsage: /demo [your question]\n\nExamples:\n• /demo Should I work out today?\n• /demo How much can I drink tonight?\n• /demo Why am I feeling tired?`);
    return;
  }

  await routeThroughAsk(ctx, question, "demo", true);
}

// Handle unknown commands
export async function handleUnknown(ctx: Context) {
  await reply(
    ctx,
    `❓ Unknown command. Try /help to see available commands.`
  );
}

// /upload (or document attachment) — Apple Health export.xml ingestion
export async function handleUpload(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const document = ctx.message?.document;
  if (!document) {
    await reply(
      ctx,
      `📤 <b>Upload Apple Health Data</b>\n\nAttach your <code>export.xml</code> file from Apple Health.\n\n<b>How to export:</b>\n1. Open Health app → tap your profile pic\n2. "Export All Health Data"\n3. Unzip → send <code>export.xml</code> here\n\n<i>File size limit: 20MB (trim to recent months if larger)</i>`
    );
    return;
  }

  // File size check (Telegram getFile limit is 20MB)
  const MAX_SIZE = 20 * 1024 * 1024;
  if (document.file_size && document.file_size > MAX_SIZE) {
    await reply(
      ctx,
      `⚠️ File too large (${Math.round(document.file_size / 1024 / 1024)}MB). Max 20MB.\n\nTip: Open export.xml and keep only the last 6 months of data.`
    );
    return;
  }

  await ctx.reply("⏳ Parsing Apple Health data...");

  try {
    // Download file from Telegram
    const file = await ctx.api.getFile(document.file_id);
    if (!file.file_path) {
      await reply(ctx, "❌ Could not download file. Try again.");
      return;
    }

    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
    const response = await fetch(fileUrl);
    if (!response.ok) {
      await reply(ctx, "❌ Failed to download file. Try again.");
      return;
    }
    const xmlText = await response.text();

    // Parse Apple Health XML (keep only last 6 months to reduce size)
    const parser = new AppleHealthXMLParser();
    const parseResult = parser.parse(xmlText, 6);

    if (parseResult.records.length === 0) {
      await reply(
        ctx,
        `⚠️ No step data found.\n\nMake sure you uploaded <code>export.xml</code> (not the zip file). The file should contain <code>HKQuantityTypeIdentifierStepCount</code> records.`
      );
      return;
    }

    // Store records in memory
    setAppleHealthRecords(telegramId, parseResult.records);

    // Run confounding analysis if device is connected
    let confoundingMessage = "";
    if (hasConnectedDevice(telegramId)) {
      try {
        const biometricData = await getUserBiometricData(telegramId);
        if (biometricData && biometricData.readinessScore !== null) {
          // Find most recent Apple Health record
          const latestRecord = parseResult.records[parseResult.records.length - 1];
          if (latestRecord) {
            const analyzer = new ActivityConfoundingAnalyzer();
            const report = analyzer.analyze(
              biometricData.readinessScore,
              null, // activityBalance not exposed from BiometricData (Phase 2)
              latestRecord.steps,
            );
            if (report.detectedConfound) {
              confoundingMessage = `\n\n🔍 <b>Activity Confounding Detected!</b>\n` +
                `Apple Health: ${latestRecord.steps.toLocaleString()} steps (${latestRecord.date})\n` +
                `Oura estimated: ~${report.ouraEstimatedSteps.toLocaleString()} steps\n` +
                `Step gap: ${report.stepGap.toLocaleString()} steps\n\n` +
                `📊 Readiness adjustment:\n` +
                `Oura: ${report.ourasReadiness} → P360 adjusted: <b>${report.adjustedReadiness}</b> (${report.readinessDelta} pts)\n` +
                `Oura says: "${report.ourasRecommendation}"\n` +
                `P360 says: "<b>${report.p360Recommendation}</b>"\n\n` +
                `<i>Confidence: ${report.confidence}% | Now /ask for adjusted recommendations</i>`;
            } else {
              confoundingMessage = `\n\n✅ No significant activity gap detected between Oura and Apple Health.`;
            }
          }
        }
      } catch {
        // Confounding analysis is best-effort, don't fail upload
      }
    }

    const errorNote = parseResult.parseErrors > 0
      ? `\n<i>⚠️ ${parseResult.parseErrors} records skipped (parse errors)</i>`
      : "";

    await reply(
      ctx,
      `✅ <b>Apple Health data uploaded!</b>\n\n` +
      `📅 ${parseResult.records.length} days of data\n` +
      `📆 ${parseResult.dateRange.start} → ${parseResult.dateRange.end}\n` +
      `📊 ${parseResult.totalRawRecords.toLocaleString()} raw records processed` +
      errorNote +
      confoundingMessage +
      `\n\n💬 Now use /ask for activity-aware recommendations!`
    );
  } catch (error) {
    console.error("Upload error:", error);
    await reply(ctx, "❌ Error parsing Apple Health data. Make sure you sent export.xml.");
  }
}
