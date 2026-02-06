/**
 * WHOOP API Types
 *
 * Based on WHOOP API v1
 * https://developer.whoop.com/api
 */

// Recovery response from /v1/recovery
export interface WhoopRecovery {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score: {
    user_calibrating: boolean;
    recovery_score: number; // 0-100
    resting_heart_rate: number; // bpm
    hrv_rmssd_milli: number; // raw milliseconds
    spo2_percentage?: number;
    skin_temp_celsius?: number;
  } | null;
}

// Sleep response from /v1/activity/sleep
export interface WhoopSleep {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate: number;
    sleep_performance_percentage: number; // 0-100 - this is our sleep score
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
  } | null;
}

// Cycle response from /v1/cycle
export interface WhoopCycle {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string | null;
  timezone_offset: string;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score: {
    strain: number; // 0-21
    kilojoule: number;
    average_heart_rate: number;
    max_heart_rate: number;
  } | null;
}

// API list response wrapper
export interface WhoopListResponse<T> {
  records: T[];
  next_token?: string;
}
