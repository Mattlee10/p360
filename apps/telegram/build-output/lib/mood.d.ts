export { getMoodAttribution, getMoodDecision, calculateMoodInsight, calculatePearsonCorrelation, } from "@p360/core";
export type { MoodEntry, MoodScenario, MoodAttribution, MoodInsight, MoodDecision, } from "@p360/core";
import type { MoodDecision, MoodInsight } from "@p360/core";
export declare function formatMoodTelegram(decision: MoodDecision): string;
export declare function formatMoodHistoryTelegram(insight: MoodInsight): string;
export declare function formatMoodLoggedTelegram(score: number, attribution: {
    emoji: string;
    headline: string;
    isPhysiological: boolean;
}): string;
