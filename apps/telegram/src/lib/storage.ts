// Simple in-memory storage for MVP
// TODO: Replace with Supabase for production

import { DrinkLog } from "./drink";

interface UserData {
  telegramId: number;
  ouraToken?: string;
  morningAlertTime?: string;
  timezone?: string;
  createdAt: Date;
  lastCheckAt?: Date;
  drinkLogs?: DrinkLog[];
}

const users = new Map<number, UserData>();

export function getUser(telegramId: number): UserData | undefined {
  return users.get(telegramId);
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
  return updated;
}

export function setOuraToken(telegramId: number, token: string): void {
  setUser(telegramId, { ouraToken: token });
}

export function getOuraToken(telegramId: number): string | undefined {
  return users.get(telegramId)?.ouraToken;
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
