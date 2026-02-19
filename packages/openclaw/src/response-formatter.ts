/**
 * Response Formatter
 *
 * Converts NudgeResponse (from Claude) → platform-specific output
 * Handles text formatting, interactive elements, and platform capabilities
 */

import type {
  NudgeResponse,
  ActionableInsight,
  ActionVerdict,
} from "@p360/core";
import type {
  PlatformOutput,
  FormattedResponse,
  PlatformContext,
  InteractiveElement,
  PlatformType,
} from "./types";

// ============================================
// Response Formatter
// ============================================

export class ResponseFormatter {
  /**
   * Main entry point: Convert NudgeResponse → PlatformOutput
   */
  async format(
    nudge: NudgeResponse | null,
    platformContext: PlatformContext,
    fallback: string = "Unable to generate advice at this time.",
  ): Promise<PlatformOutput> {
    // If no nudge, return plain text fallback
    if (!nudge) {
      return {
        text: fallback,
        shouldNotify: false,
      };
    }

    // Format plain text (always required)
    const text = this.formatPlainText(nudge);

    // Platform-specific formatting (if supported)
    let formatted: FormattedResponse | undefined;
    if (platformContext.features.supportsEmbed) {
      formatted = this.formatByPlatform(
        nudge,
        platformContext.features.preferredFormat,
      );
    }

    // Interactive elements (if supported)
    const interactive = platformContext.features.supportsInteractive
      ? this.buildInteractiveElements(nudge)
      : undefined;

    return {
      text,
      formatted,
      interactive,
      shouldNotify: true,
    };
  }

  /**
   * Format as plain text (fallback for all platforms)
   */
  private formatPlainText(nudge: NudgeResponse): string {
    const lines: string[] = [];

    // Answer (main response)
    if (nudge.answer) {
      lines.push(nudge.answer);
      lines.push("");
    }

    // Options with emoji indicators
    if (nudge.options && nudge.options.length > 0) {
      for (const option of nudge.options) {
        const emoji = this.getVerdictEmoji(option.verdict);
        lines.push(`${emoji} ${option.label}: ${option.impact}`);
      }
      lines.push("");
    }

    // Strategy
    if (nudge.strategy) {
      lines.push(nudge.strategy);
    }

    // Data source (quiet, at end)
    if (nudge.dataSource) {
      lines.push("");
      lines.push(`📊 Based on: ${nudge.dataSource}`);
    }

    return lines.filter((l) => l !== "").join("\n");
  }

  /**
   * Platform-specific formatting
   */
  private formatByPlatform(
    nudge: NudgeResponse,
    format: "text" | "markdown" | "html" | "json",
  ): FormattedResponse {
    switch (format) {
      case "html":
        return this.formatHTML(nudge);
      case "markdown":
        return this.formatMarkdown(nudge);
      case "json":
        return this.formatJSON(nudge);
      default:
        return this.formatMarkdown(nudge);
    }
  }

  /**
   * Telegram HTML formatting
   */
  private formatHTML(nudge: NudgeResponse): FormattedResponse {
    const lines: string[] = [];

    // Answer
    if (nudge.answer) {
      lines.push(`<b>${this.escapeHTML(nudge.answer)}</b>`);
      lines.push("");
    }

    // Options
    if (nudge.options && nudge.options.length > 0) {
      for (const option of nudge.options) {
        const emoji = this.getVerdictEmoji(option.verdict);
        const label = this.escapeHTML(option.label);
        const impact = this.escapeHTML(option.impact);
        lines.push(`${emoji} <b>${label}</b>: <code>${impact}</code>`);
      }
      lines.push("");
    }

    // Strategy
    if (nudge.strategy) {
      const strategyLines = nudge.strategy.split("\n");
      for (const line of strategyLines) {
        // Indent sub-items
        if (line.trim().startsWith("-") || line.trim().startsWith("•")) {
          lines.push(`  ${this.escapeHTML(line)}`);
        } else {
          lines.push(this.escapeHTML(line));
        }
      }
    }

    return {
      platform: "telegram",
      native: lines.join("\n"),
    };
  }

  /**
   * Discord/Slack Markdown formatting
   */
  private formatMarkdown(nudge: NudgeResponse): FormattedResponse {
    const lines: string[] = [];

    // Answer
    if (nudge.answer) {
      lines.push(`**${nudge.answer}**`);
      lines.push("");
    }

    // Options
    if (nudge.options && nudge.options.length > 0) {
      for (const option of nudge.options) {
        const emoji = this.getVerdictEmoji(option.verdict);
        lines.push(`${emoji} **${option.label}**: \`${option.impact}\``);
      }
      lines.push("");
    }

    // Strategy
    if (nudge.strategy) {
      lines.push(nudge.strategy);
    }

    return {
      platform: "discord",
      native: lines.join("\n"),
    };
  }

  /**
   * JSON formatting (for Web/API)
   */
  private formatJSON(nudge: NudgeResponse): FormattedResponse {
    return {
      platform: "web",
      native: {
        answer: nudge.answer,
        options: nudge.options,
        strategy: nudge.strategy,
        dataSource: nudge.dataSource,
      },
    };
  }

  /**
   * Build interactive elements (buttons, selects, etc)
   */
  private buildInteractiveElements(nudge: NudgeResponse): InteractiveElement[] {
    const elements: InteractiveElement[] = [];

    // Add "Did this help?" feedback button
    elements.push({
      type: "button",
      id: "feedback_helpful",
      label: "👍 Helpful",
      action: "log_decision",
      style: "primary",
    });

    elements.push({
      type: "button",
      id: "feedback_not_helpful",
      label: "👎 Not helpful",
      action: "log_decision",
      style: "secondary",
    });

    // Add "Show data" for deeper analysis
    if (nudge.dataSource) {
      elements.push({
        type: "button",
        id: "show_data",
        label: "📊 Show breakdown",
        action: "follow_up_question",
      });
    }

    return elements;
  }

  /**
   * Helper: Get emoji for verdict
   */
  private getVerdictEmoji(verdict: ActionVerdict): string {
    switch (verdict) {
      case "safe":
        return "✅";
      case "caution":
        return "⚠️";
      case "risky":
        return "❌";
      default:
        return "ℹ️";
    }
  }

  /**
   * Helper: Escape HTML special characters
   */
  private escapeHTML(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

// ============================================
// Export Singleton
// ============================================

export const responseFormatter = new ResponseFormatter();
