# Railway Deployment - Quick Start (5 minutes)

## TL;DR - Deploy in 5 Steps

### Step 1: Prepare Your Code
```bash
cd /Users/mattlee/Desktop/p360
git add .
git commit -m "Deploy: Configure for Railway"
git push origin main
```

### Step 2: Get Your Tokens
- **Telegram**: Message @BotFather on Telegram → `/newbot` → copy token
- **Discord**: https://discord.com/developers/applications → New Application → Bot → Copy Token

### Step 3: Open Railway Dashboard
1. Go to https://railway.app
2. Sign in with GitHub
3. Click **New Project** → **Deploy from GitHub**
4. Select your `p360` repo
5. Wait for auto-detection of services

### Step 4: Set Environment Variables
In Railway Dashboard, for **each service** (telegram & discord):

**Settings** → **Environment** → Add variables:

```
TELEGRAM_BOT_TOKEN=your_token_here
DISCORD_BOT_TOKEN=your_token_here
ANTHROPIC_API_KEY=your_key_here
OURA_API_KEY=your_key_here
P360_USER_ID=bot-default
```

(Optional: Add Supabase keys if you want data persistence)

### Step 5: Deploy & Monitor
- Click **Deploy** in Railway dashboard
- Watch logs: **Service** → **Logs**
- Should see:
  ```
  ✅ Bot started: @your_bot_name
  ✅ Cron job scheduled
  ```

**Done! 🎉 Your bots are live**

---

## What Gets Created

Railway automatically creates:

| Service | What It Does | Port |
|---------|-------------|------|
| **telegram** | Telegram bot listening for commands | Internal |
| **discord** | Discord bot listening for interactions | Internal |

Both run 24/7 with automatic restart on crash.

---

## Testing Your Bots

### Telegram
1. Open Telegram app
2. Search for your bot: `@your_bot_username`
3. Send: `/demo`
4. Should get a workout decision with demo data

### Discord
1. Add bot to your server via Developer Portal OAuth2 URL
2. In Discord server, type: `/demo feature:workout`
3. Should get embed with demo data

---

## Monitoring

### View Logs
```bash
# Via Railway CLI
railway logs --follow

# Or in dashboard: Service → Logs
```

### Check Status
```bash
railway status
```

### Restart Service
```bash
railway restart
```

---

## Common Issues

### "Bot token not set"
→ Add `TELEGRAM_BOT_TOKEN` or `DISCORD_BOT_TOKEN` to environment variables

### Service crashes immediately
→ Check logs for missing dependencies
→ Ensure `packages/core` installed: `npm install --workspace=packages/core`

### Cron jobs not running
→ Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY`
→ Check logs for: `[cron] Starting daily outcome resolution`

### Commands don't respond
→ Check if service is in "Running" state
→ Verify bot has permissions in Discord/Telegram
→ Check logs for errors

---

## Scaling Up

If you need higher performance:

**In Railway Dashboard:**
1. Service → Settings
2. Increase Memory: 512MB → 1GB+
3. Add Replicas: 1 → 2 (load balance)
4. Increase CPU if needed

---

## Adding Supabase (Optional)

For user data persistence:

1. Create account at https://supabase.com
2. Create new project
3. Get credentials:
   - URL → Project Settings → API
   - Anon Key → Same page
   - Service Role Key → Same page
4. Add to Railway environment variables:
   ```
   SUPABASE_URL=your_url
   SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_role_key
   ```
5. Run migrations:
   ```bash
   cd packages/core
   npm run migrate
   ```

Then Railway will automatically:
- Store user profiles
- Resolve outcomes daily via cron
- Build causality profiles from user data

---

## Production Checklist

Before going live:

- [ ] Both bots have unique tokens
- [ ] All env variables set in Railway
- [ ] Tested `/demo` command in both bots
- [ ] Logs show no errors
- [ ] Bots are in "Running" state
- [ ] Cron jobs scheduled (check logs)

---

## What's Automated

Railway handles:
- ✅ Building Node.js app
- ✅ Installing dependencies
- ✅ Starting bot processes
- ✅ Restarting on crash
- ✅ Monitoring memory/CPU
- ✅ Auto-scaling (with multiple replicas)
- ✅ Rolling updates (zero downtime)

---

## Next Steps

1. **Deploy now** (follow steps above)
2. **Monitor for 24h** (ensure cron runs successfully)
3. **Share your bots**:
   - Telegram: `https://t.me/your_bot_name`
   - Discord: Add to servers via OAuth2 URL

---

**Need help?**
- Railway docs: https://docs.railway.app
- Full guide: See `RAILWAY_DEPLOYMENT.md`
- Troubleshooting: See `docs/STATUS.md`

---

**Last Updated**: 2026-02-16 | **Status**: Ready to deploy
