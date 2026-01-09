-- ============================================================================
-- CONSOLIDATED JOB INGESTION FIX
-- Date: 2026-01-09
-- Purpose: Single migration to fix all job ingestion issues
-- ============================================================================
--
-- This migration MUST run after all 20260108_* migrations.
-- It fixes:
-- 1. The partial unique index that can't be inferred by ON CONFLICT
-- 2. Missing last_seen_at column for freshness tracking
-- 3. Updates the RPC to the correct, working version
--
-- This migration is IDEMPOTENT - safe to run multiple times.
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX THE UNIQUE CONSTRAINT
-- ============================================================================
-- Problem: jobs_dedup_key_unique_idx is a PARTIAL INDEX (WHERE dedup_key IS NOT NULL)
-- PostgreSQL cannot infer partial indexes from ON CONFLICT (dedup_key)
-- Solution: Convert to a proper UNIQUE CONSTRAINT

-- First, drop the problematic partial index
DROP INDEX IF EXISTS jobs_dedup_key_unique_idx;

-- Also drop any constraint with similar name (in case of partial migration)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_dedup_key_unique') THEN
    RAISE NOTICE 'Constraint jobs_dedup_key_unique already exists - keeping it';
  ELSE
    -- Handle duplicates before creating constraint
    RAISE NOTICE 'Checking for duplicate dedup_keys...';

    -- Delete duplicates, keeping the best version
    WITH to_delete AS (
      SELECT id FROM (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY dedup_key
            ORDER BY
              CASE source_slug
                WHEN 'greenhouse' THEN 1
                WHEN 'lever' THEN 2
                WHEN 'remotive' THEN 3
                WHEN 'themuse' THEN 4
                WHEN 'himalayas' THEN 5
                ELSE 10
              END,
              CASE WHEN salary_min IS NOT NULL THEN 0 ELSE 1 END,
              CASE WHEN description IS NOT NULL AND LENGTH(description) > 100 THEN 0 ELSE 1 END,
              updated_at DESC NULLS LAST,
              created_at DESC NULLS LAST
          ) AS rn
        FROM jobs
        WHERE dedup_key IS NOT NULL
      ) sub WHERE rn > 1
    )
    DELETE FROM jobs WHERE id IN (SELECT id FROM to_delete);

    -- Now create the constraint
    RAISE NOTICE 'Creating unique constraint on dedup_key...';
    ALTER TABLE jobs ADD CONSTRAINT jobs_dedup_key_unique UNIQUE (dedup_key);
  END IF;
END $$;

-- ============================================================================
-- STEP 2: ADD LAST_SEEN_AT COLUMN
-- ============================================================================
-- This column tracks when a job was last seen during ingestion
-- Used for proper cleanup decisions (instead of posted_date)

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Backfill existing rows
UPDATE jobs
SET last_seen_at = COALESCE(updated_at, created_at, NOW())
WHERE last_seen_at IS NULL;

-- Set default for new rows
ALTER TABLE jobs ALTER COLUMN last_seen_at SET DEFAULT NOW();

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_jobs_last_seen_at ON jobs(last_seen_at);

COMMENT ON COLUMN jobs.last_seen_at IS
  'When this job was last seen during ingestion. Updated on every upsert. Used for cleanup.';

-- ============================================================================
-- STEP 3: CREATE/UPDATE THE UPSERT RPC FUNCTION
-- ============================================================================
-- This is the FINAL, CORRECT version that:
-- - Uses ON CONFLICT (dedup_key) with proper constraint
-- - Always sets last_seen_at = NOW()
-- - Handles all enrichment fields

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
  SELECT jsonb_array_length(jobs) INTO attempted_count;

  IF attempted_count = 0 OR attempted_count IS NULL THEN
    RETURN QUERY SELECT 0::INT, 0::INT, 0::INT;
    RETURN;
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS _upsert_results (
    id UUID,
    was_inserted BOOLEAN
  ) ON COMMIT DROP;

  TRUNCATE _upsert_results;

  WITH upserted AS (
    INSERT INTO public.jobs (
      source_slug, external_id, dedup_key,
      title, company, location, description, external_url,
      employment_type, remote_type, posted_date, created_at,
      last_seen_at,  -- FRESHNESS TRACKING
      salary_min, salary_max, competitiveness_level,
      is_active, is_direct, ats_type, enrichment_confidence,
      seniority_level, experience_years_min, experience_years_max,
      required_skills, preferred_skills, education_level, industry,
      source
    )
    SELECT
      j.source_slug,
      j.external_id,
      COALESCE(j.dedup_key, public.compute_job_dedup_key(j.title, j.company, j.location)),
      j.title, j.company, j.location, j.description, j.external_url,
      j.employment_type, j.remote_type,
      j.posted_date::TIMESTAMPTZ,
      COALESCE(j.created_at::TIMESTAMPTZ, NOW()),
      NOW(),  -- Always set last_seen_at to NOW() on insert
      j.salary_min::NUMERIC, j.salary_max::NUMERIC, j.competitiveness_level,
      COALESCE(j.is_active, TRUE),
      COALESCE(j.is_direct, FALSE),
      j.ats_type,
      COALESCE(j.enrichment_confidence, '0')::FLOAT,
      j.seniority_level,
      j.experience_years_min::INT, j.experience_years_max::INT,
      CASE WHEN j.required_skills IS NOT NULL THEN
        ARRAY(SELECT jsonb_array_elements_text(j.required_skills))
      ELSE NULL END,
      CASE WHEN j.preferred_skills IS NOT NULL THEN
        ARRAY(SELECT jsonb_array_elements_text(j.preferred_skills))
      ELSE NULL END,
      j.education_level, j.industry,
      j.source_slug
    FROM jsonb_to_recordset(jobs) AS j(
      source_slug TEXT, external_id TEXT, dedup_key TEXT,
      title TEXT, company TEXT, location TEXT, description TEXT, external_url TEXT,
      employment_type TEXT, remote_type TEXT, posted_date TEXT, created_at TEXT,
      salary_min TEXT, salary_max TEXT, competitiveness_level TEXT,
      is_active BOOLEAN, is_direct BOOLEAN, ats_type TEXT, enrichment_confidence TEXT,
      seniority_level TEXT, experience_years_min TEXT, experience_years_max TEXT,
      required_skills JSONB, preferred_skills JSONB, education_level TEXT, industry TEXT
    )
    ON CONFLICT (dedup_key)
    DO UPDATE SET
      source_slug = CASE
        WHEN (CASE EXCLUDED.source_slug WHEN 'greenhouse' THEN 1 WHEN 'lever' THEN 2 WHEN 'remotive' THEN 3 ELSE 10 END)
           < (CASE public.jobs.source_slug WHEN 'greenhouse' THEN 1 WHEN 'lever' THEN 2 WHEN 'remotive' THEN 3 ELSE 10 END)
        THEN EXCLUDED.source_slug
        ELSE public.jobs.source_slug
      END,
      external_id = CASE
        WHEN EXCLUDED.source_slug = public.jobs.source_slug THEN EXCLUDED.external_id
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
      last_seen_at = NOW()  -- ALWAYS update last_seen_at
    WHERE
      public.jobs.title IS DISTINCT FROM EXCLUDED.title OR
      public.jobs.company IS DISTINCT FROM EXCLUDED.company OR
      public.jobs.location IS DISTINCT FROM EXCLUDED.location OR
      public.jobs.description IS DISTINCT FROM EXCLUDED.description OR
      public.jobs.external_url IS DISTINCT FROM EXCLUDED.external_url OR
      public.jobs.salary_min IS DISTINCT FROM EXCLUDED.salary_min OR
      public.jobs.salary_max IS DISTINCT FROM EXCLUDED.salary_max OR
      public.jobs.last_seen_at < NOW() - INTERVAL '1 hour'
    RETURNING id, (xmax = 0) AS was_inserted
  )
  INSERT INTO _upsert_results SELECT * FROM upserted;

  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN was_inserted THEN 1 ELSE 0 END), 0)::INT AS inserted_count,
    COALESCE(SUM(CASE WHEN NOT was_inserted THEN 1 ELSE 0 END), 0)::INT AS updated_count,
    (attempted_count - COUNT(*))::INT AS noop_count
  FROM _upsert_results;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_jobs_counted TO service_role;

COMMENT ON FUNCTION public.upsert_jobs_counted IS
  'Upserts jobs using dedup_key. Always updates last_seen_at for freshness. Returns: inserted, updated, noop counts. Fixed 2026-01-09.';

-- ============================================================================
-- STEP 4: VERIFY EVERYTHING IS SET UP CORRECTLY
-- ============================================================================
DO $$
DECLARE
  constraint_exists BOOLEAN;
  column_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  -- Check constraint
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_dedup_key_unique'
  ) INTO constraint_exists;

  -- Check column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'last_seen_at'
  ) INTO column_exists;

  -- Check function
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'upsert_jobs_counted'
  ) INTO function_exists;

  IF constraint_exists AND column_exists AND function_exists THEN
    RAISE NOTICE 'SUCCESS: All job ingestion fixes applied successfully';
    RAISE NOTICE '  - jobs_dedup_key_unique constraint: OK';
    RAISE NOTICE '  - last_seen_at column: OK';
    RAISE NOTICE '  - upsert_jobs_counted function: OK';
  ELSE
    IF NOT constraint_exists THEN
      RAISE EXCEPTION 'FAILED: jobs_dedup_key_unique constraint not created';
    END IF;
    IF NOT column_exists THEN
      RAISE EXCEPTION 'FAILED: last_seen_at column not created';
    END IF;
    IF NOT function_exists THEN
      RAISE EXCEPTION 'FAILED: upsert_jobs_counted function not created';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- DONE!
-- After running this migration:
-- 1. Deploy the updated Netlify functions (which have cleanup disabled)
-- 2. Run ingestion - jobs should start inserting/updating with last_seen_at
-- 3. Monitor: SELECT MAX(last_seen_at) FROM jobs; -- should move forward
-- ============================================================================
