"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeGap = exports.parseWhyInput = exports.getWhyDecision = void 0;
exports.formatWhyTelegram = formatWhyTelegram;
// Re-export algorithm functions from core
var core_1 = require("@p360/core");
Object.defineProperty(exports, "getWhyDecision", { enumerable: true, get: function () { return core_1.getWhyDecision; } });
Object.defineProperty(exports, "parseWhyInput", { enumerable: true, get: function () { return core_1.parseWhyInput; } });
Object.defineProperty(exports, "analyzeGap", { enumerable: true, get: function () { return core_1.analyzeGap; } });
// ============================================
// Telegram-specific Formatters
// ============================================
function formatWhyTelegram(decision, userInput) {
    const lines = [];
    // Header
    lines.push(`${decision.emoji} <b>${decision.headline}</b>`);
    lines.push("");
    // User input echo (if provided)
    if (userInput?.rawText && userInput.rawText.trim()) {
        const scoreText = userInput.subjectiveScore
            ? ` (${userInput.subjectiveScore}/10)`
            : "";
        lines.push(`<i>You said: "${userInput.rawText}"${scoreText}</i>`);
        lines.push("");
    }
    lines.push(`<i>${decision.subheadline}</i>`);
    lines.push("");
    // Data summary
    lines.push("<b>📊 Your Body Says:</b>");
    const { dataSummary } = decision;
    lines.push(`  • Readiness: <b>${dataSummary.readiness.value ?? "?"}</b> (${dataSummary.readiness.status})`);
    lines.push(`  • HRV: <b>${dataSummary.hrv.trend}</b>`);
    lines.push(`  • Sleep: <b>${dataSummary.sleep.value ?? "?"}</b>`);
    lines.push("");
    // Gap analysis (if available)
    if (decision.gapAnalysis) {
        lines.push("<b>🔍 Gap Analysis:</b>");
        lines.push(`  You feel: ${decision.gapAnalysis.subjectiveScore}/10`);
        lines.push(`  Body says: ${decision.gapAnalysis.objectiveScore}/10`);
        lines.push(`  → ${decision.gapAnalysis.explanation.split("\n")[0]}`);
        lines.push("");
    }
    // Explanation
    lines.push("<b>💡 Why you feel this way:</b>");
    decision.explanation.split("\n").forEach((line) => {
        lines.push(`  ${line}`);
    });
    lines.push("");
    lines.push(`  <i>${decision.mindBodyStatement}</i>`);
    lines.push("");
    // Recommendations
    lines.push("<b>🎯 What to do:</b>");
    decision.recommendations.forEach((rec) => {
        lines.push(`  • ${rec}`);
    });
    lines.push("");
    // Risk warning (only for physiological/mixed)
    if (decision.verdict !== "psychological") {
        lines.push(`<b>⚠️ If you push through:</b>`);
        lines.push(`  ${decision.risk}`);
    }
    return lines.join("\n");
}
