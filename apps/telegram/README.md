# p360-telegram

> Telegram bot that tells you if you should work out today based on your Oura Ring data

## Try It

Search for `@p360bot` on Telegram (once deployed)

## Commands

| Command | Description |
|---------|-------------|
| `/workout` | Get your training recommendation |
| `/w` | Shortcut for /workout |
| `/connect TOKEN` | Link your Oura Ring |
| `/status` | Check connection status |
| `/disconnect` | Remove Oura connection |
| `/demo` | Try with random sample data |
| `/help` | Show all commands |

## Example Output

```
🟡 TRAIN LIGHT

Move your body, but don't push it

📊 Readiness 58 • HRV -5% • Sleep 65

✓ Do this:
  → Zone 2 cardio (easy pace)
  → Light weights, more reps
  → Yoga or stretching

✗ Skip:
  → Heavy lifting
  → HIIT
  → PRs

💓 Max HR: 140 bpm

📅 Tomorrow: Better if you rest today
```

## Self-Hosting

### Prerequisites

- Node.js 18+
- Telegram Bot Token (from @BotFather)

### Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   cd p360-telegram
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env and add your TELEGRAM_BOT_TOKEN
   ```

4. Build and run:
   ```bash
   npm run build
   npm start
   ```

### Development

```bash
npm run dev  # Watch mode with tsx
```

## How to Get Your Oura Token

1. Go to [Oura Cloud](https://cloud.ouraring.com/personal-access-tokens)
2. Create a new Personal Access Token
3. Copy the token
4. In Telegram: `/connect YOUR_TOKEN`

## Deployment

### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

1. Fork this repo
2. Connect to Railway
3. Add `TELEGRAM_BOT_TOKEN` environment variable
4. Deploy

### Docker

```bash
docker build -t p360-telegram .
docker run -e TELEGRAM_BOT_TOKEN=your_token p360-telegram
```

## License

MIT
