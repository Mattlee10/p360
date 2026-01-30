# S1-E GTM Materials

> 운동 Go/No-Go 솔루션 런칭 자료

---

## 1. Reddit Posts

### r/Biohackers Post

**Title:** I built a tool that finally answers "should I work out today?" using your Oura data

**Body:**

```
Like many of you, I've been staring at my Oura readiness score wondering "okay, but what does 58 actually MEAN for my workout?"

So I built something to solve this.

**The Problem:**
- Oura says "Readiness: 58"
- Me: "...so do I go to the gym or not?"

**The Solution:**
A simple tool that takes your Oura data and gives you a clear verdict:

🟢 TRAIN HARD - Go for PRs, HIIT, heavy lifting
🟡 TRAIN LIGHT - Zone 2 only, no intensity
🔴 REST DAY - Walking and stretching only

Plus specific recommendations like "Max HR 140 bpm" and risk warnings like "Pushing hard today = 60% chance of 3-day forced recovery."

**How it works:**
- Pulls your Readiness, HRV Balance, and Sleep Score
- Weighs them against thresholds backed by recovery research
- Gives you a verdict + specific do's and don'ts

**Try it:**
- Telegram Bot: @p360bot (just /demo to try without Oura)
- CLI (for devs): `npm install -g p360-cli && p360 workout --demo`

It's free. I just want to know if this actually helps people.

What do you think? Would you use something like this?
```

---

### r/ouraring Post

**Title:** Finally built the "what should I do today" feature Oura is missing

**Body:**

```
Anyone else frustrated that Oura gives you numbers but not actions?

"Your readiness is 62" - okay but should I:
- Skip my CrossFit class?
- Go but take it easy?
- Push through anyway?

I built a tool that answers this. It reads your Oura data and tells you:

🟢 TRAIN HARD
🟡 TRAIN LIGHT (with max HR recommendation)
�� REST DAY

Example output:

```
🟡 TRAIN LIGHT

Move your body, but don't push it

Readiness: 58 (Fair)
HRV: -5% vs baseline
Sleep: 65 (Fair)

✓ Do this:
  → Zone 2 cardio (easy pace)
  → Light weights, more reps
  → Yoga or stretching

✗ Skip:
  → Heavy lifting
  → HIIT
  → PRs

💓 Max HR: 140 bpm

Tomorrow: Better if you rest today
```

**Try it:**
- Telegram: @p360bot (send /demo)
- CLI: `npm i -g p360-cli && p360 workout --demo`

Free to use. Curious if others find this useful or if I'm the only one who needed this 😅
```

---

### r/QuantifiedSelf Post

**Title:** Turning HRV numbers into actionable workout decisions - my approach

**Body:**

```
I've been tracking HRV for 2 years and the #1 problem I kept hitting:

> "My HRV was 45 yesterday and 38 today... now what?"

The data is there. The interpretation isn't.

So I built a decision layer on top of Oura data. Here's the logic:

**Inputs:**
- Readiness Score (primary signal)
- HRV Balance (trend vs your baseline)
- Sleep Score (recovery indicator)

**Algorithm:**
1. Base score from Readiness (or Sleep as fallback)
2. HRV Balance modifier (±5 points based on trend)
3. Threshold-based verdict:
   - 70+ with normal/high HRV → TRAIN HARD
   - 50-69 or 40+ with stable HRV → TRAIN LIGHT
   - Below 50 with declining HRV → REST

**Output:**
Not just a number, but:
- Clear verdict (train hard/light/rest)
- Specific activities to do and avoid
- Max HR recommendation when relevant
- Recovery risk projection

**The key insight:**
It's not about the absolute number. It's about the combination of signals and what they mean for TODAY's decision.

Open source CLI: github.com/[repo]
Or try via Telegram: @p360bot

Would love feedback from fellow QS folks on the algorithm. What signals am I missing?
```

---

## 2. Hacker News Post

**Title:** Show HN: CLI that tells you if you should work out today (Oura Ring data)

**Body:**

```
I built a CLI tool that connects to your Oura Ring and tells you whether to train hard, train light, or rest today.

The problem: Oura shows "Readiness: 58" but doesn't tell you what to DO with that information.

The solution: A simple algorithm that weighs Readiness, HRV Balance, and Sleep Score to give you:

- A clear verdict (🟢 TRAIN HARD / 🟡 TRAIN LIGHT / 🔴 REST)
- Specific activity recommendations
- Max heart rate when relevant
- Recovery risk projection

Example output:

  🟡 TRAIN LIGHT

  Readiness: 58 (Fair)
  HRV: -5% vs baseline

  ✓ Recommended:
    • Zone 2 cardio
    • Light weights
    • Yoga

  ✗ Avoid:
    • Heavy lifting
    • HIIT
    • PRs

  💓 Max HR: 140 bpm

  Risk: Pushing hard risks 2-3 day setback

Install:
  npm install -g p360-cli
  p360 login --token YOUR_OURA_TOKEN
  p360 workout

Or try with demo data:
  p360 workout --demo

Also available as a Telegram bot: @p360bot

Tech: TypeScript, Oura API v2. Planning to open source soon.

The algorithm is intentionally simple (threshold-based, no ML). Happy to discuss the logic and take feedback.
```

---

## 3. Twitter/X Thread

**Tweet 1:**
```
I got tired of staring at my Oura readiness score wondering "but should I work out?"

So I built a tool that actually answers the question.

Here's what it does 🧵
```

**Tweet 2:**
```
The problem:

Oura: "Your readiness is 58"
Me: "...so what?"

- Do I skip the gym?
- Go but take it easy?
- Push through?

The app doesn't tell you. So I built something that does.
```

**Tweet 3:**
```
It gives you one of three verdicts:

🟢 TRAIN HARD - PRs, HIIT, go all out
🟡 TRAIN LIGHT - Zone 2 only, max HR 140
🔴 REST DAY - Walking and stretching only

Plus specific do's and don'ts for each.
```

**Tweet 4:**
```
Example output:

🟡 TRAIN LIGHT

Readiness 58 • HRV -5% • Sleep 65

✓ Zone 2 cardio, light weights, yoga
✗ Heavy lifting, HIIT, PRs

Max HR: 140 bpm
Risk: Hard training = 2-3 day setback
```

**Tweet 5:**
```
The logic is simple:

1. Readiness score as primary signal
2. HRV trend as modifier
3. Sleep as tiebreaker

No ML. Just thresholds based on recovery research.

(Happy to share the algorithm if anyone wants to poke holes in it)
```

**Tweet 6:**
```
Try it:

📱 Telegram: @p360bot (send /demo)
💻 CLI: npm i -g p360-cli && p360 workout --demo

Free. Just want to know if this helps people.

What other "data → action" problems do you want solved?
```

---

## 4. Product Hunt

**Tagline:** Your body's workout advisor - know when to push and when to rest

**Description:**

```
P360 turns your Oura Ring data into clear workout decisions.

THE PROBLEM
Your Oura app shows "Readiness: 58" but doesn't tell you what to DO. Should you skip the gym? Go easy? Push through?

THE SOLUTION
P360 analyzes your Readiness, HRV, and Sleep to give you:

🟢 TRAIN HARD - Go for PRs, HIIT, heavy lifting
🟡 TRAIN LIGHT - Zone 2 only, with max HR recommendation
🔴 REST DAY - Walking and stretching only

Plus specific activities to do and avoid, and recovery risk projections.

HOW IT WORKS
1. Connect your Oura Ring (Personal Access Token)
2. Ask "should I work out today?"
3. Get a clear verdict with actionable recommendations

AVAILABLE ON
• Telegram Bot (@p360bot)
• Command Line (npm install -g p360-cli)

Free to use. Built by a frustrated Oura user who got tired of guessing.
```

**First Comment (Maker):**

```
Hey PH! 👋

I built P360 because I kept staring at my Oura readiness score wondering what to actually DO with it.

58 readiness - should I work out or not? The app doesn't say.

So I built a simple decision layer:
- Takes your Readiness, HRV Balance, and Sleep Score
- Runs them through threshold-based logic
- Gives you a clear verdict + specific recommendations

No AI hype. No complex ML. Just clear rules based on recovery research.

Try it without Oura:
• Telegram: @p360bot → send /demo
• CLI: p360 workout --demo

Would love your feedback:
1. Is the output actionable enough?
2. What other biometric → action problems should I tackle next?

Thanks for checking it out! 🙏
```

---

## 5. Launch Checklist

### Pre-Launch (Day -1)
- [ ] Deploy Telegram bot to Railway/Fly.io
- [ ] Publish CLI to npm
- [ ] Test both with real Oura token
- [ ] Create @p360bot Telegram username
- [ ] Prepare all post drafts

### Launch Day (Day 0)
- [ ] 9 AM: Post to r/Biohackers
- [ ] 10 AM: Post to r/ouraring
- [ ] 11 AM: Post to r/QuantifiedSelf
- [ ] 12 PM: Twitter thread
- [ ] Monitor and respond to comments

### Day 1
- [ ] Hacker News (Show HN) - morning EST
- [ ] Continue Reddit engagement

### Day 2
- [ ] Product Hunt launch
- [ ] Cross-post results to Twitter

### Week 1 Metrics to Track
- [ ] Telegram bot users
- [ ] CLI npm downloads
- [ ] Reddit upvotes/comments
- [ ] HN points
- [ ] Direct feedback/feature requests

---

## 6. Response Templates

### "How is this different from just looking at Oura?"

```
Great question! Oura tells you your readiness score (e.g., 58), but it doesn't tell you what to DO with that information.

P360 translates that number into action:
- Should you train hard or light?
- What's your max HR today?
- What activities to avoid?
- What's the risk if you push it?

It's the decision layer Oura is missing.
```

### "What's the algorithm?"

```
Intentionally simple:

1. Primary signal: Oura Readiness Score
2. Modifier: HRV Balance (±5 points based on trend vs baseline)
3. Fallback: Sleep Score if Readiness unavailable

Thresholds:
- 70+ with stable/high HRV → TRAIN HARD
- 50-69 (or 40+ with stable HRV) → TRAIN LIGHT
- Below 50 with declining HRV → REST

No ML, no black box. Just clear rules you can understand and override if needed.
```

### "Will you add X integration?"

```
What integration are you thinking? Current priorities:

Coming soon:
- Apple Watch (direct HRV reading)
- Whoop integration
- Garmin integration

On the radar:
- Calendar integration (auto-suggest rest days)
- Strava (post-workout validation)

Let me know what would be most useful for you!
```

### "Is it free? What's the catch?"

```
Free right now, no catch. I built this to solve my own problem.

If it gets traction, I might add a Pro tier ($5-8/mo) for things like:
- Historical trends
- Weekly planning
- Custom thresholds

But the core "should I work out today?" will always be free.
```

---

*Last Updated: 2026-01-30*
