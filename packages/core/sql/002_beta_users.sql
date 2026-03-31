-- Beta Users Table (Slack Bot)
-- Run this in Supabase SQL Editor after 001_causality_tables.sql

CREATE TABLE beta_users (
  slack_user_id   TEXT PRIMARY KEY,
  provider        TEXT CHECK (provider IN ('oura', 'whoop')),
  provider_token  TEXT,
  onboarded_at    TIMESTAMPTZ,       -- 첫 /ask 완료 시 설정. NULL = 미완료
  created_at      TIMESTAMPTZ DEFAULT now(),
  last_check_at   TIMESTAMPTZ
);

CREATE INDEX idx_beta_users_provider ON beta_users(provider);

ALTER TABLE beta_users ENABLE ROW LEVEL SECURITY;

-- anon/authenticated 접근 전면 차단 (service_role은 RLS 무시)
CREATE POLICY "Deny all anon access" ON beta_users FOR ALL USING (false);
