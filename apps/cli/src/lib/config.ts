import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { MoodEntry } from "@p360/core";

interface DrinkLog {
  date: string;
  amount: number;
  timestamp: Date;
}

const CONFIG_DIR = path.join(os.homedir(), ".p360");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export interface OuraTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface StoredDrinkLog {
  date: string;
  amount: number;
  timestamp: string;
}

interface StoredMoodEntry {
  date: string;
  score: number;
  timestamp: string;
  note?: string;
}

interface Config {
  ouraTokens?: OuraTokens;
  userId?: string;
  drinkHistory?: StoredDrinkLog[];
  moodHistory?: StoredMoodEntry[];
  anthropicApiKey?: string;
}

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function readConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch {
    // Ignore errors, return empty config
  }
  return {};
}

function writeConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// ============================================
// Oura Tokens
// ============================================

export function getOuraTokens(): OuraTokens | undefined {
  return readConfig().ouraTokens;
}

export function setOuraTokens(tokens: OuraTokens): void {
  const config = readConfig();
  config.ouraTokens = tokens;
  writeConfig(config);
}

export function clearOuraTokens(): void {
  const config = readConfig();
  delete config.ouraTokens;
  writeConfig(config);
}

export function isLoggedIn(): boolean {
  const tokens = getOuraTokens();
  return !!tokens?.accessToken;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

// ============================================
// Drink History
// ============================================

export function getDrinkHistory(): DrinkLog[] {
  const config = readConfig();
  return (config.drinkHistory || []).map((log) => ({
    ...log,
    timestamp: new Date(log.timestamp),
  }));
}

export function addDrinkLog(log: DrinkLog): void {
  const config = readConfig();
  if (!config.drinkHistory) {
    config.drinkHistory = [];
  }
  config.drinkHistory.push({
    date: log.date,
    amount: log.amount,
    timestamp: log.timestamp.toISOString(),
  });
  // Keep last 90 days
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  config.drinkHistory = config.drinkHistory.filter((l) => l.timestamp >= cutoff);
  writeConfig(config);
}

// ============================================
// Mood History
// ============================================

export function getMoodHistory(): MoodEntry[] {
  const config = readConfig();
  return (config.moodHistory || []).map((entry) => ({
    ...entry,
    timestamp: new Date(entry.timestamp),
  }));
}

export function addMoodEntry(entry: MoodEntry): void {
  const config = readConfig();
  if (!config.moodHistory) {
    config.moodHistory = [];
  }
  config.moodHistory.push({
    date: entry.date,
    score: entry.score,
    timestamp: entry.timestamp.toISOString(),
    note: entry.note,
  });
  // Keep last 90 days
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  config.moodHistory = config.moodHistory.filter((e) => e.timestamp >= cutoff);
  writeConfig(config);
}

// ============================================
// Anthropic API Key
// ============================================

export function getAnthropicApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY || readConfig().anthropicApiKey;
}

export function setAnthropicApiKey(key: string): void {
  const config = readConfig();
  config.anthropicApiKey = key;
  writeConfig(config);
}
