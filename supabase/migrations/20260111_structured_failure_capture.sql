-- ============================================================================
-- STRUCTURED FAILURE CAPTURE
-- Date: 2026-01-11
-- Purpose: Add decision-grade error classification to source health tracking
-- ============================================================================

-- Add structured failure columns to job_source_health
ALTER TABLE job_source_health
ADD COLUMN IF NOT EXISTS failure_stage TEXT,
ADD COLUMN IF NOT EXISTS failure_type TEXT,
ADD COLUMN IF NOT EXISTS failure_batch_context JSONB;

-- Add check constraints for valid values
DO $$
BEGIN
  -- Drop existing constraints if they exist (idempotent)
  ALTER TABLE job_source_health DROP CONSTRAINT IF EXISTS chk_failure_stage;
  ALTER TABLE job_source_health DROP CONSTRAINT IF EXISTS chk_failure_type;
  
  -- Add constraints
  ALTER TABLE job_source_health
    ADD CONSTRAINT chk_failure_stage
    CHECK (failure_stage IS NULL OR failure_stage IN ('fetch', 'normalize', 'dedup', 'upsert', 'post-filter'));
  
  ALTER TABLE job_source_health
    ADD CONSTRAINT chk_failure_type
    CHECK (failure_type IS NULL OR failure_type IN ('timeout', 'schema_mismatch', 'duplicate_key', 'validation', 'rate_limit', 'auth', 'unknown'));
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not add constraints: %', SQLERRM;
END $$;

-- Add comments
COMMENT ON COLUMN job_source_health.failure_stage IS 'Stage where failure occurred: fetch, normalize, dedup, upsert, post-filter';
COMMENT ON COLUMN job_source_health.failure_type IS 'Classified failure type: timeout, schema_mismatch, duplicate_key, validation, rate_limit, auth, unknown';
COMMENT ON COLUMN job_source_health.failure_batch_context IS 'Batch context at failure: {job_count, stale_count, insert_attempts}';

-- Create index for failure analysis
CREATE INDEX IF NOT EXISTS idx_source_health_failure_type 
  ON job_source_health(failure_type) 
  WHERE failure_type IS NOT NULL;
