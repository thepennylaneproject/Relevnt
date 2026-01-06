-- =============================================================================
-- STRATEGIC PIVOT REPORTS MIGRATION
-- =============================================================================
-- Created: 2026-01-02
-- Purpose: Add strategic pivot reports table and enhanced application tracking
--          fields to support AI-driven rejection analysis and pattern detection
-- =============================================================================

-- ============================================================================
-- PART 1: Enhanced Application Tracking Fields
-- ============================================================================

-- Add job characteristic fields to applications table for pattern analysis
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS job_skills_required JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS job_experience_level TEXT,
  ADD COLUMN IF NOT EXISTS job_company_size TEXT,
  ADD COLUMN IF NOT EXISTS job_industry TEXT,
  ADD COLUMN IF NOT EXISTS application_source TEXT;

-- Add field documentation
COMMENT ON COLUMN applications.job_skills_required IS 'Array of skills/technologies required in job posting';
COMMENT ON COLUMN applications.job_experience_level IS 'Experience level: entry, mid, senior, lead, executive';
COMMENT ON COLUMN applications.job_company_size IS 'Company size: startup, small, medium, large, enterprise';
COMMENT ON COLUMN applications.job_industry IS 'Industry/sector of the company';
COMMENT ON COLUMN applications.application_source IS 'Where user found the job: linkedin, indeed, company_site, referral, etc.';

-- Create indexes for efficient pattern analysis queries
CREATE INDEX IF NOT EXISTS idx_applications_experience_level
  ON applications (user_id, job_experience_level, status)
  WHERE job_experience_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_company_size
  ON applications (user_id, job_company_size, status)
  WHERE job_company_size IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_industry
  ON applications (user_id, job_industry, status)
  WHERE job_industry IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_source
  ON applications (user_id, application_source, status)
  WHERE application_source IS NOT NULL;

-- GIN index for skills array queries
CREATE INDEX IF NOT EXISTS idx_applications_skills_gin
  ON applications USING GIN (job_skills_required)
  WHERE job_skills_required != '[]'::jsonb;

-- ============================================================================
-- PART 2: Strategic Pivot Reports Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.strategic_pivot_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Report metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Statistics snapshot
  total_applications INTEGER NOT NULL DEFAULT 0,
  total_responses INTEGER NOT NULL DEFAULT 0,
  total_interviews INTEGER NOT NULL DEFAULT 0,
  total_offers INTEGER NOT NULL DEFAULT 0,
  total_rejections INTEGER NOT NULL DEFAULT 0,
  
  -- Calculated rates
  response_rate DECIMAL(5,2),
  interview_rate DECIMAL(5,2),
  offer_rate DECIMAL(5,2),
  
  -- AI-generated insights (structured JSON)
  insights JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Recommendations with actions
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- User interaction tracking
  recommendations_applied JSONB DEFAULT '[]'::jsonb,
  recommendations_dismissed JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for strategic_pivot_reports
CREATE INDEX IF NOT EXISTS idx_strategic_reports_user_date
  ON strategic_pivot_reports (user_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategic_reports_period
  ON strategic_pivot_reports (user_id, period_start, period_end);

-- RLS Policies
ALTER TABLE public.strategic_pivot_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own strategic reports"
  ON public.strategic_pivot_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own strategic reports"
  ON public.strategic_pivot_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategic reports"
  ON public.strategic_pivot_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategic reports"
  ON public.strategic_pivot_reports FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PART 3: Helper Functions
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_strategic_report_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_strategic_reports_updated_at ON public.strategic_pivot_reports;
CREATE TRIGGER trigger_strategic_reports_updated_at
  BEFORE UPDATE ON public.strategic_pivot_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_strategic_report_updated_at();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
