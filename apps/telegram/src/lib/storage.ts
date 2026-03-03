// Hybrid storage: in-memory (L1 cache) + Supabase (L2 persistent)
// Railway 재시작 후에도 provider token, timezone 유지

import type { ProviderType, MoodEntry } from "@p360/core";
import { DrinkLog } from "./drink";
import {
  saveUserToSupabase,
  getUserFromSupabase,
  type PersistedUserData,
} from "./supabase-user-store";

interface UserData {
  telegramId: number;
  // Device provider configuration
  provider?: ProviderType; // "oura" | "whoop"
  providerToken?: string; // Token for the selected provider
  // Legacy field for backward compatibility
  ouraToken?: string;
  morningAlertTime?: string;
  timezone?: string;
  createdAt: Date;
  lastCheckAt?: Date;
  drinkLogs?: DrinkLog[];
  // Mood tracking (P17)
  moodEntries?: MoodEntry[];
  recoveryHistory?: number[]; // Last N readiness scores
}

const users = new Map<number, UserData>();

export function getUser(telegramId: number): UserData | undefined {
  return users.get(telegramId);
}

/**
 * in-memory miss 시 Supabase에서 로드 후 캐시에 저장
 * /connect, /ask 최초 호출 시 사용
 */
export async function getUserWithFallback(telegramId: number): Promise<UserData | undefined> {
  const cached = users.get(telegramId);
  if (cached) return cached;

  const persisted = await getUserFromSupabase(telegramId);
  if (!persisted) return undefined;

  // Supabase 데이터로 in-memory 복원
  const restored: UserData = {
    telegramId,
    provider: persisted.provider as ProviderType | undefined,
    providerToken: persisted.provider_token,
    ouraToken: persisted.oura_token,
    timezone: persisted.timezone,
    createdAt: persisted.created_at ? new Date(persisted.created_at) : new Date(),
  };
  users.set(telegramId, restored);
  return restored;
}

/**
 * Supabase에서 전체 유저 목록을 in-memory로 preload
 * 앱 시작 시 호출
 */
export function preloadUsers(persistedUsers: PersistedUserData[]): void {
  for (const p of persistedUsers) {
    if (!users.has(p.telegram_id)) {
      users.set(p.telegram_id, {
        telegramId: p.telegram_id,
        provider: p.provider as ProviderType | undefined,
        providerToken: p.provider_token,
        ouraToken: p.oura_token,
        timezone: p.timezone,
        createdAt: p.created_at ? new Date(p.created_at) : new Date(),
      });
    }
  }
  console.log(`[storage] Preloaded ${persistedUsers.length} users from Supabase`);
}

export function setUser(telegramId: number, data: Partial<UserData>): UserData {
  const existing = users.get(telegramId);
  const updated: UserData = {
    telegramId,
    createdAt: existing?.createdAt ?? new Date(),
    ...existing,
    ...data,
  };
  users.set(telegramId, updated);

  // Supabase 영구 저장 (fire-and-forget) — critical fields only
  const persisted: PersistedUserData = {
    telegram_id: telegramId,
    provider: updated.provider,
    provider_token: updated.providerToken,
    oura_token: updated.ouraToken,
    timezone: updated.timezone,
    created_at: updated.createdAt.toISOString(),
  };
  saveUserToSupabase(persisted).catch(() => {});

  return updated;
}

export function setOuraToken(telegramId: number, token: string): void {
  setUser(telegramId, { ouraToken: token });
}

export function getOuraToken(telegramId: number): string | undefined {
  return users.get(telegramId)?.ouraToken;
}

// Multi-device provider functions
export function setProvider(telegramId: number, provider: ProviderType, token: string): void {
  setUser(telegramId, { provider, providerToken: token });
  // Also set ouraToken for backward compatibility if Oura
  if (provider === "oura") {
    setUser(telegramId, { ouraToken: token });
  }
}

export function getProvider(telegramId: number): ProviderType | undefined {
  const user = users.get(telegramId);
  // Default to oura if legacy ouraToken exists but no provider set
  if (user?.ouraToken && !user.provider) {
    return "oura";
  }
  return user?.provider;
}

export function getProviderToken(telegramId: number): string | undefined {
  const user = users.get(telegramId);
  // Try providerToken first, fall back to legacy ouraToken
  return user?.providerToken || user?.ouraToken;
}

export function hasConnectedDevice(telegramId: number): boolean {
  const user = users.get(telegramId);
  return !!(user?.providerToken || user?.ouraToken);
}

export function updateLastCheck(telegramId: number): void {
  const user = users.get(telegramId);
  if (user) {
    user.lastCheckAt = new Date();
  }
}

export function getAllUsers(): UserData[] {
  return Array.from(users.values());
}

export function getUsersWithMorningAlert(): UserData[] {
  return getAllUsers().filter((u) => u.ouraToken && u.morningAlertTime);
}

export interface ConnectedUser {
  telegramId: number;
  providerToken: string;
}

export function getConnectedUsers(): ConnectedUser[] {
  return getAllUsers()
    .filter((u) => u.providerToken || u.ouraToken)
    .map((u) => ({
      telegramId: u.telegramId,
      providerToken: (u.providerToken || u.ouraToken) as string,
    }));
}

// Drink log functions
export function addDrinkLog(telegramId: number, amount: number): DrinkLog {
  const user = users.get(telegramId);
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
    setUser(telegramId, { drinkLogs: [log] });
  }

  return log;
}

export function getDrinkLogs(telegramId: number): DrinkLog[] {
  return users.get(telegramId)?.drinkLogs || [];
}

// ============================================
// Mood Tracking (P17)
// ============================================

export function addMoodEntry(
  telegramId: number,
  score: number,
  note?: string
): MoodEntry {
  const user = users.get(telegramId);
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

    // Replace entry if already logged today
    const existingIndex = user.moodEntries.findIndex((e) => e.date === today);
    if (existingIndex >= 0) {
      user.moodEntries[existingIndex] = entry;
    } else {
      user.moodEntries.push(entry);
    }

    // Keep only last 30 entries
    if (user.moodEntries.length > 30) {
      user.moodEntries = user.moodEntries.slice(-30);
    }
  } else {
    setUser(telegramId, { moodEntries: [entry] });
  }

  return entry;
}

export function getMoodEntries(telegramId: number): MoodEntry[] {
  return users.get(telegramId)?.moodEntries || [];
}

export function getTodayMoodEntry(telegramId: number): MoodEntry | undefined {
  const today = new Date().toISOString().split("T")[0];
  const entries = getMoodEntries(telegramId);
  return entries.find((e) => e.date === today);
}

export function addRecoveryScore(telegramId: number, readiness: number): void {
  const user = users.get(telegramId);

  if (user) {
    user.recoveryHistory = user.recoveryHistory || [];
    user.recoveryHistory.push(readiness);

    // Keep only last 30 entries
    if (user.recoveryHistory.length > 30) {
      user.recoveryHistory = user.recoveryHistory.slice(-30);
    }
  } else {
    setUser(telegramId, { recoveryHistory: [readiness] });
  }
}

export function getRecoveryHistory(telegramId: number): number[] {
  return users.get(telegramId)?.recoveryHistory || [];
}

// Stats functions
export interface BotStats {
  totalUsers: number;
  connectedUsers: number;
  drinkUsers: number;
  workoutChecks: number;
  drinkChecks: number;
  whyChecks: number;
  todayNewUsers: number;
}

// Command usage counters (in-memory, resets on restart)
const commandCounts = {
  workout: 0,
  drink: 0,
  demo: 0,
  drinkdemo: 0,
  why: 0,
  whydemo: 0,
  cost: 0,
  costdemo: 0,
  ask: 0,
  askdemo: 0,
};

export function incrementCommandCount(command: keyof typeof commandCounts): void {
  commandCounts[command]++;
}

export function getCommandCounts() {
  return { ...commandCounts };
}

export function getBotStats(): BotStats {
  const allUsers = getAllUsers();
  const today = new Date().toISOString().split("T")[0];

  return {
    totalUsers: allUsers.length,
    connectedUsers: allUsers.filter(u => u.ouraToken).length,
    drinkUsers: allUsers.filter(u => u.drinkLogs && u.drinkLogs.length > 0).length,
    workoutChecks: commandCounts.workout + commandCounts.demo,
    drinkChecks: commandCounts.drink + commandCounts.drinkdemo,
    whyChecks: commandCounts.why + commandCounts.whydemo,
    todayNewUsers: allUsers.filter(u => u.createdAt.toISOString().split("T")[0] === today).length,
  };
}
