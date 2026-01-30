---
name: p360-context
description: Product context and decision framework for p360 - a biometric-based decision-making solution for bio-hackers and high-performers. Use this skill for ALL p360 project work including feature design, implementation planning, architecture decisions, GTM strategy, and any task related to building the biometric decision engine.
---

# p360 Product Context

## Mission

Build a biometric-based decision engine that helps bio-hackers and high-performers make better decisions using their body's data.

## Target Users

**Primary**: Bio-hackers × High-performers
- People who already track biometrics (Oura, Whoop, Apple Watch, etc.)
- Decision-makers who want data-driven optimization
- Early adopters comfortable with experimental tools

## Core Strategy

### 1. Tool-first GTM (Phase 1: Now)
- Start with CLI/terminal tools for power users
- Fast iteration, immediate value
- Build in public, gather early adopters
- Focus: One killer use case that works perfectly

### 2. B2C Expansion (Phase 2: After validation)
- Add consumer-friendly UI layer
- Broaden appeal beyond developers
- Scale distribution

### 3. SW Embedding (Phase 3: Platform play)
- Browser extensions
- IDE plugins
- OS-level integration
- Terminal/shell embedding

## Product Principles

### Always Consider These in Order:

1. **Biometric Integration First**
   - Every feature MUST connect to measurable biometric data
   - If it can't be measured, it can't be in p360
   - Valid sources: HRV, sleep stages, activity, cognitive load indicators, stress markers

2. **Tool-first Validation**
   - Can this be built as a CLI tool in < 1 week?
   - If not, break it down further
   - Launch fast, iterate with users

3. **UX Through Nudge**
   - Don't just present data - nudge behavior change
   - Use biometric feedback loops
   - Design for "aha moments" not dashboards

4. **Embedding Path**
   - Every feature should have a clear embedding story
   - How does this become a plugin/extension?
   - What's the API surface?

## Decision Framework

When evaluating ANY feature, idea, or implementation:

### ✅ Green Light If:
- Uses biometric data as primary input
- Solves a real high-performer pain point
- Can be validated as CLI tool quickly
- Has obvious embedding path (extension/plugin)
- Nudges better decisions (not just information display)

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

## Technical Stack Preferences

### Phase 1 (Tool-first):
- **CLI**: Python (rich/typer for UX)
- **Data**: SQLite for local storage
- **APIs**: Direct integration with Oura/Whoop/Apple Health
- **Deployment**: pip install, homebrew

### Phase 2 (B2C):
- **Frontend**: Keep it minimal (consider Figma-like simple UI)
- **Backend**: Keep stateless where possible
- **Auth**: OAuth with biometric providers

### Phase 3 (Embedding):
- **Extensions**: Manifest V3 for Chrome/Edge
- **Plugins**: VSCode extension API
- **CLI**: Shell integration (zsh/bash)

## Output Patterns

When working on p360 tasks, structure responses as:

1. **Biometric Hook**: What data drives this?
2. **Tool Implementation**: How does CLI version work?
3. **Nudge Mechanism**: How does this change behavior?
4. **Embedding Strategy**: Where does this live long-term?
5. **Success Metrics**: How do we know it works?

## Anti-Patterns to Avoid

- ❌ Building dashboards that just show biometric data
- ❌ Features that work without biometric input
- ❌ Complex onboarding flows in Phase 1
- ❌ Features that can't be tools first
- ❌ Generic productivity app features
- ❌ Anything that requires B2C infrastructure before validation

## Current Phase: Tool-first

We are in **Phase 1: Tool-first GTM**. This means:

- Every conversation should default to CLI implementation
- Ship fast, iterate with early adopters
- Build only what power users need NOW
- No UI polish unless it blocks adoption
- Focus on one killer feature at a time

## Success Looks Like

**Month 1-3**: Power users can't live without one p360 CLI tool
**Month 4-6**: Community building plugins on top
**Month 7-12**: Non-developers asking for "the biometric thing"

## Key Resources

- Biometric APIs: Oura Cloud API, Whoop API, Apple HealthKit
- Nudge Theory: Thaler & Sunstein behavioral economics
- Tool-first examples: oh-my-opencode, pencil, clawdbot

## When to Use This Skill

This skill should be loaded for:
- Feature design and prioritization
- Technical architecture decisions  
- GTM strategy discussions
- User feedback interpretation
- Scope definition and MVP planning
- Any question about "should we build X?"
