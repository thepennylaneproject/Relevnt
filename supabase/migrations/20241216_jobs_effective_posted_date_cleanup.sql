-- Backfill effective_posted_date and streamline indexes for public.jobs.
-- Avoid generated columns because the immutable requirement conflicts with
-- the need to coalesce posted_date and a time zone conversion of created_at.
-- UTC conversion ensures deterministic dates regardless of server time zones.

-- 1) Backfill effective_posted_date where missing.
UPDATE public.jobs AS j
SET effective_posted_date = COALESCE(j.posted_date, (j.created_at AT TIME ZONE 'UTC')::date)
WHERE j.effective_posted_date IS NULL;

-- 2) Drop duplicate indexes while leaving one index per column.
DROP INDEX IF EXISTS public.jobs_location_idx;
DROP INDEX IF EXISTS public.jobs_posted_date_idx;

-- 3) Ensure an index exists on effective_posted_date (descending for recency).
CREATE INDEX IF NOT EXISTS idx_jobs_effective_posted_date
    ON public.jobs (effective_posted_date DESC);
