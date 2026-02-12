import { EmbedBuilder } from "discord.js";
import type { WorkoutDecision, DrinkDecision, WhyDecision, MoodDecision, DrinkHistory, MoodInsight, RecoveryCost } from "@p360/core";
export declare function formatWorkoutEmbed(decision: WorkoutDecision): EmbedBuilder;
export declare function formatDrinkEmbed(decision: DrinkDecision): EmbedBuilder;
export declare function formatWhyEmbed(decision: WhyDecision): EmbedBuilder;
export declare function formatMoodEmbed(decision: MoodDecision): EmbedBuilder;
export declare function formatMoodHistoryEmbed(insight: MoodInsight): EmbedBuilder;
export declare function formatDrinkHistoryEmbed(history: DrinkHistory): EmbedBuilder;
export declare function formatCostEmbed(cost: RecoveryCost): EmbedBuilder;
