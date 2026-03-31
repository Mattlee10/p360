import { App } from "@slack/bolt";
import * as dotenv from "dotenv";
import cron from "node-cron";
import {
  ProviderType,
  resolveOutcomes,
  createSupabaseProfileStore,
  buildCausalityProfile,
  OuraProvider,
  createSupabaseEventStore,
} from "@p360/core";
import {
  fetchBiometricData,
  validateToken,
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
  markOnboarded,
} from "./lib/storage";
import { notConnectedBlocks, errorBlocks } from "./lib/format";
import { getAskBlocks, isAskAvailable } from "./lib/ask";

dotenv.config();

const eventStore = createSupabaseEventStore() ?? undefined;

const BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const APP_TOKEN = process.env.SLACK_APP_TOKEN;

if (!BOT_TOKEN || !APP_TOKEN) {
  console.error("Error: SLACK_BOT_TOKEN or SLACK_APP_TOKEN not set");
  process.exit(1);
}

const app = new App({
  token: BOT_TOKEN,
  appToken: APP_TOKEN,
  socketMode: true,
});

async function getUserBiometricData(userId: string) {
  const token = await getProviderToken(userId);
  if (!token) return null;
  const provider = (await getProvider(userId)) || "oura";
  return fetchBiometricData(token, provider);
}

// ============================================
// Block Kit helpers
// ============================================

function joinWelcomeBlocks() {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Welcome to P360 Beta!* 🎉\n\nComplete 3 steps to start your AutoResearch loop:",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "✅ *Step 1:* Join — done\n⬜ *Step 2:* `/p360-connect oura YOUR_TOKEN`\n⬜ *Step 3:* `/p360-ask 오늘 운동해도 될까?`",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Get your Oura token: <https://cloud.ouraring.com/personal-access-tokens|cloud.ouraring.com/personal-access-tokens>",
      },
    },
  ];
}

function connectSuccessBlocks(providerName: string) {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `✅ *Step 1:* Join — done\n✅ *Step 2:* ${providerName} Connected — done\n⬜ *Step 3:* \`/p360-ask Should I work out today?\``,
      },
    },
  ];
}

// ============================================
// /p360-join
// ============================================

app.command("/p360-join", async ({ command, ack, respond }) => {
  await ack();
  const userId = command.user_id;
  const alreadyConnected = await hasConnectedDevice(userId);
  if (alreadyConnected) {
    const provider = await getProvider(userId);
    await respond({
      response_type: "ephemeral",
      text: `이미 ${getProviderDisplayName(provider!)} 연결됨. /p360-ask 로 시작하세요.`,
    });
    return;
  }
  await respond({
    response_type: "ephemeral",
    blocks: joinWelcomeBlocks(),
    text: "Welcome to P360 Beta",
  });
});

// ============================================
// /p360-ask [question]
// ============================================

app.command("/p360-ask", async ({ command, ack, respond }) => {
  await ack();

  const userId = command.user_id;
  const question = command.text.trim();

  if (!isAskAvailable()) {
    await respond({ response_type: "ephemeral", text: "ANTHROPIC_API_KEY not configured." });
    return;
  }

  if (!(await hasConnectedDevice(userId))) {
    await respond({ response_type: "ephemeral", blocks: notConnectedBlocks(), text: "Device Not Connected" });
    return;
  }

  if (!question) {
    await respond({ response_type: "ephemeral", text: "질문을 입력해주세요. 예: `/p360-ask 오늘 운동해도 될까?`" });
    return;
  }

  try {
    const data = await getUserBiometricData(userId);
    if (!data) {
      await respond({ response_type: "ephemeral", blocks: notConnectedBlocks(), text: "Device Not Connected" });
      return;
    }
    const blocks = await getAskBlocks(question, data, `sl-${userId}`, eventStore);
    await updateLastCheck(userId);
    markOnboarded(userId).catch(() => {}); // fire-and-forget, idempotent
    await respond({ response_type: "ephemeral", blocks, text: "P360 Answer" });
  } catch (error) {
    console.error("Ask error:", error);
    await respond({ response_type: "ephemeral", blocks: errorBlocks("Error processing your question. Try again."), text: "Error" });
  }
});

// ============================================
// /p360-connect [device] [token]
// ============================================

app.command("/p360-connect", async ({ command, ack, respond }) => {
  await ack();

  const userId = command.user_id;
  const [device, token] = command.text.trim().split(/\s+/);

  if (!device || !token) {
    await respond({ response_type: "ephemeral", text: "*Connect Your Wearable*\n\n*Oura:* `/p360-connect oura YOUR_TOKEN`\n*WHOOP:* `/p360-connect whoop YOUR_TOKEN`" });
    return;
  }

  const provider = device.toLowerCase() as ProviderType;
  if (provider !== "oura" && provider !== "whoop") {
    await respond({ response_type: "ephemeral", text: `Unknown device: "${device}". Use "oura" or "whoop".` });
    return;
  }

  try {
    const isValid = await validateToken(token, provider);
    if (!isValid) {
      await respond({ response_type: "ephemeral", text: `*${getProviderDisplayName(provider)} Connection Failed*\n\nToken invalid. Check that you copied the full token.` });
      return;
    }

    await setProvider(userId, provider, token);
    await respond({
      response_type: "ephemeral",
      blocks: connectSuccessBlocks(getProviderDisplayName(provider)),
      text: `${getProviderDisplayName(provider)} Connected`,
    });
  } catch (error) {
    console.error("Connect error:", error);
    await respond({ response_type: "ephemeral", text: "Connection failed. Please try again." });
  }
});

// ============================================
// /p360-disconnect
// ============================================

app.command("/p360-disconnect", async ({ command, ack, respond }) => {
  await ack();

  await setUser(command.user_id, { provider: undefined, providerToken: undefined });
  await respond({ response_type: "ephemeral", text: "*Device Disconnected*\n\nUse `/p360-connect` to reconnect anytime." });
});

// ============================================
// /p360-status
// ============================================

app.command("/p360-status", async ({ command, ack, respond }) => {
  await ack();

  const userId = command.user_id;
  const user = await getUser(userId);
  const connected = await hasConnectedDevice(userId);
  const provider = await getProvider(userId);

  if (connected) {
    const lastCheck = user?.lastCheckAt
      ? `Last check: ${user.lastCheckAt.toLocaleString()}`
      : "No checks yet";
    await respond({ response_type: "ephemeral", text: `*Status*\n\n${getProviderDisplayName(provider!)} Connected\n${lastCheck}` });
  } else {
    await respond({ response_type: "ephemeral", text: "*Status*\n\nNot connected. Use `/p360-connect` to link your device." });
  }
});

// ============================================
// Cron: Daily Outcome Resolution (00:00 UTC)
// ============================================

function scheduleCronJobs() {
  cron.schedule("0 0 * * *", async () => {
    console.log("[cron] Daily outcome resolution at", new Date().toISOString());

    try {
      if (!eventStore) return;

      const ouraToken = process.env.OURA_API_KEY;
      if (!ouraToken) return;

      const ouraProvider = new OuraProvider();
      const userId = process.env.P360_USER_ID || "slack-default";
      const data = await ouraProvider.fetchBiometricData(ouraToken);
      if (!data) return;

      const resolved = await resolveOutcomes(eventStore, userId, data);
      console.log(`[cron] Resolved ${resolved} pending outcomes for ${userId}`);

      const events = await eventStore.getByUser(userId, 100);
      if (events.length >= 5) {
        const profileStore = createSupabaseProfileStore();
        if (profileStore) {
          const profile = buildCausalityProfile(userId, events);
          await profileStore.saveProfile(profile);
          console.log(`[cron] CausalityProfile saved (${events.length} events)`);
        }
      }
    } catch (error) {
      console.error("[cron] Error:", error instanceof Error ? error.message : error);
    }
  });

  console.log("[cron] Scheduled: Daily outcome resolution at 00:00 UTC");
}

// ============================================
// Start
// ============================================

(async () => {
  scheduleCronJobs();
  await app.start(Number(process.env.PORT) || 3001);
  console.log(`P360 Slack bot running on port ${process.env.PORT || 3001}`);
  console.log("Commands: /p360-join, /p360-ask, /p360-connect, /p360-disconnect, /p360-status");
})();
