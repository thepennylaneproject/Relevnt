-- Migration: Add unique index on dedup_key for cross-source deduplication
-- Date: 2026-01-08
-- Purpose: Enable upsert ON CONFLICT (dedup_key) to merge duplicate jobs from different sources

-- ============================================================================
-- 1. HANDLE EXISTING DUPLICATES
-- ============================================================================
-- Before adding unique constraint, merge duplicates by keeping the highest-trust version.

DO $$
DECLARE
  dup_count INTEGER;
  deleted_count INTEGER;
BEGIN
  -- Count duplicate dedup_key groups
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT dedup_key FROM jobs
    WHERE dedup_key IS NOT NULL
    GROUP BY dedup_key HAVING COUNT(*) > 1
  ) dups;
  
  IF dup_count > 0 THEN
    RAISE NOTICE 'Found % duplicate dedup_key groups. Merging...', dup_count;
    
    -- Delete duplicates, keeping the one with best data (prefer high trust sources)
    -- Priority: greenhouse > lever > remotive > themuse > himalayas > others
    WITH to_delete AS (
      SELECT id FROM (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY dedup_key
            ORDER BY
              CASE source_slug
                WHEN 'greenhouse' THEN 1
                WHEN 'lever' THEN 2
                WHEN 'remotive' THEN 3
                WHEN 'themuse' THEN 4
                WHEN 'himalayas' THEN 5
                ELSE 10
              END,
              -- Prefer jobs with more complete data
              CASE WHEN salary_min IS NOT NULL THEN 0 ELSE 1 END,
              CASE WHEN description IS NOT NULL AND LENGTH(description) > 100 THEN 0 ELSE 1 END,
              updated_at DESC NULLS LAST,
              created_at DESC NULLS LAST
          ) AS rn
        FROM jobs
        WHERE dedup_key IS NOT NULL
      ) sub WHERE rn > 1
    )
    DELETE FROM jobs WHERE id IN (SELECT id FROM to_delete);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % duplicate job rows, kept best version for each dedup_key', deleted_count;
  ELSE
    RAISE NOTICE 'No duplicate dedup_key groups found';
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE UNIQUE INDEX ON DEDUP_KEY
-- ============================================================================
-- Partial unique index - only for non-null dedup_keys

-- First, drop the old non-unique index if it exists
DROP INDEX IF EXISTS idx_jobs_dedup_key;

-- Create unique partial index
CREATE UNIQUE INDEX IF NOT EXISTS jobs_dedup_key_unique_idx
ON jobs (dedup_key)
WHERE dedup_key IS NOT NULL;

COMMENT ON INDEX jobs_dedup_key_unique_idx IS 
  'Enforces cross-source job uniqueness. Jobs with same title+company+location are merged regardless of source.';

-- ============================================================================
-- 3. KEEP LEGACY CONSTRAINT FOR BACKWARD COMPATIBILITY
-- ============================================================================
-- The (source_slug, external_id) constraint stays for now as a secondary guard.
-- It prevents duplicate jobs from the SAME source even if dedup_key differs.

-- Verify it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'jobs_source_slug_external_id_key'
  ) THEN
    RAISE NOTICE 'Creating legacy source_slug+external_id constraint for backward compatibility';
    ALTER TABLE jobs 
    ADD CONSTRAINT jobs_source_slug_external_id_key 
    UNIQUE (source_slug, external_id);
  END IF;
END $$;
