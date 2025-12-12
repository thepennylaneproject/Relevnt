-- Migration: Phase 0 - Reliability & Observability
-- Created: 2025-12-11
-- Purpose: Add observability for job ingestion and analytics foundation

-- =====================================================
-- PART 1: INGESTION OBSERVABILITY TABLES
-- =====================================================

-- Track overall ingestion runs (one row per scheduled/manual trigger)
CREATE TABLE IF NOT EXISTS job_ingestion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed')),
  triggered_by TEXT NOT NULL DEFAULT 'schedule' CHECK (triggered_by IN ('schedule', 'manual', 'admin')),
  sources_requested TEXT[] NOT NULL DEFAULT '{}',
  total_normalized INTEGER NOT NULL DEFAULT 0,
  total_inserted INTEGER NOT NULL DEFAULT 0,
  total_duplicates INTEGER NOT NULL DEFAULT 0,
  total_failed_sources INTEGER NOT NULL DEFAULT 0,
  error_summary TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_ingestion_runs_started_at ON job_ingestion_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_ingestion_runs_status ON job_ingestion_runs(status);

-- Track per-source execution within a run
CREATE TABLE IF NOT EXISTS job_ingestion_run_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES job_ingestion_runs(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed')),
  page_start INTEGER NOT NULL DEFAULT 1,
  page_end INTEGER NOT NULL DEFAULT 1,
  normalized_count INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  http_status INTEGER,
  error_message TEXT,
  cursor_in JSONB,
  cursor_out JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_ingestion_run_sources_run_id ON job_ingestion_run_sources(run_id);
CREATE INDEX IF NOT EXISTS idx_job_ingestion_run_sources_source ON job_ingestion_run_sources(source);

-- Track source health (real-time health status per source)
CREATE TABLE IF NOT EXISTS job_source_health (
  source TEXT PRIMARY KEY,
  last_success_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_counts JSONB DEFAULT '{}'::jsonb,
  is_degraded BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PART 2: ANALYTICS TABLES
-- =====================================================

-- Drop existing tables if they exist (to ensure clean migration)
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS analytics_daily_summaries CASCADE;

-- Store raw user events (batched from client)
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  event_name TEXT NOT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  properties JSONB DEFAULT '{}'::jsonb,
  page_path TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_event_time ON analytics_events(event_time DESC);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);


-- Store aggregated daily metrics
CREATE TABLE analytics_daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day DATE NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(day, metric_key)
);

CREATE INDEX idx_analytics_daily_summaries_day ON analytics_daily_summaries(day DESC);
CREATE INDEX idx_analytics_daily_summaries_metric_key ON analytics_daily_summaries(metric_key);

-- =====================================================
-- PART 3: RLS POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE job_ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_ingestion_run_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_source_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_summaries ENABLE ROW LEVEL SECURITY;

-- No public access to these tables (service role only for writes)
-- Admin access will be via server-side functions with ADMIN_SECRET

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Service role only" ON job_ingestion_runs;
DROP POLICY IF EXISTS "Service role only" ON job_ingestion_run_sources;
DROP POLICY IF EXISTS "Service role only" ON job_source_health;
DROP POLICY IF EXISTS "Service role only" ON analytics_events;
DROP POLICY IF EXISTS "Service role only" ON analytics_daily_summaries;

-- Create restrictive policies (no client access)
CREATE POLICY "Service role only" ON job_ingestion_runs FOR ALL USING (false);
CREATE POLICY "Service role only" ON job_ingestion_run_sources FOR ALL USING (false);
CREATE POLICY "Service role only" ON job_source_health FOR ALL USING (false);
CREATE POLICY "Service role only" ON analytics_events FOR ALL USING (false);
CREATE POLICY "Service role only" ON analytics_daily_summaries FOR ALL USING (false);

-- =====================================================
-- PART 4: HARDEN EXISTING INGESTION STATE TABLE
-- =====================================================

-- Ensure job_ingestion_state has RLS enabled (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'job_ingestion_state'
  ) THEN
    ALTER TABLE job_ingestion_state ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Service role only" ON job_ingestion_state;
    
    -- Create restrictive policy
    CREATE POLICY "Service role only" ON job_ingestion_state FOR ALL USING (false);
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
