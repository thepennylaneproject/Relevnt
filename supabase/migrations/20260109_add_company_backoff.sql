-- Migration: Add backoff logic to company_targets
-- Date: 2026-01-09
-- Purpose: Add consecutive_empty_runs tracking to company_targets (like search_slices)
--          and update the success handler to implement cooling/warming

-- =============================================================================
-- 1. ADD CONSECUTIVE_EMPTY_RUNS COLUMN
-- =============================================================================

ALTER TABLE company_targets
ADD COLUMN IF NOT EXISTS consecutive_empty_runs INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN company_targets.consecutive_empty_runs IS
  'Count of consecutive runs where new_jobs_last = 0. Used for cooling (backoff).';

-- =============================================================================
-- 2. UPDATE SUCCESS FUNCTION WITH COOLING/WARMING
-- =============================================================================

-- Drop existing function since we're changing the return type
DROP FUNCTION IF EXISTS update_company_target_success(UUID, INTEGER);

CREATE OR REPLACE FUNCTION update_company_target_success(
  p_target_id UUID,
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
  FROM company_targets
  WHERE id = p_target_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF p_new_jobs_count = 0 THEN
    -- Cooling: increment consecutive empty runs
    v_new_empty := v_current_empty + 1;

    -- After 3 consecutive empty runs, double the interval (cap at 48h = 2880)
    IF v_new_empty >= 3 THEN
      v_new_interval := LEAST(v_current_interval * 2, 2880);
    ELSE
      v_new_interval := v_current_interval;
    END IF;
  ELSE
    -- Warming: reset empty counter, halve interval (floor at 12h = 720)
    v_new_empty := 0;
    v_new_interval := GREATEST(v_current_interval / 2, 720);
  END IF;

  -- Update the target
  UPDATE company_targets
  SET
    last_success_at = NOW(),
    next_allowed_at = NOW() + (v_new_interval || ' minutes')::interval,
    fail_count = 0,
    last_error = NULL,
    new_jobs_last = p_new_jobs_count,
    min_interval_minutes = v_new_interval,
    consecutive_empty_runs = v_new_empty
  WHERE id = p_target_id;

  RETURN QUERY SELECT v_new_interval, v_new_empty;
END;
$$;

GRANT EXECUTE ON FUNCTION update_company_target_success TO service_role;

COMMENT ON FUNCTION update_company_target_success IS
  'Updates company target after successful ingestion. Implements cooling (double interval after 3 empty runs, cap 48h) and warming (halve interval after productive run, floor 12h).';
