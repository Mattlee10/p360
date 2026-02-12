import { getOuraTokens, setOuraTokens } from "./config";
import type { BiometricData, OuraDailySleep, OuraDailyReadiness } from "@p360/core";
import { getRandomDemoData as coreGetRandomDemoData } from "@p360/core";

const OURA_API_BASE = "https://api.ouraring.com/v2";
const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";
const OURA_CLIENT_ID = process.env.OURA_CLIENT_ID || "";
const OURA_CLIENT_SECRET = process.env.OURA_CLIENT_SECRET || "";

// Demo data for testing without Oura
const DEMO_DATA: BiometricData = {
  sleepScore: 72,
  readinessScore: 65,
  hrvBalance: 45,
  restingHR: 58,
  date: new Date().toISOString().split("T")[0],
};

async function refreshAccessToken(refreshToken: string): Promise<boolean> {
  if (!OURA_CLIENT_ID || !OURA_CLIENT_SECRET) {
    console.log("OAuth credentials not set. Cannot refresh token.");
    return false;
  }

  try {
    const params = new URLSearchParams();
    params.set("grant_type", "refresh_token");
    params.set("refresh_token", refreshToken);
    params.set("client_id", OURA_CLIENT_ID);
    params.set("client_secret", OURA_CLIENT_SECRET);

    const response = await fetch(OURA_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      console.log(`Token refresh failed: ${response.status}`);
      return false;
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    setOuraTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    });

    console.log("  ✅ Token refreshed automatically");
    return true;
  } catch (error) {
    console.log("Token refresh error:", error);
    return false;
  }
}

export async function fetchBiometricData(): Promise<BiometricData> {
  let tokens = getOuraTokens();

  if (!tokens) {
    console.log("No Oura tokens found. Using demo data.");
    return DEMO_DATA;
  }

  // Check if token needs refresh (with 5 min buffer)
  if (Date.now() >= tokens.expiresAt - 5 * 60 * 1000) {
    if (tokens.refreshToken) {
      console.log("  Token expired, refreshing...");
      const refreshed = await refreshAccessToken(tokens.refreshToken);
      if (refreshed) {
        tokens = getOuraTokens()!;
      } else {
        console.log("Token refresh failed. Please run 'p360 login' again.");
        return DEMO_DATA;
      }
    } else {
      console.log("Token expired and no refresh token. Please run 'p360 login' again.");
      return DEMO_DATA;
    }
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    const [sleepData, readinessData] = await Promise.all([
      fetchSleepData(tokens.accessToken, yesterday, today),
      fetchReadinessData(tokens.accessToken, yesterday, today),
    ]);

    return parseBiometricData(sleepData, readinessData);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("401")) {
        // Try refresh once
        if (tokens.refreshToken) {
          const refreshed = await refreshAccessToken(tokens.refreshToken);
          if (refreshed) {
            return fetchBiometricData(); // Retry with new token
          }
        }
        console.log("Oura token invalid. Please run 'p360 login' again.");
      } else if (error.message.includes("403")) {
        console.log("Oura API access denied. Check your permissions.");
      } else {
        console.log(`Error fetching data: ${error.message}`);
      }
    }
    console.log("Using demo data as fallback.");
    return DEMO_DATA;
  }
}

async function fetchSleepData(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<OuraDailySleep[]> {
  const url = `${OURA_API_BASE}/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = (await response.json()) as { data: OuraDailySleep[] };
  return data.data || [];
}

async function fetchReadinessData(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<OuraDailyReadiness[]> {
  const url = `${OURA_API_BASE}/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = (await response.json()) as { data: OuraDailyReadiness[] };
  return data.data || [];
}

function parseBiometricData(
  sleepData: OuraDailySleep[],
  readinessData: OuraDailyReadiness[]
): BiometricData {
  // Get most recent data
  const latestSleep = sleepData[sleepData.length - 1];
  const latestReadiness = readinessData[readinessData.length - 1];

  return {
    sleepScore: latestSleep?.score ?? null,
    readinessScore: latestReadiness?.score ?? null,
    hrvBalance: latestReadiness?.contributors?.hrv_balance ?? null,
    restingHR: latestReadiness?.contributors?.resting_heart_rate ?? null,
    date: latestReadiness?.day ?? latestSleep?.day ?? new Date().toISOString().split("T")[0],
  };
}

export function getDemoData(): BiometricData {
  return DEMO_DATA;
}

export function getRandomDemoData(): BiometricData {
  return coreGetRandomDemoData();
}
