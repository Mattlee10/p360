import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { OuraTokens } from "./types";

const CONFIG_DIR = path.join(os.homedir(), ".p360");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface Config {
  ouraTokens?: OuraTokens;
  userId?: string;
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
