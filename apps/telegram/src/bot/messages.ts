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

I help you make smarter decisions based on your biometric data.

<b>How it works:</b>
1. Connect your Oura Ring or WHOOP
2. Ask me anything about your health & performance
3. Get personalized, data-driven answers

<b>Example questions:</b>
• "Should I work out today?"
• "How much can I drink tonight?"
• "Is it a good time to start a project?"
• "Why am I feeling tired?"
• "What should I do about my sleep?"

<b>Get started:</b>
/connect - Link your device
/ask - Ask anything
/demo - Try with sample data
/help - Show all commands`,

  help: `<b>📖 P360 Commands</b>

<b>💬 Ask Questions (Everything goes through /ask)</b>
/ask &lt;question&gt; - Ask anything about your health
Examples:
  /ask Should I work out today?
  /ask How much can I drink tonight?
  /ask Why am I so tired?
  /ask Is now a good time to work?

<b>🎮 Try It First</b>
/demo - Try /ask with sample data (no device needed)

<b>🔗 Device Connection</b>
/connect - Link your Oura Ring or WHOOP
/status - Check connection status
/disconnect - Remove device connection

<b>📱 Apple Health Integration</b>
Simply attach your <code>export.xml</code> file from Apple Health
P360 will auto-detect activity gaps and adjust your readiness score
(No command needed - just upload the file directly)

<b>ℹ️ Help</b>
/help - Show this message

<b>How to connect your device:</b>

<b>Oura Ring:</b>
1. Go to cloud.ouraring.com
2. Create a Personal Access Token
3. Send: /connect YOUR_TOKEN

<b>WHOOP:</b>
1. Go to developer.whoop.com
2. Get your access token
3. Send: /connect whoop YOUR_TOKEN

<b>How to upload Apple Health data:</b>
1. Open Health app → tap your profile
2. "Export All Health Data"
3. Unzip → attach <code>export.xml</code> here
(P360 will automatically detect activity and adjust recommendations)

💡 <i>Pro tip: Start with /demo to see how it works!</i>`,

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

You're all set! Now you can ask me anything about your health and performance.

Try it now: /ask Should I work out today?`,

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

Ready to ask questions! Try: /ask Should I work out today?`;
    }
    return `📊 <b>Status</b>

Device: ❌ Not connected

Use /connect to link your Oura Ring
Or /connect whoop YOUR_TOKEN for WHOOP`;
  },
};
