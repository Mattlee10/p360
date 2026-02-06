import { BiometricData } from "../types";
import { BiometricProvider } from "./provider";
import type {
  WhoopRecovery,
  WhoopSleep,
  WhoopListResponse,
} from "./whoop.types";

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer";

/**
 * WHOOP Provider
 *
 * Fetches biometric data from WHOOP API.
 * Requires an OAuth access token.
 *
 * HRV Normalization:
 * WHOOP reports raw HRV in milliseconds (hrv_rmssd_milli).
 * We normalize to 0-100 scale where:
 * - 50 = baseline (roughly 60ms RMSSD for average user)
 * - <50 = below baseline (nervous system stressed)
 * - >50 = above baseline (well recovered)
 *
 * Formula: min(100, max(0, hrvRmssd / 1.2))
 * - 60ms -> 50 (baseline)
 * - 120ms -> 100 (excellent)
 * - 30ms -> 25 (stressed)
 */
export class WhoopProvider implements BiometricProvider {
  readonly name = "whoop";
  readonly displayName = "WHOOP";

  /**
   * Normalize WHOOP HRV (milliseconds) to 0-100 scale
   * WHOOP raw RMSSD is typically 20-150ms
   * Using 60ms as baseline (50 on our scale)
   */
  private normalizeHrv(hrvRmssdMilli: number): number {
    // Simple linear mapping: 120ms = 100, 0ms = 0
    // This gives 60ms ≈ 50 (baseline)
    return Math.min(100, Math.max(0, Math.round(hrvRmssdMilli / 1.2)));
  }

  async fetchBiometricData(token: string): Promise<BiometricData> {
    const today = new Date().toISOString().split("T")[0];

    // Fetch recovery and sleep in parallel
    const [recoveryData, sleepData] = await Promise.all([
      this.fetchRecovery(token),
      this.fetchSleep(token),
    ]);

    // Extract values
    let readinessScore: number | null = null;
    let hrvBalance: number | null = null;
    let restingHR: number | null = null;

    if (recoveryData?.score) {
      readinessScore = recoveryData.score.recovery_score;
      hrvBalance = this.normalizeHrv(recoveryData.score.hrv_rmssd_milli);
      restingHR = recoveryData.score.resting_heart_rate;
    }

    let sleepScore: number | null = null;
    if (sleepData?.score) {
      sleepScore = sleepData.score.sleep_performance_percentage;
    }

    return {
      sleepScore,
      readinessScore,
      hrvBalance,
      restingHR,
      date: today,
    };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${WHOOP_API_BASE}/v1/user/profile/basic`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async fetchRecovery(token: string): Promise<WhoopRecovery | null> {
    try {
      // Get most recent recovery (today's)
      const response = await fetch(
        `${WHOOP_API_BASE}/v1/recovery?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("WHOOP recovery fetch failed:", response.status);
        return null;
      }

      const data: WhoopListResponse<WhoopRecovery> = await response.json();
      return data.records[0] || null;
    } catch (error) {
      console.error("WHOOP recovery fetch error:", error);
      return null;
    }
  }

  private async fetchSleep(token: string): Promise<WhoopSleep | null> {
    try {
      // Get most recent sleep (last night's)
      const response = await fetch(
        `${WHOOP_API_BASE}/v1/activity/sleep?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("WHOOP sleep fetch failed:", response.status);
        return null;
      }

      const data: WhoopListResponse<WhoopSleep> = await response.json();
      return data.records[0] || null;
    } catch (error) {
      console.error("WHOOP sleep fetch error:", error);
      return null;
    }
  }
}
