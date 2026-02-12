"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatWorkoutEmbed = formatWorkoutEmbed;
exports.formatDrinkEmbed = formatDrinkEmbed;
exports.formatWhyEmbed = formatWhyEmbed;
exports.formatMoodEmbed = formatMoodEmbed;
exports.formatMoodHistoryEmbed = formatMoodHistoryEmbed;
exports.formatDrinkHistoryEmbed = formatDrinkHistoryEmbed;
exports.formatCostEmbed = formatCostEmbed;
const discord_js_1 = require("discord.js");
// Color constants
const COLORS = {
    green: 0x22c55e, // Go / Good
    amber: 0xf59e0b, // Caution / Moderate
    red: 0xef4444, // Stop / Rest
    blue: 0x3b82f6, // Info
    purple: 0x8b5cf6, // Mood
};
function getVerdictColor(verdict) {
    switch (verdict) {
        case "train_hard":
        case "good":
        case "proceed":
            return COLORS.green;
        case "moderate":
        case "train_light":
        case "caution":
        case "wait":
            return COLORS.amber;
        case "rest":
        case "skip":
        case "stop":
            return COLORS.red;
        default:
            return COLORS.blue;
    }
}
// ============================================
// Workout Embed
// ============================================
function formatWorkoutEmbed(decision) {
    const { dataSummary } = decision;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`${decision.emoji} ${decision.headline}`)
        .setDescription(decision.subheadline)
        .setColor(getVerdictColor(decision.verdict))
        .addFields({
        name: "📊 Readiness",
        value: `${dataSummary.readiness.value ?? "?"}/100`,
        inline: true,
    }, {
        name: "💓 HRV",
        value: dataSummary.hrv.trend,
        inline: true,
    }, {
        name: "😴 Sleep",
        value: `${dataSummary.sleep.value ?? "?"}/100`,
        inline: true,
    });
    // Reasoning
    if (decision.reasoning.length > 0) {
        embed.addFields({
            name: "📋 Why",
            value: decision.reasoning.map((r) => `• ${r}`).join("\n"),
            inline: false,
        });
    }
    // Intensity guide
    const intensityParts = [];
    if (decision.intensityGuide.cardio) {
        intensityParts.push(`Cardio: ${decision.intensityGuide.cardio}`);
    }
    if (decision.intensityGuide.weights) {
        intensityParts.push(`Weights: ${decision.intensityGuide.weights}`);
    }
    if (decision.intensityGuide.rpe) {
        intensityParts.push(`Effort: ${decision.intensityGuide.rpe}`);
    }
    if (intensityParts.length > 0) {
        embed.addFields({
            name: "🎯 Intensity",
            value: intensityParts.join("\n"),
            inline: false,
        });
    }
    // Sport guide
    if (decision.sportGuide) {
        const sg = decision.sportGuide;
        let sportText = sg.todayAdvice;
        if (sg.intensityTips.length > 0) {
            sportText += "\n" + sg.intensityTips.slice(0, 2).map((t) => `• ${t}`).join("\n");
        }
        embed.addFields({
            name: `🏀 ${sg.displayName}`,
            value: sportText,
            inline: false,
        });
    }
    embed.setFooter({ text: `Tomorrow: ${decision.tomorrowOutlook}` });
    return embed;
}
// ============================================
// Drink Embed
// ============================================
function formatDrinkEmbed(decision) {
    const { dataSummary } = decision;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`${decision.emoji} ${decision.headline}`)
        .setDescription(decision.subheadline)
        .setColor(getVerdictColor(decision.verdict))
        .addFields({
        name: "📊 Readiness",
        value: `${dataSummary.readiness.value ?? "?"}/100`,
        inline: true,
    }, {
        name: "💓 HRV",
        value: dataSummary.hrv.trend,
        inline: true,
    }, {
        name: "😴 Sleep",
        value: `${dataSummary.sleep.value ?? "?"}/100`,
        inline: true,
    });
    // Limits
    embed.addFields({
        name: "🍺 Tonight's Limits",
        value: [
            `🟢 ${decision.greenLimit} drinks: ${decision.impacts[decision.greenLimit - 1]?.recoveryTime || "normal tomorrow"}`,
            `🟡 ${decision.yellowLimit} drinks: ${decision.impacts[decision.yellowLimit - 1]?.recoveryTime || "afternoon recovery"}`,
            `🔴 ${decision.redThreshold}+ drinks: ${decision.impacts[Math.min(decision.redThreshold, 4)]?.recoveryTime || "multi-day recovery"}`,
        ].join("\n"),
        inline: false,
    });
    // Tips
    if (decision.tips.length > 0) {
        embed.addFields({
            name: "💡 Tips",
            value: decision.tips.slice(0, 3).map((t) => `• ${t}`).join("\n"),
            inline: false,
        });
    }
    return embed;
}
// ============================================
// Why Embed
// ============================================
function formatWhyEmbed(decision) {
    const { dataSummary } = decision;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`${decision.emoji} ${decision.headline}`)
        .setDescription(decision.subheadline)
        .setColor(decision.verdict === "physiological" ? COLORS.amber : COLORS.blue)
        .addFields({
        name: "📊 Readiness",
        value: `${dataSummary.readiness.value ?? "?"} (${dataSummary.readiness.status})`,
        inline: true,
    }, {
        name: "💓 HRV",
        value: dataSummary.hrv.trend,
        inline: true,
    }, {
        name: "😴 Sleep",
        value: `${dataSummary.sleep.value ?? "?"}`,
        inline: true,
    });
    // Gap analysis
    if (decision.gapAnalysis) {
        embed.addFields({
            name: "🔍 Gap Analysis",
            value: `You feel: ${decision.gapAnalysis.subjectiveScore}/10\nBody says: ${decision.gapAnalysis.objectiveScore}/10\n${decision.gapAnalysis.explanation.split("\n")[0]}`,
            inline: false,
        });
    }
    // Explanation
    embed.addFields({
        name: "💡 Why You Feel This Way",
        value: decision.explanation.split("\n").slice(0, 3).join("\n"),
        inline: false,
    });
    // Recommendations
    embed.addFields({
        name: "🎯 What to Do",
        value: decision.recommendations.slice(0, 4).map((r) => `• ${r}`).join("\n"),
        inline: false,
    });
    if (decision.verdict !== "psychological") {
        embed.setFooter({ text: `⚠️ ${decision.risk}` });
    }
    return embed;
}
// ============================================
// Mood Embed
// ============================================
function formatMoodEmbed(decision) {
    const { attribution, dataSummary } = decision;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`${attribution.emoji} ${attribution.headline}`)
        .setDescription(attribution.subheadline)
        .setColor(attribution.isPhysiological ? COLORS.amber : COLORS.purple)
        .addFields({
        name: "📊 Recovery",
        value: `${dataSummary.readiness ?? "?"} (${dataSummary.recoveryStatus})`,
        inline: true,
    }, {
        name: "🎭 Mood",
        value: `${dataSummary.moodScore}/5 (${dataSummary.moodStatus})`,
        inline: true,
    });
    // Explanation
    embed.addFields({
        name: "💡 What's Happening",
        value: attribution.explanation.split("\n").filter((l) => l.trim()).slice(0, 3).join("\n"),
        inline: false,
    });
    // Recommendations
    embed.addFields({
        name: "🎯 What to Do",
        value: attribution.recommendations.slice(0, 4).map((r) => `• ${r}`).join("\n"),
        inline: false,
    });
    if (decision.scenario === "A") {
        embed.setFooter({
            text: "⚡ This is NOT a personal failing. Your body needs rest.",
        });
    }
    return embed;
}
function formatMoodHistoryEmbed(insight) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle("📈 Your Mood-Recovery Pattern")
        .setColor(COLORS.purple);
    if (insight.trend === "insufficient_data") {
        embed.setDescription(insight.summary);
        embed.addFields({
            name: "💡 Tip",
            value: insight.insight,
            inline: false,
        });
    }
    else {
        embed.addFields({
            name: "Correlation",
            value: insight.summary,
            inline: true,
        }, {
            name: "Data Points",
            value: `${insight.dataPoints} days`,
            inline: true,
        });
        embed.addFields({
            name: "💡 Your Pattern",
            value: insight.insight,
            inline: false,
        });
    }
    return embed;
}
// ============================================
// Drink History Embed
// ============================================
function formatDrinkHistoryEmbed(history) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle("📈 Your Drinking Patterns")
        .setColor(COLORS.blue)
        .addFields({
        name: "Last 30 Days",
        value: `Avg per week: ${history.avgPerWeek.toFixed(1)} sessions\nAvg per session: ${history.avgPerSession.toFixed(1)} drinks`,
        inline: false,
    });
    if (history.patterns.length > 0) {
        embed.addFields({
            name: "Impact Patterns",
            value: history.patterns
                .map((p) => `${p.drinks} drinks → HRV -${p.avgHrvDrop}%, ${p.avgRecoveryDays}d recovery`)
                .join("\n"),
            inline: false,
        });
    }
    if (history.personalSafeLimit) {
        embed.addFields({
            name: "🎯 Your Safe Limit",
            value: `${history.personalSafeLimit} drinks\n*(Based on your personal data)*`,
            inline: false,
        });
    }
    return embed;
}
// ============================================
// Cost Embed (P27 - Recovery Cost Simulator)
// ============================================
function formatCostEmbed(cost) {
    const { dataSummary } = cost;
    const color = cost.emoji === "🔴"
        ? COLORS.red
        : cost.emoji === "🟡"
            ? COLORS.amber
            : COLORS.green;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`${cost.emoji} ${cost.headline}`)
        .setDescription(cost.subheadline)
        .setColor(color)
        .addFields({
        name: "📊 Readiness",
        value: `${dataSummary.readiness.value ?? "?"}/100`,
        inline: true,
    }, {
        name: "💓 HRV",
        value: dataSummary.hrv.trend,
        inline: true,
    }, {
        name: "😴 Sleep",
        value: `${dataSummary.sleep.value ?? "?"}/100`,
        inline: true,
    });
    // Timeline
    if (cost.timeline.length > 0) {
        const timelineText = cost.timeline
            .map((day) => {
            const parts = [`HRV ${day.hrvChange}%`];
            if (day.sleepImpact)
                parts.push(day.sleepImpact);
            parts.push(`workout: ${day.workoutCapacity}`);
            return `**${day.label}:** ${parts.join(", ")}`;
        })
            .join("\n");
        embed.addFields({
            name: "📅 Day-by-Day Forecast",
            value: timelineText,
            inline: false,
        });
    }
    // Tradeoff
    embed.setFooter({ text: cost.tradeoff });
    return embed;
}
