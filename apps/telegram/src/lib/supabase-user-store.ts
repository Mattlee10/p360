/**
 * Supabase persistence for user data (provider tokens, timezone)
 * Railway 재시작 후에도 유저 데이터 유지
 *
 * 전략: in-memory Map은 L1 캐시, Supabase는 L2 영구 저장소
 * - write: memory + Supabase 동시 (fire-and-forget)
 * - read: memory 우선, 없으면 Supabase fallback
 * - startup: Supabase에서 전체 preload
 */

export interface PersistedUserData {
  telegram_id: number;
  provider?: string;
  provider_token?: string;
  oura_token?: string;
  timezone?: string;
  created_at?: string;
  last_seen_at?: string;
}

// 싱글턴 Supabase 클라이언트 (lazy init)
let _client: ReturnType<typeof createSupabaseClient> | null | undefined = undefined;

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key);
}

function getClient() {
  if (_client === undefined) {
    _client = createSupabaseClient();
  }
  return _client;
}

/**
 * 시작 시 Supabase에서 전체 유저 목록 로드
 */
export async function loadAllUsersFromSupabase(): Promise<PersistedUserData[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("user_profiles")
      .select("*");

    if (error) {
      console.error("[user-store] Failed to load users from Supabase:", error.message);
      return [];
    }

    return (data as PersistedUserData[]) ?? [];
  } catch (err) {
    console.error("[user-store] Supabase load error:", err);
    return [];
  }
}

/**
 * 유저 데이터를 Supabase에 저장 (upsert)
 * fire-and-forget: 호출자는 await 없이 사용
 */
export async function saveUserToSupabase(data: PersistedUserData): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    const { error } = await client
      .from("user_profiles")
      .upsert(
        {
          ...data,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "telegram_id" },
      );

    if (error) {
      console.error("[user-store] Failed to save user to Supabase:", error.message);
    }
  } catch (err) {
    console.error("[user-store] Supabase save error:", err);
  }
}

/**
 * 단일 유저 Supabase에서 조회 (in-memory miss 시 fallback)
 */
export async function getUserFromSupabase(telegramId: number): Promise<PersistedUserData | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("user_profiles")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    if (error || !data) return null;
    return data as PersistedUserData;
  } catch {
    return null;
  }
}
