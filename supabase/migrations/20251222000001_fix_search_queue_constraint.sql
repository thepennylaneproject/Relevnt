-- Migration: Fix Search Queue Unique Constraint
-- Fixes "42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- Add unique constraint to search_queue to support upsert (onConflict)
-- We use a unique index that treats NULLs as NOT DISTINCT if supported, 
-- but for maximum compatibility with current Supabase versions and the JS client's onConflict: 'col1,col2',
-- a standard unique constraint is often the most direct fix for the 42P10 error.

-- First, clean up any existing duplicates that would prevent constraint creation
DELETE FROM search_queue a USING search_queue b
WHERE a.id > b.id 
  AND a.source_slug = b.source_slug 
  AND a.keywords = b.keywords 
  AND COALESCE(a.location, '') = COALESCE(b.location, '');

-- Add the unique constraint
-- Note: In Postgres, UNIQUE (col) allows multiple NULLs. 
-- For the search queue, we ideally want only one NULL per (slug, keywords) combo.
-- Postgres 15+ supports NULLS NOT DISTINCT, which is perfect here.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'search_queue'
    ) THEN
        -- Try Postgres 15+ syntax first
        BEGIN
            EXECUTE 'CREATE UNIQUE INDEX idx_search_queue_upsert_dedupe ON search_queue (source_slug, keywords, location) NULLS NOT DISTINCT';
        EXCEPTION WHEN others THEN
            -- Fallback to standard unique constraint for older versions
            -- (Will not dedupe NULLs as strictly, but will satisfy the 42P10 error)
            ALTER TABLE search_queue ADD CONSTRAINT search_queue_upsert_unique UNIQUE (source_slug, keywords, location);
        END;
    END IF;
END $$;
