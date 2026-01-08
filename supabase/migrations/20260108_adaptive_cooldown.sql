-- Migration: Add adaptive cooldown tracking to job_ingestion_state
-- Date: 2026-01-08
-- Purpose: Track consecutive high-noop runs to enable adaptive cooldowns

-- Add columns for adaptive cooldown tracking
ALTER TABLE job_ingestion_state
  ADD COLUMN IF NOT EXISTS consecutive_high_noop_runs INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_noop_ratio FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cooldown_multiplier FLOAT DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS last_inserted_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_updated_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_noop_count INTEGER DEFAULT 0;

COMMENT ON COLUMN job_ingestion_state.consecutive_high_noop_runs IS
  'Number of consecutive runs where noop_ratio > 0.6. Used to increase cooldown.';

COMMENT ON COLUMN job_ingestion_state.last_noop_ratio IS
  'Ratio of noop jobs to total processed in last run (0.0-1.0).';

COMMENT ON COLUMN job_ingestion_state.cooldown_multiplier IS
  'Current multiplier for source cooldown (1.0 = normal, 2.0 = double cooldown).';

-- Create function to update adaptive cooldown state after each run
CREATE OR REPLACE FUNCTION update_ingestion_adaptive_state(
  p_source TEXT,
  p_inserted INTEGER,
  p_updated INTEGER,
  p_noop INTEGER
) RETURNS TABLE (
  new_cooldown_multiplier FLOAT,
  new_consecutive_high_noop INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INTEGER;
  v_noop_ratio FLOAT;
  v_current_consecutive INTEGER;
  v_new_consecutive INTEGER;
  v_new_multiplier FLOAT;
BEGIN
  v_total := p_inserted + p_updated + p_noop;
  
  IF v_total = 0 THEN
    v_noop_ratio := 0;
  ELSE
    v_noop_ratio := p_noop::FLOAT / v_total;
  END IF;
  
  -- Get current consecutive count
  SELECT COALESCE(consecutive_high_noop_runs, 0)
  INTO v_current_consecutive
  FROM job_ingestion_state
  WHERE source = p_source;
  
  IF NOT FOUND THEN
    v_current_consecutive := 0;
  END IF;
  
  -- Update consecutive count based on noop ratio
  -- High noop threshold is 60%
  IF v_noop_ratio > 0.6 THEN
    v_new_consecutive := v_current_consecutive + 1;
  ELSE
    v_new_consecutive := 0;  -- Reset on good run
  END IF;
  
  -- Calculate cooldown multiplier based on consecutive high-noop runs
  -- 0 consecutive: 1.0x (normal)
  -- 1-2 consecutive: 1.5x
  -- 3-5 consecutive: 2.0x
  -- 6+ consecutive: 3.0x (max)
  IF v_new_consecutive = 0 THEN
    v_new_multiplier := 1.0;
  ELSIF v_new_consecutive <= 2 THEN
    v_new_multiplier := 1.5;
  ELSIF v_new_consecutive <= 5 THEN
    v_new_multiplier := 2.0;
  ELSE
    v_new_multiplier := 3.0;
  END IF;
  
  -- Update state
  INSERT INTO job_ingestion_state (
    source,
    consecutive_high_noop_runs,
    last_noop_ratio,
    cooldown_multiplier,
    last_inserted_count,
    last_updated_count,
    last_noop_count,
    last_run_at
  ) VALUES (
    p_source,
    v_new_consecutive,
    v_noop_ratio,
    v_new_multiplier,
    p_inserted,
    p_updated,
    p_noop,
    NOW()
  )
  ON CONFLICT (source) DO UPDATE SET
    consecutive_high_noop_runs = v_new_consecutive,
    last_noop_ratio = v_noop_ratio,
    cooldown_multiplier = v_new_multiplier,
    last_inserted_count = p_inserted,
    last_updated_count = p_updated,
    last_noop_count = p_noop,
    last_run_at = NOW();
  
  RETURN QUERY SELECT v_new_multiplier, v_new_consecutive;
END;
$$;

GRANT EXECUTE ON FUNCTION update_ingestion_adaptive_state TO service_role;

COMMENT ON FUNCTION update_ingestion_adaptive_state IS
  'Updates adaptive cooldown state after each ingestion run. Returns new cooldown multiplier.';
