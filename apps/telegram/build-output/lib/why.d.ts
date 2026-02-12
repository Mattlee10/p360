export { getWhyDecision, parseWhyInput, analyzeGap, } from "@p360/core";
export type { WhyCategory, WhyVerdict, GapDirection, WhyUserInput, GapAnalysis, WhyDataSummary, WhyDecision, } from "@p360/core";
import type { WhyDecision, WhyUserInput } from "@p360/core";
export declare function formatWhyTelegram(decision: WhyDecision, userInput?: WhyUserInput): string;
