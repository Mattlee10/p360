"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePearsonCorrelation = exports.calculateMoodInsight = exports.getMoodDecision = exports.getMoodAttribution = void 0;
exports.formatMoodTelegram = formatMoodTelegram;
exports.formatMoodHistoryTelegram = formatMoodHistoryTelegram;
exports.formatMoodLoggedTelegram = formatMoodLoggedTelegram;
// Re-export algorithm functions from core
var core_1 = require("@p360/core");
Object.defineProperty(exports, "getMoodAttribution", { enumerable: true, get: function () { return core_1.getMoodAttribution; } });
Object.defineProperty(exports, "getMoodDecision", { enumerable: true, get: function () { return core_1.getMoodDecision; } });
Object.defineProperty(exports, "calculateMoodInsight", { enumerable: true, get: function () { return core_1.calculateMoodInsight; } });
Object.defineProperty(exports, "calculatePearsonCorrelation", { enumerable: true, get: function () { return core_1.calculatePearsonCorrelation; } });
// ============================================
// Telegram-specific Formatters
// ============================================
function formatMoodTelegram(decision) {
    const lines = [];
    const { attribution, dataSummary } = decision;
    // Header
    lines.push(`${attribution.emoji} <b>${attribution.headline}</b>`);
    lines.push("");
    lines.push(`<i>${attribution.subheadline}</i>`);
    lines.push("");
    // Data summary
    lines.push("<b>📊 Today's State:</b>");
    lines.push(`  • Recovery: <b>${dataSummary.readiness ?? "?"}</b> (${dataSummary.recoveryStatus})`);
    lines.push(`  • Mood: <b>${dataSummary.moodScore}/5</b> (${dataSummary.moodStatus})`);
    lines.push("");
    // Explanation
    lines.push("<b>💡 What's Happening:</b>");
    attribution.explanation.split("\n").forEach((line) => {
        if (line.trim()) {
            lines.push(`  ${line}`);
        }
    });
    lines.push("");
    // Recommendations
    lines.push("<b>🎯 What to Do:</b>");
    attribution.recommendations.slice(0, 4).forEach((rec) => {
        lines.push(`  • ${rec}`);
    });
    // Key insight for scenario A (the main P17 insight)
    if (decision.scenario === "A") {
        lines.push("");
        lines.push("<b>⚡ Key Insight:</b>");
        lines.push("  <i>What you're feeling is NOT a personal failing.</i>");
        lines.push("  <i>Your body needs rest - listen to it.</i>");
    }
    return lines.join("\n");
}
function formatMoodHistoryTelegram(insight) {
    const lines = [];
    lines.push("📈 <b>Your Mood-Recovery Pattern</b>");
    lines.push("");
    if (insight.trend === "insufficient_data") {
        lines.push(`<i>${insight.summary}</i>`);
        lines.push("");
        lines.push(insight.insight);
        lines.push("");
        lines.push("Keep logging your mood daily to see your personal patterns!");
    }
    else {
        lines.push(`<b>Correlation:</b> ${insight.summary}`);
        lines.push(`<b>Data points:</b> ${insight.dataPoints} days`);
        lines.push("");
        lines.push("<b>💡 Your Pattern:</b>");
        lines.push(`  ${insight.insight}`);
    }
    return lines.join("\n");
}
function formatMoodLoggedTelegram(score, attribution) {
    const lines = [];
    lines.push(`✅ <b>Mood Logged: ${score}/5</b>`);
    lines.push("");
    lines.push(`${attribution.emoji} ${attribution.headline}`);
    lines.push("");
    if (attribution.isPhysiological) {
        lines.push("<i>Remember: Low mood during low recovery is your body talking, not a character flaw.</i>");
    }
    lines.push("");
    lines.push("Use /mood history to see your patterns over time.");
    return lines.join("\n");
}
