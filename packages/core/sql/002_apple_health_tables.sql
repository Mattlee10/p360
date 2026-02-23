-- ============================================
-- Apple Health Integration Tables
-- ============================================
-- Run AFTER 001_causality_tables.sql
--
-- Stores Apple Health daily aggregates and confounding analysis results.
-- Primary key pattern: "{user_id}_{date}" (matches 001 convention)

-- Daily aggregated Apple Health data (one row per user per day)
CREATE TABLE apple_health_records (
  id                   TEXT PRIMARY KEY,     -- "{user_id}_{date}"
  user_id              TEXT NOT NULL,
  date                 TEXT NOT NULL,        -- "YYYY-MM-DD"
  steps                INT  NOT NULL,
  distance_km          NUMERIC(8, 3),        -- nullable (not all exports have this)
  active_energy_kcal   INT,                  -- nullable
  exercise_minutes     INT,                  -- nullable
  uploaded_at          TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_apple_health_user_date
  ON apple_health_records(user_id, date);

CREATE INDEX idx_apple_health_user
  ON apple_health_records(user_id);

-- Activity confounding analysis results (one row per user per day analyzed)
CREATE TABLE activity_confounding_analysis (
  id                   TEXT PRIMARY KEY,     -- "{user_id}_{date}"
  user_id              TEXT NOT NULL,
  date                 TEXT NOT NULL,        -- "YYYY-MM-DD"
  oura_estimated_steps INT  NOT NULL,
  apple_health_steps   INT  NOT NULL,
  step_gap             INT  NOT NULL,        -- apple - oura (positive = Oura missed activity)
  step_gap_percent     NUMERIC(6, 2) NOT NULL,
  ouras_readiness      INT  NOT NULL,
  adjusted_readiness   INT  NOT NULL,
  readiness_delta      INT  NOT NULL,        -- negative if Oura was inflated
  confidence           INT  NOT NULL,        -- 0-100
  detected_confound    BOOLEAN NOT NULL,
  explanation          TEXT NOT NULL,
  analyzed_at          TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_confounding_user_date
  ON activity_confounding_analysis(user_id, date);

CREATE INDEX idx_confounding_user
  ON activity_confounding_analysis(user_id);

-- RLS (matching pattern from 001_causality_tables.sql)
ALTER TABLE apple_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_confounding_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON apple_health_records
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations" ON activity_confounding_analysis
  FOR ALL USING (true) WITH CHECK (true);
