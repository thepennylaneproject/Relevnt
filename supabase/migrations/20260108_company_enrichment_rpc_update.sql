-- Migration: Update RPC and dedup function for company enrichment
-- Date: 2026-01-08
-- Purpose: Support company_id in deduplication and job storage

-- 1. UPDATE DEDUP KEY FUNCTION TO SUPPORT company_id
CREATE OR REPLACE FUNCTION public.compute_job_dedup_key(
  p_title TEXT,
  p_company TEXT,
  p_location TEXT,
  p_company_id UUID DEFAULT NULL
) RETURNS TEXT
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT md5(
    LOWER(TRIM(COALESCE(p_title, ''))) || '|' ||
    LOWER(TRIM(COALESCE(p_company_id::TEXT, REGEXP_REPLACE(COALESCE(p_company, ''), '[^a-zA-Z0-9]', '', 'g')))) || '|' ||
    LOWER(TRIM(REGEXP_REPLACE(COALESCE(p_location, ''), '[^a-zA-Z0-9]', '', 'g')))
  )
$$;

-- 2. UPDATE UPSERT RPC TO HANDLE company_id
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
      source_slug,
      external_id,
      dedup_key,
      company_id, -- NEW COLUMN

      title,
      company,
      location,
      description,
      external_url,

      employment_type,
      remote_type,
      posted_date,
      created_at,

      salary_min,
      salary_max,
      competitiveness_level,

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
      source
    )
    SELECT
      j.source_slug,
      j.external_id,
      -- Pass company_id to dedup key computation
      COALESCE(j.dedup_key, compute_job_dedup_key(j.title, j.company, j.location, j.company_id::UUID)),
      j.company_id::UUID,

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
      j.source_slug
    FROM jsonb_to_recordset(jobs) AS j(
      source_slug TEXT,
      external_id TEXT,
      dedup_key TEXT,
      company_id TEXT, -- NEW FIELD
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
      company_id = COALESCE(EXCLUDED.company_id, public.jobs.company_id), -- UPDATE company_id
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
      updated_at = NOW()
    WHERE
      public.jobs.title IS DISTINCT FROM EXCLUDED.title OR
      public.jobs.company IS DISTINCT FROM EXCLUDED.company OR
      public.jobs.location IS DISTINCT FROM EXCLUDED.location OR
      public.jobs.description IS DISTINCT FROM EXCLUDED.description OR
      public.jobs.external_url IS DISTINCT FROM EXCLUDED.external_url OR
      public.jobs.company_id IS DISTINCT FROM EXCLUDED.company_id
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
  'Upserts jobs using dedup_key with company_id support. Returns accurate counts. Updated 2026-01-08.';
