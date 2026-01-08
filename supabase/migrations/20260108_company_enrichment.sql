-- Migration: Enrich companies table and add company_id to jobs
-- Date: 2026-01-08
-- Purpose: Enable mapping raw company names to canonical companies for better deduplication

-- 1. ENRICH COMPANIES TABLE
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS canonical_name TEXT,
  ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';

-- Populate canonical_name with name if missing
UPDATE companies SET canonical_name = name WHERE canonical_name IS NULL;

-- 2. ADD company_id TO JOBS TABLE
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs (company_id);

-- 3. CREATE COMPANY RESOLUTION FUNCTION
-- This is a simple version that can be evolved with fuzzy matching later
CREATE OR REPLACE FUNCTION resolve_company_id(p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_normalized_name TEXT;
BEGIN
  v_normalized_name := LOWER(TRIM(p_name));
  
  -- 1. Try exact match on name
  SELECT id INTO v_id FROM companies 
  WHERE LOWER(name) = v_normalized_name 
     OR LOWER(canonical_name) = v_normalized_name
  LIMIT 1;
  
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;
  
  -- 2. Try match on aliases
  SELECT id INTO v_id FROM companies
  WHERE v_normalized_name = ANY(aliases)
  LIMIT 1;
  
  RETURN v_id;
END;
$$;

-- 4. UPDATE EXISTING JOBS
-- Attempt to link existing jobs to companies based on name
-- This is a one-time BEST EFFORT operation
UPDATE jobs j
SET company_id = resolve_company_id(j.company)
WHERE company_id IS NULL AND company IS NOT NULL;

COMMENT ON COLUMN companies.canonical_name IS 'The official approved name of the company.';
COMMENT ON COLUMN companies.aliases IS 'Array of alternative names or common variations for fuzzy matching.';
COMMENT ON COLUMN jobs.company_id IS 'Link to the canonical company in the registry.';
