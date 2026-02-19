/**
 * CLI Platform Adapter
 *
 * Converts CLI arguments → UnifiedMessage
 * Converts PlatformOutput → stdout/colored text
 */

import { BaseAdapter } from "./types";
import type {
  UnifiedMessage,
  PlatformOutput,
  PlatformFeatures,
  InteractiveElement,
} from "../types";

// ============================================
// CLI Adapter
// ============================================

export class CLIAdapter extends BaseAdapter {
  private args: string[];
  private userId: string;
  private verbose: boolean;

  constructor(args: string[], userId: string = "cli-user", verbose: boolean = false) {
    // CLI features: text only, no interactivity, max length is terminal width
    const features: PlatformFeatures = {
      supportsEmbed: true,
      supportsInteractive: false,
      supportsImages: false,
      supportsAudio: false,
      supportsVideo: false,
      supportsReactions: false,
      maxMessageLength: 200,
      preferredFormat: "markdown",
    };

    super("cli", features, 200);
    this.args = args;
    this.userId = userId;
    this.verbose = verbose;
  }

  /**
   * Parse CLI arguments → UnifiedMessage
   */
  async parseInput(): Promise<UnifiedMessage> {
    const question = this.args.join(" ");
    const timestamp = new Date();

    // Determine command type
    let messageType: "query" | "command" | "log" | "feedback" = "query";
    let command: string | undefined;

    if (question.startsWith("--")) {
      messageType = "command";
      const match = question.match(/--(\w+)/);
      if (match) {
        command = match[1];
      }
    }

    return {
      id: this.generateMessageId(),
      platform: "cli",
      timestamp,
      userId: this.userId,
      userDevice: "cli",
      type: messageType,
      question,
      command,
      platformContext: this.getPlatformContext(),
    };
  }

  /**
   * Format PlatformOutput → stdout
   */
  async formatOutput(result: PlatformOutput): Promise<void> {
    // Use formatted markdown if available
    const output = result.formatted?.native || result.text;

    // Add colors for readability
    const colored = this.colorize(String(output));

    // Print to stdout
    console.log(colored);

    // Print interactive options if verbose mode
    if (this.verbose && result.interactive && result.interactive.length > 0) {
      console.log("\n📌 Options:");
      result.interactive.forEach((el) => {
        console.log(`   [${el.id}] ${el.label}`);
      });
    }
  }

  /**
   * Helper: Extract user ID (not used in CLI)
   */
  protected extractUserId(): string {
    return this.userId;
  }

  /**
   * Helper: Extract message text (not used in CLI)
   */
  protected extractText(): string {
    return this.args.join(" ");
  }

  /**
   * Helper: Get source ID
   */
  protected getSourceId(): string {
    return "cli";
  }

  /**
   * Helper: Get source name
   */
  protected getSourceName(): string | undefined {
    return "CLI";
  }

  /**
   * Add ANSI color codes for better readability
   */
  private colorize(text: string): string {
    const colors = {
      reset: "\x1b[0m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      red: "\x1b[31m",
      blue: "\x1b[34m",
      cyan: "\x1b[36m",
      bold: "\x1b[1m",
      dim: "\x1b[2m",
    };

    // Color main answer (first line) in bold cyan
    let result = text.replace(/^([^\n]+)/m, `${colors.bold}${colors.cyan}$1${colors.reset}`);

    // Color checkmarks/warnings/errors with appropriate colors
    result = result
      .replace(/✅/g, `${colors.green}✅${colors.reset}`)
      .replace(/⚠️/g, `${colors.yellow}⚠️${colors.reset}`)
      .replace(/❌/g, `${colors.red}❌${colors.reset}`)
      .replace(/📊/g, `${colors.dim}📊${colors.reset}`);

    // Color code blocks in dim blue
    result = result.replace(/`([^`]+)`/g, `${colors.blue}$1${colors.reset}`);

    return result;
  }
}

// ============================================
// Factory Function
// ============================================

export function createCLIAdapter(
  args: string[],
  userId?: string,
  verbose?: boolean,
): CLIAdapter {
  return new CLIAdapter(args, userId, verbose);
}
