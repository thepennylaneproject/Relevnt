-- =============================================================================
-- COMPANY RESPONSIVENESS TRACKING MIGRATION
-- =============================================================================
-- Created: 2026-01-02
-- Purpose: Add fields to applications table to track company response times
--          and enable sentiment analysis for job seekers
-- =============================================================================

-- Add new columns to applications table
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS company_response_time INTEGER,
  ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS response_received BOOLEAN DEFAULT false;

-- Add comment documentation
COMMENT ON COLUMN applications.company_response_time IS 'Number of days from application submission to first company response';
COMMENT ON COLUMN applications.last_status_update IS 'Timestamp of most recent status change';
COMMENT ON COLUMN applications.response_received IS 'Whether any response (interview, offer, etc.) was received from company';

-- Create index for efficient company sentiment queries
CREATE INDEX IF NOT EXISTS idx_applications_company_sentiment
  ON applications (company, response_received, company_response_time)
  WHERE company_response_time IS NOT NULL;

-- Create index for status update tracking
CREATE INDEX IF NOT EXISTS idx_applications_last_status_update
  ON applications (user_id, last_status_update DESC);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
