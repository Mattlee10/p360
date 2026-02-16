---
name: research
description: Research trends, competitors, and opportunities. Use proactively when exploring new ideas or markets.
argument-hint: [topic or question]
allowed-tools: WebSearch, WebFetch, Read, Grep, Glob
---

# Research Skill

When researching for P360, follow the operating pipeline: `p(x) → s(y)`

## Research Process

1. **Define the Question** - What specific insight do we need?
2. **Search Multiple Sources** - Web, Reddit (r/Biohackers, r/QuantifiedSelf), competitor products
3. **Extract S+V+Num Insights** - Simple, Verifiable, Numeric
4. **Assess Applicability** - Does this fit our Decision Framework?

## Output Format

```
## Research: $ARGUMENTS

### Key Finding (Conclusion First)
[One sentence answer]

### Evidence
- [Source 1]: [Specific finding with numbers]
- [Source 2]: [Specific finding with numbers]
- [Source 3]: [Specific finding with numbers]

### P360 Applicability
- Green Light: [Yes/No + why]
- Biometric Hook: [What data could drive this?]
- Tool Implementation: [How would CLI version work?]

### Next Action
[Specific action to take, or "No action - doesn't fit pipeline"]
```

## Decision Framework Check

Before concluding research, verify:
- [ ] Uses biometric data as primary input?
- [ ] Solves real high-performer pain point?
- [ ] Can be validated as CLI tool quickly?
- [ ] Has obvious embedding path?
- [ ] Nudges better decisions (not just displays info)?

If <3 checkmarks: recommend "park this idea"
