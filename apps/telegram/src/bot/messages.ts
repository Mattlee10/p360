export const MESSAGES = {
  welcome: `👋 <b>Welcome to P360!</b>

I help you make better decisions based on your Oura Ring data.

<b>What I can do:</b>
🏋️ /workout - Should I train today?
🍺 /drink - How much can I drink tonight?
🧠 /why - Why do I feel this way?

<b>Quick Start:</b>
1. Get your Oura Personal Access Token
2. Run /connect YOUR_TOKEN
3. Ask me anytime!

<b>Commands:</b>
/workout - Training recommendation
/drink - Drinking limit guide
/why - Mind vs Body analysis
/connect - Link your Oura Ring
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

🔗 <b>Connection</b>
/connect TOKEN - Link your Oura Ring
/status - Check connection status
/disconnect - Remove Oura connection

🎮 <b>Demo</b>
/demo - Try workout with sample data
/drinkdemo - Try drink with sample data
/whydemo - Try why with sample data

❓ <b>Help</b>
/help - Show this message

<b>How to get your Oura token:</b>
1. Go to cloud.ouraring.com
2. Personal Access Tokens
3. Create new token
4. Copy and send: /connect YOUR_TOKEN`,

  connectInstructions: `🔐 <b>Connect Your Oura Ring</b>

1. Go to <a href="https://cloud.ouraring.com/personal-access-tokens">Oura Cloud</a>
2. Create a new Personal Access Token
3. Copy the token
4. Send: <code>/connect YOUR_TOKEN</code>

Or try demo mode: /demo`,

  connectSuccess: `✅ <b>Oura Ring Connected!</b>

You can now use /workout to check your training readiness.

Try it now: /workout`,

  connectFailed: `❌ <b>Connection Failed</b>

The token appears to be invalid. Please check:
1. You copied the full token
2. The token hasn't expired
3. You're using a Personal Access Token (not OAuth)

Try again: /connect YOUR_TOKEN`,

  disconnected: `🔓 <b>Oura Disconnected</b>

Your Oura token has been removed.
Use /connect to reconnect anytime.`,

  notConnected: `⚠️ <b>Oura Not Connected</b>

You need to connect your Oura Ring first.

Use /connect to link your account
Or /demo to try with sample data`,

  fetchError: `❌ <b>Error Fetching Data</b>

Couldn't get your Oura data. This might be because:
• Token expired - try /connect again
• Oura API is down
• No recent data available

Try /demo for sample data`,

  status: (connected: boolean, lastCheck?: Date) => {
    if (connected) {
      const lastCheckText = lastCheck
        ? `Last check: ${lastCheck.toLocaleString()}`
        : "No checks yet";
      return `📊 <b>Status</b>

Oura: ✅ Connected
${lastCheckText}

Ready to use /workout`;
    }
    return `📊 <b>Status</b>

Oura: ❌ Not connected

Use /connect to link your Oura Ring`;
  },
};
