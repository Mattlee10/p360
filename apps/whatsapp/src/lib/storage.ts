import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  return createClient(url, key);
}

/**
 * Look up user_id by WhatsApp phone number.
 * Phone number format: digits only, no +, e.g. "61451024641"
 */
export async function getUserIdByPhone(phone: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_whatsapp_user_id", { p_phone: phone });
  if (error || !data) return null;
  return data as string;
}

/**
 * Upsert a snapshot row from iOS Shortcut ingest.
 */
export async function upsertAppleHealthSnapshot(snapshot: {
  user_id: string;
  date: string;
  hrv_sdnn_ms?: number | null;
  resting_hr?: number | null;
  sleep_minutes?: number | null;
  deep_sleep_minutes?: number | null;
  sleep_efficiency?: number | null;
  bedtime_hour?: number | null;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("upsert_apple_health_snapshot", {
    p_user_id: snapshot.user_id,
    p_date: snapshot.date,
    p_hrv_sdnn_ms: snapshot.hrv_sdnn_ms ?? null,
    p_resting_hr: snapshot.resting_hr ?? null,
    p_sleep_minutes: snapshot.sleep_minutes ?? null,
    p_deep_sleep_minutes: snapshot.deep_sleep_minutes ?? null,
    p_sleep_efficiency: snapshot.sleep_efficiency ?? null,
    p_bedtime_hour: snapshot.bedtime_hour ?? null,
  });

  if (error) throw new Error(`Supabase upsert error: ${error.message}`);
}
