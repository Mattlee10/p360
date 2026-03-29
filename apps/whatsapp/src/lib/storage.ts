import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL required");
    pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

/**
 * Look up user_id by WhatsApp phone number.
 * Phone number format: digits only, no +, e.g. "61451024641"
 */
export async function getUserIdByPhone(phone: string): Promise<string | null> {
  const { rows } = await getPool().query<{ user_id: string }>(
    "SELECT user_id FROM public.whatsapp_users WHERE wa_phone_number = $1",
    [phone]
  );
  return rows[0]?.user_id ?? null;
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
  await getPool().query(
    `INSERT INTO public.apple_health_snapshots
       (user_id, date, hrv_sdnn_ms, resting_hr, sleep_minutes, deep_sleep_minutes, sleep_efficiency, bedtime_hour)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id, date) DO UPDATE SET
       hrv_sdnn_ms = EXCLUDED.hrv_sdnn_ms,
       resting_hr = EXCLUDED.resting_hr,
       sleep_minutes = EXCLUDED.sleep_minutes,
       deep_sleep_minutes = EXCLUDED.deep_sleep_minutes,
       sleep_efficiency = EXCLUDED.sleep_efficiency,
       bedtime_hour = EXCLUDED.bedtime_hour`,
    [
      snapshot.user_id,
      snapshot.date,
      snapshot.hrv_sdnn_ms ?? null,
      snapshot.resting_hr ?? null,
      snapshot.sleep_minutes ?? null,
      snapshot.deep_sleep_minutes ?? null,
      snapshot.sleep_efficiency ?? null,
      snapshot.bedtime_hour ?? null,
    ]
  );
}
