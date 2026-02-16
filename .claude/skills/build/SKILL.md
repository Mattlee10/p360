---
name: build
description: Build features following P360 standards. Use when implementing new functionality.
argument-hint: [feature name]
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Build Skill

Build features following the P360 operating pipeline and tech stack.

## Pre-Build Checklist

Before writing code, verify:
- [ ] Feature passes Decision Framework (Green Light)
- [ ] Biometric hook is clear
- [ ] CLI/Extension implementation path is defined
- [ ] Nudge mechanism is specified

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind + shadcn/ui |
| Backend | Supabase |
| Primary API | Oura API v2 |

## Code Standards

### Must Have
- Strict TypeScript (no `any`)
- React Query for data fetching
- Error boundaries
- Loading states

### Must Avoid
- Global state
- `useEffect` for data fetching
- Over-engineering
- Features not requested

## Output Structure

For feature `$ARGUMENTS`:

1. **Types first** - Define interfaces
2. **Core logic** - Business logic functions
3. **Components** - React components
4. **Integration** - How it connects to existing code

## Design Guidelines

- Colors: Navy (#3B82F6), Status (Green/Amber/Red), Dark BG (#0F172A)
- Typography: Inter (UI), JetBrains Mono (data)
- Style: Clean, minimal, card-based, dark mode default

## Effective Nudge Pattern

```
BAD:  "Your HRV is 45ms"
GOOD: "Your HRV is 20% below baseline.
       Taking a rest day could prevent 3 days of forced recovery.
       Reschedule your workout?"
```

Always implement nudges, not just data displays.
