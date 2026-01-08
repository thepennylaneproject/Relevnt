-- Diagnostic SQL Queries for Job Ingestion Metrics
-- Run these to compare net new job rates before/after deploying changes

-- 1. Total jobs overall
SELECT COUNT(*) AS total_jobs FROM jobs;

-- 2. Jobs created in the last 24h (truly new jobs)
SELECT COUNT(*) AS created_24h
FROM jobs
WHERE created_at >= NOW() - INTERVAL '1 day';

-- 3. Jobs updated (but not created) in the last 24h (refreshed existing jobs)
SELECT COUNT(*) AS updated_only_24h
FROM jobs
WHERE updated_at >= NOW() - INTERVAL '1 day'
  AND created_at < NOW() - INTERVAL '1 day';

-- 4. Source run metrics for last 24h (shows true insert vs update vs noop per source)
SELECT 
  source,
  COUNT(*) AS run_count,
  SUM(COALESCE(inserted_count, 0)) AS total_inserted,
  SUM(COALESCE(updated_count, 0)) AS total_updated,
  SUM(COALESCE(noop_count, 0)) AS total_noop,
  ROUND(
    SUM(COALESCE(inserted_count, 0))::NUMERIC / 
    NULLIF(SUM(COALESCE(inserted_count, 0) + COALESCE(updated_count, 0) + COALESCE(noop_count, 0)), 0) * 100, 
    1
  ) AS net_new_pct
FROM job_ingestion_run_sources
WHERE started_at >= NOW() - INTERVAL '1 day'
GROUP BY source
ORDER BY SUM(COALESCE(inserted_count, 0)) DESC;

-- 5. Hourly job creation rate (to spot trends)
SELECT 
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) AS jobs_created
FROM jobs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC
LIMIT 168;

-- 6. Identify sources with high noop ratios (candidates for increased cooldown)
SELECT 
  source,
  SUM(COALESCE(noop_count, 0)) AS total_noop,
  SUM(COALESCE(inserted_count, 0) + COALESCE(updated_count, 0) + COALESCE(noop_count, 0)) AS total_processed,
  ROUND(
    SUM(COALESCE(noop_count, 0))::NUMERIC / 
    NULLIF(SUM(COALESCE(inserted_count, 0) + COALESCE(updated_count, 0) + COALESCE(noop_count, 0)), 0) * 100, 
    1
  ) AS noop_pct
FROM job_ingestion_run_sources
WHERE started_at >= NOW() - INTERVAL '7 days'
GROUP BY source
HAVING SUM(COALESCE(inserted_count, 0) + COALESCE(updated_count, 0) + COALESCE(noop_count, 0)) > 0
ORDER BY noop_pct DESC;
