-- Migration: Add last_seen_at column for proper freshness tracking
-- Date: 2026-01-08
-- Purpose: Track when jobs were last seen during ingestion, enabling proper cleanup
--
-- PROBLEM: The cleanup job was deleting based on posted_date (original posting date),
--          but jobs that are still active get re-ingested. Without tracking when a job
--          was last seen, we delete jobs that are still being actively listed.
--
-- SOLUTION: Add last_seen_at column that gets updated on every upsert (insert or update).
--           The cleanup should use last_seen_at instead of posted_date.

-- ============================================================================
-- 1. ADD LAST_SEEN_AT COLUMN
-- ============================================================================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Set default for existing rows to the most recent activity timestamp
UPDATE jobs
SET last_seen_at = COALESCE(updated_at, created_at, NOW())
WHERE last_seen_at IS NULL;

-- Set default for new rows
ALTER TABLE jobs ALTER COLUMN last_seen_at SET DEFAULT NOW();

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_jobs_last_seen_at ON jobs(last_seen_at);

COMMENT ON COLUMN jobs.last_seen_at IS
  'Timestamp of when this job was last seen during ingestion. Updated on every upsert. Used for cleanup decisions.';

-- ============================================================================
-- 2. UPDATE UPSERT RPC TO ALWAYS SET last_seen_at = NOW()
-- ============================================================================
CREATE OR REPLACE FUNCTION public.upsert_jobs_counted(jobs JSONB)
RETURNS TABLE (
  inserted_count INT,
  updated_count INT,
  noop_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempted_count INT;
BEGIN
  -- Count attempted jobs
  SELECT jsonb_array_length(jobs) INTO attempted_count;

  -- Handle empty array
  IF attempted_count = 0 OR attempted_count IS NULL THEN
    RETURN QUERY SELECT 0::INT, 0::INT, 0::INT;
    RETURN;
  END IF;

  -- Create temp table to store upsert results
  CREATE TEMP TABLE IF NOT EXISTS _upsert_results (
    id UUID,
    was_inserted BOOLEAN
  ) ON COMMIT DROP;

  TRUNCATE _upsert_results;

  -- Perform upsert with RETURNING to track what happened
  WITH upserted AS (
    INSERT INTO public.jobs (
      -- Identity fields
      source_slug,
      external_id,
      dedup_key,

      -- Core job fields
      title,
      company,
      location,
      description,
      external_url,

      -- Metadata
      employment_type,
      remote_type,
      posted_date,
      created_at,

      -- FRESHNESS TRACKING
      last_seen_at,

      -- Salary
      salary_min,
      salary_max,
      competitiveness_level,

      -- Enrichment fields
      is_active,
      is_direct,
      ats_type,
      enrichment_confidence,
      seniority_level,
      experience_years_min,
      experience_years_max,
      required_skills,
      preferred_skills,
      education_level,
      industry,

      -- Source compatibility
      source
    )
    SELECT
      j.source_slug,
      j.external_id,
      COALESCE(j.dedup_key, compute_job_dedup_key(j.title, j.company, j.location)),

      j.title,
      j.company,
      j.location,
      j.description,
      j.external_url,

      j.employment_type,
      j.remote_type,
      j.posted_date::TIMESTAMPTZ,
      COALESCE(j.created_at::TIMESTAMPTZ, NOW()),

      -- ALWAYS set last_seen_at to NOW() on insert
      NOW(),

      j.salary_min::NUMERIC,
      j.salary_max::NUMERIC,
      j.competitiveness_level,

      COALESCE(j.is_active, TRUE),
      COALESCE(j.is_direct, FALSE),
      j.ats_type,
      COALESCE(j.enrichment_confidence, '0')::FLOAT,
      j.seniority_level,
      j.experience_years_min::INT,
      j.experience_years_max::INT,
      CASE WHEN j.required_skills IS NOT NULL THEN
        ARRAY(SELECT jsonb_array_elements_text(j.required_skills))
      ELSE NULL END,
      CASE WHEN j.preferred_skills IS NOT NULL THEN
        ARRAY(SELECT jsonb_array_elements_text(j.preferred_skills))
      ELSE NULL END,
      j.education_level,
      j.industry,

      j.source_slug -- source = source_slug for compatibility
    FROM jsonb_to_recordset(jobs) AS j(
      source_slug TEXT,
      external_id TEXT,
      dedup_key TEXT,
      title TEXT,
      company TEXT,
      location TEXT,
      description TEXT,
      external_url TEXT,
      employment_type TEXT,
      remote_type TEXT,
      posted_date TEXT,
      created_at TEXT,
      salary_min TEXT,
      salary_max TEXT,
      competitiveness_level TEXT,
      is_active BOOLEAN,
      is_direct BOOLEAN,
      ats_type TEXT,
      enrichment_confidence TEXT,
      seniority_level TEXT,
      experience_years_min TEXT,
      experience_years_max TEXT,
      required_skills JSONB,
      preferred_skills JSONB,
      education_level TEXT,
      industry TEXT
    )
    ON CONFLICT (dedup_key)
    DO UPDATE SET
      -- Update source info if the new source is higher trust
      source_slug = CASE
        WHEN (CASE EXCLUDED.source_slug
          WHEN 'greenhouse' THEN 1
          WHEN 'lever' THEN 2
          WHEN 'remotive' THEN 3
          ELSE 10
        END) < (CASE public.jobs.source_slug
          WHEN 'greenhouse' THEN 1
          WHEN 'lever' THEN 2
          WHEN 'remotive' THEN 3
          ELSE 10
        END)
        THEN EXCLUDED.source_slug
        ELSE public.jobs.source_slug
      END,
      external_id = CASE
        WHEN EXCLUDED.source_slug = public.jobs.source_slug
        THEN EXCLUDED.external_id
        ELSE public.jobs.external_id
      END,
      title = EXCLUDED.title,
      company = EXCLUDED.company,
      location = EXCLUDED.location,
      description = CASE
        WHEN LENGTH(COALESCE(EXCLUDED.description, '')) > LENGTH(COALESCE(public.jobs.description, ''))
        THEN EXCLUDED.description
        ELSE COALESCE(public.jobs.description, EXCLUDED.description)
      END,
      external_url = EXCLUDED.external_url,
      employment_type = COALESCE(EXCLUDED.employment_type, public.jobs.employment_type),
      remote_type = COALESCE(EXCLUDED.remote_type, public.jobs.remote_type),
      posted_date = COALESCE(EXCLUDED.posted_date, public.jobs.posted_date),
      salary_min = COALESCE(EXCLUDED.salary_min, public.jobs.salary_min),
      salary_max = COALESCE(EXCLUDED.salary_max, public.jobs.salary_max),
      competitiveness_level = COALESCE(EXCLUDED.competitiveness_level, public.jobs.competitiveness_level),
      is_active = EXCLUDED.is_active,
      is_direct = EXCLUDED.is_direct,
      ats_type = COALESCE(EXCLUDED.ats_type, public.jobs.ats_type),
      enrichment_confidence = EXCLUDED.enrichment_confidence,
      seniority_level = COALESCE(EXCLUDED.seniority_level, public.jobs.seniority_level),
      experience_years_min = COALESCE(EXCLUDED.experience_years_min, public.jobs.experience_years_min),
      experience_years_max = COALESCE(EXCLUDED.experience_years_max, public.jobs.experience_years_max),
      required_skills = COALESCE(EXCLUDED.required_skills, public.jobs.required_skills),
      preferred_skills = COALESCE(EXCLUDED.preferred_skills, public.jobs.preferred_skills),
      education_level = COALESCE(EXCLUDED.education_level, public.jobs.education_level),
      industry = COALESCE(EXCLUDED.industry, public.jobs.industry),
      updated_at = NOW(),
      -- CRITICAL: Always update last_seen_at on conflict/update
      last_seen_at = NOW()
    WHERE
      -- Only update if data actually changed (prevents unnecessary writes)
      -- BUT always update last_seen_at even if data is same
      public.jobs.title IS DISTINCT FROM EXCLUDED.title OR
      public.jobs.company IS DISTINCT FROM EXCLUDED.company OR
      public.jobs.location IS DISTINCT FROM EXCLUDED.location OR
      public.jobs.description IS DISTINCT FROM EXCLUDED.description OR
      public.jobs.external_url IS DISTINCT FROM EXCLUDED.external_url OR
      public.jobs.salary_min IS DISTINCT FROM EXCLUDED.salary_min OR
      public.jobs.salary_max IS DISTINCT FROM EXCLUDED.salary_max OR
      -- ALWAYS update if last_seen_at is more than 1 hour old (ensures freshness tracking)
      public.jobs.last_seen_at < NOW() - INTERVAL '1 hour'
    RETURNING id, (xmax = 0) AS was_inserted
  )
  INSERT INTO _upsert_results SELECT * FROM upserted;

  -- Calculate counts
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN was_inserted THEN 1 ELSE 0 END), 0)::INT AS inserted_count,
    COALESCE(SUM(CASE WHEN NOT was_inserted THEN 1 ELSE 0 END), 0)::INT AS updated_count,
    (attempted_count - COUNT(*))::INT AS noop_count
  FROM _upsert_results;

END;
$$;

COMMENT ON FUNCTION public.upsert_jobs_counted IS
  'Upserts jobs using dedup_key for cross-source deduplication. Always updates last_seen_at for freshness tracking. Returns accurate counts: inserted (new), updated (changed), noop (unchanged). Updated 2026-01-08.';

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION public.upsert_jobs_counted TO service_role;

-- ============================================================================
-- 3. VERIFY COLUMN EXISTS
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'last_seen_at'
  ) THEN
    RAISE NOTICE 'SUCCESS: last_seen_at column added to jobs table';
  ELSE
    RAISE EXCEPTION 'FAILED: last_seen_at column was not added';
  END IF;
END $$;
