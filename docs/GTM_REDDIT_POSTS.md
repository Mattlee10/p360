# Reddit GTM Posts

## Post 1: r/Biohackers

**Title:** I built a Telegram bot that tells me if I should work out based on my Oura data

**Body:**

Hey everyone,

I've been wearing an Oura Ring for about a year now, and my biggest frustration was always: "I see these numbers... but what should I actually DO with them?"

So I built a simple Telegram bot that answers one question: **Should I work out today?**

**How it works:**
- Connect your Oura Ring
- Send `/workout` (or `/workout basketball` for sport-specific advice)
- Get a clear verdict: 🟢 TRAIN HARD, 🟡 TRAIN LIGHT, or 🔴 REST

**What makes it different:**
- It explains WHY (not just "your HRV is 45ms" but "HRV 15% above baseline - your nervous system is recovered")
- Sport-specific guidance (13 sports: basketball, running, weightlifting, BJJ, etc.)
- Intensity ranges (HR zones, % of 1RM, RPE)
- Actionable recommendations, not just data

**Example output:**
```
🟢 TRAIN HARD

Readiness 79 • HRV +14% • Sleep 73

📋 Why:
→ Readiness 79 - good
→ HRV 14% above baseline
→ Sleep 73 - adequate

🏀 Basketball:
Great day for full-court games
→ Go all out on fast breaks
→ Full-intensity scrimmages OK
```

**Try it:** @p360e_bot on Telegram (send `/demo basketball` to test without connecting Oura)

Would love feedback from fellow biohackers. What other decisions would you want your wearable data to help with?

---

## Post 2: r/ouraring

**Title:** Made a bot that turns Oura data into workout decisions (free, open source)

**Body:**

Fellow Oura users,

Anyone else feel like the Oura app shows you data but doesn't tell you what to DO with it?

I built a Telegram bot that solves this. It looks at your:
- Readiness Score
- HRV Balance (vs your baseline)
- Sleep Score

And gives you a simple verdict: Train Hard, Train Light, or Rest.

**The best part:** It's sport-specific. Tell it you're planning to play basketball, and it'll say things like:
- "Great day for full-court games"
- "Skip fast breaks today, stick to shooting drills"
- "Rest day - high injury risk if you play tired"

**Try it:** @p360e_bot on Telegram

Send `/demo` to test with random data, or `/connect` to link your real Oura data.

Currently supports 13 sports: basketball, running, cycling, weightlifting, CrossFit, swimming, yoga, soccer, tennis, golf, hiking, climbing, martial arts.

What sports should I add next?

---

## Post 3: r/QuantifiedSelf

**Title:** From data to decisions: A bot that turns HRV/sleep data into actionable workout guidance

**Body:**

The quantified self community talks a lot about collecting data. But the real challenge is: **what do you DO with it?**

I built a tool that bridges this gap for workout decisions. It takes your Oura Ring data and outputs:

1. **A clear verdict** (Train Hard / Train Light / Rest)
2. **The reasoning** (why this verdict based on your specific numbers)
3. **Intensity guidelines** (HR zones, weight percentages, RPE)
4. **Sport-specific advice** (if you tell it what you're planning to do)

The algorithm is simple and transparent:
- Readiness ≥70 + HRV at/above baseline → Train Hard
- Readiness 50-70 or HRV slightly below → Train Light
- Below those thresholds → Rest

No black box ML. Just clear rules based on recovery science.

**Try it:** @p360e_bot on Telegram

Curious what other "data → decision" tools you all have built or would want to see?

---

## Post 4: r/fitness (if allowed)

**Title:** Free tool: Should I work out today? (uses Oura Ring data)

**Body:**

Built a simple Telegram bot for anyone with an Oura Ring who wants to know if they should train hard, go easy, or rest.

Send `/workout` → get a verdict based on your HRV, readiness, and sleep.

Send `/workout running` → get running-specific advice (easy run vs tempo vs rest).

Works with 13 sports. Free. No account needed.

@p360e_bot on Telegram

---

## Posting Strategy

**Order:**
1. r/ouraring (most targeted audience)
2. r/Biohackers (larger but relevant)
3. r/QuantifiedSelf (interested in data→decision)

**Timing:**
- Post on Tuesday-Thursday
- 9-11 AM EST (peak Reddit activity)
- Space posts 2-3 days apart

**Engagement:**
- Reply to EVERY comment within 1 hour
- Ask follow-up questions
- Note feature requests for future updates
- DM power users who seem interested

**Rules:**
- Don't spam multiple subreddits same day
- Check each subreddit's self-promotion rules
- Be genuinely helpful, not salesy
- Share the "why" and story, not just features
