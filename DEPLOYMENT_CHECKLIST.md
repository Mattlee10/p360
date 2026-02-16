# P360 Railway Deployment Checklist

## Pre-Deployment (Do This First)

- [ ] Repository is clean (no uncommitted changes)
- [ ] Latest code pushed to GitHub main branch
- [ ] Both bots have been tested locally:
  ```bash
  cd apps/telegram && npm run build && npm start
  cd apps/discord && npm run build && npm start
  ```

## Get Your Tokens & Keys

### Telegram
- [ ] Message @BotFather on Telegram
- [ ] Send `/newbot` and follow setup
- [ ] Copy the token (format: `123456789:ABCdefGHIJKlmnoPQRstuvWXYZ`)
- [ ] Store securely, add to Railway env vars

### Discord
- [ ] Go to https://discord.com/developers/applications
- [ ] Click "New Application"
- [ ] Go to "Bot" section
- [ ] Click "Add Bot"
- [ ] Copy token from "TOKEN" section
- [ ] Store securely, add to Railway env vars

### API Keys
- [ ] Anthropic API Key from https://console.anthropic.com
- [ ] Oura API Key from https://cloud.ouraring.com
- [ ] (Optional) Supabase project URL & keys from https://supabase.com

## Deploy to Railway

### Step 1: Create Railway Project
- [ ] Go to https://railway.app
- [ ] Sign in with GitHub
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose `p360` repository
- [ ] Wait for Railway to auto-detect services

### Step 2: Configure Services
Railway should auto-create two services. For each service:

#### Telegram Service
- [ ] Name: `telegram`
- [ ] Root Directory: `apps/telegram`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`

#### Discord Service
- [ ] Name: `discord`
- [ ] Root Directory: `apps/discord`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`

### Step 3: Set Environment Variables
For **both services**, add these variables:

**Required:**
- [ ] `TELEGRAM_BOT_TOKEN` = your_telegram_token
- [ ] `DISCORD_BOT_TOKEN` = your_discord_token
- [ ] `ANTHROPIC_API_KEY` = your_anthropic_key
- [ ] `OURA_API_KEY` = your_oura_key
- [ ] `P360_USER_ID` = `bot-default`

**Optional (for data persistence):**
- [ ] `SUPABASE_URL` = your_supabase_url
- [ ] `SUPABASE_ANON_KEY` = your_supabase_key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = your_supabase_service_key

**Automatically set by Railway:**
- [ ] `NODE_ENV` = `production`

### Step 4: Deploy
- [ ] Click "Deploy" button in Railway dashboard
- [ ] Wait for both services to build and start
- [ ] Monitor logs for successful startup

## Verify Deployment

### Check Service Status
- [ ] Go to Dashboard → Services
- [ ] Telegram service shows "Running" status
- [ ] Discord service shows "Running" status

### Check Logs for Success Messages

#### Telegram Service Logs
- [ ] `✅ Bot started: @your_bot_name`
- [ ] `Available commands: /workout, /drink, etc.`
- [ ] `[cron] ✅ Cron job scheduled`

#### Discord Service Logs
- [ ] `✅ Discord bot ready: your_bot#0000`
- [ ] `Commands: /workout, /drink, /cost, /why, /mood, /ask, /connect, /demo`
- [ ] `[cron] ✅ Cron job scheduled`

### Test Commands

#### Telegram Test
- [ ] Open Telegram app
- [ ] Find your bot: `@your_bot_username`
- [ ] Send `/demo`
- [ ] ✅ Should return workout decision with demo data

#### Discord Test
- [ ] Open Discord
- [ ] Add bot to your server (via Developer Portal OAuth2 URL)
- [ ] Type `/demo feature:workout`
- [ ] ✅ Should return embed with demo data

## Post-Deployment

### Daily Monitoring (First Week)
- [ ] Check logs daily for errors
- [ ] Monitor memory usage (should stay <250MB per service)
- [ ] Verify cron jobs run at 00:00 UTC
- [ ] Test `/workout`, `/drink`, `/why`, `/mood`, `/ask` commands

### Weekly Checks
- [ ] Both services in "Running" state
- [ ] No recurring errors in logs
- [ ] Cron job successfully resolved outcomes
- [ ] Bot response times are acceptable (<2s)

### Monthly Tasks
- [ ] Review logs for patterns
- [ ] Check if memory usage trending up
- [ ] Verify API rate limits not exceeded
- [ ] Update documentation if needed

## Production Checklist

Before sharing publicly:

- [ ] Bots respond to all commands
- [ ] Error messages are helpful
- [ ] Bot doesn't crash on invalid input
- [ ] Demo data works correctly
- [ ] Real data (when connected) works correctly
- [ ] Cron jobs running successfully
- [ ] No sensitive data in logs
- [ ] Memory usage stable

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| "Bot token not set" | Add token to Railway environment variables |
| Service crashes | Check logs for error, ensure all dependencies installed |
| Commands not responding | Verify service is "Running", check bot permissions |
| Cron jobs not running | Ensure Supabase configured, check logs for `[cron]` messages |
| High memory usage | Monitor with `railway logs`, check for memory leaks |
| API rate limiting | Add rate limiting middleware or upgrade API plan |

## Rollback Plan

If something goes wrong:

### Option 1: Restart Service
```bash
# Via Railway CLI
railway restart

# Or in dashboard: Service → Restart
```

### Option 2: Redeploy from Git
```bash
# Fix code locally
# Commit changes
git push origin main

# Railway auto-redeploys on push
```

### Option 3: Manual Rollback
- Railway dashboard → Service → Deployments
- Click previous successful deployment
- Click "Redeploy"

## Scaling Checklist

If you need to handle more users:

- [ ] Monitor memory usage (add more if >80% used)
- [ ] Check CPU usage (should be <50% most of the time)
- [ ] Review API rate limits (Oura, Anthropic)
- [ ] Consider database scaling (Supabase)
- [ ] Add more replicas if needed (1 → 2+ services)

## Documentation Links

- 📖 Full Guide: `RAILWAY_DEPLOYMENT.md`
- ⚡ Quick Start: `RAILWAY_QUICKSTART.md` (5 minute setup)
- 🐛 Troubleshooting: `docs/STATUS.md`
- 🏗️ Architecture: `docs/core/P360_SYSTEM_ARCHITECTURE.md`

## Sign-Off

- [ ] All checks completed
- [ ] Deployment successful
- [ ] Both bots tested and working
- [ ] Monitoring in place
- [ ] Team notified of new deployment

---

**Deployed Date**: _______________
**Deployed By**: _______________
**Status**: ⬜ Pending | 🟢 Live | 🔴 Failed
**Notes**: _______________________________

---

**Last Updated**: 2026-02-16
