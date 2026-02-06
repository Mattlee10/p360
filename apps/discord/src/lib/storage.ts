// Simple in-memory storage for MVP
// TODO: Replace with Supabase for production

import type { ProviderType, MoodEntry, DrinkLog } from "@p360/core";

interface UserData {
  discordId: string; // Discord uses string snowflake IDs
  provider?: ProviderType;
  providerToken?: string;
  createdAt: Date;
  lastCheckAt?: Date;
  drinkLogs?: DrinkLog[];
  moodEntries?: MoodEntry[];
  recoveryHistory?: number[];
}

const users = new Map<string, UserData>();

export function getUser(discordId: string): UserData | undefined {
  return users.get(discordId);
}

export function setUser(discordId: string, data: Partial<UserData>): UserData {
  const existing = users.get(discordId);
  const updated: UserData = {
    discordId,
    createdAt: existing?.createdAt ?? new Date(),
    ...existing,
    ...data,
  };
  users.set(discordId, updated);
  return updated;
}

export function setProvider(
  discordId: string,
  provider: ProviderType,
  token: string
): void {
  setUser(discordId, { provider, providerToken: token });
}

export function getProvider(discordId: string): ProviderType | undefined {
  return users.get(discordId)?.provider;
}

export function getProviderToken(discordId: string): string | undefined {
  return users.get(discordId)?.providerToken;
}

export function hasConnectedDevice(discordId: string): boolean {
  return !!users.get(discordId)?.providerToken;
}

export function updateLastCheck(discordId: string): void {
  const user = users.get(discordId);
  if (user) {
    user.lastCheckAt = new Date();
  }
}

// Drink logs
export function addDrinkLog(discordId: string, amount: number): DrinkLog {
  const user = users.get(discordId);
  const now = new Date();
  const log: DrinkLog = {
    date: now.toISOString().split("T")[0],
    amount,
    timestamp: now,
  };

  if (user) {
    user.drinkLogs = user.drinkLogs || [];
    user.drinkLogs.push(log);
  } else {
    setUser(discordId, { drinkLogs: [log] });
  }

  return log;
}

export function getDrinkLogs(discordId: string): DrinkLog[] {
  return users.get(discordId)?.drinkLogs || [];
}

// Mood tracking
export function addMoodEntry(
  discordId: string,
  score: number,
  note?: string
): MoodEntry {
  const user = users.get(discordId);
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const entry: MoodEntry = {
    date: today,
    score,
    timestamp: now,
    note,
  };

  if (user) {
    user.moodEntries = user.moodEntries || [];
    const existingIndex = user.moodEntries.findIndex((e) => e.date === today);
    if (existingIndex >= 0) {
      user.moodEntries[existingIndex] = entry;
    } else {
      user.moodEntries.push(entry);
    }
    if (user.moodEntries.length > 30) {
      user.moodEntries = user.moodEntries.slice(-30);
    }
  } else {
    setUser(discordId, { moodEntries: [entry] });
  }

  return entry;
}

export function getMoodEntries(discordId: string): MoodEntry[] {
  return users.get(discordId)?.moodEntries || [];
}

export function addRecoveryScore(discordId: string, readiness: number): void {
  const user = users.get(discordId);

  if (user) {
    user.recoveryHistory = user.recoveryHistory || [];
    user.recoveryHistory.push(readiness);
    if (user.recoveryHistory.length > 30) {
      user.recoveryHistory = user.recoveryHistory.slice(-30);
    }
  } else {
    setUser(discordId, { recoveryHistory: [readiness] });
  }
}

export function getRecoveryHistory(discordId: string): number[] {
  return users.get(discordId)?.recoveryHistory || [];
}

// Stats
export function getAllUsers(): UserData[] {
  return Array.from(users.values());
}
