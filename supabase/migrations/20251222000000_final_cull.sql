-- ============================================================================
-- Final Investor Readiness Culling Script
-- Relevnt Career Intelligence - 2025-12-22
-- ============================================================================

-- 1. DROP OBSOLETE LEGACY TABLES
-- These tables are no longer used by the Relevnt V2 Concierge UI
DROP TABLE IF EXISTS public.auto_apply_queue CASCADE;
DROP TABLE IF EXISTS public.skill_gap_analyses CASCADE;
-- Note: keeping wellness_checkins as they are now used by the new Wellness Mode

-- 2. PRUNE EXPIRED JOB DATA (Older than 6 months)
-- Improves market pulse signal quality and index performance
DELETE FROM public.jobs
WHERE effective_posted_date <= (CURRENT_DATE - INTERVAL '6 months');

-- 3. DATA SCRUBBING (Demo Prep)
-- Remove obvious test/junk data from high-visibility tables

-- Clean applications
DELETE FROM public.applications
WHERE position ILIKE '%test%'
   OR position ILIKE '%asdf%'
   OR company ILIKE '%test%'
   OR company ILIKE '%dummy%';

-- Clean wellness checkins (Remove unstable test pulses)
-- We'll keep the ones with actual notes or higher quality scores
DELETE FROM public.wellness_checkins
WHERE note ILIKE '%test%'
   OR note ILIKE '%asdf%';

-- Clean resumes (Remove obviously fake files)
DELETE FROM public.resumes
WHERE file_name ILIKE '%test%'
   OR file_name ILIKE '%asdf%';

-- 4. VACUUM (Optional/Informational)
-- If we were running directly on Postgres, we'd vacuum here. 
-- In Supabase, this is handled by autovacuum, but removing thousands of jobs 
-- will trigger it soon after.

COMMIT;
