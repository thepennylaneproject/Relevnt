-- Add enrichment data fields to jobs table
-- These track whether a job URL points directly to company careers page

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_direct BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ats_type TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS enrichment_confidence FLOAT DEFAULT 0;

-- Create index for finding direct apply links
CREATE INDEX IF NOT EXISTS idx_jobs_is_direct ON jobs(is_direct);
CREATE INDEX IF NOT EXISTS idx_jobs_enrichment_confidence ON jobs(enrichment_confidence);

-- Add comment for documentation
COMMENT ON COLUMN jobs.is_direct IS 'True if external_url is from company''s own ATS/careers page, not aggregator';
COMMENT ON COLUMN jobs.ats_type IS 'Type of ATS detected: lever, greenhouse, workday, or null';
COMMENT ON COLUMN jobs.enrichment_confidence IS 'Confidence score (0-1) for how certain the enrichment is. 1.0 = certain, 0.5 = uncertain';
