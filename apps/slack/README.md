# P360 Slack Bot

Real-time bio-data driven decision support for Slack.

## Features

All P360 features accessible via slash commands:

- `/p360-ask [question]` - AI-powered decision support
- `/p360-workout [sport?]` - Check workout readiness
- `/p360-drink [log|history|social?] [amount?]` - Alcohol decision support
- `/p360-why [feeling?] [score?]` - Mind vs body analysis
- `/p360-mood [score] [history?]` - Mood tracking
- `/p360-cost [substance] [amount]` - Recovery cost calculator
- `/p360-connect [oura|whoop] [token]` - Connect wearable
- `/p360-disconnect` - Disconnect device
- `/p360-status` - Check connection status
- `/p360-demo [feature?]` - Try with demo data

## Setup

### 1. Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From an app manifest"
3. Select your workspace
4. Paste contents of `manifest.yml`
5. Click "Create"

### 2. Install to Workspace

1. Go to "OAuth & Permissions"
2. Click "Install to Workspace"
3. Copy the "Bot User OAuth Token" (starts with `xoxb-`)

### 3. Get Signing Secret

1. Go to "Basic Information"
2. Copy the "Signing Secret" from "App Credentials"

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
ANTHROPIC_API_KEY=sk-ant-your-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3001
# For cron job
OURA_API_KEY=your-oura-token
P360_USER_ID=your-user-id
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Start Server

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

### 7. Configure Request URL

The bot must be publicly accessible. Options:

**Option A: ngrok (Development)**
```bash
ngrok http 3001
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

**Option B: Production Server**
Deploy to your server and use your domain.

Then:
1. Go to Slack app settings → "Slash Commands"
2. For each command, set Request URL to: `https://your-domain.com/slack/events`
3. Click "Save Changes"

## Usage

In any Slack channel or DM:

```
/p360-ask Should I do HIIT today?
/p360-workout running
/p360-drink
/p360-drink log 2
/p360-drink social
/p360-why tired 4
/p360-mood 3
/p360-cost beer 3
/p360-connect oura YOUR_TOKEN
/p360-status
/p360-demo workout
```

## Architecture

Mirrors Discord bot structure:

- `src/index.ts` - Main bot + command handlers
- `src/lib/storage.ts` - In-memory user data
- `src/lib/data.ts` - Biometric data fetching
- `src/lib/format.ts` - Slack Block Kit formatting
- `src/lib/ask.ts` - AI-powered ask gateway

Uses `@p360/core` for all domain logic.

## Daily Cron Job

Runs at 00:00 UTC (09:00 KST) daily:
- Resolves pending causality events
- Builds personalized profiles after 5+ events

Requires `OURA_API_KEY` and `P360_USER_ID` env vars.

## Tech Stack

- **Framework**: @slack/bolt (Slack SDK)
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js
- **Core Logic**: @p360/core
- **AI**: Claude API (Anthropic)
- **Storage**: Supabase (events + profiles)

## Development

```bash
# Install deps
npm install

# Type check
npm run build

# Run dev server
npm run dev
```

## Deployment

Deploy to any Node.js hosting:
- Railway
- Render
- Heroku
- AWS Lambda (with adapter)
- Your own server

Must be publicly accessible for Slack webhooks.
