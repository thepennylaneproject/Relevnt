-- Migration: Ingestion Healing Log
-- Created: 2025-12-27
-- Purpose: Track auto-healing attempts for job ingestion failures

-- =====================================================
-- HEALING LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ingestion_healing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  failure_type TEXT NOT NULL CHECK (failure_type IN (
    'stuck_run', 'timeout', 'http_error', 'auth_error', 
    'parse_error', 'rate_limit', 'consecutive_failures'
  )),
  healing_action TEXT NOT NULL CHECK (healing_action IN (
    'retry', 'reset_cursor', 'skip_batch', 'disable_source', 
    'mark_failed', 'increase_delay', 'escalate'
  )),
  original_error TEXT,
  healing_result TEXT NOT NULL CHECK (healing_result IN (
    'success', 'failed', 'escalated', 'pending'
  )),
  run_id UUID REFERENCES job_ingestion_runs(id) ON DELETE SET NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_healing_log_source ON ingestion_healing_log(source);
CREATE INDEX IF NOT EXISTS idx_healing_log_attempted_at ON ingestion_healing_log(attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_healing_log_result ON ingestion_healing_log(healing_result);

-- =====================================================
-- ADD AUTO-HEAL COLUMN TO SOURCE HEALTH
-- =====================================================

ALTER TABLE job_source_health 
  ADD COLUMN IF NOT EXISTS auto_heal_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_heal_attempt_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS heal_attempts_24h INTEGER DEFAULT 0;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE ingestion_healing_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only" ON ingestion_healing_log;
CREATE POLICY "Service role only" ON ingestion_healing_log FOR ALL USING (false);

-- Grant access to service role
GRANT ALL ON ingestion_healing_log TO service_role;
GRANT SELECT ON ingestion_healing_log TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
