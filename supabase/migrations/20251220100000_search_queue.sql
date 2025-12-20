-- Migration: Intelligent Search Queue System
-- Creates tables for user-driven, rate-aware job ingestion

-- Search Queue: Tasks to execute
CREATE TABLE IF NOT EXISTS search_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_slug TEXT NOT NULL,
  keywords TEXT,
  location TEXT,
  params JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 50,
  last_run_at TIMESTAMPTZ,
  next_run_after TIMESTAMPTZ DEFAULT NOW(),
  run_count INTEGER DEFAULT 0,
  last_result_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for priority queue queries
CREATE INDEX IF NOT EXISTS idx_search_queue_priority 
  ON search_queue (status, next_run_after, priority DESC);

CREATE INDEX IF NOT EXISTS idx_search_queue_source 
  ON search_queue (source_slug, status);

-- User Search Interests: Aggregated from user profiles
CREATE TABLE IF NOT EXISTS user_search_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keywords TEXT NOT NULL,
  location TEXT,
  user_count INTEGER DEFAULT 1,
  weight FLOAT DEFAULT 1.0,
  last_seeded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(keywords, COALESCE(location, ''))
);

CREATE INDEX IF NOT EXISTS idx_user_search_interests_weight 
  ON user_search_interests (weight DESC, user_count DESC);

-- Source Rate Limits: Configurable per-source limits
CREATE TABLE IF NOT EXISTS source_rate_limits (
  source_slug TEXT PRIMARY KEY,
  max_per_hour INTEGER DEFAULT 10,
  cooldown_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default rate limits
INSERT INTO source_rate_limits (source_slug, max_per_hour, cooldown_minutes) VALUES
  ('lever', 100, 5),
  ('greenhouse', 100, 5),
  ('remoteok', 20, 15),
  ('remotive', 20, 15),
  ('himalayas', 20, 15),
  ('jobicy', 15, 20),
  ('arbeitnow', 15, 20),
  ('careerjet', 10, 30),
  ('adzuna_us', 5, 60),
  ('usajobs', 10, 30),
  ('themuse', 15, 20),
  ('theirstack', 5, 60)
ON CONFLICT (source_slug) DO NOTHING;

-- RLS Policies
ALTER TABLE search_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for cron jobs)
CREATE POLICY "service_role_search_queue" ON search_queue
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_user_search_interests" ON user_search_interests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_source_rate_limits" ON source_rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- Anon can read rate limits (for debugging)
CREATE POLICY "anon_read_rate_limits" ON source_rate_limits
  FOR SELECT USING (true);
