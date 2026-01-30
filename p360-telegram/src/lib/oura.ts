import { BiometricData, OuraDailySleep, OuraDailyReadiness } from "./types";

const OURA_API_BASE = "https://api.ouraring.com/v2";

// Demo data for testing without Oura
const DEMO_DATA: BiometricData = {
  sleepScore: 72,
  readinessScore: 65,
  hrvBalance: 45,
  restingHR: 58,
  date: new Date().toISOString().split("T")[0],
};

export async function fetchBiometricData(
  accessToken: string
): Promise<BiometricData> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    const [sleepData, readinessData] = await Promise.all([
      fetchSleepData(accessToken, yesterday, today),
      fetchReadinessData(accessToken, yesterday, today),
    ]);

    return parseBiometricData(sleepData, readinessData);
  } catch (error) {
    console.error("Error fetching Oura data:", error);
    throw error;
  }
}

async function fetchSleepData(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<OuraDailySleep[]> {
  const url = `${OURA_API_BASE}/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
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
    headers: { Authorization: `Bearer ${accessToken}` },
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
  const latestSleep = sleepData[sleepData.length - 1];
  const latestReadiness = readinessData[readinessData.length - 1];

  return {
    sleepScore: latestSleep?.score ?? null,
    readinessScore: latestReadiness?.score ?? null,
    hrvBalance: latestReadiness?.contributors?.hrv_balance ?? null,
    restingHR: latestReadiness?.contributors?.resting_heart_rate ?? null,
    date:
      latestReadiness?.day ??
      latestSleep?.day ??
      new Date().toISOString().split("T")[0],
  };
}

export function getDemoData(): BiometricData {
  return DEMO_DATA;
}

export function getRandomDemoData(): BiometricData {
  const scenarios = [
    { sleepScore: 88, readinessScore: 85, hrvBalance: 65, restingHR: 52 },
    { sleepScore: 75, readinessScore: 72, hrvBalance: 55, restingHR: 55 },
    { sleepScore: 65, readinessScore: 58, hrvBalance: 45, restingHR: 58 },
    { sleepScore: 55, readinessScore: 42, hrvBalance: 35, restingHR: 62 },
    { sleepScore: 45, readinessScore: 28, hrvBalance: 25, restingHR: 68 },
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

  return {
    ...scenario,
    date: new Date().toISOString().split("T")[0],
  };
}
