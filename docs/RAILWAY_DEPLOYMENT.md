# Railway Deployment Guide - P360 Telegram & Discord Bots

## Overview

This guide walks you through deploying both the Telegram and Discord bots to Railway with proper environment configuration and cron job support.

## Prerequisites

1. **Railway Account**: https://railway.app
2. **Git Repository**: Your p360 repo must be pushed to GitHub
3. **Bot Tokens**:
   - Telegram Bot Token from @BotFather
   - Discord Bot Token from Discord Developer Portal
4. **API Keys**:
   - Anthropic API key (for `/ask` commands)
   - Oura API key (for biometric data)
   - Supabase URL & Anon Key (optional, for data storage)

## Step 1: Prepare Your Repository

Ensure your p360 repo is pushed to GitHub with the latest changes:

```bash
cd /Users/mattlee/Desktop/p360
git add .
git commit -m "Configure Railway deployment for Telegram and Discord bots"
git push origin main
```

## Step 2: Create Railway Project

### Option A: Via Web Dashboard

1. Go to https://railway.app/dashboard
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Select your `p360` repository
5. Railway will auto-detect the monorepo structure

### Option B: Via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize in your project
cd /Users/mattlee/Desktop/p360
railway init

# Deploy
railway up
```

## Step 3: Configure Environment Variables

Set these variables in your Railway project settings:

### Core Configuration

```
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_token_here

# Discord Bot
DISCORD_BOT_TOKEN=your_discord_token_here

# Anthropic API (for /ask command)
ANTHROPIC_API_KEY=your_anthropic_key_here

# Oura Ring API
OURA_API_KEY=your_oura_api_key_here

# Supabase (optional, for data persistence)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Default user ID for cron jobs
P360_USER_ID=cli-default
```

## Step 4: Deploy Both Services

Railway will automatically create separate services for each bot based on your `Procfile`.

### Understanding the Procfile

```
telegram: cd apps/telegram && npm start
discord: cd apps/discord && npm start
```

This tells Railway to:
1. Create a `telegram` service that runs the Telegram bot
2. Create a `discord` service that runs the Discord bot
3. Each service runs independently with automatic restarts

### Manual Service Creation (if needed)

In Railway dashboard:
1. Click **New Service** → **GitHub Repo**
2. Select your p360 repo
3. In **Settings**, set Root Directory: `apps/telegram`
4. Set Start Command: `npm install && npm run build && npm start`
5. Repeat for Discord with `apps/discord`

## Step 5: Configure Services

For each service (Telegram & Discord):

### Environment Variables

Ensure both services have access to:
- `TELEGRAM_BOT_TOKEN` (Telegram service only)
- `DISCORD_BOT_TOKEN` (Discord service only)
- `ANTHROPIC_API_KEY` (both)
- `OURA_API_KEY` (both)
- `SUPABASE_*` (both, if using)

### Resource Allocation

- **Memory**: 512MB (sufficient for bots)
- **CPU**: Shared (default)
- **Restart Policy**: On Failure

### Deployment Settings

In Railway Service Settings:
- **Builder**: NIXPACKS (auto-detected)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

## Step 6: Monitor Deployments

### View Logs

```bash
# Via Railway CLI
railway logs

# Or in dashboard: Service → Logs
```

### Health Checks

Both bots will log:
- `✅ Bot started: @bot_username` (Telegram)
- `✅ Discord bot ready: bot#0000` (Discord)
- `[cron] ✅ Cron job scheduled` (Daily outcome resolution)

### Common Issues

#### Bot not starting
```
Error: TELEGRAM_BOT_TOKEN not set in environment
```
→ Add token to Railway environment variables

#### Service crashes on startup
Check logs for:
- Missing dependencies: `npm install` might fail if `@p360/core` is missing
- Solution: Ensure `packages/core` is properly published or linked

#### Cron jobs not running
- Both bots schedule daily cron at 00:00 UTC (09:00 KST)
- Requires: Supabase configured + OURA_API_KEY set
- Check logs for `[cron] Starting daily outcome resolution`

## Step 7: Setup Webhooks (Optional but Recommended)

For better performance, configure webhooks instead of polling:

### Telegram Webhook (faster, zero polling)

```bash
# After Railway deployment, get your service URL
railway env | grep RAILWAY_PUBLIC_DOMAIN

# Set webhook (run once)
curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook \
  -d url="https://your-railway-domain.up.railway.app/telegram/webhook"
```

Then update telegram bot to use webhook mode:
See `apps/telegram/src/bot/webhook.ts` for webhook implementation

### Discord Webhook

Discord.js automatically handles webhooks internally, no manual setup needed.

## Step 8: Database Setup (Optional)

If you want to store user data and resolve outcomes:

### Supabase Setup

1. Create Supabase project: https://supabase.com
2. Create tables (see `packages/core/src/stores/schemas.ts`)
3. Get credentials:
   - Project URL → `SUPABASE_URL`
   - Anon Key → `SUPABASE_ANON_KEY`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`
4. Add to Railway environment

### Run Migrations

```bash
# From project root
cd packages/core
npm run migrate  # Creates tables if needed
```

## Monitoring & Maintenance

### Daily Checks

- Log into Railway dashboard
- Check both services are in "Running" state
- Check recent logs for errors

### Weekly Checks

- Monitor memory usage (should be <250MB for both)
- Check for recurring errors
- Verify cron jobs ran successfully

### Backup Plan

If a service fails:

1. **Manual Restart**: Railway dashboard → Service → Restart
2. **Redeploy**: `git push origin main` triggers auto-redeploy
3. **Rollback**: Railway version history available in dashboard

## Production Checklist

- [ ] Both bots have unique tokens
- [ ] All environment variables set
- [ ] Oura API key configured
- [ ] Supabase tables created (if using)
- [ ] Bot commands tested in each service
- [ ] Logs are being written correctly
- [ ] Cron jobs scheduled
- [ ] Memory usage < 512MB per service
- [ ] Restart policy set to ON_FAILURE

## Scaling

If you need to handle more users:

1. **Vertical Scaling**: Increase memory per service (Railway → Service Settings)
2. **Horizontal Scaling**: Multiple replicas (set `numReplicas: 2+` in railway.json)
3. **Database**: Upgrade Supabase plan if needed
4. **Rate Limiting**: Add rate limit middleware to prevent abuse

## Troubleshooting

### Bot offline but service running

```bash
# Check if bot is actually listening
railway logs --follow

# Should see:
# ✅ Bot started: @username
# Available commands: /workout, /drink, etc.
```

### Commands not working

1. Check bot has necessary permissions in Discord/Telegram
2. Verify environment variables with `railway env`
3. Check API integrations (Oura, Anthropic)

### Data not persisting

- Verify Supabase is configured
- Check table schemas exist
- Look for errors in logs: `[cron] Failed to save profile`

### High memory usage

- Check for memory leaks in bot code
- Monitor with `railway logs --tail`
- Consider splitting services further

## Next Steps

1. **Test Locally First**:
   ```bash
   cd apps/telegram
   npm install
   npm run build
   TELEGRAM_BOT_TOKEN=test npm start
   ```

2. **Deploy to Railway**: Follow Steps 1-6

3. **Monitor for 24 hours**: Ensure cron jobs run successfully

4. **Share Bot Links**:
   - Telegram: https://t.me/your_bot_username
   - Discord: Add bot to servers via OAuth2 URL in Developer Portal

## API Reference

### Telegram Commands
- `/workout` - Check workout readiness
- `/drink` - Check drinking limit
- `/why` - Mind vs Body analysis
- `/mood N` - Log mood and get insight
- `/cost substance amount` - Recovery cost calculator
- `/ask question` - AI-powered contextual advice
- `/connect` - Link Oura/WHOOP
- `/demo` - Try with demo data

### Discord Commands
- `/workout [sport]` - Check workout readiness
- `/drink [action]` - Drinking limit & logging
- `/why [feeling] [score]` - Mind vs Body analysis
- `/mood score:N [action]` - Mood tracking
- `/cost substance:X amount:N` - Recovery cost calculator
- `/ask question:X` - AI-powered advice
- `/connect device:X token:Y` - Link Oura/WHOOP
- `/demo [feature]` - Try with demo data

## Support

For Railway-specific issues:
- Railway Docs: https://docs.railway.app
- Railway Support: https://railway.app/support

For P360-specific issues:
- Check logs in Railway dashboard
- Review CLAUDE.md for project architecture
- Check individual bot implementations in `apps/telegram/` and `apps/discord/`

---

**Last Updated**: 2026-02-16
**Status**: Ready for production deployment
