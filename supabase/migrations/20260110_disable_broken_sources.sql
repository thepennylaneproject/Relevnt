-- ============================================================================
-- DISABLE BROKEN AGGREGATOR SOURCES
-- Date: 2026-01-10
-- Purpose: Pause search_slices for sources that are returning errors
-- ============================================================================
--
-- CareerOneStop: Returns 401 Unauthorized on every run
-- Fantastic Jobs: Returns 404 Not Found (service no longer available)
--
-- These are already disabled in SOURCE_CONFIGS, but we need to also
-- pause their search_slices database rows to prevent them from running.
-- ============================================================================

UPDATE search_slices
SET status = 'bad',
    last_error = 'Source disabled - returns 401 Unauthorized on every request. Credentials invalid or API changed.'
WHERE source = 'careeronestop'
  AND status = 'active';

UPDATE search_slices
SET status = 'bad',
    last_error = 'Source disabled - endpoint returns 404 Not Found. Service no longer available.'
WHERE source = 'fantastic'
  AND status = 'active';

-- Log results
DO $$
DECLARE
  careeronestop_count INT;
  fantastic_count INT;
BEGIN
  SELECT COUNT(*) INTO careeronestop_count
  FROM search_slices
  WHERE source = 'careeronestop' AND status = 'bad';

  SELECT COUNT(*) INTO fantastic_count
  FROM search_slices
  WHERE source = 'fantastic' AND status = 'bad';

  RAISE NOTICE 'Disabled % CareerOneStop slices', careeronestop_count;
  RAISE NOTICE 'Disabled % Fantastic Jobs slices', fantastic_count;
END $$;
