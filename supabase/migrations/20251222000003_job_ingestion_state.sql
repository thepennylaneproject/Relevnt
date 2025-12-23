-- Create job_ingestion_state table for tracking pagination cursors
-- This table tracks the cursor position for each job ingestion source
-- so pagination can resume from where it left off

CREATE TABLE IF NOT EXISTS job_ingestion_state (
  source TEXT PRIMARY KEY,
  cursor JSONB DEFAULT '{}',
  last_run_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE job_ingestion_state ENABLE ROW LEVEL SECURITY;

-- Create policy: allow authenticated service role to manage state
CREATE POLICY "Allow service role to manage ingestion state" ON job_ingestion_state
  AS PERMISSIVE
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Create index on last_run_at for efficient cooldown checks
CREATE INDEX IF NOT EXISTS idx_job_ingestion_state_last_run ON job_ingestion_state(last_run_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_job_ingestion_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS job_ingestion_state_updated_at ON job_ingestion_state;
CREATE TRIGGER job_ingestion_state_updated_at
  BEFORE UPDATE ON job_ingestion_state
  FOR EACH ROW
  EXECUTE FUNCTION update_job_ingestion_state_updated_at();
