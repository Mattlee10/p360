---
name: scout
description: Scout new tools, trends, and opportunities. Use proactively when scanning for innovations.
argument-hint: [topic or source URL]
allowed-tools: WebSearch, WebFetch, Read
---

# Scout Skill

Scan for innovations and assess applicability to P360.

## Scout Process

1. **Discover** - Find new tool/trend/technique
2. **Analyze** - What does it do? How does it work?
3. **Assess** - Does it fit P360 pipeline?
4. **Recommend** - Action or park

## Sources to Check

- **Tech News**: Hacker News, Product Hunt
- **Communities**: r/Biohackers, r/QuantifiedSelf, r/Oura
- **Competitors**: Apps in bio-tracking space
- **Research**: PubMed for HRV/sleep studies
- **AI Tools**: New Claude features, MCP servers, integrations

## Assessment Framework

### Quick Filter
Does this help with: `p(x) → s(y) → tool-first GTM`?

If no → park it.

### Decision Framework Check
- Uses biometric data? [Y/N]
- Solves high-performer pain point? [Y/N]
- Can be CLI tool in <1 week? [Y/N]
- Has embedding path? [Y/N]
- Nudges decisions (not just displays)? [Y/N]

Score: [X/5]
- 4-5: Green Light - implement
- 2-3: Yellow Light - explore more
- 0-1: Red Light - park

## Output Format

```
## Scout Report: $ARGUMENTS

### What Is It?
[One sentence description]

### How It Works
[2-3 bullet points]

### P360 Applicability Score: [X/5]
- Biometric data: [Y/N]
- Pain point: [Y/N]
- CLI possible: [Y/N]
- Embedding path: [Y/N]
- Decision nudge: [Y/N]

### Recommendation
[Implement/Explore/Park]

### If Implement
- Biometric Hook: [What data drives this?]
- Tool Implementation: [CLI version description]
- Nudge Mechanism: [How it changes behavior]
- First Step: [Concrete next action]
```

## Example Scouting Topics

- New Oura API features
- Competitor apps (Whoop, Eight Sleep, Levels)
- HRV analysis techniques
- Sleep optimization research
- AI/agent tools that could enhance P360
