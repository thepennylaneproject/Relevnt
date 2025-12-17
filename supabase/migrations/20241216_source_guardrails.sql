-- ============================================================================
-- SOURCE GUARDRAILS AND FRESHNESS TRACKING
-- ============================================================================
-- Adds columns to track freshness metrics during job ingestion.
-- Supports the new guardrails system that filters stale jobs.
-- ============================================================================

-- Add freshness tracking to source run logs
ALTER TABLE job_ingestion_run_sources
  ADD COLUMN IF NOT EXISTS stale_filtered_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freshness_ratio NUMERIC(5,4);

-- Add source mode and config to health tracking  
ALTER TABLE job_source_health
  ADD COLUMN IF NOT EXISTS source_mode TEXT,
  ADD COLUMN IF NOT EXISTS max_age_days INTEGER,
  ADD COLUMN IF NOT EXISTS median_job_age_days NUMERIC(5,2);

-- ============================================================================
-- COLUMN COMMENTS
-- ============================================================================

COMMENT ON COLUMN job_ingestion_run_sources.stale_filtered_count IS 
  'Number of jobs filtered out due to freshness ceiling (posted_date older than maxAgeDays)';

COMMENT ON COLUMN job_ingestion_run_sources.freshness_ratio IS 
  'Ratio of truly new jobs to total normalized (0.0-1.0). High ratio = fresh source, low = stale/resurfaced';

COMMENT ON COLUMN job_source_health.source_mode IS
  'Ingestion mode: fresh-only, shallow-curated, or wide-capped';

COMMENT ON COLUMN job_source_health.max_age_days IS
  'Maximum job age allowed for this source (jobs older than this are filtered)';

COMMENT ON COLUMN job_source_health.median_job_age_days IS
  'Median age of jobs from this source (for monitoring freshness drift)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
