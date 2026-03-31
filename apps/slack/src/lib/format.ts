import type { NudgeResponse } from "@p360/core";
import type { KnownBlock } from "@slack/types";

export function formatAskBlocks(nudge: NudgeResponse, domain?: string): KnownBlock[] {
  const blocks: KnownBlock[] = [];

  const title = domain ? `P360 Ask — ${domain}` : "P360 Ask";
  blocks.push({ type: "header", text: { type: "plain_text", text: title } });
  blocks.push({ type: "section", text: { type: "mrkdwn", text: nudge.answer } });

  if (nudge.options.length > 0) {
    const optionsText = nudge.options
      .map((opt) => `${getVerdictEmoji(opt.verdict)} *${opt.label}*: ${opt.impact}`)
      .join("\n");
    blocks.push({ type: "section", text: { type: "mrkdwn", text: `*Options*\n${optionsText}` } });
  }

  if (nudge.strategy) {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: `*Strategy*\n${nudge.strategy}` } });
  }

  blocks.push({ type: "divider" });

  if (nudge.dataSource) {
    blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: `📈 ${nudge.dataSource}` }] });
  }

  return blocks;
}

function getVerdictEmoji(verdict: string): string {
  switch (verdict) {
    case "proceed": return "🟢";
    case "proceed_with_caution": return "🟡";
    case "wait": return "🟠";
    case "stop": return "🔴";
    default: return "⚪";
  }
}

export function notConnectedBlocks(): KnownBlock[] {
  return [
    { type: "header", text: { type: "plain_text", text: "Device Not Connected" } },
    { type: "section", text: { type: "mrkdwn", text: "Connect your wearable first.\n\n*Oura:* `/p360-connect oura YOUR_TOKEN`\n*WHOOP:* `/p360-connect whoop YOUR_TOKEN`" } },
  ];
}

export function errorBlocks(message: string): KnownBlock[] {
  return [
    { type: "section", text: { type: "mrkdwn", text: `❌ *Error*\n${message}` } },
  ];
}
