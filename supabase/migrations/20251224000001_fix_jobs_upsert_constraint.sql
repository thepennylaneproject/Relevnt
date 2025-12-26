-- Migration: Add unique constraint for job upsert
-- Date: 2025-12-24
-- Purpose: Fix job ingestion by adding required unique constraint
-- The upsert in ingest_jobs.ts uses onConflict: 'source_slug,external_id'
-- which requires this constraint to exist

-- First, check for and remove any duplicates that would violate the constraint
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  -- Count duplicates
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT source_slug, external_id
    FROM jobs
    WHERE source_slug IS NOT NULL AND external_id IS NOT NULL
    GROUP BY source_slug, external_id
    HAVING COUNT(*) > 1
  ) AS dups;
  
  IF dup_count > 0 THEN
    RAISE NOTICE 'Found % duplicate source_slug/external_id combinations. Removing older entries...', dup_count;
    
    -- Delete duplicates, keeping only the most recent (by id, which is serial/uuid ordered)
    DELETE FROM jobs
    WHERE id IN (
      SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY source_slug, external_id
                 ORDER BY created_at DESC, id DESC
               ) as rn
        FROM jobs
        WHERE source_slug IS NOT NULL AND external_id IS NOT NULL
      ) sub
      WHERE rn > 1
    );
  END IF;
END $$;

-- Now add the unique constraint
-- Using IF NOT EXISTS pattern for idempotency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'jobs_source_slug_external_id_key'
  ) THEN
    ALTER TABLE jobs 
    ADD CONSTRAINT jobs_source_slug_external_id_key 
    UNIQUE (source_slug, external_id);
    
    RAISE NOTICE 'Added unique constraint jobs_source_slug_external_id_key';
  ELSE
    RAISE NOTICE 'Constraint jobs_source_slug_external_id_key already exists';
  END IF;
END $$;

-- Create index to improve upsert performance
CREATE INDEX IF NOT EXISTS idx_jobs_source_external_lookup 
ON jobs (source_slug, external_id);

-- Add comment for documentation
COMMENT ON CONSTRAINT jobs_source_slug_external_id_key ON jobs IS 
  'Required for upsert operations in ingest_jobs.ts. Each job must have unique source_slug + external_id combination.';
