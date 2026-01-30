# p360 Functional Operating Model
## Pain → Solution → Tool-first GTM

---

## 1. p360 Is a Function, Not a Product

p360 is not an app.
p360 is not a dashboard.
p360 is a function.

It takes a **pain** as input
and outputs multiple **solution hypotheses**.

```text
p360(pain) → {solution₁, solution₂, solution₃, ...}
```

Each solution is an independent experiment.

Most will fail.

A few will survive and become infrastructure.

---

## 2. Fixed Target

**Target: Bio-hacker × High-performer**

This target does not change.

They:
- Already track biometric data (Oura, Whoop, Garmin, Apple Watch)
- Make many decisions every day
- Frequently regret decisions made under fatigue or stress
- Are tired of installing new apps
- Are open to tools embedded into existing workflows

I am not optimizing for users.

I am optimizing for **decision moments**.

---

## 3. How I Define the Problem

Users do not say:
- "I need a biometric decision system"
- "I want AI to decide for me"

They say:
- "I don't trust my state today"
- "I make worse calls when I'm tired"
- "I wish something stopped me before I messed this up"

The problem is not _what_ to decide.

The problem is _when_ decisions are made.

---

## 4. What I Will NOT Build

- ❌ Standalone consumer apps
- ❌ Dashboards
- ❌ Habit trackers
- ❌ Productivity coaches
- ❌ Systems that replace human judgment

Apps create friction.

Dashboards create hindsight.

I focus on **interruption and timing**.

---

## 5. What I WILL Build

For each pain, I generate multiple solution hypotheses using:
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

---

## 6. Functional Template

```
## Function: p360(pX)

Input (x):
- pX: [pain statement in user language]

Output (y):
- s1: [solution hypothesis 1]
- s2: [solution hypothesis 2]
- s3: [solution hypothesis 3]
```

This defines the problem space only.

Implementation comes later.

---

## 7. Solution = Independent Execution Unit

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

---

## 8. Tool-first GTM Funnel

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

This is not a marketing funnel.

It is a **behavioral funnel**.

---

## 9. External Data & APIs

If a decision depends on nutrition, stress, or context:
- I will not ask users to open another app
- I will pull data from existing systems

Examples:
- MyFitnessPal API
- Food photo → Vision API → nutrition estimate
- Calendar context
- Message pre-send hooks
- Biometric signals

Data flows to the decision.

Not the other way around.

---

## 10. Operating Rules

- One pain at a time
- Multiple solution hypotheses allowed
- Build the fastest interface first
- Kill aggressively
- Keep survivors as APIs
- Never rebuild the same thing twice

---

## 11. Why This Works in the AI Era

- AI reduces implementation cost to near zero
- Architecture becomes the real bottleneck
- Speed beats polish
- Deletion is cheaper than maintenance

My job is not to write perfect code.

My job is to design the function.

---

## 12. Definition of Success

Success is NOT:
- DAU
- Feature count
- Perfect UX

Success IS:
- One pain
- One tool
- Used repeatedly at the moment of decision
