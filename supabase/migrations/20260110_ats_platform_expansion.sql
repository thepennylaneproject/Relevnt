-- Migration: ATS Platform Expansion
-- Date: 2026-01-10
-- Purpose: Add slug columns + detection support for new ATS platforms

-- ============================================================================
-- 1. ADD ATS SLUG COLUMNS TO COMPANIES
-- ============================================================================
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS smartrecruiters_slug TEXT,
ADD COLUMN IF NOT EXISTS workday_tenant_url TEXT,
ADD COLUMN IF NOT EXISTS recruitee_slug TEXT,
ADD COLUMN IF NOT EXISTS breezyhr_slug TEXT,
ADD COLUMN IF NOT EXISTS jazzhr_slug TEXT,
ADD COLUMN IF NOT EXISTS personio_slug TEXT;

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_companies_smartrecruiters ON companies(smartrecruiters_slug) WHERE smartrecruiters_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_workday ON companies(workday_tenant_url) WHERE workday_tenant_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_recruitee ON companies(recruitee_slug) WHERE recruitee_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_breezyhr ON companies(breezyhr_slug) WHERE breezyhr_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_jazzhr ON companies(jazzhr_slug) WHERE jazzhr_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_personio ON companies(personio_slug) WHERE personio_slug IS NOT NULL;

-- ============================================================================
-- 2. ENSURE COMPANY_TARGETS METADATA COLUMNS EXIST
-- ============================================================================
ALTER TABLE company_targets
ADD COLUMN IF NOT EXISTS total_jobs_found INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consecutive_empty_runs INTEGER DEFAULT 0;

-- ============================================================================
-- 3. UPDATE PLATFORM CHECK CONSTRAINT
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'company_targets_platform_check'
  ) THEN
    ALTER TABLE company_targets DROP CONSTRAINT company_targets_platform_check;
  END IF;

  ALTER TABLE company_targets
    ADD CONSTRAINT company_targets_platform_check
    CHECK (platform IN (
      'greenhouse',
      'lever',
      'ashby',
      'smartrecruiters',
      'workday',
      'recruitee',
      'breezyhr',
      'jazzhr',
      'personio'
    ));
END $$;

-- ============================================================================
-- 4. SEED SMARTRECRUITERS COMPANIES
-- ============================================================================
INSERT INTO companies (name, domain, smartrecruiters_slug, discovered_via, is_active)
VALUES
  ('Visa', 'visa.com', 'Visa', 'manual_seed', true),
  ('Bosch', 'bosch.com', 'BoschGroup', 'manual_seed', true),
  ('Equinix', 'equinix.com', 'Equinix', 'manual_seed', true),
  ('Skechers', 'skechers.com', 'Skechers', 'manual_seed', true),
  ('KPMG', 'kpmg.com', 'KPMG', 'manual_seed', true),
  ('Adidas', 'adidas.com', 'adidas', 'manual_seed', true),
  ('Square', 'squareup.com', 'Square', 'manual_seed', true),
  ('LinkedIn', 'linkedin.com', 'LinkedIn', 'manual_seed', true),
  ('Spotify', 'spotify.com', 'Spotify', 'manual_seed', true),
  ('Twitter', 'twitter.com', 'Twitter', 'manual_seed', true)
ON CONFLICT (domain) DO UPDATE SET
  smartrecruiters_slug = EXCLUDED.smartrecruiters_slug;

INSERT INTO company_targets (platform, company_slug, company_id, status, min_interval_minutes, priority)
SELECT 'smartrecruiters', smartrecruiters_slug, id, 'active', 1440, 120
FROM companies
WHERE smartrecruiters_slug IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM company_targets ct
    WHERE ct.company_id = companies.id
      AND ct.platform = 'smartrecruiters'
  );

-- ============================================================================
-- 5. SEED WORKDAY COMPANIES
-- ============================================================================
INSERT INTO companies (name, domain, workday_tenant_url, discovered_via, is_active)
VALUES
  ('NVIDIA', 'nvidia.com', 'https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite', 'manual_seed', true),
  ('Salesforce', 'salesforce.com', 'https://salesforce.wd12.myworkdayjobs.com/en-US/External_Career_Site', 'manual_seed', true),
  ('Netflix', 'netflix.com', 'https://netflix.wd5.myworkdayjobs.com/en-US/Netflix_Careers', 'manual_seed', true),
  ('Adobe', 'adobe.com', 'https://adobe.wd5.myworkdayjobs.com/en-US/external_experienced', 'manual_seed', true),
  ('Uber', 'uber.com', 'https://uber.wd5.myworkdayjobs.com/en-US/Uber_Careers', 'manual_seed', true),
  ('Airbnb', 'airbnb.com', 'https://airbnb.wd5.myworkdayjobs.com/en-US/airbnb', 'manual_seed', true),
  ('Target', 'target.com', 'https://target.wd5.myworkdayjobs.com/en-US/targetcareers', 'manual_seed', true),
  ('Walmart', 'walmart.com', 'https://walmart.wd5.myworkdayjobs.com/en-US/WalmartExternal', 'manual_seed', true),
  ('Bank of America', 'bankofamerica.com', 'https://bankofamerica.wd5.myworkdayjobs.com/en-US/campus', 'manual_seed', true),
  ('JPMorgan Chase', 'jpmorganchase.com', 'https://jpmc.wd1.myworkdayjobs.com/en-US/Corporate', 'manual_seed', true),
  ('Goldman Sachs', 'goldmansachs.com', 'https://gs.wd5.myworkdayjobs.com/en-US/GS_Careers', 'manual_seed', true),
  ('Morgan Stanley', 'morganstanley.com', 'https://morganstanley.wd5.myworkdayjobs.com/en-US/MS_Careers', 'manual_seed', true),
  ('Deloitte', 'deloitte.com', 'https://deloitte.wd5.myworkdayjobs.com/en-US/External', 'manual_seed', true),
  ('PwC', 'pwc.com', 'https://pwc.wd5.myworkdayjobs.com/en-US/Global_Experienced_Careers', 'manual_seed', true),
  ('EY', 'ey.com', 'https://ey.wd5.myworkdayjobs.com/en-US/EY_Careers', 'manual_seed', true)
ON CONFLICT (domain) DO UPDATE SET
  workday_tenant_url = EXCLUDED.workday_tenant_url;

INSERT INTO company_targets (platform, company_slug, company_id, status, min_interval_minutes, priority)
SELECT
  'workday',
  SPLIT_PART(SPLIT_PART(workday_tenant_url, '//', 2), '.', 1),
  id,
  'active',
  2880,
  100
FROM companies
WHERE workday_tenant_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM company_targets ct
    WHERE ct.company_id = companies.id
      AND ct.platform = 'workday'
  );

-- ============================================================================
-- 6. SEED RECRUITEE COMPANIES
-- ============================================================================
INSERT INTO companies (name, domain, recruitee_slug, discovered_via, is_active)
VALUES
  ('Hotjar', 'hotjar.com', 'hotjar', 'manual_seed', true),
  ('Factorial', 'factorial.co', 'factorial', 'manual_seed', true),
  ('Tide', 'tide.co', 'tide', 'manual_seed', true),
  ('Aircall', 'aircall.io', 'aircall', 'manual_seed', true),
  ('ContentSquare', 'contentsquare.com', 'contentsquare', 'manual_seed', true)
ON CONFLICT (domain) DO UPDATE SET
  recruitee_slug = EXCLUDED.recruitee_slug;

INSERT INTO company_targets (platform, company_slug, company_id, status, min_interval_minutes, priority)
SELECT 'recruitee', recruitee_slug, id, 'active', 1440, 120
FROM companies
WHERE recruitee_slug IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM company_targets ct
    WHERE ct.company_id = companies.id
      AND ct.platform = 'recruitee'
  );

-- ============================================================================
-- 7. SEED PERSONIO COMPANIES
-- ============================================================================
INSERT INTO companies (name, domain, personio_slug, discovered_via, is_active)
VALUES
  ('Personio', 'personio.de', 'personio', 'manual_seed', true),
  ('N26', 'n26.com', 'n26', 'manual_seed', true),
  ('Celonis', 'celonis.com', 'celonis', 'manual_seed', true),
  ('FlixBus', 'flixbus.com', 'flixbus', 'manual_seed', true)
ON CONFLICT (domain) DO UPDATE SET
  personio_slug = EXCLUDED.personio_slug;

INSERT INTO company_targets (platform, company_slug, company_id, status, min_interval_minutes, priority)
SELECT 'personio', personio_slug, id, 'active', 1440, 120
FROM companies
WHERE personio_slug IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM company_targets ct
    WHERE ct.company_id = companies.id
      AND ct.platform = 'personio'
  );
