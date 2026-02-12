export { getDrinkDecision, getSocialStrategy, calculateDrinkHistory, } from "@p360/core";
export type { DrinkLog, DrinkVerdict, DrinkImpact, DrinkDecision, DrinkHistory, SocialStrategy, } from "@p360/core";
import type { DrinkDecision, DrinkHistory, SocialStrategy } from "@p360/core";
export declare function formatDrinkTelegram(decision: DrinkDecision): string;
export declare function formatSocialStrategyTelegram(strategy: SocialStrategy): string;
export declare function formatDrinkLogTelegram(amount: number, decision: DrinkDecision): string;
export declare function formatDrinkHistoryTelegram(history: DrinkHistory): string;
