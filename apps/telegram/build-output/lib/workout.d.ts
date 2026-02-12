export { getWorkoutDecision, parseSport, getSportList, getSportGuide, } from "@p360/core";
export type { WorkoutDecision, WorkoutVerdict, Sport, SportGuide } from "@p360/core";
import type { WorkoutDecision } from "@p360/core";
export declare function formatWorkoutTelegram(decision: WorkoutDecision): string;
export declare function formatWorkoutShort(decision: WorkoutDecision): string;
