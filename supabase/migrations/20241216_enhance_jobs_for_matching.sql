-- ============================================================================
-- ENHANCE JOBS TABLE FOR ATS-ALIGNED MATCHING
-- ============================================================================
-- Adds structured metadata fields to support modern ATS scoring:
-- - Seniority level extraction
-- - Experience years requirements
-- - Required vs preferred skills separation
-- - Education level requirements
-- - Industry classification
-- - Company size categorization
-- ============================================================================

-- Add seniority level (extracted from title/description)
-- Values: junior, mid, senior, lead, director, executive
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS seniority_level text;

-- Add experience requirements (extracted from description)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_years_min integer;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_years_max integer;

-- Separate required vs preferred skills for weighted scoring
-- These complement the existing 'keywords' column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_skills text[];
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS preferred_skills text[];

-- Education level requirement
-- Values: none, high_school, associate, bachelor, master, phd
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS education_level text;

-- Industry classification for industry preference matching
-- Values: tech, finance, healthcare, retail, manufacturing, education, etc.
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS industry text;

-- Company size for company preference matching
-- Values: startup, small, medium, large, enterprise
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_size text;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index on seniority for filtering
CREATE INDEX IF NOT EXISTS idx_jobs_seniority_level ON jobs(seniority_level) 
  WHERE seniority_level IS NOT NULL;

-- Index on industry for filtering
CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs(industry)
  WHERE industry IS NOT NULL;

-- GIN index for required_skills array searching
CREATE INDEX IF NOT EXISTS idx_jobs_required_skills ON jobs USING GIN(required_skills)
  WHERE required_skills IS NOT NULL;

-- ============================================================================
-- COLUMN COMMENTS
-- ============================================================================

COMMENT ON COLUMN jobs.seniority_level IS 
  'Experience level extracted from title/description: junior, mid, senior, lead, director, executive';

COMMENT ON COLUMN jobs.experience_years_min IS 
  'Minimum years of experience required, extracted from job description';

COMMENT ON COLUMN jobs.experience_years_max IS 
  'Maximum years of experience (upper bound if range specified)';

COMMENT ON COLUMN jobs.required_skills IS 
  'Skills explicitly marked as required in the job posting';

COMMENT ON COLUMN jobs.preferred_skills IS 
  'Skills marked as preferred/nice-to-have in the job posting';

COMMENT ON COLUMN jobs.education_level IS 
  'Minimum education requirement: none, high_school, associate, bachelor, master, phd';

COMMENT ON COLUMN jobs.industry IS 
  'Primary industry classification: tech, finance, healthcare, retail, etc.';

COMMENT ON COLUMN jobs.company_size IS 
  'Company size category: startup, small, medium, large, enterprise';
