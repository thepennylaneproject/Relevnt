-- Migration: Add job URL enrichment tracking
-- This migration adds fields to track when and how job URLs were enriched
-- with direct company links

BEGIN;

-- Add column to track if URL was enriched from aggregator to direct link
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS url_enriched BOOLEAN DEFAULT FALSE;

-- Add column to track enrichment confidence (0-1)
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS url_enrichment_confidence DECIMAL(3,2);

-- Add column to track how URL was enriched
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS url_enrichment_method TEXT CHECK (url_enrichment_method IN ('registry_lookup', 'ats_detection', 'fallback', NULL));

-- Create index on url_enriched for filtering
CREATE INDEX IF NOT EXISTS idx_jobs_url_enriched ON jobs(url_enriched);

-- Add comments
COMMENT ON COLUMN jobs.url_enriched IS 'Whether the external_url was enriched from an aggregator to a direct company link';
COMMENT ON COLUMN jobs.url_enrichment_confidence IS 'Confidence score (0-1) of the URL enrichment accuracy';
COMMENT ON COLUMN jobs.url_enrichment_method IS 'Method used for enrichment: registry_lookup, ats_detection, or fallback';

COMMIT;
