-- Migration: Add job_search_profiles table for aggregator query rotation
-- Run this in Supabase SQL Editor

-- Defines the search space for aggregator rotation
CREATE TABLE IF NOT EXISTS job_search_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  keywords TEXT NOT NULL,
  location TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 50,
  last_run_at TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (source, keywords, location)
);

-- Index for fetching due profiles (enabled, sorted by staleness)
CREATE INDEX IF NOT EXISTS idx_search_profiles_next_run 
  ON job_search_profiles(enabled, source, last_run_at ASC NULLS FIRST);

-- Index for source-specific queries
CREATE INDEX IF NOT EXISTS idx_search_profiles_source 
  ON job_search_profiles(source) WHERE enabled = true;

COMMENT ON TABLE job_search_profiles IS 'Defines search profiles for aggregator query rotation. Each profile is called at most once per 24h.';

-- Seed some initial high-value profiles (can be expanded)
INSERT INTO job_search_profiles (source, keywords, location, priority) VALUES
  -- High-priority tech roles
  ('jooble', 'software engineer', 'remote', 80),
  ('jooble', 'senior software engineer', 'remote', 80),
  ('jooble', 'data scientist', 'remote', 75),
  ('jooble', 'product manager', 'remote', 75),
  ('jooble', 'devops engineer', 'remote', 70),
  ('reed_uk', 'software engineer', 'UK', 80),
  ('reed_uk', 'data analyst', 'UK', 75),
  ('arbeitnow', 'software engineer', 'remote', 75),
  ('arbeitnow', 'backend developer', 'remote', 70),
  ('findwork', 'software engineer', 'remote', 80),
  ('findwork', 'full stack developer', 'remote', 75)
ON CONFLICT (source, keywords, location) DO NOTHING;
