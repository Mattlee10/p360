// Simple in-memory storage for MVP
// TODO: Replace with Supabase for production

interface UserData {
  telegramId: number;
  ouraToken?: string;
  morningAlertTime?: string;
  timezone?: string;
  createdAt: Date;
  lastCheckAt?: Date;
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
