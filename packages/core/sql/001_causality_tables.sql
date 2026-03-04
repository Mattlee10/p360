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

-- RLS (Row Level Security) - anon 접근 차단, service_role만 허용
-- 서버(Railway)는 SUPABASE_SERVICE_ROLE_KEY를 사용 → RLS 자동 bypass
ALTER TABLE causality_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE causality_profiles ENABLE ROW LEVEL SECURITY;

-- anon/authenticated 접근 전면 차단 (service_role은 RLS 무시)
CREATE POLICY "Deny all anon access" ON causality_events
  FOR ALL USING (false);

CREATE POLICY "Deny all anon access" ON causality_profiles
  FOR ALL USING (false);

-- 기존 "Allow all operations" 정책이 있으면 먼저 삭제:
-- DROP POLICY IF EXISTS "Allow all operations" ON causality_events;
-- DROP POLICY IF EXISTS "Allow all operations" ON causality_profiles;
