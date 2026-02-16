-- Causality Engine Tables (Supabase Free Tier)
-- Run this in Supabase SQL Editor after creating project

-- causality_events: 유저가 /ask할 때마다 자동 기록
CREATE TABLE causality_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  biometrics_before JSONB NOT NULL,
  action JSONB NOT NULL,
  recommendation JSONB,
  outcome JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 유저별 이벤트 조회 최적화
CREATE INDEX idx_causality_user_domain ON causality_events(user_id, domain);

-- outcome 없는 이벤트 조회 최적화 (daily cron에서 사용)
CREATE INDEX idx_causality_pending ON causality_events(user_id) WHERE outcome IS NULL;

-- causality_profiles: 5+ 이벤트 후 자동 생성되는 개인 프로필
CREATE TABLE causality_profiles (
  user_id TEXT PRIMARY KEY,
  total_events INT NOT NULL,
  personal_constants JSONB NOT NULL,
  patterns JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security) - 각 유저는 자기 데이터만 접근
ALTER TABLE causality_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE causality_profiles ENABLE ROW LEVEL SECURITY;

-- 간단한 RLS: anon key로 모든 작업 허용 (서버 사이드에서만 사용)
CREATE POLICY "Allow all operations" ON causality_events
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations" ON causality_profiles
  FOR ALL USING (true) WITH CHECK (true);
