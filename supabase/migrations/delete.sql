-- ============================================================================
-- Relevnt Jobs Retention: preview + batch delete
-- Uses effective_posted_date (posted_date fallback to created_at UTC date)
-- ============================================================================

-- 0) PREVIEW: what would be deleted?
SELECT
  COUNT(*) AS would_delete,
  MIN(effective_posted_date) AS oldest_to_delete,
  MAX(effective_posted_date) AS newest_to_delete
FROM public.jobs
WHERE effective_posted_date <= DATE '2025-06-18';

-- 1) OPTIONAL: break down whether posted_date was null
SELECT
  COUNT(*) AS delete_total,
  COUNT(*) FILTER (WHERE posted_date IS NULL) AS delete_where_posted_null,
  COUNT(*) FILTER (WHERE posted_date IS NOT NULL) AS delete_where_posted_present
FROM public.jobs
WHERE effective_posted_date <= DATE '2025-06-18';

-- 2) DELETE: run this block repeatedly until deleted_rows = 0
WITH doomed AS (
  SELECT id
  FROM public.jobs
  WHERE effective_posted_date <= DATE '2025-06-18'
  ORDER BY effective_posted_date ASC
  LIMIT 10000
),
deleted AS (
  DELETE FROM public.jobs j
  USING doomed
  WHERE j.id = doomed.id
  RETURNING j.id
)
SELECT COUNT(*) AS deleted_rows FROM deleted;