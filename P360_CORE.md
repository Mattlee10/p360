# P360 Core Documentation

> Real-time Bio-data Driven Decision Support for Bio-hackers & High-performers
>
> Version: 2.0 | Last Updated: 2026-01-30

---

## Table of Contents

1. [Vision & Philosophy](#1-vision--philosophy)
2. [Target Users](#2-target-users)
3. [Pain Statements](#3-pain-statements)
4. [Problem & Solution](#4-problem--solution)
5. [Functional Model](#5-functional-model)
6. [Technical Stack](#6-technical-stack)
7. [Design System](#7-design-system)
8. [Embedding Strategy](#8-embedding-strategy)
9. [Biometric Domain Knowledge](#9-biometric-domain-knowledge)
10. [Roadmap & Metrics](#10-roadmap--metrics)

---

## 1. Vision & Philosophy

### Core Belief

The future is not about building full apps.

The future is about:
- APIs
- Extensions
- Plugins
- OS-level hooks
- Agents that act at the moment of decision

**Apps are destinations. We want to be infrastructure.**

### p360 Is a Function, Not a Product

p360 is not an app. p360 is not a dashboard. p360 is a function.

It takes a **pain** as input and outputs multiple **solution hypotheses**.

```
p360(pain) → {solution₁, solution₂, solution₃, ...}
```

Each solution is an independent experiment. Most will fail. A few will survive and become infrastructure.

### What We Will NOT Build

- ❌ Standalone consumer apps
- ❌ Dashboards
- ❌ Habit trackers
- ❌ Productivity coaches
- ❌ Systems that replace human judgment

Apps create friction. Dashboards create hindsight. We focus on **interruption and timing**.

### What We WILL Build

For each pain, we generate multiple solution hypotheses using:
- CLI tools
- Browser extensions
- OS-level widgets / menu bar apps
- Messaging bots
- APIs embedded into other tools
- Agent-driven workflows

Each solution must:
- Intervene _before_ a bad decision
- Require minimal user effort
- Live where the decision already happens
- Be disposable if it doesn't work

### Operating Rules

- One pain at a time
- Multiple solution hypotheses allowed
- Build the fastest interface first
- Kill aggressively
- Keep survivors as APIs
- Never rebuild the same thing twice

### Why This Works in the AI Era

- AI reduces implementation cost to near zero
- Architecture becomes the real bottleneck
- Speed beats polish
- Deletion is cheaper than maintenance

My job is not to write perfect code. My job is to design the function.

### Definition of Success

Success is NOT: DAU, Feature count, Perfect UX

Success IS: One pain → One tool → Used repeatedly at the moment of decision

---

## 2. Target Users

### Primary: Bio-hacker × High-performer

```
Profile:
- Age: 25-45
- Income: $75K+/year
- Location: US, UK, Canada, Australia
- Devices: Oura Ring, Whoop, Apple Watch
- Behavior: Tracks everything, optimizes constantly
- Values: Data > intuition, Science > trends
- Pain: "I know I should track more, but what do I do with the data?"
- Goal: Peak performance in work & life

Psychographics:
- Reads: Huberman Lab, Tim Ferriss, Bryan Johnson
- Uses: Superhuman, Linear, Arc Browser, Notion
- Communities: r/Biohackers, r/QuantifiedSelf
- Willing to pay: $10-30/month for real value

Current behavior:
- Checks Oura app daily
- Has spreadsheets of data
- Doesn't know when to make important decisions
- Sometimes makes bad decisions when tired/stressed
```

### Secondary Targets (Phase 2+)

1. **ADHD individuals** - decision timing is critical
2. **Day traders** - emotional control needed
3. **Executives** - high-stakes decision makers

### Target Optimization

We are not optimizing for users. We are optimizing for **decision moments**.

---

## 3. Pain Statements

> Community-sourced pain statements from Reddit, forums, and comments.
> Goal: Understand how users *actually* describe their problems.

### Important Note

Users do NOT say:
- "I need a biometric decision engine"
- "I want AI to tell me what to decide"

Users DO say:
- "I don't trust my state today"
- "I made a bad call when I was tired"
- "I can't tell if this is real fatigue or just laziness"

### Pain 1: Data vs Intuition Conflict

> "I have the data, but I don't know which signal to trust."

**Raw Community Statements:**
- "My HRV is low but I feel fine. Should I still train?"
- "Oura says I'm not recovered, but subjectively I feel okay."
- "I track everything, yet I still don't know when to push or pull back."
- "At some point all this data just makes me second-guess myself."

**Hidden Pain:** Users feel *less confident*, not more. Data creates hesitation instead of clarity.

**Translation:** Decision timing ambiguity → No authoritative "go / no-go" moment

### Pain 2: Regret After the Fact

> "I only realize it was a bad decision *after* it's done."

**Raw Community Statements:**
- "Sent an email last night while stressed. Definitely shouldn't have."
- "Why do I always make worse decisions when I'm tired?"
- "Low sleep days = impulsive choices for me."
- "I wish there was something that stopped me before hitting send."

**Hidden Pain:** Emotional + reputational damage. Repeated mistakes despite high self-awareness.

**Translation:** Pre-decision intervention missing → Regret prevention > productivity optimization

### Pain 3: Fatigue vs Laziness Anxiety

> "I don't want to use tiredness as an excuse."

**Raw Community Statements:**
- "How do you tell real fatigue from just lack of discipline?"
- "Am I burned out or just unmotivated?"
- "I'm scared of listening to my body too much."
- "If I rest every time I feel off, I'll get soft."

**Hidden Pain:** Identity conflict (discipline vs recovery). Fear of self-deception.

**Translation:** Need for objective permission to rest or wait → External validator of internal state

### Pain 4: Bad Timing of Important Decisions

> "Important decisions always seem to happen at the worst time."

**Raw Community Statements:**
- "Big calls always come when I'm exhausted."
- "Why do I schedule important meetings on low-energy days?"
- "I make my worst calls under stress."
- "I know timing matters, but I don't know how to manage it."

**Hidden Pain:** Calendar ≠ capacity. No awareness of decision quality windows.

**Translation:** Decision readiness ≠ availability → Calendar-level embedding opportunity

### Pain 5: Over-Tracking Without Action

> "I collect everything, but nothing changes."

**Raw Community Statements:**
- "I have years of HRV data. Not sure what I've actually changed."
- "I love the data, but it doesn't tell me what to do today."
- "Dashboards are cool, but I still make the same mistakes."
- "Awareness alone doesn't seem to fix anything."

**Hidden Pain:** Data fatigue. Diminishing returns from tracking.

**Translation:** Awareness ceiling reached → Actionable nudges required

### What Users Are Actually Asking For

Not: Better charts, More metrics, AI explanations

Yes:
- "Should I do this *now*?"
- "Is today a bad day to decide?"
- "Can I trust myself in this state?"
- "Can something stop me before I mess this up again?"

### Canonical Pain Sentences (For Copy)

- "I don't know if this tired feeling is a real signal or just in my head."
- "I keep making bad calls when I'm exhausted."
- "I wish something stopped me before I hit send."
- "I track everything, but I still don't know when to decide."
- "The problem isn't the decision — it's the timing."

---

## 4. Problem & Solution

### Problem Statement

**"High-performers have all the biometric data, but don't know what to DO with it in the moment."**

Specific pain points:
- Makes impulse purchases when HRV is low
- Sends angry emails when stressed
- Schedules important meetings at wrong times
- Can't tell if tired feeling is "real" or just mental

### Our Solution

**Real-time decision support powered by biometric data.**

Key differentiation:
1. **Real-time** - Not weekly reports, but instant feedback
2. **Actionable** - Not just "your HRV is 45", but "Wait 3 hours to decide"
3. **Embeddable** - Can integrate into other tools (calendar, email, shopping)
4. **Privacy-first** - Your data stays yours, never sold

### Value Proposition

"Your body knows when you're ready for important decisions. We just translate the signal."

### Product Alignment Check

p360 is aligned IF it:
- Intervenes *before* decisions
- Focuses on timing, not content
- Reduces regret, not just improves metrics
- Acts as a gate, not a coach
- Preserves user agency

p360 is misaligned IF it:
- Becomes another dashboard
- Explains data without action
- Tries to replace user judgment
- Optimizes productivity at all costs

---

## 5. Functional Model

### Functional Template

```
## Function: p360(pX)

Input (x):
- pX: [pain statement in user language]

Output (y):
- s1: [solution hypothesis 1]
- s2: [solution hypothesis 2]
- s3: [solution hypothesis 3]
```

This defines the problem space only. Implementation comes later.

### Solution = Independent Execution Unit

Each solution is evaluated independently.

```
### y1 = s1: [Solution Name]

Tool:
- Interface: CLI / Extension / OS-level / Bot / API
- Entry point: where the decision happens

Tool-first GTM Funnel:
- Distribution:
- Trigger:
- Activation signal:
- Retention signal:
- Monetization path:

Status:
- Hypothesis / Active / Killed
```

Rules:
- Solutions do not depend on each other
- Success or failure is judged per solution
- One pain can have multiple active solutions

### Tool-first GTM Funnel

```
Pain Recognition
   ↓
Single-purpose Tool
   ↓
Decision Moment Intervention
   ↓
Repeated Usage
   ↓
Trust Accumulation
   ↓
API / Infrastructure Adoption
```

This is not a marketing funnel. It is a **behavioral funnel**.

### External Data & APIs

If a decision depends on nutrition, stress, or context:
- We will not ask users to open another app
- We will pull data from existing systems

Examples:
- MyFitnessPal API
- Food photo → Vision API → nutrition estimate
- Calendar context
- Message pre-send hooks
- Biometric signals

Data flows to the decision. Not the other way around.

---

## 6. Technical Stack

### Frontend

```
Framework: React 18+ with Vite
  - Why: Fast, modern, great ecosystem

Styling: Tailwind CSS + shadcn/ui

Language: TypeScript

State Management:
  - React Query (server state)
  - Zustand (client state, only if needed)

Routing: React Router v6
```

### Backend & Database

```
Platform: Supabase
  - Database: PostgreSQL
  - Auth: Built-in OAuth (Oura, Google, etc)
  - Realtime: WebSocket subscriptions
  - Edge Functions: Serverless functions
  - Why: All-in-one, great DX, generous free tier
```

### APIs & Integrations

```
Primary: Oura API v2
  - Most popular in target market
  - Clean API, good docs
  - OAuth 2.0

Phase 2: Whoop API, Apple Health (HealthKit), Garmin Connect

Embedding targets (Phase 3):
  - Google Calendar
  - Gmail
  - Notion
  - Slack
```

### Infrastructure

```
Hosting: Vercel
Analytics: PostHog or Plausible
Error Tracking: Sentry
Payments: Stripe
```

### Development Tools

```
Package Manager: pnpm
Version Control: Git + GitHub
Code Quality: ESLint + Prettier + Husky
Testing: Vitest (unit), Playwright (E2E)
```

### Database Schema (Core Tables)

```sql
-- Oura connections
CREATE TABLE oura_tokens (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamp NOT NULL,
  UNIQUE(user_id)
);

-- Biometric data cache
CREATE TABLE biometric_data (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  hrv integer,
  sleep_score integer,
  resting_hr integer,
  readiness_score integer,
  UNIQUE(user_id, date)
);

-- Decision logs
CREATE TABLE decisions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  decision_type text,
  body_score integer NOT NULL,
  action_taken text CHECK (action_taken IN ('proceed', 'wait', 'skip')),
  outcome text,
  notes text,
  created_at timestamp DEFAULT now()
);
```

---

## 7. Design System

### Visual Identity: Navy Professional

**Color Palette:**
```css
/* Primary - Navy Blue */
--primary-500: #3B82F6;  /* Main brand */
--primary-600: #2563EB;  /* Hover */
--primary-700: #1E40AF;  /* Active */

/* Status Colors (Biometric Indicators) */
--status-excellent: #10B981; /* Green */
--status-good: #3B82F6;      /* Blue */
--status-caution: #F59E0B;   /* Amber */
--status-poor: #EF4444;      /* Red */

/* Dark Mode First */
--bg-dark: #0F172A;
--bg-dark-elevated: #1E293B;
```

**Typography:**
```css
font-family: 'Inter Variable', system-ui, sans-serif;
/* Monospace for data: JetBrains Mono */
```

**Design Aesthetic:**
```
Style: Data-Driven Professional
Inspiration: Linear + Stripe Dashboard + Superhuman

Characteristics:
- Clean, uncluttered layouts
- Generous whitespace
- Card-based information architecture
- Smooth, purposeful animations
- Dark mode as default

Avoid:
- Playful illustrations
- Bright neon colors
- Heavy gradients
- Cluttered dashboards
```

---

## 8. Embedding Strategy

### Philosophy

> "Don't make users come to us. Go where they already are."

Principles:
1. Embed in existing workflows (zero friction)
2. Leverage 40-year-old interfaces (CLI, shortcuts)
3. Multi-channel distribution (reduce platform risk)
4. API-first architecture (all channels share core)
5. Fast validation (1-2 weeks per channel)

### Priority Channels

#### Tier 1: Build First (Week 1-2)

| Channel | Build Time | Target Fit | Notes |
|---------|------------|------------|-------|
| Chrome Extension | 3-4 days | ⭐⭐⭐ | Gmail warning = immediate value |
| Telegram Bot | 1-2 days | ⭐⭐ | Fastest MVP, first $ |
| p360-cli | 2-3 days | ⭐⭐⭐ | Developer credibility |

#### Tier 2: After Validation (Week 3-6)

| Channel | Build Time | Target Fit | Notes |
|---------|------------|------------|-------|
| Raycast Extension | 1-2 days | ⭐⭐⭐ | Perfect overlap with power users |
| Slack Bot | 3-4 days | ⭐⭐ | Team use case, viral potential |
| macOS Menu Bar | 1-2 weeks | ⭐⭐⭐ | Native feel, always visible |
| Obsidian Plugin | 2-3 days | ⭐⭐ | Data integration |

### Monetization Models by Channel

| Channel | Model | Price |
|---------|-------|-------|
| CLI/Extensions | API subscription | $4.99-9.99/mo |
| Telegram Bot | Freemium (5 msgs/day free) | $7.99/mo |
| Slack Bot | Team plan | $19.99/mo |
| macOS App | One-time or subscription | $9.99 or $7.99/mo |

### Go-to-Market Channels

1. **Product Hunt** - Launch on Thursday, aim for #1
2. **Hacker News** - Show HN with technical story
3. **Reddit** - r/Biohackers, r/macapps, r/productivity
4. **Twitter/X** - Launch thread, daily tips

---

## 9. Biometric Domain Knowledge

### Key Metrics & Interpretation

#### Heart Rate Variability (HRV)

- **What it measures**: Autonomic nervous system balance
- **Key metrics**: RMSSD, SDNN, pNN50
- **Decision signals**:
  - <20% below baseline → reduce intensity
  - >10% above baseline → opportunity for hard work
  - Consistent decline over 3+ days → mandatory rest

#### Sleep Metrics

- **Key stages**: Deep, REM, Light, Awake
- **Optimal ratios**: Deep 13-23%, REM 20-25%, Efficiency >85%
- **Decision signals**:
  - <1hr deep sleep → avoid heavy physical work
  - <1.5hr REM → avoid complex cognitive tasks

#### Resting Heart Rate (RHR)

- 5-10 bpm above baseline = stress/overtraining
- Rising RHR over days = cumulative fatigue

### Effective Nudge Patterns

**Pattern 1: Data + Impact + Action**
```
❌ "Your HRV is 45ms"
✅ "Your HRV is 20% below baseline. Taking a rest day could prevent 3 days of forced recovery. Reschedule your workout?"
```

**Pattern 2: Opportunity Framing**
```
❌ "You slept well"
✅ "Peak recovery detected. Next 4 hours are ideal for your quarterly strategy session."
```

**Pattern 3: Counterfactual Projection**
```
"If you push through today's workout despite low HRV:
- 60% chance of 3-day recovery penalty
- 40% chance of productive session

If you take active recovery:
- 90% chance of strong performance tomorrow
- 0% injury risk"
```

### Red Flags (Immediate Attention)

- HRV < 50% of baseline for 2+ consecutive days
- RHR > 15 bpm above baseline
- Sleep efficiency < 70% for 3+ nights
- Body temp deviation > 0.5°C

---

## 10. Roadmap & Metrics

### Phase 1: MVP v0.1 (Week 4-8) - Proof of Concept

**Must Have:**
- [ ] User Authentication (Email + Google OAuth)
- [ ] Oura Connection (OAuth flow)
- [ ] Dashboard (HRV, Sleep score, Decision readiness)
- [ ] Decision Algorithm v1 (threshold-based)
- [ ] Basic Settings

**Success Metrics:**
- 5 beta users can connect Oura
- Works on mobile web

### Phase 2: v0.2 (Week 9-12) - Beta Launch

**Add:**
- [ ] Historical View (7-day HRV trend)
- [ ] Decision Log
- [ ] Notifications
- [ ] Improved Algorithm (multi-factor)

**Success Metrics:**
- 30 sign-ups, 20 active weekly
- 7-day retention: 50%+

### Phase 3: v0.3 (Month 4-6) - Public Launch

**Add:**
- [ ] Freemium Model ($9.99/mo Pro)
- [ ] Product Hunt Launch
- [ ] Calendar Integration (Phase 1)
- [ ] Chrome Extension (Phase 1)

**Success Metrics:**
- 500 sign-ups
- 100 active users
- 30 paying users
- $300 MRR

### Explicitly NOT Building (Yet)

- ❌ Social features
- ❌ Community/forum
- ❌ Meditation/breathing exercises
- ❌ Food/supplement tracking
- ❌ Fitness tracking
- ❌ AI chatbot

---

## Appendix: Decision Framework

### ✅ Green Light If:

- Uses biometric data as primary input
- Solves a real high-performer pain point
- Can be validated as CLI tool quickly
- Has obvious embedding path
- Nudges better decisions (not just information)

### ⚠️ Yellow Light If:

- Biometric connection is indirect
- Requires complex UI for Phase 1
- Takes >2 weeks to build MVP
- Embedding path unclear

### 🛑 Red Light If:

- No biometric data involved
- Pure information dashboard (no nudge)
- Requires B2C infrastructure first
- Can't work as standalone tool

---

*Document consolidated from: p360_functional_model.md, p360_operating_philosophy.md, p360_pain_statements.md, and CLAUDE.md*

*Generated: 2026-01-30*
