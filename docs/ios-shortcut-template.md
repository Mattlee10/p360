# iOS Shortcut Template for p360 Apple Health Ingest

Run this Shortcut every morning (Automation: Daily at 9:00 AM) to push overnight biometrics to p360.

## HealthKit Data to Read

| HealthKit Type | Period | Method |
|---|---|---|
| Heart Rate Variability (SDNN) | Yesterday 9PM → Today 9AM | Average |
| Resting Heart Rate | Today | Latest value |
| Sleep Analysis | Yesterday 8PM → Today 9AM | Stage totals |

## POST Body Format

```json
{
  "user_id": "wa-61451024641",
  "date": "2026-03-28",
  "hrv_sdnn_ms": 58.3,
  "resting_hr": 52,
  "sleep_minutes": 420,
  "deep_sleep_minutes": 85,
  "sleep_efficiency": 87.5,
  "bedtime_hour": 23.5
}
```

**Field notes:**
- `bedtime_hour`: decimal hours, 24-hour clock. `23.5` = 11:30 PM. `0.5` = 12:30 AM (enter as `24.5` so causality regression treats it correctly as after midnight).
- `sleep_efficiency`: percentage 0-100 (total_asleep / time_in_bed * 100).
- `deep_sleep_minutes`: Stage 3 (Deep / Slow Wave) duration only.
- All fields except `user_id` and `date` are optional — send what Apple Watch provides.

## Shortcut Steps

1. **Get Current Date** → format as `YYYY-MM-DD` → save as `today`
2. **Find Health Samples** (HRV SDNN) → last 12 hours → Average → save as `hrv`
3. **Find Health Samples** (Resting HR) → today → Latest → save as `rhr`
4. **Find Health Samples** (Sleep Analysis - Asleep) → last 14 hours → Sum (minutes) → save as `sleep_min`
5. **Find Health Samples** (Sleep Analysis - Deep) → last 14 hours → Sum (minutes) → save as `deep_min`
6. **URL** → `https://YOUR_SERVER/health/apple`
7. **Get Contents of URL**
   - Method: POST
   - Headers: `Content-Type: application/json`, `X-P360-Secret: YOUR_INGEST_SECRET`
   - Body (JSON):
     ```
     {
       "user_id": "wa-61451024641",
       "date": [today],
       "hrv_sdnn_ms": [hrv],
       "resting_hr": [rhr],
       "sleep_minutes": [sleep_min],
       "deep_sleep_minutes": [deep_min]
     }
     ```

## Validation

After first run, check Supabase:

```sql
SELECT * FROM apple_health_snapshots
WHERE user_id = 'wa-61451024641'
ORDER BY date DESC
LIMIT 5;
```

## Supabase Setup SQL

```sql
CREATE TABLE apple_health_snapshots (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            text NOT NULL,
  date               date NOT NULL,
  hrv_sdnn_ms        numeric,
  resting_hr         numeric,
  sleep_minutes      integer,
  deep_sleep_minutes integer,
  sleep_efficiency   numeric,
  bedtime_hour       numeric,
  created_at         timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE TABLE whatsapp_users (
  wa_phone_number text PRIMARY KEY,
  user_id         text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- Myles
INSERT INTO whatsapp_users (wa_phone_number, user_id)
VALUES ('61451024641', 'wa-61451024641');
```
