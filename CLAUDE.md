---
name: p360
description: Bio-data Driven Decision Support for Bio-hackers & High-performers
version: 2.0
author: P360 Team
---

# P360 Project Skill

## Quick Reference

**One-liner:** Real-time Bio-data Driven Decision Support

**Target:** Bio-hackers × High-performers (English-speaking markets)

**Core Insight:** The problem isn't *what* to decide. The problem is *when* decisions are made.

**Documentation:** See `P360_CORE.md` for full details on philosophy, pain statements, tech stack, and roadmap.

---

## Current Phase: Tool-first GTM

We are in **Phase 1**. This means:
- Default to CLI/Extension implementation
- Ship fast, iterate with early adopters
- Build only what power users need NOW
- No UI polish unless it blocks adoption
- Focus on one killer feature at a time

---

## Decision Framework

When evaluating ANY feature, idea, or implementation:

### ✅ Green Light

- Uses biometric data as primary input
- Solves a real high-performer pain point
- Can be validated as CLI tool in <1 week
- Has obvious embedding path (extension/plugin)
- Nudges better decisions (not just information display)

### ⚠️ Yellow Light

- Biometric connection is indirect
- Requires complex UI for Phase 1
- Takes >2 weeks to build MVP
- Embedding path unclear

### 🛑 Red Light

- No biometric data involved
- Pure information dashboard (no nudge)
- Requires B2C infrastructure first
- Can't work as standalone tool

---

## Output Structure

When working on p360 tasks, structure responses as:

1. **Biometric Hook**: What data drives this?
2. **Tool Implementation**: How does CLI/Extension version work?
3. **Nudge Mechanism**: How does this change behavior?
4. **Embedding Strategy**: Where does this live long-term?
5. **Success Metrics**: How do we know it works?

---

## Prompting Templates

### Starting New Feature

```
Use p360 skill.

I'm building [feature name].

Context: [brief context]
Requirements:
- [req 1]
- [req 2]
- [req 3]

Tech stack: React + TypeScript + Tailwind + Supabase
Design: Navy professional, data-driven

Generate complete code with:
1. Component code (TSX)
2. Types (TypeScript interfaces)
3. Supabase queries
4. Error handling
5. Loading states
6. Mobile responsive

Make it production-ready.
```

### Debugging

```
Use p360 skill.

Bug in [feature/file].

Expected: [what should happen]
Actual: [what happens]
Error: [error message if any]

Code:
[paste relevant code]

Please debug and fix with explanation.
```

### Algorithm/Logic

```
Use p360 skill.

I need an algorithm to [goal].

Inputs:
- HRV: number
- Sleep score: number
- [other inputs]

Output:
- Decision readiness score (0-100)

Requirements:
- Simple, explainable
- No ML (for now)
- Based on research if possible

Generate TypeScript function with tests.
```

### Content Writing

```
Use p360 skill.

Write [type of content] for P360.

Purpose: [purpose]
Audience: Bio-hackers, high-performers
Tone: Professional, data-driven, trustworthy
Length: [length]

Guidelines:
- Focus on outcomes, not features
- Use simple language
- Include data/research if relevant
- No hype or marketing speak
```

---

## Tech Stack (Quick Reference)

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 18 + Vite + TypeScript | Fast, modern |
| Styling | Tailwind + shadcn/ui | Rapid prototyping |
| Backend | Supabase | All-in-one, great DX |
| Primary API | Oura API v2 | Target market leader |
| Hosting | Vercel | Zero config |
| Analytics | PostHog | Product analytics |
| Payments | Stripe | Standard for SaaS |

---

## Design Quick Reference

**Colors:**
- Primary: Navy Blue (#3B82F6)
- Status: Green (good) → Amber (caution) → Red (poor)
- Background: Dark mode first (#0F172A)

**Typography:**
- UI: Inter Variable
- Data/Numbers: JetBrains Mono

**Style:**
- Data-Driven Professional
- Inspiration: Linear, Stripe Dashboard, Superhuman
- Dark mode as default
- Clean, minimal, card-based

---

## Biometric Quick Reference

### HRV Decision Signals

| Condition | Signal |
|-----------|--------|
| <20% below baseline | Rest day needed |
| >10% above baseline | Good for hard work |
| Declining 3+ days | Mandatory rest |

### Sleep Decision Signals

| Condition | Signal |
|-----------|--------|
| Deep <1hr | Avoid physical work |
| REM <1.5hr | Avoid complex cognitive tasks |
| Efficiency <85% | Check sleep hygiene |

### Effective Nudge Pattern

```
❌ BAD:  "Your HRV is 45ms"
✅ GOOD: "Your HRV is 20% below baseline.
         Taking a rest day could prevent 3 days of forced recovery.
         Reschedule your workout?"
```

---

## Anti-Patterns to Avoid

### Code
- ❌ `any` types
- ❌ Global state
- ❌ `useEffect` for data fetching (use React Query)

### Design
- ❌ Playful illustrations
- ❌ Neon colors
- ❌ Cluttered dashboards
- ❌ Animations everywhere

### Product
- ❌ Features no one asked for
- ❌ Dashboard-only (no nudge)
- ❌ Social features too early
- ❌ Complex onboarding in Phase 1

---

## Key Resources

- **Full Documentation:** `P360_CORE.md`
- **Oura API:** https://cloud.ouraring.com/v2/docs
- **Supabase:** https://supabase.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Target Communities:** r/Biohackers, r/QuantifiedSelf

---

## When to Use This Skill

Load this skill for:
- Feature design and prioritization
- Technical architecture decisions
- Building CLI tools or extensions
- Algorithm design for biometric data
- Content writing for bio-hacker audience
- Any "should we build X?" question

---

**Version:** 2.0
**Last Updated:** 2026-01-30
