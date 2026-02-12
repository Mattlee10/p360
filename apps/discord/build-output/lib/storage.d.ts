import type { ProviderType, MoodEntry, DrinkLog } from "@p360/core";
interface UserData {
    discordId: string;
    provider?: ProviderType;
    providerToken?: string;
    createdAt: Date;
    lastCheckAt?: Date;
    drinkLogs?: DrinkLog[];
    moodEntries?: MoodEntry[];
    recoveryHistory?: number[];
}
export declare function getUser(discordId: string): UserData | undefined;
export declare function setUser(discordId: string, data: Partial<UserData>): UserData;
export declare function setProvider(discordId: string, provider: ProviderType, token: string): void;
export declare function getProvider(discordId: string): ProviderType | undefined;
export declare function getProviderToken(discordId: string): string | undefined;
export declare function hasConnectedDevice(discordId: string): boolean;
export declare function updateLastCheck(discordId: string): void;
export declare function addDrinkLog(discordId: string, amount: number): DrinkLog;
export declare function getDrinkLogs(discordId: string): DrinkLog[];
export declare function addMoodEntry(discordId: string, score: number, note?: string): MoodEntry;
export declare function getMoodEntries(discordId: string): MoodEntry[];
export declare function addRecoveryScore(discordId: string, readiness: number): void;
export declare function getRecoveryHistory(discordId: string): number[];
export declare function getAllUsers(): UserData[];
export {};
