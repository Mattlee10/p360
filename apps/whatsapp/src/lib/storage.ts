import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  return createClient(url, key);
}

export async function getUserIdByPhone(phone: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("whatsapp_users")
    .select("user_id")
    .eq("wa_phone_number", phone)
    .single();
  if (error || !data) return null;
  return data.user_id as string;
}

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
  const { error } = await supabase
    .from("apple_health_snapshots")
    .upsert(snapshot, { onConflict: "user_id,date" });
  if (error) throw new Error(`Supabase upsert error: ${error.message}`);
}
