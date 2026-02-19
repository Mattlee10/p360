/**
 * Telegram Platform Adapter
 *
 * Converts Telegram input/output to/from UnifiedMessage/PlatformOutput
 * Works with grammy (async) or gramjs context
 */

import { BaseAdapter } from "./types";
import type {
  UnifiedMessage,
  PlatformOutput,
  PlatformFeatures,
} from "../types";
import type { TelegramContext } from "./types";

// ============================================
// Telegram Adapter
// ============================================

export class TelegramAdapter extends BaseAdapter {
  private ctx: TelegramContext;

  constructor(ctx: TelegramContext) {
    // Telegram features: supports HTML, buttons, good message length
    const features: PlatformFeatures = {
      supportsEmbed: true,
      supportsInteractive: true,
      supportsImages: true,
      supportsAudio: true,
      supportsVideo: true,
      supportsReactions: true,
      maxMessageLength: 4096,
      preferredFormat: "html",
    };

    super("telegram", features, 4096);
    this.ctx = ctx;
  }

  /**
   * Parse Telegram message → UnifiedMessage
   */
  async parseInput(): Promise<UnifiedMessage> {
    const text = this.extractText();
    const userId = this.extractUserId();
    const sourceId = String(this.ctx.chat?.id || "unknown");

    // Determine message type
    let messageType: "query" | "command" | "log" | "feedback" = "query";
    if (text.startsWith("/")) {
      messageType = "command";
    }

    return {
      id: this.generateMessageId(userId),
      platform: "telegram",
      timestamp: new Date(),
      userId,
      userDevice: "mobile", // Telegram is usually mobile, but not always
      type: messageType,
      question: text,
      platformContext: this.getPlatformContext(),
    };
  }

  /**
   * Format PlatformOutput → Telegram message
   */
  async formatOutput(result: PlatformOutput): Promise<void> {
    // Use formatted HTML if available, otherwise plain text
    const content = result.formatted?.native || result.text;

    // Send main message
    if (this.ctx.reply) {
      await this.ctx.reply(String(content), {
        parse_mode: "HTML",
        // Add reply buttons if available
        reply_markup: result.interactive
          ? this.buildReplyMarkup(result.interactive)
          : undefined,
      });
    }
  }

  /**
   * Helper: Extract user ID
   */
  protected extractUserId(): string {
    return String(this.ctx.from?.id || "unknown");
  }

  /**
   * Helper: Extract message text
   */
  protected extractText(): string {
    return this.ctx.message?.text || "";
  }

  /**
   * Helper: Get source ID
   */
  protected getSourceId(): string {
    return String(this.ctx.chat?.id || "unknown");
  }

  /**
   * Helper: Get source name
   */
  protected getSourceName(): string | undefined {
    return this.ctx.chat?.title || this.ctx.from?.first_name;
  }

  /**
   * Build Telegram inline keyboard from interactive elements
   */
  private buildReplyMarkup(elements: Array<any>): any {
    const buttons = elements.map((el) => ({
      text: el.label,
      callback_data: el.id || el.label,
    }));

    // Group buttons into rows (2 per row)
    const rows: any[] = [];
    for (let i = 0; i < buttons.length; i += 2) {
      rows.push(buttons.slice(i, i + 2));
    }

    return {
      inline_keyboard: rows,
    };
  }
}

// ============================================
// Factory Function
// ============================================

export function createTelegramAdapter(ctx: TelegramContext): TelegramAdapter {
  return new TelegramAdapter(ctx);
}
