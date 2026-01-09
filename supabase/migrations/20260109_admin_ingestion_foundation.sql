-- Migration: Admin Ingestion Foundation
-- Date: 2026-01-09
-- Purpose: Create tables and views for admin observability console (Phase 1)

-- =============================================================================
-- 1. ADMIN_CONFIG - Runtime configuration
-- =============================================================================
-- Allows changing settings without code deploy

CREATE TABLE IF NOT EXISTS admin_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);

-- Seed default values
INSERT INTO admin_config (key, value, description) VALUES
  ('rotation.max_company_targets_per_run', '10', 'Max ATS companies per ingestion run'),
  ('rotation.max_search_slices_per_run', '5', 'Max aggregator slices per ingestion run'),
  ('cleanup.global_max_age_days', '180', 'Default max age for job cleanup'),
  ('alerts.ingestion_failure_threshold', '3', 'Alert after N failures in an hour'),
  ('alerts.net_new_jobs_min_24h', '50', 'Alert if fewer than N new jobs in 24h'),
  ('flags.use_rotation_ingestion', 'true', 'Use new rotation-based ingestion'),
  ('flags.aggressive_cooling', 'false', 'Double cooling rate for empty slices')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_config" ON admin_config
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Admins can read config
CREATE POLICY "Admins can read admin_config" ON admin_config
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.plan_tier = 'admin' OR profiles.tier = 'admin')
    )
  );

COMMENT ON TABLE admin_config IS 'Runtime configuration for admin console. Changes take effect on next ingestion run.';

-- =============================================================================
-- 2. ADMIN_ERROR_LOG - Centralized error tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL, -- 'ingestion', 'api', 'db', 'ai_helper'
  source_slug TEXT,
  function_name TEXT,
  error_code TEXT,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for recent errors
CREATE INDEX IF NOT EXISTS admin_error_log_created_idx 
  ON admin_error_log(created_at DESC);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS admin_error_log_type_idx 
  ON admin_error_log(error_type, created_at DESC);

-- Index for source-specific errors
CREATE INDEX IF NOT EXISTS admin_error_log_source_idx 
  ON admin_error_log(source_slug, created_at DESC)
  WHERE source_slug IS NOT NULL;

-- RLS
ALTER TABLE admin_error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_error_log" ON admin_error_log
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE admin_error_log IS 'Centralized error log for admin monitoring. Populated by ingestion and API functions.';

-- =============================================================================
-- 3. SOURCE_DAILY_STATS - Materialized view for dashboards
-- =============================================================================
-- Aggregates from job_ingestion_run_sources for performance

CREATE MATERIALIZED VIEW IF NOT EXISTS source_daily_stats AS
SELECT
  source,
  DATE(started_at) AS stat_date,
  COUNT(*) AS run_count,
  SUM(COALESCE(total_normalized, 0)) AS jobs_fetched,
  SUM(COALESCE(total_inserted, 0)) AS net_new_jobs,
  SUM(COALESCE(total_duplicates, 0)) AS duplicates_logged,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_runs,
  AVG(CASE WHEN finished_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (finished_at - started_at)) 
      ELSE NULL END)::INTEGER AS avg_duration_seconds
FROM job_ingestion_run_sources
WHERE started_at > now() - INTERVAL '30 days'
GROUP BY source, DATE(started_at);

CREATE UNIQUE INDEX IF NOT EXISTS source_daily_stats_idx 
  ON source_daily_stats(source, stat_date);

COMMENT ON MATERIALIZED VIEW source_daily_stats IS 'Daily aggregated stats per source. Refresh via admin endpoint.';

-- =============================================================================
-- 4. HELPER FUNCTION: Refresh materialized views
-- =============================================================================

CREATE OR REPLACE FUNCTION refresh_admin_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY source_daily_stats;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_admin_stats TO service_role;

-- =============================================================================
-- 5. HELPER FUNCTION: Log admin error
-- =============================================================================

CREATE OR REPLACE FUNCTION log_admin_error(
  p_error_type TEXT,
  p_error_message TEXT,
  p_source_slug TEXT DEFAULT NULL,
  p_function_name TEXT DEFAULT NULL,
  p_error_code TEXT DEFAULT NULL,
  p_stack_trace TEXT DEFAULT NULL,
  p_context JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO admin_error_log (
    error_type, error_message, source_slug, function_name, 
    error_code, stack_trace, context
  ) VALUES (
    p_error_type, p_error_message, p_source_slug, p_function_name,
    p_error_code, p_stack_trace, p_context
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION log_admin_error TO service_role;

-- =============================================================================
-- 6. HELPER FUNCTION: Get config value
-- =============================================================================

CREATE OR REPLACE FUNCTION get_admin_config(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_value JSONB;
BEGIN
  SELECT value INTO v_value FROM admin_config WHERE key = p_key;
  RETURN v_value;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_config TO service_role;

-- =============================================================================
-- DONE
-- =============================================================================
