-- ============================================================================
-- FIX INTRA-BATCH DUPLICATE DEDUP_KEYS
-- Date: 2026-01-10
-- Purpose: Handle duplicate jobs within a single upsert batch
-- ============================================================================
--
-- Problem: When the same job appears multiple times in one batch, PostgreSQL
-- checks the UNIQUE constraint before ON CONFLICT, causing errors like:
-- "duplicate key value violates unique constraint jobs_dedup_key_unique"
--
-- Solution: Deduplicate the batch using DISTINCT ON before INSERT
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

  -- Deduplicate the batch BEFORE inserting
  -- Use DISTINCT ON to keep the best version of each duplicate dedup_key
  WITH deduped_batch AS (
    SELECT DISTINCT ON (computed_dedup_key)
      source_slug, external_id, computed_dedup_key AS dedup_key,
      title, company, location, description, external_url,
      employment_type, remote_type, posted_date, created_at,
      salary_min, salary_max, competitiveness_level,
      is_active, is_direct, ats_type, enrichment_confidence,
      seniority_level, experience_years_min, experience_years_max,
      required_skills, preferred_skills, education_level, industry
    FROM (
      SELECT
        j.source_slug,
        j.external_id,
        COALESCE(j.dedup_key, public.compute_job_dedup_key(j.title, j.company, j.location)) AS computed_dedup_key,
        j.title, j.company, j.location, j.description, j.external_url,
        j.employment_type, j.remote_type,
        j.posted_date, j.created_at,
        j.salary_min, j.salary_max, j.competitiveness_level,
        j.is_active, j.is_direct, j.ats_type, j.enrichment_confidence,
        j.seniority_level,
        j.experience_years_min, j.experience_years_max,
        j.required_skills, j.preferred_skills, j.education_level, j.industry,
        -- Prioritize by source quality and data completeness
        CASE j.source_slug
          WHEN 'greenhouse' THEN 1
          WHEN 'lever' THEN 2
          WHEN 'remotive' THEN 3
          WHEN 'themuse' THEN 4
          WHEN 'himalayas' THEN 5
          ELSE 10
        END AS source_priority,
        CASE WHEN j.salary_min IS NOT NULL THEN 0 ELSE 1 END AS has_salary,
        LENGTH(COALESCE(j.description, '')) AS desc_length
      FROM jsonb_to_recordset(jobs) AS j(
        source_slug TEXT, external_id TEXT, dedup_key TEXT,
        title TEXT, company TEXT, location TEXT, description TEXT, external_url TEXT,
        employment_type TEXT, remote_type TEXT, posted_date TEXT, created_at TEXT,
        salary_min TEXT, salary_max TEXT, competitiveness_level TEXT,
        is_active BOOLEAN, is_direct BOOLEAN, ats_type TEXT, enrichment_confidence TEXT,
        seniority_level TEXT, experience_years_min TEXT, experience_years_max TEXT,
        required_skills JSONB, preferred_skills JSONB, education_level TEXT, industry TEXT
      )
    ) sub
    ORDER BY computed_dedup_key, source_priority, has_salary, desc_length DESC
  ),
  upserted AS (
    INSERT INTO public.jobs (
      source_slug, external_id, dedup_key,
      title, company, location, description, external_url,
      employment_type, remote_type, posted_date, created_at,
      last_seen_at,
      salary_min, salary_max, competitiveness_level,
      is_active, is_direct, ats_type, enrichment_confidence,
      seniority_level, experience_years_min, experience_years_max,
      required_skills, preferred_skills, education_level, industry,
      source
    )
    SELECT
      source_slug, external_id, dedup_key,
      title, company, location, description, external_url,
      employment_type, remote_type,
      posted_date::TIMESTAMPTZ,
      COALESCE(created_at::TIMESTAMPTZ, NOW()),
      NOW(),  -- last_seen_at
      salary_min::NUMERIC, salary_max::NUMERIC, competitiveness_level,
      COALESCE(is_active, TRUE),
      COALESCE(is_direct, FALSE),
      ats_type,
      COALESCE(enrichment_confidence, '0')::FLOAT,
      seniority_level,
      experience_years_min::INT, experience_years_max::INT,
      CASE WHEN required_skills IS NOT NULL THEN
        ARRAY(SELECT jsonb_array_elements_text(required_skills))
      ELSE NULL END,
      CASE WHEN preferred_skills IS NOT NULL THEN
        ARRAY(SELECT jsonb_array_elements_text(preferred_skills))
      ELSE NULL END,
      education_level, industry,
      source_slug
    FROM deduped_batch
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
      last_seen_at = NOW()
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
  'Upserts jobs with intra-batch deduplication. Uses DISTINCT ON to handle duplicate dedup_keys within the same batch. Fixed 2026-01-10.';
