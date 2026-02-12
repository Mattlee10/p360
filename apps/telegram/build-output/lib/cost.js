"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubstanceCategory = exports.getSubstanceList = exports.parseSubstance = exports.getRecoveryCost = void 0;
exports.formatCostTelegram = formatCostTelegram;
// Re-export algorithm functions from core
var core_1 = require("@p360/core");
Object.defineProperty(exports, "getRecoveryCost", { enumerable: true, get: function () { return core_1.getRecoveryCost; } });
Object.defineProperty(exports, "parseSubstance", { enumerable: true, get: function () { return core_1.parseSubstance; } });
Object.defineProperty(exports, "getSubstanceList", { enumerable: true, get: function () { return core_1.getSubstanceList; } });
Object.defineProperty(exports, "getSubstanceCategory", { enumerable: true, get: function () { return core_1.getSubstanceCategory; } });
// ============================================
// Telegram-specific Formatters
// ============================================
function formatCostTelegram(cost) {
    const lines = [];
    // Header
    lines.push(`${cost.emoji} <b>${cost.headline}</b>`);
    lines.push("");
    lines.push(cost.subheadline);
    lines.push("");
    // Data summary
    const { dataSummary } = cost;
    lines.push(`readiness ${dataSummary.readiness.value ?? "?"} / hrv ${dataSummary.hrv.trend} / sleep ${dataSummary.sleep.value ?? "?"}`);
    lines.push("");
    // Timeline
    if (cost.timeline.length > 0) {
        lines.push("<b>day-by-day forecast:</b>");
        for (const day of cost.timeline) {
            const parts = [];
            parts.push(`HRV ${day.hrvChange}%`);
            if (day.sleepImpact) {
                parts.push(day.sleepImpact);
            }
            parts.push(`workout: ${day.workoutCapacity}`);
            lines.push(`  ${day.label}: ${parts.join(", ")}`);
        }
        lines.push("");
    }
    // Tradeoff
    lines.push(`<b>${cost.tradeoff}</b>`);
    return lines.join("\n");
}
