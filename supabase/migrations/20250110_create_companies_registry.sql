-- Create companies registry table for centralized platform tracking
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name TEXT NOT NULL,
  domain TEXT UNIQUE,

  -- Platform integrations
  lever_slug TEXT,
  greenhouse_board_token TEXT,

  -- Discovery & growth metrics
  founding_year INTEGER,
  funding_stage TEXT CHECK (funding_stage IN ('pre-seed', 'seed', 'series_a', 'series_b', 'series_c', 'series_d+', 'public', 'acquired', 'unknown')),
  employee_count INTEGER,
  industry TEXT,

  -- Sync tracking
  last_synced_at TIMESTAMP,
  last_synced_platforms TEXT[] DEFAULT '{}',
  sync_frequency_hours INTEGER DEFAULT 24,

  -- Scoring for prioritization
  job_creation_velocity FLOAT DEFAULT 0, -- jobs/week average
  growth_score FLOAT DEFAULT 0, -- 0-100 based on funding + growth
  priority_tier TEXT DEFAULT 'standard' CHECK (priority_tier IN ('high', 'standard', 'low')),

  -- Discovery metadata
  discovered_via TEXT DEFAULT 'manual', -- 'yc', 'crunchbase', 'manual', 'careers_page', 'user_submit'
  discovered_at TIMESTAMP DEFAULT now(),
  verified_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_companies_priority ON companies (priority_tier, last_synced_at);
CREATE INDEX idx_companies_growth ON companies (growth_score DESC);
CREATE INDEX idx_companies_velocity ON companies (job_creation_velocity DESC);
CREATE INDEX idx_companies_active ON companies (is_active);
CREATE INDEX idx_companies_lever ON companies (lever_slug) WHERE lever_slug IS NOT NULL;
CREATE INDEX idx_companies_greenhouse ON companies (greenhouse_board_token) WHERE greenhouse_board_token IS NOT NULL;
CREATE INDEX idx_companies_funding ON companies (funding_stage);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for functions)
CREATE POLICY "Service role access" ON companies
  FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for ingestion scoring
CREATE MATERIALIZED VIEW companies_priority_queue AS
SELECT
  id,
  name,
  domain,
  lever_slug,
  greenhouse_board_token,
  founding_year,
  funding_stage,
  employee_count,
  industry,
  last_synced_at,
  priority_tier,

  -- Calculate priority score
  (
    -- Recency penalty: days since sync * 0.4
    (EXTRACT(epoch FROM (now() - last_synced_at)) / 86400 * 0.4) +
    -- Growth bonus: growth_score * 0.35
    (growth_score * 0.35) +
    -- Velocity bonus: job_creation_velocity * 0.25
    (COALESCE(job_creation_velocity, 0) * 0.25)
  ) AS priority_score
FROM companies
WHERE is_active = true
  AND (lever_slug IS NOT NULL OR greenhouse_board_token IS NOT NULL)
ORDER BY priority_score DESC;

-- Index for the view
CREATE INDEX idx_priority_queue_score ON companies_priority_queue (priority_score DESC);
