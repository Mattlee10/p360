import { EmbedBuilder } from "discord.js";
import type {
  MoodDecision,
  MoodInsight,
  RecoveryCost,
} from "@p360/core";

// Color constants
const COLORS = {
  green: 0x22c55e, // Go / Good
  amber: 0xf59e0b, // Caution / Moderate
  red: 0xef4444, // Stop / Rest
  blue: 0x3b82f6, // Info
  purple: 0x8b5cf6, // Mood
};

// ============================================
// Mood Embed
// ============================================

export function formatMoodEmbed(decision: MoodDecision): EmbedBuilder {
  const { attribution, dataSummary } = decision;

  const embed = new EmbedBuilder()
    .setTitle(`${attribution.emoji} ${attribution.headline}`)
    .setDescription(attribution.subheadline)
    .setColor(attribution.isPhysiological ? COLORS.amber : COLORS.purple)
    .addFields(
      {
        name: "Recovery",
        value: `${dataSummary.readiness ?? "?"} (${dataSummary.recoveryStatus})`,
        inline: true,
      },
      {
        name: "Mood",
        value: `${dataSummary.moodScore}/5 (${dataSummary.moodStatus})`,
        inline: true,
      }
    );

  // Explanation
  embed.addFields({
    name: "What's Happening",
    value: attribution.explanation.split("\n").filter((l) => l.trim()).slice(0, 3).join("\n"),
    inline: false,
  });

  // Recommendations
  embed.addFields({
    name: "What to Do",
    value: attribution.recommendations.slice(0, 4).map((r) => `• ${r}`).join("\n"),
    inline: false,
  });

  if (decision.scenario === "A") {
    embed.setFooter({
      text: "This is NOT a personal failing. Your body needs rest.",
    });
  }

  return embed;
}

export function formatMoodHistoryEmbed(insight: MoodInsight): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("Your Mood-Recovery Pattern")
    .setColor(COLORS.purple);

  if (insight.trend === "insufficient_data") {
    embed.setDescription(insight.summary);
    embed.addFields({
      name: "Tip",
      value: insight.insight,
      inline: false,
    });
  } else {
    embed.addFields(
      {
        name: "Correlation",
        value: insight.summary,
        inline: true,
      },
      {
        name: "Data Points",
        value: `${insight.dataPoints} days`,
        inline: true,
      }
    );
    embed.addFields({
      name: "Your Pattern",
      value: insight.insight,
      inline: false,
    });
  }

  return embed;
}

// ============================================
// Cost Embed (P27 - Recovery Cost Simulator)
// ============================================

export function formatCostEmbed(cost: RecoveryCost): EmbedBuilder {
  const { dataSummary } = cost;

  const color =
    cost.emoji === "🔴"
      ? COLORS.red
      : cost.emoji === "🟡"
        ? COLORS.amber
        : COLORS.green;

  const embed = new EmbedBuilder()
    .setTitle(`${cost.emoji} ${cost.headline}`)
    .setDescription(cost.subheadline)
    .setColor(color)
    .addFields(
      {
        name: "Readiness",
        value: `${dataSummary.readiness.value ?? "?"}/100`,
        inline: true,
      },
      {
        name: "HRV",
        value: dataSummary.hrv.trend,
        inline: true,
      },
      {
        name: "Sleep",
        value: `${dataSummary.sleep.value ?? "?"}/100`,
        inline: true,
      }
    );

  // Timeline
  if (cost.timeline.length > 0) {
    const timelineText = cost.timeline
      .map((day) => {
        const parts: string[] = [`HRV ${day.hrvChange}%`];
        if (day.sleepImpact) parts.push(day.sleepImpact);
        parts.push(`workout: ${day.workoutCapacity}`);
        return `**${day.label}:** ${parts.join(", ")}`;
      })
      .join("\n");

    embed.addFields({
      name: "Day-by-Day Forecast",
      value: timelineText,
      inline: false,
    });
  }

  // Tradeoff
  embed.setFooter({ text: cost.tradeoff });

  return embed;
}
