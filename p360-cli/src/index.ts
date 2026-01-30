#!/usr/bin/env node

import { Command } from "commander";
import { workoutCommand } from "./commands/workout";
import { loginCommand, loginWithToken } from "./commands/login";
import { statusCommand } from "./commands/status";

const program = new Command();

program
  .name("p360")
  .description("CLI tool that tells you if you should work out today based on your Oura data")
  .version("0.1.0");

// Main workout command
program
  .command("workout")
  .alias("w")
  .description("Check if you should work out today")
  .option("-j, --json", "Output as JSON")
  .option("-c, --compact", "Output in compact format")
  .option("-d, --demo", "Use demo data (no Oura connection needed)")
  .action(workoutCommand);

// Login command
program
  .command("login")
  .description("Connect your Oura Ring")
  .option("-t, --token <token>", "Personal Access Token from Oura")
  .action((options) => {
    if (options.token) {
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

// Default to workout if no command specified
program.action(() => {
  workoutCommand({});
});

program.parse();
