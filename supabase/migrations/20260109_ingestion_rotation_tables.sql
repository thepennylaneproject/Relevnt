-- Migration: Add ingestion rotation tables (company_targets, search_slices)
-- Date: 2026-01-09
-- Purpose: Enable "high frequency, low repetition" ingestion architecture
--
-- company_targets: Explicit scheduling for ATS (Lever/Greenhouse) companies
-- search_slices: Adaptive scheduling for aggregator queries with cooling/warming

-- =============================================================================
-- 1. COMPANY_TARGETS TABLE
-- =============================================================================
-- Replaces implicit company selection with explicit, per-company scheduling.
-- Each target has its own next_allowed_at to enable rotation.

CREATE TABLE IF NOT EXISTS company_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('lever','greenhouse')),
  company_slug TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','bad')),
  last_success_at TIMESTAMPTZ,
  next_allowed_at TIMESTAMPTZ,
  min_interval_minutes INTEGER NOT NULL DEFAULT 1440, -- 24h default
  priority INTEGER NOT NULL DEFAULT 100, -- Lower = higher priority
  fail_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  new_jobs_last INTEGER DEFAULT 0, -- Track productivity per company
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one target per (platform, company_slug)
CREATE UNIQUE INDEX IF NOT EXISTS company_targets_platform_slug_idx
  ON company_targets(platform, company_slug);

-- Index for eligible target selection (active, past next_allowed_at, ordered by priority)
CREATE INDEX IF NOT EXISTS company_targets_eligible_idx
  ON company_targets(status, next_allowed_at, priority)
  WHERE status = 'active';

-- Index for linking back to companies registry
CREATE INDEX IF NOT EXISTS company_targets_company_id_idx
  ON company_targets(company_id)
  WHERE company_id IS NOT NULL;

COMMENT ON TABLE company_targets IS 'Per-company scheduling for ATS ingestion (Lever/Greenhouse). Uses next_allowed_at for rotation.';
COMMENT ON COLUMN company_targets.min_interval_minutes IS 'Minimum time between ingestion attempts. Default 24h for ATS.';
COMMENT ON COLUMN company_targets.priority IS 'Lower number = higher priority. Used for ordering eligible targets.';
COMMENT ON COLUMN company_targets.new_jobs_last IS 'Number of truly new jobs from last successful run (upsertResult.inserted).';

-- =============================================================================
-- 2. SEARCH_SLICES TABLE
-- =============================================================================
-- Enhanced version of job_search_profiles with adaptive intervals.
-- Cooling: if new_jobs_last = 0 for 3 consecutive runs, double interval (cap 24h)
-- Warming: if new_jobs_last > 0, halve interval (floor 6h)

CREATE TABLE IF NOT EXISTS search_slices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- e.g. 'jooble', 'reed_uk', 'arbeitnow'
  query_hash TEXT NOT NULL, -- MD5 of normalized params for uniqueness
  params_json JSONB NOT NULL, -- {keywords, location, days_back, etc.}
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','bad')),
  last_success_at TIMESTAMPTZ,
  next_allowed_at TIMESTAMPTZ,
  min_interval_minutes INTEGER NOT NULL DEFAULT 720, -- 12h default
  result_count_last INTEGER DEFAULT 0, -- Total jobs returned
  new_jobs_last INTEGER DEFAULT 0, -- Truly new (upsertResult.inserted)
  consecutive_empty_runs INTEGER NOT NULL DEFAULT 0, -- For cooling logic
  fail_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: one slice per (source, query_hash)
CREATE UNIQUE INDEX IF NOT EXISTS search_slices_source_query_hash_idx
  ON search_slices(source, query_hash);

-- Index for eligible slice selection
CREATE INDEX IF NOT EXISTS search_slices_eligible_idx
  ON search_slices(status, next_allowed_at, last_success_at)
  WHERE status = 'active';

-- Index for source-specific queries
CREATE INDEX IF NOT EXISTS search_slices_source_idx
  ON search_slices(source)
  WHERE status = 'active';

COMMENT ON TABLE search_slices IS 'Aggregator query slices with adaptive cooldown. Cooling doubles interval after 3 empty runs; warming halves after productive runs.';
COMMENT ON COLUMN search_slices.query_hash IS 'MD5 hash of normalized params_json for uniqueness check.';
COMMENT ON COLUMN search_slices.params_json IS 'Search parameters: {keywords, location, days_back, etc.}';
COMMENT ON COLUMN search_slices.consecutive_empty_runs IS 'Count of consecutive runs where new_jobs_last = 0. Used for cooling.';

-- =============================================================================
-- 3. UPDATED_AT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_rotation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS company_targets_updated_at ON company_targets;
CREATE TRIGGER company_targets_updated_at
  BEFORE UPDATE ON company_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_rotation_updated_at();

DROP TRIGGER IF EXISTS search_slices_updated_at ON search_slices;
CREATE TRIGGER search_slices_updated_at
  BEFORE UPDATE ON search_slices
  FOR EACH ROW
  EXECUTE FUNCTION update_rotation_updated_at();

-- =============================================================================
-- 4. RLS POLICIES
-- =============================================================================

ALTER TABLE company_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_slices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on company_targets" ON company_targets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on search_slices" ON search_slices
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 5. SEED COMPANY_TARGETS FROM EXISTING COMPANIES
-- =============================================================================
-- Populate from companies registry where lever_slug or greenhouse_board_token exists

-- Lever companies
INSERT INTO company_targets (platform, company_slug, company_id, priority, min_interval_minutes, status)
SELECT 
  'lever',
  lever_slug,
  id,
  CASE 
    WHEN priority_tier = 'high' THEN 50
    WHEN priority_tier = 'low' THEN 150
    ELSE 100 
  END,
  1440, -- 24h default
  CASE WHEN is_active THEN 'active' ELSE 'paused' END
FROM companies 
WHERE lever_slug IS NOT NULL
ON CONFLICT (platform, company_slug) DO NOTHING;

-- Greenhouse companies
INSERT INTO company_targets (platform, company_slug, company_id, priority, min_interval_minutes, status)
SELECT 
  'greenhouse',
  greenhouse_board_token,
  id,
  CASE 
    WHEN priority_tier = 'high' THEN 50
    WHEN priority_tier = 'low' THEN 150
    ELSE 100 
  END,
  1440, -- 24h default
  CASE WHEN is_active THEN 'active' ELSE 'paused' END
FROM companies 
WHERE greenhouse_board_token IS NOT NULL
ON CONFLICT (platform, company_slug) DO NOTHING;

-- =============================================================================
-- 6. SEED SEARCH_SLICES FROM EXISTING JOB_SEARCH_PROFILES
-- =============================================================================
-- Migrate existing search profiles to the new search_slices table

INSERT INTO search_slices (source, query_hash, params_json, min_interval_minutes, status)
SELECT 
  source,
  md5(source || ':' || LOWER(TRIM(keywords)) || ':' || LOWER(TRIM(location))),
  jsonb_build_object(
    'keywords', keywords,
    'location', location
  ),
  720, -- 12h default
  CASE WHEN enabled THEN 'active' ELSE 'paused' END
FROM job_search_profiles
ON CONFLICT (source, query_hash) DO NOTHING;

-- =============================================================================
-- 7. HELPER FUNCTION: Apply cooling/warming to search slice
-- =============================================================================
-- Called after each successful ingest to adjust min_interval_minutes

CREATE OR REPLACE FUNCTION apply_slice_cooling_warming(
  p_slice_id UUID,
  p_new_jobs_count INTEGER
) RETURNS TABLE (
  new_interval_minutes INTEGER,
  new_consecutive_empty INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_interval INTEGER;
  v_current_empty INTEGER;
  v_new_interval INTEGER;
  v_new_empty INTEGER;
BEGIN
  -- Get current values
  SELECT min_interval_minutes, consecutive_empty_runs
  INTO v_current_interval, v_current_empty
  FROM search_slices
  WHERE id = p_slice_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  IF p_new_jobs_count = 0 THEN
    -- Cooling: increment consecutive empty runs
    v_new_empty := v_current_empty + 1;
    
    -- After 3 consecutive empty runs, double the interval (cap at 24h = 1440)
    IF v_new_empty >= 3 THEN
      v_new_interval := LEAST(v_current_interval * 2, 1440);
    ELSE
      v_new_interval := v_current_interval;
    END IF;
  ELSE
    -- Warming: reset empty counter, halve interval (floor at 6h = 360)
    v_new_empty := 0;
    v_new_interval := GREATEST(v_current_interval / 2, 360);
  END IF;
  
  -- Update the slice
  UPDATE search_slices
  SET 
    min_interval_minutes = v_new_interval,
    consecutive_empty_runs = v_new_empty,
    new_jobs_last = p_new_jobs_count,
    last_success_at = NOW(),
    next_allowed_at = NOW() + (v_new_interval || ' minutes')::interval
  WHERE id = p_slice_id;
  
  RETURN QUERY SELECT v_new_interval, v_new_empty;
END;
$$;

GRANT EXECUTE ON FUNCTION apply_slice_cooling_warming TO service_role;

COMMENT ON FUNCTION apply_slice_cooling_warming IS 
  'Applies cooling (double interval after 3 empty runs) or warming (halve interval after productive run) to a search slice.';

-- =============================================================================
-- 8. HELPER FUNCTION: Update company target after success
-- =============================================================================

CREATE OR REPLACE FUNCTION update_company_target_success(
  p_target_id UUID,
  p_new_jobs_count INTEGER
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_interval INTEGER;
BEGIN
  SELECT min_interval_minutes INTO v_interval
  FROM company_targets
  WHERE id = p_target_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  UPDATE company_targets
  SET 
    last_success_at = NOW(),
    next_allowed_at = NOW() + (v_interval || ' minutes')::interval,
    fail_count = 0,
    last_error = NULL,
    new_jobs_last = p_new_jobs_count
  WHERE id = p_target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_company_target_success TO service_role;

-- =============================================================================
-- 9. HELPER FUNCTION: Update company target after failure
-- =============================================================================

CREATE OR REPLACE FUNCTION update_company_target_failure(
  p_target_id UUID,
  p_error_message TEXT
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_interval INTEGER;
  v_fail_count INTEGER;
  v_backoff_multiplier INTEGER;
BEGIN
  SELECT min_interval_minutes, fail_count INTO v_interval, v_fail_count
  FROM company_targets
  WHERE id = p_target_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Exponential backoff: 2^fail_count, capped at 8x
  v_backoff_multiplier := LEAST(POWER(2, LEAST(v_fail_count, 3))::INTEGER, 8);
  
  UPDATE company_targets
  SET 
    fail_count = v_fail_count + 1,
    last_error = p_error_message,
    next_allowed_at = NOW() + ((v_interval * v_backoff_multiplier) || ' minutes')::interval,
    -- Mark as 'bad' after 5 consecutive failures
    status = CASE WHEN v_fail_count + 1 >= 5 THEN 'bad' ELSE status END
  WHERE id = p_target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_company_target_failure TO service_role;

-- =============================================================================
-- DONE
-- =============================================================================
-- Summary:
-- - Created company_targets table with per-company scheduling
-- - Created search_slices table with adaptive cooling/warming
-- - Seeded from existing companies and job_search_profiles
-- - Added helper functions for success/failure updates
