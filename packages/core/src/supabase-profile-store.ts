/**
 * SupabaseProfileStore — Supabase 기반 CausalityProfile 영구 저장소
 *
 * buildCausalityProfile()로 계산된 개인 패턴을 저장
 * /ask 호출 시 프로필 로드 → buildSystemPrompt()에 주입
 * → "YOUR HRV drops 5.2% per drink" 형태의 개인화된 추천
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  CausalityProfile,
  PersonalConstants,
  PersonalPattern,
} from "./causality";

interface CausalityProfileRow {
  user_id: string;
  total_events: number;
  personal_constants: PersonalConstants;
  patterns: PersonalPattern[];
  updated_at: string;
}

function rowToProfile(row: CausalityProfileRow): CausalityProfile {
  return {
    userId: row.user_id,
    totalEvents: row.total_events,
    personalConstants: row.personal_constants,
    patterns: row.patterns,
  };
}

function profileToRow(profile: CausalityProfile): Omit<CausalityProfileRow, "updated_at"> {
  return {
    user_id: profile.userId,
    total_events: profile.totalEvents,
    personal_constants: profile.personalConstants,
    patterns: profile.patterns,
  };
}

export interface ProfileStore {
  saveProfile(profile: CausalityProfile): Promise<void>;
  getProfile(userId: string): Promise<CausalityProfile | null>;
}

export class SupabaseProfileStore implements ProfileStore {
  constructor(private client: SupabaseClient) {}

  async saveProfile(profile: CausalityProfile): Promise<void> {
    const row = profileToRow(profile);

    const { error } = await this.client
      .from("causality_profiles")
      .upsert([row], { onConflict: "user_id" });

    if (error) {
      throw new Error(`Failed to save profile: ${error.message}`);
    }
  }

  async getProfile(userId: string): Promise<CausalityProfile | null> {
    const { data, error } = await this.client
      .from("causality_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No row found
        return null;
      }
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return rowToProfile(data as CausalityProfileRow);
  }
}

/**
 * 환경 변수에서 Supabase 프로필 저장소 생성
 */
export function createSupabaseProfileStore(): SupabaseProfileStore | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  const client = createClient(url, key);
  return new SupabaseProfileStore(client);
}
