-- Migration: Fix dedup_key constraint for ON CONFLICT inference
-- Date: 2026-01-08
-- Purpose: Convert partial unique index to proper unique constraint
--          so PostgreSQL can infer it from ON CONFLICT (dedup_key)
--
-- PROBLEM: The partial unique index (WHERE dedup_key IS NOT NULL) cannot be
--          inferred by ON CONFLICT (dedup_key). PostgreSQL requires either:
--          1. A non-partial unique constraint, OR
--          2. Explicit ON CONFLICT ON CONSTRAINT constraint_name
--
-- SOLUTION: Create a proper unique constraint instead of partial index.
--           PostgreSQL allows multiple NULL values in unique constraints,
--           so this won't cause issues with NULL dedup_keys.

-- ============================================================================
-- 1. DROP THE PARTIAL UNIQUE INDEX
-- ============================================================================
DROP INDEX IF EXISTS jobs_dedup_key_unique_idx;

-- ============================================================================
-- 2. CREATE PROPER UNIQUE CONSTRAINT
-- ============================================================================
-- First, handle any remaining duplicates (shouldn't exist, but safety first)
DO $$
DECLARE
  dup_count INTEGER;
  deleted_count INTEGER;
BEGIN
  -- Count duplicate dedup_key groups (excluding NULLs)
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT dedup_key FROM jobs
    WHERE dedup_key IS NOT NULL
    GROUP BY dedup_key HAVING COUNT(*) > 1
  ) dups;

  IF dup_count > 0 THEN
    RAISE NOTICE 'Found % duplicate dedup_key groups. Merging before constraint creation...', dup_count;

    -- Delete duplicates, keeping the one with best data
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
    RAISE NOTICE 'Deleted % duplicate job rows', deleted_count;
  ELSE
    RAISE NOTICE 'No duplicate dedup_key groups found';
  END IF;
END $$;

-- Create the unique constraint (not a partial index)
-- Note: PostgreSQL allows multiple NULL values in unique constraints by default
ALTER TABLE jobs
ADD CONSTRAINT jobs_dedup_key_unique UNIQUE (dedup_key);

COMMENT ON CONSTRAINT jobs_dedup_key_unique ON jobs IS
  'Enforces cross-source job uniqueness by dedup_key (title+company+location hash). Multiple NULLs allowed.';

-- ============================================================================
-- 3. VERIFY THE CONSTRAINT EXISTS AND CAN BE INFERRED
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'jobs_dedup_key_unique'
    AND conrelid = 'jobs'::regclass
  ) THEN
    RAISE NOTICE 'SUCCESS: jobs_dedup_key_unique constraint created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: jobs_dedup_key_unique constraint was not created';
  END IF;
END $$;
