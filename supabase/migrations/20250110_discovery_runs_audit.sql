-- Create audit table for discovery runs
CREATE TABLE IF NOT EXISTS discovery_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  run_id TEXT UNIQUE NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  duration_ms INTEGER,

  status TEXT CHECK (status IN ('success', 'failed', 'partial')),

  -- Statistics
  stats JSONB,
  sources TEXT[],
  errors TEXT[],

  created_at TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_discovery_runs_status ON discovery_runs (status);
CREATE INDEX idx_discovery_runs_started ON discovery_runs (started_at DESC);
CREATE INDEX idx_discovery_runs_completed ON discovery_runs (completed_at DESC);

-- Enable RLS
ALTER TABLE discovery_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role access" ON discovery_runs
  FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Create summary view for monitoring
CREATE OR REPLACE VIEW discovery_summary AS
SELECT
  DATE(started_at) as run_date,
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_runs,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,

  -- Extract stats from JSON
  SUM((stats->>'companies_discovered')::INT) as companies_discovered,
  SUM((stats->>'platforms_detected')::INT) as platforms_detected,
  SUM((stats->>'companies_added')::INT) as companies_added,
  SUM((stats->>'priorities_updated')::INT) as priorities_updated,
  SUM((stats->>'growth_companies_identified')::INT) as growth_companies,

  AVG(duration_ms) as avg_duration_ms,
  MAX(duration_ms) as max_duration_ms
FROM discovery_runs
GROUP BY DATE(started_at)
ORDER BY run_date DESC;

-- Create materialized view for updated company registry (includes ML scores)
CREATE MATERIALIZED VIEW company_ingestion_queue AS
SELECT
  c.id,
  c.name,
  c.domain,
  c.lever_slug,
  c.greenhouse_board_token,
  c.priority_tier,
  c.growth_score,
  c.job_creation_velocity,
  c.last_synced_at,

  -- Calculate priority score (Phase 1 + ML signals)
  (
    -- Recency penalty: days since sync * 0.3
    (EXTRACT(epoch FROM (now() - c.last_synced_at)) / 86400 * 0.3) +
    -- Growth score: 0-100 * 0.35
    (c.growth_score * 0.35) +
    -- Velocity: jobs/week * 0.25
    (COALESCE(c.job_creation_velocity, 0) * 0.25) +
    -- ML bonus: priority tier * 0.1
    (CASE
      WHEN c.priority_tier = 'high' THEN 15
      WHEN c.priority_tier = 'standard' THEN 0
      WHEN c.priority_tier = 'low' THEN -10
      ELSE 0
    END) * 0.1
  ) AS ingestion_priority_score,

  -- Estimated jobs/week based on velocity
  COALESCE(c.job_creation_velocity, 0) as estimated_jobs_per_week

FROM companies c
WHERE c.is_active = true
  AND (c.lever_slug IS NOT NULL OR c.greenhouse_board_token IS NOT NULL)
ORDER BY ingestion_priority_score DESC;

-- Index for efficient queries
CREATE INDEX idx_company_ingestion_queue_priority ON company_ingestion_queue (ingestion_priority_score DESC);
