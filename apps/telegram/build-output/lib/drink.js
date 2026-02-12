"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDrinkHistory = exports.getSocialStrategy = exports.getDrinkDecision = void 0;
exports.formatDrinkTelegram = formatDrinkTelegram;
exports.formatSocialStrategyTelegram = formatSocialStrategyTelegram;
exports.formatDrinkLogTelegram = formatDrinkLogTelegram;
exports.formatDrinkHistoryTelegram = formatDrinkHistoryTelegram;
// Re-export algorithm functions from core
var core_1 = require("@p360/core");
Object.defineProperty(exports, "getDrinkDecision", { enumerable: true, get: function () { return core_1.getDrinkDecision; } });
Object.defineProperty(exports, "getSocialStrategy", { enumerable: true, get: function () { return core_1.getSocialStrategy; } });
Object.defineProperty(exports, "calculateDrinkHistory", { enumerable: true, get: function () { return core_1.calculateDrinkHistory; } });
// ============================================
// Telegram-specific Formatters
// ============================================
function formatDrinkTelegram(decision) {
    const lines = [];
    // Header
    lines.push(`${decision.emoji} ${decision.headline}`);
    lines.push("");
    lines.push(decision.subheadline);
    lines.push("");
    // Data summary
    const { dataSummary } = decision;
    lines.push(`readiness ${dataSummary.readiness.value ?? "?"} / hrv ${dataSummary.hrv.trend} / sleep ${dataSummary.sleep.value ?? "?"}`);
    lines.push("");
    // Recommended limits
    lines.push("tonight's limit:");
    lines.push(`${decision.greenLimit} drinks: ${decision.impacts[decision.greenLimit - 1]?.recoveryTime || "normal tomorrow"}`);
    lines.push(`${decision.yellowLimit} drinks: ${decision.impacts[decision.yellowLimit - 1]?.recoveryTime || "afternoon recovery"}`);
    lines.push(`${decision.redThreshold}+ drinks: ${decision.impacts[Math.min(decision.redThreshold, 4)]?.recoveryTime || "multi-day recovery"}`);
    lines.push("");
    // Tips
    decision.tips.slice(0, 2).forEach((tip) => {
        lines.push(`• ${tip}`);
    });
    return lines.join("\n");
}
function formatSocialStrategyTelegram(strategy) {
    const lines = [];
    lines.push(`🍻 <b>${strategy.headline}</b>`);
    lines.push("");
    lines.push(`Tonight's max: <b>${strategy.limit} drinks</b>`);
    lines.push("");
    lines.push("<b>Strategy:</b>");
    strategy.tips.forEach((tip, i) => {
        lines.push(`${i + 1}. ${tip}`);
    });
    return lines.join("\n");
}
function formatDrinkLogTelegram(amount, decision) {
    const lines = [];
    lines.push(`✅ <b>Logged: ${amount} drink${amount > 1 ? "s" : ""}</b>`);
    lines.push("");
    // Find impact for this amount
    const impact = decision.impacts.find((i) => i.drinks === amount) ||
        decision.impacts[decision.impacts.length - 1];
    lines.push("<b>Tomorrow's Forecast:</b>");
    lines.push(`  HRV: ${impact.hrvDrop} expected`);
    lines.push(`  Fatigue: ${impact.fatigue}`);
    lines.push(`  Recovery: ${impact.recoveryTime}`);
    lines.push("");
    if (amount > decision.greenLimit) {
        lines.push("💤 Early bedtime will help recovery");
    }
    else {
        lines.push("👍 Within your safe limit - nice job!");
    }
    return lines.join("\n");
}
function formatDrinkHistoryTelegram(history) {
    const lines = [];
    lines.push("📈 <b>Your Drinking Patterns</b>");
    lines.push("");
    lines.push("<b>Last 30 Days:</b>");
    lines.push(`  Avg per week: ${history.avgPerWeek.toFixed(1)} sessions`);
    lines.push(`  Avg per session: ${history.avgPerSession.toFixed(1)} drinks`);
    lines.push("");
    if (history.patterns.length > 0) {
        lines.push("<b>Your Impact Patterns:</b>");
        history.patterns.forEach((p) => {
            lines.push(`  ${p.drinks} drinks → HRV -${p.avgHrvDrop}%, ${p.avgRecoveryDays}d recovery`);
        });
        lines.push("");
    }
    if (history.personalSafeLimit) {
        lines.push(`🎯 <b>Your Safe Limit:</b> ${history.personalSafeLimit} drinks`);
        lines.push("<i>(Based on your personal data)</i>");
    }
    // Recent logs
    if (history.logs.length > 0) {
        lines.push("");
        lines.push("<b>Recent:</b>");
        history.logs.slice(0, 5).forEach((log) => {
            lines.push(`  ${log.date}: ${log.amount} drinks`);
        });
    }
    return lines.join("\n");
}
