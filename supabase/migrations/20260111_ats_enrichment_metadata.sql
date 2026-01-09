-- Migration: ATS Enrichment Metadata
-- Date: 2026-01-11
-- Purpose: Add tracking columns for discovery sources, queries, and detection confidence

-- 1. ENRICH ats_detection_queue
ALTER TABLE ats_detection_queue
ADD COLUMN IF NOT EXISTS discovery_source TEXT,
ADD COLUMN IF NOT EXISTS discovery_query TEXT,
ADD COLUMN IF NOT EXISTS discovered_url TEXT,
ADD COLUMN IF NOT EXISTS confidence_score TEXT CHECK (confidence_score IN ('low', 'medium', 'high'));

COMMENT ON COLUMN ats_detection_queue.discovery_source IS 'Source that found this domain (e.g., enlyft, search_api, vendor_page).';
COMMENT ON COLUMN ats_detection_queue.discovery_query IS 'The search query or reference that discovered this domain.';
COMMENT ON COLUMN ats_detection_queue.discovered_url IS 'The specific URL where the ATS signal was first found.';
COMMENT ON COLUMN ats_detection_queue.confidence_score IS 'Detection confidence level (low, medium, high).';

-- 2. ENRICH companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS ats_confidence_score TEXT CHECK (ats_confidence_score IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS discovery_metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN companies.ats_confidence_score IS 'Confidence level of the active ATS detection.';
COMMENT ON COLUMN companies.discovery_metadata IS 'Additional context from discovery (queries, sources, timestamps).';

-- 3. INDEX FOR FILTERING
CREATE INDEX IF NOT EXISTS idx_companies_ats_confidence ON companies(ats_confidence_score) WHERE ats_confidence_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ats_detection_queue_confidence ON ats_detection_queue(confidence_score) WHERE confidence_score IS NOT NULL;
