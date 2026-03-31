# P360 Slack Bot - Quick Setup Guide

## What Was Built

Complete Slack bot mirroring Discord bot architecture:

### File Structure
```
apps/slack/
├── package.json          # Dependencies (@slack/bolt, @p360/core, etc.)
├── tsconfig.json         # TypeScript config (strict mode)
├── .env.example          # Environment template
├── .gitignore           # Git ignore rules
├── manifest.yml         # Slack App Manifest (easy app creation)
├── README.md            # Full documentation
├── SETUP.md            # This file
└── src/
    ├── index.ts         # Main bot + all command handlers
    └── lib/
        ├── storage.ts   # In-memory user data (same as Discord)
        ├── data.ts      # Biometric data fetching wrappers
        ├── format.ts    # Slack Block Kit formatting
        └── ask.ts       # AI-powered ask gateway
```

### Commands Implemented

All 10 slash commands:

1. `/p360-ask [question]` - AI-powered decision support
2. `/p360-workout [sport?]` - Workout readiness check
3. `/p360-drink [log|history|social?] [amount?]` - Alcohol decision support
4. `/p360-why [feeling?] [score?]` - Mind vs body analysis
5. `/p360-mood [score] [history?]` - Mood tracking
6. `/p360-cost [substance] [amount]` - Recovery cost calculator
7. `/p360-connect [oura|whoop] [token]` - Connect wearable
8. `/p360-disconnect` - Disconnect device
9. `/p360-status` - Connection status
10. `/p360-demo [feature?]` - Demo mode

### Daily Cron Job

Runs at 00:00 UTC (09:00 KST):
- Resolves pending causality events
- Builds personalized profiles after 5+ events

## Installation Steps

### 1. Fix npm cache issue (if needed)

```bash
sudo chown -R $(whoami) ~/.npm
```

### 2. Install dependencies

```bash
cd /Users/mattlee/p360/apps/slack
npm install
```

### 3. Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From an app manifest"
3. Select your workspace
4. Copy and paste contents of `manifest.yml`
5. Click "Create"

### 4. Get credentials

**Bot Token:**
1. Go to "OAuth & Permissions"
2. Click "Install to Workspace"
3. Copy "Bot User OAuth Token" (starts with `xoxb-`)

**Signing Secret:**
1. Go to "Basic Information"
2. Copy "Signing Secret" from "App Credentials"

### 5. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
ANTHROPIC_API_KEY=sk-ant-your-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3001
# For cron job (optional)
OURA_API_KEY=your-oura-token
P360_USER_ID=your-user-id
```

### 6. Start server

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

### 7. Expose to internet

**Option A: ngrok (Development)**
```bash
ngrok http 3001
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

**Option B: Production Server**
Deploy to Railway, Render, or your own server.

### 8. Configure Slack Request URL

1. Go to Slack app settings → "Interactivity & Shortcuts"
2. Enable "Interactivity"
3. Set "Request URL" to: `https://your-domain.com/slack/events`
4. Click "Save Changes"

Note: Slash commands inherit this URL automatically.

## Testing

In Slack:
```
/p360-demo workout
/p360-demo drink
/p360-demo mood
/p360-demo cost
```

Then connect your device:
```
/p360-connect oura YOUR_OURA_TOKEN
/p360-status
/p360-ask Should I work out today?
```

## Architecture Notes

### Mirrors Discord Exactly

Same patterns, same error handling, same flow:
- In-memory storage (Map-based)
- @p360/core for all domain logic
- Claude API for AI decisions
- Supabase for events/profiles
- Daily cron for outcome resolution

### Slack-Specific Differences

1. **Commands**: Slash commands instead of Discord slash commands
2. **Responses**: Block Kit instead of EmbedBuilder
3. **IDs**: `slackUserId` instead of `discordId`
4. **Ack**: Must call `ack()` within 3 seconds (before async ops)
5. **Respond**: All `respond()` calls include both `blocks` and `text` (fallback)

### No External Dependencies

Everything uses @p360/core:
- `prepareAsk()` - Context building
- `processAskResponse()` - Nudge parsing
- `collectEvent()` - Causality tracking
- `resolveOutcomes()` - Daily resolution
- `buildCausalityProfile()` - Profile generation

## Next Steps

1. Fix npm cache if needed
2. Install dependencies
3. Create Slack app
4. Configure credentials
5. Start server
6. Expose via ngrok
7. Test with `/p360-demo`
8. Connect real device
9. Deploy to production

## Files to Review

Core implementation:
- `/Users/mattlee/p360/apps/slack/src/index.ts` - All command handlers (530 lines)
- `/Users/mattlee/p360/apps/slack/src/lib/format.ts` - Block Kit formatting (240 lines)
- `/Users/mattlee/p360/apps/slack/src/lib/ask.ts` - AI gateway (100 lines)
- `/Users/mattlee/p360/apps/slack/manifest.yml` - Slack app config

Documentation:
- `/Users/mattlee/p360/apps/slack/README.md` - Full docs
- `/Users/mattlee/p360/apps/slack/SETUP.md` - This file
