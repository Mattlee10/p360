# p360-cli

> CLI tool that tells you if you should work out today based on your Oura Ring data

## Installation

```bash
npm install -g p360-cli
```

## Quick Start

```bash
# Try with demo data (no Oura needed)
p360 workout --demo

# Connect your Oura Ring
p360 login --token YOUR_OURA_TOKEN

# Check if you should work out
p360 workout
```

## Commands

### `p360 workout`

Check if you should work out today.

```bash
p360 workout          # Full output
p360 workout --json   # JSON format
p360 workout --compact # One-line format
p360 workout --demo   # Use demo data
```

**Example output:**

```
  🟡 TRAIN LIGHT

  Move your body, but don't push it

  ─────────────────────────────────────

  Readiness: 58 (Fair)
  HRV:       -5% vs baseline
  Sleep:     65 (Fair)

  ✓ Recommended:
    • Zone 2 cardio (conversational pace)
    • Light weights, higher reps
    • Yoga or mobility work

  ✗ Avoid:
    • Heavy lifting
    • HIIT or sprints
    • Attempting PRs

  💓 Max HR: 140 bpm

  ─────────────────────────────────────

  ⚠  Risk:     Moderate - pushing hard risks 2-3 day setback
  📅 Tomorrow: Better recovery expected if you take it easy
```

### `p360 login`

Connect your Oura Ring.

```bash
# Show instructions
p360 login

# Connect with token
p360 login --token YOUR_TOKEN
```

**How to get your token:**
1. Go to https://cloud.ouraring.com/personal-access-tokens
2. Create a new Personal Access Token
3. Copy the token

### `p360 status`

Check connection status and latest data.

```bash
p360 status
```

## How It Works

The algorithm analyzes three key metrics from your Oura Ring:

1. **Readiness Score** - Overall recovery state
2. **HRV Balance** - Heart rate variability vs your baseline
3. **Sleep Score** - Last night's sleep quality

Based on these, it gives you one of three recommendations:

| Verdict | Meaning |
|---------|---------|
| 🟢 TRAIN HARD | Go all out - PRs, HIIT, heavy lifting |
| 🟡 TRAIN LIGHT | Move, but stay in Zone 2. No PRs. |
| 🔴 REST DAY | Walking, stretching, recovery only |

## Use Cases

- **Morning decision**: "Should I go to the gym today?"
- **Pre-workout check**: "Am I recovered enough for heavy lifting?"
- **Avoiding overtraining**: Know when to rest before your body forces you to

## License

MIT
