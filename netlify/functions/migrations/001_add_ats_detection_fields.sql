-- Migration: Add ATS detection fields to companies table
-- This migration adds fields to track auto-detected ATS type and careers page URL
-- for companies, allowing direct linking to company career pages

BEGIN;

-- Add ATS type column to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS ats_type TEXT CHECK (ats_type IN ('lever', 'greenhouse', 'workday', 'unknown'));

-- Add careers page URL column
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS careers_page_url TEXT;

-- Add timestamp for when ATS was last detected/verified
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS ats_detected_at TIMESTAMPTZ;

-- Create index on ats_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_companies_ats_type ON companies(ats_type);

-- Create index on careers_page_url for efficient lookups
CREATE INDEX IF NOT EXISTS idx_companies_careers_page_url ON companies(careers_page_url);

-- Add comment describing the new fields
COMMENT ON COLUMN companies.ats_type IS 'Detected or manually-set ATS type: lever, greenhouse, workday, or unknown';
COMMENT ON COLUMN companies.careers_page_url IS 'Direct URL to company careers page (bypasses job board aggregators)';
COMMENT ON COLUMN companies.ats_detected_at IS 'Timestamp when ATS was last auto-detected or verified';

COMMIT;
