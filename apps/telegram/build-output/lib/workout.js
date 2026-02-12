"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSportGuide = exports.getSportList = exports.parseSport = exports.getWorkoutDecision = void 0;
exports.formatWorkoutTelegram = formatWorkoutTelegram;
exports.formatWorkoutShort = formatWorkoutShort;
// Re-export algorithm functions from core
var core_1 = require("@p360/core");
Object.defineProperty(exports, "getWorkoutDecision", { enumerable: true, get: function () { return core_1.getWorkoutDecision; } });
Object.defineProperty(exports, "parseSport", { enumerable: true, get: function () { return core_1.parseSport; } });
Object.defineProperty(exports, "getSportList", { enumerable: true, get: function () { return core_1.getSportList; } });
Object.defineProperty(exports, "getSportGuide", { enumerable: true, get: function () { return core_1.getSportGuide; } });
// ============================================
// Telegram-specific Formatters
// ============================================
function formatWorkoutTelegram(decision) {
    const lines = [];
    // Header
    lines.push(`${decision.emoji} <b>${decision.headline}</b>`);
    lines.push("");
    lines.push(`<i>${decision.subheadline}</i>`);
    lines.push("");
    // Data summary (compact)
    const { dataSummary } = decision;
    lines.push(`📊 Readiness <b>${dataSummary.readiness.value ?? "?"}</b> • HRV <b>${dataSummary.hrv.trend}</b> • Sleep <b>${dataSummary.sleep.value ?? "?"}</b>`);
    lines.push("");
    // Why this verdict
    lines.push("<b>📋 Why:</b>");
    decision.reasoning.forEach((reason) => {
        lines.push(`  → ${reason}`);
    });
    lines.push("");
    // Intensity guide
    lines.push("<b>🎯 Intensity:</b>");
    if (decision.intensityGuide.cardio) {
        lines.push(`  Cardio: ${decision.intensityGuide.cardio}`);
    }
    if (decision.intensityGuide.weights) {
        lines.push(`  Weights: ${decision.intensityGuide.weights}`);
    }
    if (decision.intensityGuide.rpe) {
        lines.push(`  Effort: ${decision.intensityGuide.rpe}`);
    }
    // Sport-specific guide
    if (decision.sportGuide) {
        const sg = decision.sportGuide;
        lines.push("");
        lines.push(`<b>🏀 ${sg.displayName}:</b>`);
        lines.push(`  ${sg.todayAdvice}`);
        sg.intensityTips.slice(0, 3).forEach((tip) => {
            lines.push(`  → ${tip}`);
        });
        if (sg.cautionNotes && sg.cautionNotes.length > 0) {
            lines.push(`  ⚠️ ${sg.cautionNotes[0]}`);
        }
    }
    lines.push("");
    lines.push(`📅 <b>Tomorrow:</b> ${decision.tomorrowOutlook}`);
    return lines.join("\n");
}
function formatWorkoutShort(decision) {
    const { dataSummary } = decision;
    return `${decision.emoji} ${decision.headline}\nReadiness ${dataSummary.readiness.value ?? "?"} • HRV ${dataSummary.hrv.trend}`;
}
