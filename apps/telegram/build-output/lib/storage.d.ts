import type { ProviderType, MoodEntry } from "@p360/core";
import { DrinkLog } from "./drink";
interface UserData {
    telegramId: number;
    provider?: ProviderType;
    providerToken?: string;
    ouraToken?: string;
    morningAlertTime?: string;
    timezone?: string;
    createdAt: Date;
    lastCheckAt?: Date;
    drinkLogs?: DrinkLog[];
    moodEntries?: MoodEntry[];
    recoveryHistory?: number[];
}
export declare function getUser(telegramId: number): UserData | undefined;
export declare function setUser(telegramId: number, data: Partial<UserData>): UserData;
export declare function setOuraToken(telegramId: number, token: string): void;
export declare function getOuraToken(telegramId: number): string | undefined;
export declare function setProvider(telegramId: number, provider: ProviderType, token: string): void;
export declare function getProvider(telegramId: number): ProviderType | undefined;
export declare function getProviderToken(telegramId: number): string | undefined;
export declare function hasConnectedDevice(telegramId: number): boolean;
export declare function updateLastCheck(telegramId: number): void;
export declare function getAllUsers(): UserData[];
export declare function getUsersWithMorningAlert(): UserData[];
export declare function addDrinkLog(telegramId: number, amount: number): DrinkLog;
export declare function getDrinkLogs(telegramId: number): DrinkLog[];
export declare function addMoodEntry(telegramId: number, score: number, note?: string): MoodEntry;
export declare function getMoodEntries(telegramId: number): MoodEntry[];
export declare function getTodayMoodEntry(telegramId: number): MoodEntry | undefined;
export declare function addRecoveryScore(telegramId: number, readiness: number): void;
export declare function getRecoveryHistory(telegramId: number): number[];
export interface BotStats {
    totalUsers: number;
    connectedUsers: number;
    drinkUsers: number;
    workoutChecks: number;
    drinkChecks: number;
    whyChecks: number;
    todayNewUsers: number;
}
declare const commandCounts: {
    workout: number;
    drink: number;
    demo: number;
    drinkdemo: number;
    why: number;
    whydemo: number;
    cost: number;
    costdemo: number;
};
export declare function incrementCommandCount(command: keyof typeof commandCounts): void;
export declare function getCommandCounts(): {
    workout: number;
    drink: number;
    demo: number;
    drinkdemo: number;
    why: number;
    whydemo: number;
    cost: number;
    costdemo: number;
};
export declare function getBotStats(): BotStats;
export {};
