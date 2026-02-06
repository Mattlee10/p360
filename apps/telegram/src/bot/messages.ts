import type { ProviderType } from "@p360/core";

const PROVIDER_NAMES: Record<ProviderType, string> = {
  oura: "Oura Ring",
  whoop: "WHOOP",
};

function getProviderName(provider?: ProviderType): string {
  return provider ? PROVIDER_NAMES[provider] : "device";
}

export const MESSAGES = {
  welcome: `👋 <b>Welcome to P360!</b>

I help you make better decisions based on your wearable data.

<b>Supported Devices:</b>
⌚ Oura Ring
⌚ WHOOP

<b>What I can do:</b>
🏋️ /workout - Should I train today?
🍺 /drink - How much can I drink tonight?
💰 /cost beer 3 - Recovery cost before you drink
🧠 /why - Why do I feel this way?
🎭 /mood - Track mood + get insight

<b>Quick Start:</b>
1. Get your device's access token
2. Run /connect YOUR_TOKEN (Oura) or /connect whoop YOUR_TOKEN
3. Ask me anytime!

<b>Commands:</b>
/workout - Training recommendation
/drink - Drinking limit guide
/why - Mind vs Body analysis
/connect - Link your wearable
/demo - Try with sample data
/help - Show all commands`,

  help: `<b>P360 Commands</b>

🏋️ <b>Workout Check</b>
/workout - Get your training recommendation
/w - Shortcut for /workout

🍺 <b>Drink Guide</b>
/drink - How much can I drink tonight?
/d - Shortcut for /drink
/drink log N - Log drinks (e.g. /drink log 3)
/drink history - See your drinking patterns
/drink social - Social event strategy

🧠 <b>Why (Mind vs Body)</b>
/why - Why do I feel off today?
/why tired 4 - With keyword + score (1-10)
/why mood - Check mood category
/why energy 3 - Check energy with score
/why focus - Check focus/concentration

💰 <b>Recovery Cost (P27)</b>
/cost beer 3 - Recovery cost of 3 beers
/cost coffee 2 - Sleep impact of 2 coffees
/cost wine 1 - Recovery cost of 1 wine
/c - Shortcut for /cost

🎭 <b>Mood Tracking (P17)</b>
/mood N - Log mood (1-5) + get insight
/m - Shortcut for /mood
/mood history - See mood-recovery patterns

🔗 <b>Connection</b>
/connect TOKEN - Link Oura Ring
/connect whoop TOKEN - Link WHOOP
/status - Check connection status
/disconnect - Remove device connection

🎮 <b>Demo</b>
/demo - Try workout with sample data
/drinkdemo - Try drink with sample data
/whydemo - Try why with sample data
/mooddemo - Try mood with sample data
/costdemo - Try recovery cost simulator

❓ <b>Help</b>
/help - Show this message

<b>How to get your token:</b>

<b>Oura:</b>
1. Go to cloud.ouraring.com
2. Personal Access Tokens
3. Create new token
4. /connect YOUR_TOKEN

<b>WHOOP:</b>
1. Go to developer.whoop.com
2. Create an app
3. Get access token
4. /connect whoop YOUR_TOKEN`,

  connectInstructions: `🔐 <b>Connect Your Device</b>

<b>Oura Ring:</b>
1. Go to <a href="https://cloud.ouraring.com/personal-access-tokens">Oura Cloud</a>
2. Create a Personal Access Token
3. Send: <code>/connect YOUR_TOKEN</code>

<b>WHOOP:</b>
1. Go to <a href="https://developer.whoop.com">WHOOP Developer</a>
2. Get your access token
3. Send: <code>/connect whoop YOUR_TOKEN</code>

Or try demo mode: /demo`,

  connectSuccess: (provider: ProviderType = "oura") => `✅ <b>${getProviderName(provider)} Connected!</b>

You can now use /workout to check your training readiness.

Try it now: /workout`,

  connectFailed: (provider: ProviderType = "oura") => `❌ <b>Connection Failed</b>

The ${getProviderName(provider)} token appears to be invalid. Please check:
1. You copied the full token
2. The token hasn't expired
3. You're using the correct token type

Try again: /connect ${provider === "whoop" ? "whoop " : ""}YOUR_TOKEN`,

  disconnected: `🔓 <b>Device Disconnected</b>

Your device token has been removed.
Use /connect to reconnect anytime.`,

  notConnected: `⚠️ <b>Device Not Connected</b>

You need to connect your wearable first.

<b>Oura:</b> /connect YOUR_TOKEN
<b>WHOOP:</b> /connect whoop YOUR_TOKEN

Or /demo to try with sample data`,

  fetchError: `❌ <b>Error Fetching Data</b>

Couldn't get your biometric data. This might be because:
• Token expired - try /connect again
• API is temporarily down
• No recent data available

Try /demo for sample data`,

  status: (connected: boolean, lastCheck?: Date, provider?: ProviderType) => {
    if (connected) {
      const deviceName = getProviderName(provider);
      const lastCheckText = lastCheck
        ? `Last check: ${lastCheck.toLocaleString()}`
        : "No checks yet";
      return `📊 <b>Status</b>

${deviceName}: ✅ Connected
${lastCheckText}

Ready to use /workout`;
    }
    return `📊 <b>Status</b>

Device: ❌ Not connected

Use /connect to link your Oura Ring
Or /connect whoop YOUR_TOKEN for WHOOP`;
  },
};
