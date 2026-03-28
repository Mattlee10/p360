import type { NudgeResponse } from "@p360/core";
import { getNudgeVerdictEmoji } from "@p360/core";

/**
 * Format a NudgeResponse for WhatsApp.
 * WhatsApp uses: *bold*, _italic_, ~strikethrough~
 */
export function formatNudgeText(nudge: NudgeResponse): string {
  const lines: string[] = [];

  lines.push(nudge.answer);

  if (nudge.options.length > 0) {
    lines.push("");
    lines.push("*Options:*");
    for (const opt of nudge.options) {
      lines.push(`${getNudgeVerdictEmoji(opt.verdict)} *${opt.label}:* ${opt.impact}`);
    }
  }

  if (nudge.strategy) {
    lines.push("");
    lines.push(`_Strategy:_ ${nudge.strategy}`);
  }

  if (nudge.dataSource) {
    lines.push("");
    lines.push(`_Data: ${nudge.dataSource}_`);
  }

  return lines.join("\n");
}

/**
 * Format a plain ask result (no nudge structure) for WhatsApp.
 */
export function formatRawText(raw: string): string {
  return raw.slice(0, 4096);
}
