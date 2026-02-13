#!/usr/bin/env node

import { Command } from "commander";
import { workoutCommand } from "./commands/workout";
import { loginCommand, loginWithToken, loginWithAnthropicKey } from "./commands/login";
import { statusCommand } from "./commands/status";
import { checkCommand } from "./commands/check";
import { drinkCommand, drinkLogCommand, drinkSocialCommand } from "./commands/drink";
import { whyCommand } from "./commands/why";
import { moodCommand } from "./commands/mood";
import { costCommand } from "./commands/cost";
import { askCommand } from "./commands/ask";
import { analyzeCommand } from "./commands/analyze";

const program = new Command();

program
  .name("p360")
  .description("Biometric-driven decision support for high-performers")
  .version("0.2.0");

// Check command (default)
program
  .command("check")
  .alias("c")
  .description("Check your decision readiness")
  .option("-j, --json", "Output as JSON")
  .option("-d, --demo", "Use demo data")
  .option("--category <category>", "Decision category (email, meeting, financial, workout, creative, negotiation)")
  .option("--importance <level>", "Importance level (low, medium, high, critical)")
  .action(checkCommand);

// Workout command
program
  .command("workout")
  .alias("w")
  .description("Should you work out today?")
  .option("-j, --json", "Output as JSON")
  .option("-d, --demo", "Use demo data")
  .option("-s, --sport <sport>", "Sport-specific guidance (e.g., basketball, running)")
  .action(workoutCommand);

// Drink command
const drink = program
  .command("drink")
  .description("Alcohol decision support");

drink
  .command("check", { isDefault: true })
  .description("Should you drink tonight?")
  .option("-j, --json", "Output as JSON")
  .option("-d, --demo", "Use demo data")
  .action(drinkCommand);

drink
  .command("log <amount>")
  .description("Log drinks (e.g., p360 drink log 2)")
  .action(drinkLogCommand);

drink
  .command("social")
  .description("Get social event strategy")
  .option("-d, --demo", "Use demo data")
  .action(drinkSocialCommand);

// Why command
program
  .command("why [keyword]")
  .description("Why do I feel this way? (e.g., p360 why tired -s 3)")
  .option("-j, --json", "Output as JSON")
  .option("-d, --demo", "Use demo data")
  .option("-s, --score <score>", "Your subjective feeling (1-10)")
  .action(whyCommand);

// Mood command
program
  .command("mood [score]")
  .description("Log mood (1-5) and see body correlation")
  .option("-j, --json", "Output as JSON")
  .option("-d, --demo", "Use demo data")
  .option("-n, --note <note>", "Add a note")
  .action(moodCommand);

// Cost command
program
  .command("cost [substance] [amount]")
  .description("Recovery cost simulator (e.g., p360 cost beer 3)")
  .option("-j, --json", "Output as JSON")
  .option("-d, --demo", "Use demo data")
  .action(costCommand);

// Ask command (AI-powered)
program
  .command("ask <question>")
  .alias("a")
  .description("Ask anything about your body state (AI-powered)")
  .option("-j, --json", "Output as JSON")
  .option("-d, --demo", "Use demo data")
  .action(askCommand);

// Analyze command (time-series analysis)
program
  .command("analyze [metric]")
  .description("Time-series analysis with rolling averages and confound filtering")
  .option("-r, --rolling <days>", "Rolling window size (default: 7)", "7")
  .option("--days <days>", "Lookback period in days (default: 30)", "30")
  .option("--exclude <confounds>", "Exclude confounds (comma-separated: training,travel,alcohol)")
  .option("--baseline <days>", "Baseline window for variance (default: 30)", "30")
  .option("-j, --json", "Output as JSON")
  .option("-d, --demo", "Use demo data")
  .action((metric, options) => {
    analyzeCommand(metric ? [metric] : [], {
      metric: metric || "hrv",
      rolling: parseInt(options.rolling),
      days: parseInt(options.days),
      exclude: options.exclude,
      baseline: parseInt(options.baseline),
      json: options.json,
      demo: options.demo,
    });
  });

// Login command
program
  .command("login")
  .description("Connect your Oura Ring or Anthropic API")
  .option("-t, --token <token>", "Personal Access Token from Oura")
  .option("--anthropic <key>", "Anthropic API key for p360 ask")
  .action((options) => {
    if (options.anthropic) {
      loginWithAnthropicKey(options.anthropic);
    } else if (options.token) {
      loginWithToken(options);
    } else {
      loginCommand();
    }
  });

// Status command
program
  .command("status")
  .alias("s")
  .description("Show connection status and latest data")
  .action(statusCommand);

// Default to check if no command specified
program.action(() => {
  checkCommand({ demo: false });
});

program.parse();
