import { BiometricData } from "../types";
import { BiometricProvider } from "./provider";
import { OuraDailySleep, OuraDailyReadiness } from "./oura.types";

const OURA_API_BASE = "https://api.ouraring.com/v2";

/**
 * OuraProvider - Oura Ring API integration
 *
 * Fetches biometric data from Oura Ring API v2.
 * Uses Personal Access Token (PAT) authentication.
 */
export class OuraProvider implements BiometricProvider {
  readonly name = "oura";
  readonly displayName = "Oura Ring";

  /**
   * Fetch today's biometric data from Oura API
   */
  async fetchBiometricData(token: string): Promise<BiometricData> {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    const [sleepData, readinessData] = await Promise.all([
      this.fetchSleepData(token, yesterday, today),
      this.fetchReadinessData(token, yesterday, today),
    ]);

    return this.parseBiometricData(sleepData, readinessData);
  }

  /**
   * Validate that the token is working by hitting the personal_info endpoint
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${OURA_API_BASE}/usercollection/personal_info`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private async fetchSleepData(
    token: string,
    startDate: string,
    endDate: string
  ): Promise<OuraDailySleep[]> {
    const url = `${OURA_API_BASE}/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Oura API error: HTTP ${response.status}`);
    }

    const data = (await response.json()) as { data: OuraDailySleep[] };
    return data.data || [];
  }

  private async fetchReadinessData(
    token: string,
    startDate: string,
    endDate: string
  ): Promise<OuraDailyReadiness[]> {
    const url = `${OURA_API_BASE}/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Oura API error: HTTP ${response.status}`);
    }

    const data = (await response.json()) as { data: OuraDailyReadiness[] };
    return data.data || [];
  }

  private parseBiometricData(
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
}
