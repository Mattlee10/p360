/**
 * SupabaseEventStore — Supabase 기반 CausalityEvent 영구 저장소
 *
 * InMemoryEventStore 대체: 모든 이벤트가 Supabase에 저장되어
 * 앱 재시작/멀티 디바이스에서도 데이터 유지
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  CausalityEvent,
  CausalityOutcome,
  CausalityDomain,
  EventStore,
} from "./causality";

// ============================================
// Supabase Row Types (DB ↔ App 변환)
// ============================================

interface CausalityEventRow {
  id: string;
  user_id: string;
  domain: string;
  timestamp: string;
  biometrics_before: CausalityEvent["biometricsBefore"];
  action: CausalityEvent["action"];
  recommendation: CausalityEvent["recommendation"] | null;
  outcome: CausalityOutcome | null;
  created_at: string;
}

function rowToEvent(row: CausalityEventRow): CausalityEvent {
  return {
    id: row.id,
    userId: row.user_id,
    domain: row.domain as CausalityDomain,
    timestamp: new Date(row.timestamp),
    biometricsBefore: row.biometrics_before,
    action: row.action,
    recommendation: row.recommendation ?? undefined,
    outcome: row.outcome
      ? {
          ...row.outcome,
          measuredAt: new Date(row.outcome.measuredAt),
        }
      : undefined,
  };
}

function eventToRow(event: CausalityEvent): Omit<CausalityEventRow, "created_at"> {
  return {
    id: event.id,
    user_id: event.userId,
    domain: event.domain,
    timestamp: event.timestamp.toISOString(),
    biometrics_before: event.biometricsBefore,
    action: event.action,
    recommendation: event.recommendation ?? null,
    outcome: event.outcome ?? null,
  };
}

// ============================================
// SupabaseEventStore
// ============================================

export class SupabaseEventStore implements EventStore {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    this.client = createClient(supabaseUrl, supabaseAnonKey);
  }

  async save(event: CausalityEvent): Promise<void> {
    const row = eventToRow(event);
    const { error } = await this.client
      .from("causality_events")
      .insert(row);

    if (error) {
      throw new Error(`Failed to save causality event: ${error.message}`);
    }
  }

  async getByUser(userId: string, limit = 100): Promise<CausalityEvent[]> {
    const { data, error } = await this.client
      .from("causality_events")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`);
    }

    return (data as CausalityEventRow[]).map(rowToEvent);
  }

  async getByUserAndDomain(
    userId: string,
    domain: CausalityDomain,
    limit = 100,
  ): Promise<CausalityEvent[]> {
    const { data, error } = await this.client
      .from("causality_events")
      .select("*")
      .eq("user_id", userId)
      .eq("domain", domain)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch events by domain: ${error.message}`);
    }

    return (data as CausalityEventRow[]).map(rowToEvent);
  }

  async getPendingOutcomes(userId: string): Promise<CausalityEvent[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data, error } = await this.client
      .from("causality_events")
      .select("*")
      .eq("user_id", userId)
      .is("outcome", null)
      .lt("timestamp", oneDayAgo.toISOString());

    if (error) {
      throw new Error(`Failed to fetch pending outcomes: ${error.message}`);
    }

    return (data as CausalityEventRow[]).map(rowToEvent);
  }

  async updateOutcome(
    eventId: string,
    outcome: CausalityOutcome,
  ): Promise<void> {
    const { error } = await this.client
      .from("causality_events")
      .update({ outcome })
      .eq("id", eventId);

    if (error) {
      throw new Error(`Failed to update outcome: ${error.message}`);
    }
  }
}

// ============================================
// Factory (env var 기반 자동 생성)
// ============================================

/**
 * 환경 변수에서 Supabase 클라이언트를 생성
 * SUPABASE_URL과 SUPABASE_ANON_KEY가 없으면 null 반환
 */
export function createSupabaseEventStore(): SupabaseEventStore | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return new SupabaseEventStore(url, key);
}
