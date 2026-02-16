#!/usr/bin/env node

import * as dotenv from "dotenv";
import { Command } from "commander";
import { loginCommand, loginWithToken, loginWithAnthropicKey } from "./commands/login";
import { statusCommand } from "./commands/status";
import { askCommand } from "./commands/ask";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const program = new Command();

program
  .name("p360")
  .description("Biometric-driven decision support for high-performers")
  .version("0.3.0");

// Ask command (AI-powered) — THE decision-making command
program
  .command("ask [question]")
  .alias("a")
  .description("Ask anything about your body state (AI-powered)")
  .option("-j, --json", "Output as JSON")
  .option("-d, --demo", "Use demo data")
  .action(askCommand);

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

// Default: show help (no more implicit check command)
program.action(() => {
  program.help();
});

program.parse();
