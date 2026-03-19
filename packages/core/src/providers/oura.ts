import { BiometricData, BiometricHistory } from "../types";
import { BiometricProvider } from "./provider";
import { OuraDailySleep, OuraDailyReadiness, OuraDailyActivity, OuraSleepSession } from "./oura.types";

const OURA_API_BASE = "https://api.ouraring.com/v2";

/**
 * Extract local bedtime hour from Oura's ISO 8601 string.
 * Oura stores times in the user's local timezone, so we parse the T part directly.
 * Early-morning hours (0-4 AM) are normalized to 24-28 range so regression treats
 * them as "later than midnight" rather than "earlier than noon".
 *
 * Examples:
 *   "2024-01-01T23:30:00+09:00" → 23.5
 *   "2024-01-02T00:30:00+09:00" → 24.5  (0:30 AM treated as 24.5)
 *   "2024-01-02T01:00:00+09:00" → 25.0
 */
function parseLocalBedtimeHour(isoStr: string): number | null {
  const match = isoStr.match(/T(\d{2}):(\d{2}):/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  let hour = h + m / 60;
  // Normalize 0-4 AM → 24-28 (continuation of the previous night)
  if (hour < 4) hour += 24;
  return hour;
}

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
   * Fetch today's biometric data from Oura API (with 60-day history)
   */
  async fetchBiometricData(token: string): Promise<BiometricData> {
    const today = new Date().toISOString().split("T")[0];
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000)
      .toISOString()
      .split("T")[0];

    const [sleepData, readinessData, sleepSessions] = await Promise.all([
      this.fetchSleepData(token, sixtyDaysAgo, today),
      this.fetchReadinessData(token, sixtyDaysAgo, today),
      this.fetchSleepSessions(token, sixtyDaysAgo, today),
    ]);

    const history = this.buildHistory(sleepData, readinessData, sleepSessions);
    return this.parseBiometricData(sleepData, readinessData, history, sleepSessions);
  }

  /**
   * Fetch Oura daily activity data for a date range
   */
  async fetchActivityData(
    token: string,
    startDate: string,
    endDate: string
  ): Promise<OuraDailyActivity[]> {
    const url = `${OURA_API_BASE}/usercollection/daily_activity?start_date=${startDate}&end_date=${endDate}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Oura API error: HTTP ${response.status}`);
    }

    const data = (await response.json()) as { data: OuraDailyActivity[] };
    return data.data || [];
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

  private async fetchSleepSessions(
    token: string,
    startDate: string,
    endDate: string
  ): Promise<OuraSleepSession[]> {
    const url = `${OURA_API_BASE}/usercollection/sleep?start_date=${startDate}&end_date=${endDate}`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return [];

      const data = (await response.json()) as { data: OuraSleepSession[] };
      // Only long_sleep = main nightly sleep (exclude naps, rest)
      return (data.data || []).filter((s) => s.type === "long_sleep");
    } catch {
      return [];
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
    readinessData: OuraDailyReadiness[],
    history?: BiometricHistory,
    sleepSessions?: OuraSleepSession[]
  ): BiometricData {
    const latestSleep = sleepData[sleepData.length - 1];
    const latestReadiness = readinessData[readinessData.length - 1];
    const today = latestReadiness?.day ?? latestSleep?.day ?? new Date().toISOString().split("T")[0];

    // Find today's main sleep session for bedtime + deep sleep minutes
    const todaySession = sleepSessions?.find((s) => s.day === today);
    const bedtimeHour = todaySession ? parseLocalBedtimeHour(todaySession.bedtime_start) : null;
    const deepSleepMinutes = todaySession?.deep_sleep_duration != null
      ? Math.round(todaySession.deep_sleep_duration / 60)
      : null;

    return {
      sleepScore: latestSleep?.score ?? null,
      readinessScore: latestReadiness?.score ?? null,
      hrvBalance: latestReadiness?.contributors?.hrv_balance ?? null,
      restingHR: latestReadiness?.contributors?.resting_heart_rate ?? null,
      date: today,
      bedtimeHour,
      deepSleepMinutes,
      history,
    };
  }

  private buildHistory(
    sleepData: OuraDailySleep[],
    readinessData: OuraDailyReadiness[],
    sleepSessions?: OuraSleepSession[]
  ): BiometricHistory | undefined {
    if (sleepData.length < 7 || readinessData.length < 7) return undefined;

    // Align by date using readiness as the primary timeline
    const readinessByDate = new Map(readinessData.map((r) => [r.day, r]));
    const sleepByDate = new Map(sleepData.map((s) => [s.day, s]));
    const sessionByDate = new Map((sleepSessions ?? []).map((s) => [s.day, s]));

    // Use readiness dates as the canonical timeline
    const dates = readinessData.map((r) => r.day);

    const hrvValues = dates.map(
      (d) => readinessByDate.get(d)?.contributors?.hrv_balance ?? 0
    );
    const readinessValues = dates.map(
      (d) => readinessByDate.get(d)?.score ?? 0
    );
    const sleepValues = dates.map((d) => sleepByDate.get(d)?.score ?? 0);

    // Sleep detail arrays (null when session data not available for that date)
    const bedtimeHours = dates.map((d) => {
      const session = sessionByDate.get(d);
      return session ? parseLocalBedtimeHour(session.bedtime_start) : null;
    });
    const deepSleepMinutes = dates.map((d) => {
      const session = sessionByDate.get(d);
      return session?.deep_sleep_duration != null
        ? Math.round(session.deep_sleep_duration / 60)
        : null;
    });

    return { hrvValues, readinessValues, sleepValues, dates, bedtimeHours, deepSleepMinutes };
  }
}
