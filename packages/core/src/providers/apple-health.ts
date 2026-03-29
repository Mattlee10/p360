import { createClient } from "@supabase/supabase-js";
import { BiometricData, BiometricHistory } from "../types";
import { BiometricProvider } from "./provider";

interface AppleHealthSnapshot {
  user_id: string;
  date: string;
  hrv_sdnn_ms: number | null;
  resting_hr: number | null;
  sleep_minutes: number | null;
  deep_sleep_minutes: number | null;
  sleep_efficiency: number | null;
  bedtime_hour: number | null;
  created_at: string;
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  return createClient(url, key);
}

function normalizeHrvSdnn(sdnn: number): number {
  return Math.min(100, Math.max(0, Math.round(sdnn / 1.2)));
}

function normalizeRHR(rhr: number): number {
  return Math.min(100, Math.max(0, Math.round(((80 - rhr) / 40) * 100)));
}

function normalizeSleep(sleepMinutes: number | null, sleepEfficiency: number | null): number | null {
  if (sleepEfficiency != null) return Math.min(100, Math.max(0, sleepEfficiency));
  if (sleepMinutes != null) return Math.min(100, Math.max(0, Math.round((sleepMinutes / 480) * 100)));
  return null;
}

/**
 * AppleHealthProvider
 *
 * Reads data from Supabase apple_health_snapshots table.
 * The token is the user_id (e.g. "wa-61451024641").
 *
 * readinessScore formula:
 *   hrv_norm * 0.5 + rhr_norm * 0.3 + sleep_norm * 0.2
 */
export class AppleHealthProvider implements BiometricProvider {
  readonly name = "apple-health";
  readonly displayName = "Apple Watch";

  async fetchBiometricData(token: string): Promise<BiometricData> {
    const supabase = getSupabaseClient();
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("apple_health_snapshots")
      .select("*")
      .eq("user_id", token)
      .gte("date", sixtyDaysAgo)
      .order("date", { ascending: true });

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!data || data.length === 0) throw new Error(`No Apple Health data found for user: ${token}`);

    const snapshots = data as AppleHealthSnapshot[];
    const latest = snapshots[snapshots.length - 1];

    const hrvNorm = latest.hrv_sdnn_ms != null ? normalizeHrvSdnn(latest.hrv_sdnn_ms) : null;
    const rhrNorm = latest.resting_hr != null ? normalizeRHR(latest.resting_hr) : null;
    const sleepNorm = normalizeSleep(latest.sleep_minutes, latest.sleep_efficiency);

    let readinessScore: number | null = null;
    if (hrvNorm != null && rhrNorm != null && sleepNorm != null) {
      readinessScore = Math.round(hrvNorm * 0.5 + rhrNorm * 0.3 + sleepNorm * 0.2);
    } else if (hrvNorm != null && rhrNorm != null) {
      readinessScore = Math.round(hrvNorm * 0.6 + rhrNorm * 0.4);
    } else if (hrvNorm != null) {
      readinessScore = hrvNorm;
    }

    const history = snapshots.length >= 7 ? this.buildHistory(snapshots) : undefined;

    return {
      sleepScore: sleepNorm,
      readinessScore,
      hrvBalance: hrvNorm,
      restingHR: latest.resting_hr,
      date: latest.date,
      bedtimeHour: latest.bedtime_hour,
      deepSleepMinutes: latest.deep_sleep_minutes,
      history,
    };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("apple_health_snapshots")
        .select("user_id")
        .eq("user_id", token)
        .limit(1);
      if (error) return false;
      return (data?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }

  private buildHistory(snapshots: AppleHealthSnapshot[]): BiometricHistory {
    const dates = snapshots.map((s) => s.date);
    const hrvValues = snapshots.map((s) =>
      s.hrv_sdnn_ms != null ? normalizeHrvSdnn(s.hrv_sdnn_ms) : 0
    );
    const readinessValues = snapshots.map((s) => {
      const h = s.hrv_sdnn_ms != null ? normalizeHrvSdnn(s.hrv_sdnn_ms) : null;
      const r = s.resting_hr != null ? normalizeRHR(s.resting_hr) : null;
      const sl = normalizeSleep(s.sleep_minutes, s.sleep_efficiency);
      if (h != null && r != null && sl != null) return Math.round(h * 0.5 + r * 0.3 + sl * 0.2);
      if (h != null && r != null) return Math.round(h * 0.6 + r * 0.4);
      return h ?? 0;
    });
    const sleepValues = snapshots.map((s) => normalizeSleep(s.sleep_minutes, s.sleep_efficiency) ?? 0);
    const bedtimeHours = snapshots.map((s) => s.bedtime_hour);
    const deepSleepMinutes = snapshots.map((s) => s.deep_sleep_minutes);
    return { hrvValues, readinessValues, sleepValues, dates, bedtimeHours, deepSleepMinutes };
  }
}
