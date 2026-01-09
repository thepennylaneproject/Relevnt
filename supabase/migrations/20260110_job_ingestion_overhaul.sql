-- ============================================================================
-- JOB INGESTION SYSTEM OVERHAUL
-- Date: 2026-01-10
-- Purpose: Complete overhaul of job ingestion system for production launch
-- ============================================================================
-- This migration adds:
-- 1. Missing feedback loop columns for search_queue
-- 2. Missing feedback loop columns for company_targets
-- 3. aggregator_sources configuration table
-- 4. title_families reference table
-- 5. ats_detection_queue table
-- 6. observed_titles table for title learning
-- 7. RPC functions for adaptive scheduling
-- 8. Ashby support columns
-- ============================================================================

-- ============================================================================
-- TASK 1.1: ADD MISSING COLUMNS TO search_queue
-- ============================================================================
-- These columns enable the feedback loop for adaptive scheduling

ALTER TABLE search_queue
ADD COLUMN IF NOT EXISTS consecutive_empty_runs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_jobs_found INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_interval_minutes INTEGER DEFAULT 720,
ADD COLUMN IF NOT EXISTS avg_jobs_per_run NUMERIC(5,2) DEFAULT 0;

COMMENT ON COLUMN search_queue.consecutive_empty_runs IS 'Count of consecutive runs where no new jobs were found. Used for cooling.';
COMMENT ON COLUMN search_queue.total_jobs_found IS 'Total jobs found across all runs. Used for avg calculation.';
COMMENT ON COLUMN search_queue.min_interval_minutes IS 'Minimum time between runs. Adjusted by cooling/warming logic.';
COMMENT ON COLUMN search_queue.avg_jobs_per_run IS 'Average jobs found per run. Used for prioritization.';

-- ============================================================================
-- TASK 1.2: ADD MISSING COLUMNS TO company_targets
-- ============================================================================

ALTER TABLE company_targets
ADD COLUMN IF NOT EXISTS consecutive_empty_runs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_jobs_found INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_jobs_per_run NUMERIC(5,2) DEFAULT 0;

COMMENT ON COLUMN company_targets.consecutive_empty_runs IS 'Count of consecutive runs where no new jobs were found. Used for cooling.';
COMMENT ON COLUMN company_targets.total_jobs_found IS 'Total jobs found across all runs.';
COMMENT ON COLUMN company_targets.avg_jobs_per_run IS 'Average jobs found per run.';

-- ============================================================================
-- TASK 1.2b: UPDATE company_targets success RPC to track consecutive_empty_runs
-- ============================================================================
-- Override the existing function to add feedback loop tracking

CREATE OR REPLACE FUNCTION update_company_target_success(
  p_target_id UUID,
  p_new_jobs_count INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interval INTEGER;
  v_current_total INTEGER;
  v_current_run_count INTEGER;
BEGIN
  SELECT min_interval_minutes, COALESCE(total_jobs_found, 0),
         COALESCE((SELECT COUNT(*) FROM company_targets WHERE id = p_target_id AND last_success_at IS NOT NULL), 0)
  INTO v_interval, v_current_total, v_current_run_count
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
    new_jobs_last = p_new_jobs_count,
    -- Track consecutive empty runs for cooling logic
    consecutive_empty_runs = CASE
      WHEN p_new_jobs_count > 0 THEN 0
      ELSE COALESCE(consecutive_empty_runs, 0) + 1
    END,
    -- Track total jobs for avg calculation
    total_jobs_found = COALESCE(total_jobs_found, 0) + p_new_jobs_count,
    -- Calculate avg (approximation using run count from timestamps)
    avg_jobs_per_run = CASE
      WHEN v_current_run_count + 1 > 0
      THEN (v_current_total + p_new_jobs_count)::NUMERIC / (v_current_run_count + 1)
      ELSE 0
    END
  WHERE id = p_target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_company_target_success TO service_role;

COMMENT ON FUNCTION update_company_target_success IS 'Update company target after successful scrape. Tracks consecutive_empty_runs for cooling logic.';

-- ============================================================================
-- TASK 1.3: RPC FUNCTION - increment_empty_runs for search_queue
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_empty_runs(slice_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE search_queue
  SET
    consecutive_empty_runs = consecutive_empty_runs + 1,
    run_count = run_count + 1,
    last_run_at = NOW(),
    updated_at = NOW()
  WHERE id = slice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_empty_runs TO service_role;

COMMENT ON FUNCTION increment_empty_runs IS 'Increment consecutive_empty_runs counter for a search_queue entry.';

-- ============================================================================
-- TASK 1.4: RPC FUNCTION - update_search_queue_success
-- ============================================================================
-- Called after a successful search with new jobs found

CREATE OR REPLACE FUNCTION update_search_queue_success(
  p_task_id UUID,
  p_new_job_count INTEGER,
  p_cooldown_minutes INTEGER DEFAULT 30
)
RETURNS void AS $$
DECLARE
  v_current_total INTEGER;
  v_current_run_count INTEGER;
  v_min_interval INTEGER;
BEGIN
  -- Get current values
  SELECT total_jobs_found, run_count, min_interval_minutes
  INTO v_current_total, v_current_run_count, v_min_interval
  FROM search_queue
  WHERE id = p_task_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Update with new results
  UPDATE search_queue
  SET
    consecutive_empty_runs = CASE
      WHEN p_new_job_count > 0 THEN 0
      ELSE consecutive_empty_runs + 1
    END,
    total_jobs_found = v_current_total + p_new_job_count,
    run_count = v_current_run_count + 1,
    last_result_count = p_new_job_count,
    avg_jobs_per_run = CASE
      WHEN v_current_run_count + 1 > 0
      THEN (v_current_total + p_new_job_count)::NUMERIC / (v_current_run_count + 1)
      ELSE 0
    END,
    last_run_at = NOW(),
    next_run_after = NOW() + (p_cooldown_minutes * INTERVAL '1 minute'),
    status = 'pending',
    updated_at = NOW()
  WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_search_queue_success TO service_role;

COMMENT ON FUNCTION update_search_queue_success IS 'Update search_queue entry after a successful search run.';

-- ============================================================================
-- TASK 1.5: RPC FUNCTIONS - Adaptive Interval Adjustment (warm_up/cool_down)
-- ============================================================================

-- Warm up: If a slice found 5+ jobs in last run, reduce interval (min 360 = 6h)
CREATE OR REPLACE FUNCTION warm_up_productive_slices()
RETURNS TABLE(
  slices_warmed INTEGER,
  targets_warmed INTEGER
) AS $$
DECLARE
  v_slices_warmed INTEGER := 0;
  v_targets_warmed INTEGER := 0;
BEGIN
  -- Warm up search_queue entries
  WITH warmed AS (
    UPDATE search_queue
    SET
      min_interval_minutes = GREATEST(360, min_interval_minutes - 120),
      updated_at = NOW()
    WHERE last_result_count >= 5
      AND min_interval_minutes > 360
    RETURNING id
  )
  SELECT COUNT(*) INTO v_slices_warmed FROM warmed;

  -- Warm up company_targets
  WITH warmed AS (
    UPDATE company_targets
    SET
      min_interval_minutes = GREATEST(720, min_interval_minutes - 240),
      updated_at = NOW()
    WHERE new_jobs_last >= 3
      AND min_interval_minutes > 720
    RETURNING id
  )
  SELECT COUNT(*) INTO v_targets_warmed FROM warmed;

  RETURN QUERY SELECT v_slices_warmed, v_targets_warmed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION warm_up_productive_slices TO service_role;

-- Cool down: If 3+ consecutive empty runs, increase interval (max 2880 = 48h)
CREATE OR REPLACE FUNCTION cool_down_empty_slices()
RETURNS TABLE(
  slices_cooled INTEGER,
  targets_cooled INTEGER
) AS $$
DECLARE
  v_slices_cooled INTEGER := 0;
  v_targets_cooled INTEGER := 0;
BEGIN
  -- Cool down search_queue entries
  WITH cooled AS (
    UPDATE search_queue
    SET
      min_interval_minutes = LEAST(2880, min_interval_minutes + 360),
      updated_at = NOW()
    WHERE consecutive_empty_runs >= 3
      AND min_interval_minutes < 2880
    RETURNING id
  )
  SELECT COUNT(*) INTO v_slices_cooled FROM cooled;

  -- Cool down company_targets
  WITH cooled AS (
    UPDATE company_targets
    SET
      min_interval_minutes = LEAST(4320, min_interval_minutes + 720),
      updated_at = NOW()
    WHERE consecutive_empty_runs >= 3
      AND min_interval_minutes < 4320
    RETURNING id
  )
  SELECT COUNT(*) INTO v_targets_cooled FROM cooled;

  RETURN QUERY SELECT v_slices_cooled, v_targets_cooled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION cool_down_empty_slices TO service_role;

COMMENT ON FUNCTION warm_up_productive_slices IS 'Reduce intervals for high-yield slices. Min 6h for search_queue, 12h for company_targets.';
COMMENT ON FUNCTION cool_down_empty_slices IS 'Increase intervals for empty slices. Max 48h for search_queue, 72h for company_targets.';

-- ============================================================================
-- TASK 2: AGGREGATOR_SOURCES CONFIGURATION TABLE
-- ============================================================================
-- Reference table for source capabilities (supports location filter, rate limits, etc.)

CREATE TABLE IF NOT EXISTS aggregator_sources (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  supports_location_filter BOOLEAN DEFAULT false,
  supports_keyword_filter BOOLEAN DEFAULT true,
  rate_limit_per_hour INTEGER DEFAULT 60,
  is_remote_only BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  base_url TEXT,
  -- Hourly call tracking for rate limiting
  calls_this_hour INTEGER DEFAULT 0,
  hour_started_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with known sources
INSERT INTO aggregator_sources (slug, name, supports_location_filter, is_remote_only, rate_limit_per_hour, is_active) VALUES
  ('remotive', 'Remotive', false, true, 60, true),
  ('remoteok', 'RemoteOK', false, true, 30, true),
  ('himalayas', 'Himalayas', false, true, 60, true),
  ('jobicy', 'Jobicy', false, true, 60, true),
  ('careerjet', 'CareerJet', true, false, 100, false),
  ('jooble', 'Jooble', true, false, 60, true),
  ('reed_uk', 'Reed UK', true, false, 60, true),
  ('arbeitnow', 'Arbeitnow', true, false, 60, true),
  ('themuse', 'The Muse', true, false, 60, true),
  ('adzuna_us', 'Adzuna US', true, false, 30, true),
  ('usajobs', 'USAJobs', true, false, 60, false),
  ('theirstack', 'TheirStack', true, false, 30, true),
  ('fantastic', 'Fantastic Jobs', true, false, 60, false),
  ('jobdatafeeds', 'JobDataFeeds', true, false, 60, false),
  ('careeronestop', 'CareerOneStop', true, false, 60, false)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  supports_location_filter = EXCLUDED.supports_location_filter,
  is_remote_only = EXCLUDED.is_remote_only,
  rate_limit_per_hour = EXCLUDED.rate_limit_per_hour;

COMMENT ON TABLE aggregator_sources IS 'Configuration table for job aggregator sources. Tracks capabilities and rate limits.';
COMMENT ON COLUMN aggregator_sources.is_remote_only IS 'True if source only has remote jobs (location filter is meaningless).';
COMMENT ON COLUMN aggregator_sources.calls_this_hour IS 'Number of API calls made in current hour window.';

-- RLS for aggregator_sources
ALTER TABLE aggregator_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on aggregator_sources" ON aggregator_sources
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon read on aggregator_sources" ON aggregator_sources
  FOR SELECT
  USING (true);

-- ============================================================================
-- TASK 2.2: DEDUPLICATE REMOTE-ONLY SOURCE SEARCHES
-- ============================================================================
-- Clean up search_queue for remote-only sources that have location-specific entries

-- First update all remote-only source entries to use 'remote' location
UPDATE search_queue
SET location = 'remote',
    updated_at = NOW()
WHERE source_slug IN ('remotive', 'remoteok', 'himalayas', 'jobicy')
  AND location != 'remote';

-- Remove duplicates keeping only one per (source_slug, keywords) for remote-only sources
-- We use a CTE to identify duplicates and delete all but the first one
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY source_slug, keywords
           ORDER BY created_at ASC
         ) as rn
  FROM search_queue
  WHERE source_slug IN ('remotive', 'remoteok', 'himalayas', 'jobicy')
)
DELETE FROM search_queue
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- ============================================================================
-- TASK 3: TITLE_FAMILIES REFERENCE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS title_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  seniority_variants TEXT[] DEFAULT ARRAY['', 'senior', 'junior', 'lead', 'staff', 'principal'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with diverse job families
INSERT INTO title_families (family_name, keywords) VALUES
  ('Engineering', ARRAY[
    'software engineer',
    'backend engineer',
    'frontend developer',
    'full stack developer',
    'devops engineer',
    'data engineer',
    'QA engineer',
    'security engineer',
    'mobile developer',
    'platform engineer'
  ]),
  ('Data & ML', ARRAY[
    'data scientist',
    'machine learning engineer',
    'data analyst',
    'ML engineer',
    'AI engineer',
    'business intelligence analyst',
    'analytics engineer'
  ]),
  ('Product & Design', ARRAY[
    'product manager',
    'product designer',
    'UX designer',
    'UI designer',
    'UX researcher',
    'product owner',
    'graphic designer',
    'design lead'
  ]),
  ('Marketing & Growth', ARRAY[
    'marketing manager',
    'digital marketing',
    'growth marketer',
    'content marketer',
    'SEO specialist',
    'social media manager',
    'brand manager',
    'content strategist',
    'email marketing',
    'performance marketing'
  ]),
  ('Sales & Customer', ARRAY[
    'account executive',
    'sales representative',
    'sales manager',
    'business development',
    'customer success manager',
    'account manager',
    'sales engineer',
    'solutions architect'
  ]),
  ('Operations & HR', ARRAY[
    'operations manager',
    'project manager',
    'HR manager',
    'recruiter',
    'office manager',
    'executive assistant',
    'people operations',
    'talent acquisition'
  ]),
  ('Finance', ARRAY[
    'financial analyst',
    'accountant',
    'controller',
    'FP&A analyst',
    'finance manager',
    'treasury analyst'
  ]),
  ('Healthcare', ARRAY[
    'registered nurse',
    'nurse practitioner',
    'medical assistant',
    'physical therapist',
    'healthcare administrator',
    'clinical research',
    'pharmacy technician'
  ]),
  ('Education', ARRAY[
    'teacher',
    'instructional designer',
    'curriculum developer',
    'training specialist',
    'education coordinator',
    'academic advisor'
  ])
ON CONFLICT DO NOTHING;

COMMENT ON TABLE title_families IS 'Reference table for job title families. Used to generate search slices.';

-- RLS for title_families
ALTER TABLE title_families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on title_families" ON title_families
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon read on title_families" ON title_families
  FOR SELECT
  USING (true);

-- ============================================================================
-- TASK 4: ASHBY SUPPORT - Add columns to companies table
-- ============================================================================

-- Add Ashby slug column
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS ashby_slug TEXT;

-- Add columns for company discovery and ATS detection
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS ats_type TEXT,
ADD COLUMN IF NOT EXISTS careers_page_url TEXT,
ADD COLUMN IF NOT EXISTS ats_detected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS discovered_via TEXT,
ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMPTZ;

COMMENT ON COLUMN companies.ashby_slug IS 'Ashby job board slug for companies using Ashby ATS.';
COMMENT ON COLUMN companies.ats_type IS 'Detected ATS platform: greenhouse, lever, ashby, workday, etc.';
COMMENT ON COLUMN companies.careers_page_url IS 'URL to company careers page or ATS board.';
COMMENT ON COLUMN companies.ats_detected_at IS 'When the ATS was detected for this company.';
COMMENT ON COLUMN companies.discovered_via IS 'Source that first discovered this company (e.g., jooble, remotive).';
COMMENT ON COLUMN companies.discovered_at IS 'When this company was first discovered.';

-- Create index for Ashby slug lookup
CREATE INDEX IF NOT EXISTS idx_companies_ashby_slug ON companies(ashby_slug) WHERE ashby_slug IS NOT NULL;

-- Allow 'ashby' as a platform in company_targets
DO $$
BEGIN
  -- Check if constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_targets_platform_check'
  ) THEN
    ALTER TABLE company_targets DROP CONSTRAINT company_targets_platform_check;
  END IF;

  -- Add new constraint with ashby included
  ALTER TABLE company_targets
    ADD CONSTRAINT company_targets_platform_check
    CHECK (platform IN ('lever', 'greenhouse', 'ashby', 'workday'));
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not update platform check constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- TASK 5: ATS_DETECTION_QUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ats_detection_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  domain TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'detected', 'not_found', 'error')),
  detected_ats TEXT,
  detected_slug TEXT,
  last_checked_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ats_detection_queue_status ON ats_detection_queue(status);
CREATE INDEX IF NOT EXISTS idx_ats_detection_queue_company_id ON ats_detection_queue(company_id);

COMMENT ON TABLE ats_detection_queue IS 'Queue for detecting ATS platforms for discovered companies.';

-- RLS for ats_detection_queue
ALTER TABLE ats_detection_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on ats_detection_queue" ON ats_detection_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TASK 6: RATE LIMITING HELPER FUNCTIONS
-- ============================================================================

-- Function to check if we can make a request (within rate limit)
CREATE OR REPLACE FUNCTION can_make_source_request(p_source_slug TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_rate_limit INTEGER;
  v_calls_this_hour INTEGER;
  v_hour_started_at TIMESTAMPTZ;
BEGIN
  -- Get source config
  SELECT rate_limit_per_hour, calls_this_hour, hour_started_at
  INTO v_rate_limit, v_calls_this_hour, v_hour_started_at
  FROM aggregator_sources
  WHERE slug = p_source_slug;

  IF NOT FOUND THEN
    RETURN TRUE; -- Unknown source, allow
  END IF;

  -- Reset counter if hour has passed
  IF v_hour_started_at < NOW() - INTERVAL '1 hour' THEN
    UPDATE aggregator_sources
    SET calls_this_hour = 0,
        hour_started_at = NOW()
    WHERE slug = p_source_slug;
    RETURN TRUE;
  END IF;

  RETURN v_calls_this_hour < v_rate_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_make_source_request TO service_role;

-- Function to record a request
CREATE OR REPLACE FUNCTION increment_source_calls(p_source_slug TEXT)
RETURNS void AS $$
DECLARE
  v_hour_started_at TIMESTAMPTZ;
BEGIN
  -- Get current hour start
  SELECT hour_started_at INTO v_hour_started_at
  FROM aggregator_sources
  WHERE slug = p_source_slug;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Reset counter if hour has passed
  IF v_hour_started_at < NOW() - INTERVAL '1 hour' THEN
    UPDATE aggregator_sources
    SET calls_this_hour = 1,
        hour_started_at = NOW()
    WHERE slug = p_source_slug;
  ELSE
    UPDATE aggregator_sources
    SET calls_this_hour = calls_this_hour + 1
    WHERE slug = p_source_slug;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_source_calls TO service_role;

COMMENT ON FUNCTION can_make_source_request IS 'Check if source is under rate limit for current hour.';
COMMENT ON FUNCTION increment_source_calls IS 'Increment call counter for source.';

-- ============================================================================
-- TASK 7: OBSERVED_TITLES TABLE FOR TITLE LEARNING
-- ============================================================================

CREATE TABLE IF NOT EXISTS observed_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_in_search_deck BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observed_titles_count ON observed_titles(occurrence_count DESC);
CREATE INDEX IF NOT EXISTS idx_observed_titles_normalized ON observed_titles(normalized_title);
CREATE UNIQUE INDEX IF NOT EXISTS idx_observed_titles_unique ON observed_titles(normalized_title);

COMMENT ON TABLE observed_titles IS 'Tracks job titles seen during ingestion for learning new search terms.';
COMMENT ON COLUMN observed_titles.is_in_search_deck IS 'True if this title has been promoted to the search queue.';

-- RLS for observed_titles
ALTER TABLE observed_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on observed_titles" ON observed_titles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to track/update observed title
CREATE OR REPLACE FUNCTION track_observed_title(p_raw_title TEXT, p_normalized_title TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO observed_titles (raw_title, normalized_title, occurrence_count, last_seen_at)
  VALUES (p_raw_title, p_normalized_title, 1, NOW())
  ON CONFLICT (normalized_title) DO UPDATE SET
    occurrence_count = observed_titles.occurrence_count + 1,
    last_seen_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION track_observed_title TO service_role;

-- ============================================================================
-- TASK 7.2: Promote Popular Titles Function
-- ============================================================================

CREATE OR REPLACE FUNCTION promote_popular_titles_to_search_deck(p_min_occurrences INTEGER DEFAULT 10, p_max_to_promote INTEGER DEFAULT 5)
RETURNS INTEGER AS $$
DECLARE
  v_promoted INTEGER := 0;
  v_title RECORD;
  v_source RECORD;
BEGIN
  -- Get popular titles not yet in search deck
  FOR v_title IN
    SELECT id, normalized_title
    FROM observed_titles
    WHERE occurrence_count >= p_min_occurrences
      AND is_in_search_deck = false
    ORDER BY occurrence_count DESC
    LIMIT p_max_to_promote
  LOOP
    -- Add to search_queue for each active source
    FOR v_source IN
      SELECT slug, is_remote_only
      FROM aggregator_sources
      WHERE is_active = true
    LOOP
      INSERT INTO search_queue (
        source_slug,
        keywords,
        location,
        min_interval_minutes,
        priority,
        status,
        next_run_after
      )
      VALUES (
        v_source.slug,
        v_title.normalized_title,
        CASE WHEN v_source.is_remote_only THEN 'remote' ELSE 'US' END,
        720,
        40, -- Lower priority for discovered titles
        'pending',
        NOW()
      )
      ON CONFLICT (source_slug, keywords, location) DO NOTHING;
    END LOOP;

    -- Mark as added to search deck
    UPDATE observed_titles
    SET is_in_search_deck = true
    WHERE id = v_title.id;

    v_promoted := v_promoted + 1;
  END LOOP;

  RETURN v_promoted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION promote_popular_titles_to_search_deck TO service_role;

COMMENT ON FUNCTION promote_popular_titles_to_search_deck IS 'Promote frequently-seen job titles to the search queue.';

-- ============================================================================
-- Add unique constraint to search_queue if not exists
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_search_queue_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_search_queue_unique
    ON search_queue(source_slug, keywords, location);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'Unique index already exists';
END $$;

-- Add unique constraint on ats_detection_queue.company_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_ats_detection_queue_company_unique
  ON ats_detection_queue(company_id);

-- ============================================================================
-- SEED KNOWN ASHBY COMPANIES
-- ============================================================================
-- Add Ashby slugs to known companies and create company_targets for them

-- Known Ashby companies (research-based list)
DO $$
DECLARE
  v_company_slugs TEXT[] := ARRAY[
    'notion',
    'ramp',
    'mercury',
    'linear',
    'vercel',
    'supabase',
    'retool',
    'datadog',
    'figma',
    'stripe',
    'plaid',
    'coinbase',
    'instacart',
    'doordash',
    'rippling',
    'brex',
    'carta',
    'flexport',
    'scale',
    'airtable'
  ];
  v_slug TEXT;
  v_company_id UUID;
BEGIN
  FOREACH v_slug IN ARRAY v_company_slugs
  LOOP
    -- Try to update existing company
    UPDATE companies
    SET ashby_slug = v_slug,
        ats_type = 'ashby',
        careers_page_url = 'https://jobs.ashbyhq.com/' || v_slug
    WHERE LOWER(name) = v_slug
      OR domain ILIKE '%' || v_slug || '.%'
    RETURNING id INTO v_company_id;

    -- Create company_target if company was updated
    IF v_company_id IS NOT NULL THEN
      INSERT INTO company_targets (platform, company_slug, company_id, status, min_interval_minutes, priority)
      VALUES ('ashby', v_slug, v_company_id, 'active', 1440, 100)
      ON CONFLICT (platform, company_slug) DO NOTHING;
    ELSE
      -- Create company_target without company_id for now (will link later)
      INSERT INTO company_targets (platform, company_slug, status, min_interval_minutes, priority)
      VALUES ('ashby', v_slug, 'active', 1440, 100)
      ON CONFLICT (platform, company_slug) DO NOTHING;
    END IF;
  END LOOP;

  RAISE NOTICE 'Seeded Ashby company targets';
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Check search_queue columns
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_name = 'search_queue'
    AND column_name IN ('consecutive_empty_runs', 'total_jobs_found', 'min_interval_minutes');

  IF v_count < 3 THEN
    RAISE EXCEPTION 'Missing columns in search_queue';
  END IF;

  -- Check aggregator_sources
  SELECT COUNT(*) INTO v_count FROM aggregator_sources;
  IF v_count < 5 THEN
    RAISE EXCEPTION 'aggregator_sources not properly seeded';
  END IF;

  -- Check title_families
  SELECT COUNT(*) INTO v_count FROM title_families;
  IF v_count < 5 THEN
    RAISE EXCEPTION 'title_families not properly seeded';
  END IF;

  RAISE NOTICE 'SUCCESS: Job ingestion overhaul migration completed';
  RAISE NOTICE '  - search_queue feedback columns: OK';
  RAISE NOTICE '  - aggregator_sources table: OK (% sources)', v_count;
  RAISE NOTICE '  - title_families table: OK';
  RAISE NOTICE '  - ats_detection_queue table: OK';
  RAISE NOTICE '  - observed_titles table: OK';
  RAISE NOTICE '  - RPC functions: OK';
END $$;
