# Railway Deployment Setup - Summary

## ✅ What's Been Configured

Your p360 project is now fully configured for Railway deployment with **both Telegram and Discord bots**.

### Files Created/Modified

1. **Procfile** - Defines two services
   - `telegram: cd apps/telegram && npm start`
   - `discord: cd apps/discord && npm start`

2. **package.json** - Added monorepo build scripts
   - `npm run build` - Builds both bots + core
   - Works with Railway's Nixpacks builder

3. **railway.json** - Railway configuration
   - Uses Nixpacks for automatic Node.js detection
   - Restart policy: ON_FAILURE
   - Max retries: 5

4. **RAILWAY_QUICKSTART.md** ⚡ - Start here!
   - 5-step deployment guide
   - Takes ~5 minutes
   - Most important file to read first

5. **RAILWAY_DEPLOYMENT.md** - Complete guide
   - Detailed setup instructions
   - Environment variable reference
   - Monitoring & maintenance
   - Troubleshooting guide
   - API reference for both bots

6. **DEPLOYMENT_CHECKLIST.md** - Verification checklist
   - Pre-deployment checks
   - Token collection checklist
   - Service configuration verification
   - Testing procedures
   - Post-deployment monitoring

7. **.railwayrc.json** - Service configurations
   - Memory: 512MB per service
   - Replicas: 1 (can scale up)
   - Restart policy: ON_FAILURE

8. **.env.railway.example** - Environment template
   - Copy to `.env` and fill in your tokens
   - Comments explain where to get each key

9. **scripts/deploy-railway.sh** - Automation script
   - Checks prerequisites
   - Installs dependencies
   - Builds applications
   - Guides deployment

---

## 🚀 Quick Start (5 Minutes)

### 1. Get Tokens
```
Telegram: Message @BotFather → /newbot → copy token
Discord: https://discord.com/developers → New App → Bot → Copy Token
```

### 2. Open Railway
```
https://railway.app
→ New Project
→ Deploy from GitHub
→ Select p360 repo
```

### 3. Set Environment Variables
For both services, add:
```
TELEGRAM_BOT_TOKEN=your_token
DISCORD_BOT_TOKEN=your_token
ANTHROPIC_API_KEY=your_key
OURA_API_KEY=your_key
P360_USER_ID=bot-default
```

### 4. Deploy
Click "Deploy" in Railway dashboard

### 5. Test
- Telegram: `/demo`
- Discord: `/demo feature:workout`

**Done!** 🎉

---

## 📋 What Happens After Deploy

### Automatic
✅ Both bots start and listen for commands
✅ Cron job schedules for daily outcome resolution (00:00 UTC)
✅ Memory monitored automatically
✅ Auto-restart on crash

### Manual
📝 Monitor logs: `railway logs --follow`
🧪 Test commands in both bots
📊 Check memory usage (should be <250MB each)

---

## 🔧 Environment Variables Needed

### Required
| Variable | Description | Where to Get |
|----------|-------------|--------------|
| TELEGRAM_BOT_TOKEN | Telegram bot token | @BotFather |
| DISCORD_BOT_TOKEN | Discord bot token | Discord Dev Portal |
| ANTHROPIC_API_KEY | Claude API key | console.anthropic.com |
| OURA_API_KEY | Oura Ring API key | cloud.ouraring.com |

### Optional (for data persistence)
| Variable | Description |
|----------|-------------|
| SUPABASE_URL | Database URL |
| SUPABASE_ANON_KEY | Database anon key |
| SUPABASE_SERVICE_ROLE_KEY | Database role key |

### Auto-set by Railway
| Variable | Value |
|----------|-------|
| NODE_ENV | production |
| RAILWAY_PUBLIC_DOMAIN | your-service.up.railway.app |

---

## 📚 Documentation Guide

**Start here 👇**

1. **RAILWAY_QUICKSTART.md** ⚡
   - 5-minute setup
   - Most important file
   - Read this first

2. **DEPLOYMENT_CHECKLIST.md** ✅
   - Step-by-step verification
   - Testing procedures
   - Before going live

3. **RAILWAY_DEPLOYMENT.md** 📖
   - Complete reference guide
   - Detailed setup instructions
   - Advanced configuration

---

## 🎯 Commands Available After Deploy

### Telegram Commands
```
/workout           - Check workout readiness
/drink             - Check drinking limit
/why               - Mind vs Body analysis
/mood N            - Log mood (1-5)
/cost beer 3       - Recovery cost simulator
/ask question      - AI-powered advice
/connect           - Link Oura/WHOOP
/demo              - Try with demo data
```

### Discord Commands
```
/workout [sport]   - Check workout readiness
/drink [action]    - Drinking limit & logging
/why [feeling]     - Mind vs Body analysis
/mood score:N      - Mood tracking
/cost substance:X  - Recovery cost calculator
/ask question:X    - AI-powered advice
/connect           - Link Oura/WHOOP
/demo [feature]    - Try with demo data
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Service won't start | Check logs: `railway logs --follow` |
| "Token not set" error | Add env var to Railway dashboard |
| Commands don't work | Ensure service is "Running", check permissions |
| Cron jobs missing | Add Supabase vars + check logs |
| High memory | Monitor with `railway logs`, consider scaling |

**Full troubleshooting**: See RAILWAY_DEPLOYMENT.md

---

## 📊 Monitoring

### View Logs
```bash
railway logs --follow
```

### Check Status
```bash
railway status
```

### Restart Service
```bash
railway restart
```

### View Environment
```bash
railway env
```

---

## ⚙️ Service Details

### Telegram Service
- **Language**: TypeScript/Node.js
- **Library**: grammy (Telegram Bot API)
- **Memory**: 512MB
- **Port**: Internal (webhook-based)
- **Cron**: Daily at 00:00 UTC

### Discord Service
- **Language**: TypeScript/Node.js
- **Library**: discord.js
- **Memory**: 512MB
- **Port**: Internal (gateway-based)
- **Cron**: Daily at 00:00 UTC

---

## 🔐 Security Checklist

- [ ] Never commit `.env` files with real tokens
- [ ] Use `.env.railway.example` as template
- [ ] Store tokens securely in Railway environment
- [ ] Don't share bot tokens publicly
- [ ] Don't commit API keys to git
- [ ] Rotate tokens periodically
- [ ] Monitor logs for exposed secrets

---

## 📈 Scaling Guide

If you need higher performance:

```
1 Service
↓
Add memory (512MB → 1GB)
↓
Add replicas (1 → 2)
↓
Add horizontal scaling
↓
Load balance across regions
```

See RAILWAY_DEPLOYMENT.md for details.

---

## 🚨 If Something Goes Wrong

### Option 1: Restart Service
```bash
railway restart
```

### Option 2: Check Logs
```bash
railway logs --tail 50  # Last 50 lines
```

### Option 3: Redeploy
```bash
git push origin main  # Railway auto-redeploys
```

### Option 4: Rollback
- Railway Dashboard → Service → Deployments
- Click previous version → Redeploy

---

## ✨ What's Automated

Railroad handles for you:
✅ Building Node.js app
✅ Installing dependencies
✅ Starting bot processes
✅ Monitoring health
✅ Restarting on crash
✅ Memory management
✅ Zero-downtime deployments

---

## 🎯 Next Steps

1. **Read**: RAILWAY_QUICKSTART.md (5 min)
2. **Get tokens**: Telegram & Discord tokens + API keys
3. **Deploy**: Follow 5-step guide
4. **Test**: `/demo` in both bots
5. **Monitor**: Watch logs for 24h
6. **Share**: Send bot links to users

---

## 📞 Support

- **Railway Docs**: https://docs.railway.app
- **Railway Support**: https://railway.app/support
- **P360 Docs**: See docs/ folder
- **Troubleshooting**: RAILWAY_DEPLOYMENT.md

---

## ✅ Deployment Ready Checklist

- [x] Procfile configured for both services
- [x] package.json has build scripts
- [x] railway.json configured
- [x] Environment template created
- [x] Deployment guide written
- [x] Checklist created
- [x] Scripts automated
- [x] Code pushed to GitHub

**Status**: 🟢 Ready for production deployment

---

## 📅 Timeline

| Step | Time | What to Do |
|------|------|-----------|
| 1 | 5 min | Read RAILWAY_QUICKSTART.md |
| 2 | 5 min | Get tokens from services |
| 3 | 10 min | Create Railway project & set vars |
| 4 | 5 min | Deploy & watch logs |
| 5 | 5 min | Test commands |
| 6 | Real-time | Monitor logs |
| 7 | 24h | Verify cron jobs run |

**Total**: ~35 minutes to production

---

**Version**: 1.0
**Last Updated**: 2026-02-16
**Status**: Production Ready 🚀
