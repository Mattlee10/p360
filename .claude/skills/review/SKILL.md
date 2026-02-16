---
name: review
description: Review code or PRs for quality and P360 standards. Use after code changes.
argument-hint: [file path or PR number]
allowed-tools: Read, Grep, Glob, Bash
---

# Code Review Skill

Review code against P360 standards and best practices.

## Review Checklist

### TypeScript Quality
- [ ] No `any` types
- [ ] Proper interfaces defined
- [ ] Strict null checks
- [ ] No implicit any

### React Patterns
- [ ] No `useEffect` for data fetching (use React Query)
- [ ] No global state
- [ ] Error boundaries present
- [ ] Loading states handled

### P360 Standards
- [ ] Nudge mechanism (not just data display)?
- [ ] Biometric hook clear?
- [ ] Follows Decision Framework?

### Security
- [ ] No secrets in code
- [ ] Input validation
- [ ] Error handling

### Over-engineering Check
- [ ] Only requested changes made?
- [ ] No unnecessary abstractions?
- [ ] No premature optimization?

## Output Format

```
## Review: $ARGUMENTS

### Summary
[One sentence: Pass/Needs Work]

### Issues Found
1. [Severity: High/Medium/Low] [Issue description]
   - Location: [file:line]
   - Fix: [Specific fix]

### Good Practices Observed
- [What was done well]

### Recommendations
- [Optional improvements, not blockers]
```

## For PR Reviews

```bash
# Get PR diff
gh pr diff $ARGUMENTS

# Get PR details
gh pr view $ARGUMENTS
```

Review against the same checklist, but also check:
- [ ] PR title is clear and descriptive
- [ ] Changes match PR description
- [ ] No unrelated changes included
