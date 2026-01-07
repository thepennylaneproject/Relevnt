-- Migration: Add source field constraints and unique index
-- This prevents jobs from being inserted with NULL source
-- and prevents duplicates when source might be missing

-- 1. Add NOT NULL constraint on source column (if not already present)
-- Note: If this fails because NULL values exist, the validation in code will catch it
ALTER TABLE public.jobs
ADD CONSTRAINT jobs_source_not_null CHECK (source IS NOT NULL);

-- 2. Add NOT NULL constraint on source_slug column (if not already present)
ALTER TABLE public.jobs
ADD CONSTRAINT jobs_source_slug_not_null CHECK (source_slug IS NOT NULL);

-- 3. Add unique index on coalesce(source, source_slug) and external_url
-- This prevents duplicates even if one of the source fields is NULL
CREATE UNIQUE INDEX IF NOT EXISTS jobs_effective_source_external_url_uniq
ON public.jobs (COALESCE(source, source_slug), external_url)
WHERE external_url IS NOT NULL;

-- 4. Drop the old unique constraint if it exists and add a stronger one
-- This ensures (source, external_id) uniqueness as well
CREATE UNIQUE INDEX IF NOT EXISTS jobs_source_external_id_uniq
ON public.jobs (source, external_id)
WHERE external_id IS NOT NULL AND source IS NOT NULL;
