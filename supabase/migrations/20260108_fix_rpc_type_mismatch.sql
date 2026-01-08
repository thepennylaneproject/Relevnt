-- Migration: Fix upsert_jobs_counted RPC type mismatch
-- Date: 2026-01-08
-- Issue: COALESCE types text and integer cannot be matched
-- 
-- The enrichment_confidence field is declared as TEXT in jsonb_to_recordset
-- but COALESCE(j.enrichment_confidence, 0) tries to match TEXT with INTEGER
-- 
-- Solution: Change COALESCE to use '0' (text) then cast whole expression to FLOAT

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
      -- Compute dedup_key if not provided
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

      j.salary_min::NUMERIC,
      j.salary_max::NUMERIC,
      j.competitiveness_level,

      COALESCE(j.is_active, TRUE),
      COALESCE(j.is_direct, FALSE),
      j.ats_type,
      -- FIX: Use text '0' in COALESCE since j.enrichment_confidence is TEXT from JSONB
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
    ON CONFLICT (source_slug, external_id)
    DO UPDATE SET
      title = EXCLUDED.title,
      company = EXCLUDED.company,
      location = EXCLUDED.location,
      description = EXCLUDED.description,
      external_url = EXCLUDED.external_url,
      employment_type = EXCLUDED.employment_type,
      remote_type = EXCLUDED.remote_type,
      posted_date = EXCLUDED.posted_date,
      salary_min = EXCLUDED.salary_min,
      salary_max = EXCLUDED.salary_max,
      competitiveness_level = EXCLUDED.competitiveness_level,
      is_active = EXCLUDED.is_active,
      is_direct = EXCLUDED.is_direct,
      ats_type = EXCLUDED.ats_type,
      enrichment_confidence = EXCLUDED.enrichment_confidence,
      seniority_level = EXCLUDED.seniority_level,
      experience_years_min = EXCLUDED.experience_years_min,
      experience_years_max = EXCLUDED.experience_years_max,
      required_skills = EXCLUDED.required_skills,
      preferred_skills = EXCLUDED.preferred_skills,
      education_level = EXCLUDED.education_level,
      industry = EXCLUDED.industry,
      dedup_key = COALESCE(EXCLUDED.dedup_key, compute_job_dedup_key(EXCLUDED.title, EXCLUDED.company, EXCLUDED.location)),
      updated_at = NOW()
    WHERE
      -- Only update if data actually changed (prevents unnecessary writes)
      public.jobs.title IS DISTINCT FROM EXCLUDED.title OR
      public.jobs.company IS DISTINCT FROM EXCLUDED.company OR
      public.jobs.location IS DISTINCT FROM EXCLUDED.location OR
      public.jobs.description IS DISTINCT FROM EXCLUDED.description OR
      public.jobs.external_url IS DISTINCT FROM EXCLUDED.external_url OR
      public.jobs.salary_min IS DISTINCT FROM EXCLUDED.salary_min OR
      public.jobs.salary_max IS DISTINCT FROM EXCLUDED.salary_max
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
  'Upserts jobs and returns accurate counts: inserted (new), updated (changed), noop (unchanged). Fixed type mismatch in COALESCE 2026-01-08.';
