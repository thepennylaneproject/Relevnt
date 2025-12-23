-- Migration Verification Script
-- Run this in Supabase SQL Editor to check which migrations were applied

-- 1. Check if schema_migrations table exists
-- (Supabase uses this to track applied migrations)
SELECT * FROM extensions.migrations LIMIT 10;

-- 2. Check key tables that should exist from migrations
SELECT
  'job_ingestion_state' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_ingestion_state') as exists
UNION ALL
SELECT
  'job_sources',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_sources')
UNION ALL
SELECT
  'job_source_health',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_source_health')
UNION ALL
SELECT
  'jobs',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs');

-- 3. Check if enrichment columns exist on jobs table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'jobs'
AND column_name IN ('is_direct', 'ats_type', 'enrichment_confidence');

-- 4. Check if job_ingestion_state has correct columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'job_ingestion_state'
ORDER BY ordinal_position;

-- 5. Count how many migrations have been applied
SELECT
  'Total migrations in folder' as check_type,
  COUNT(*) as count
FROM (
  VALUES
    ('20241210_add_personas'),
    ('20241211_add_persona_resume_association'),
    ('20241211_v2_phase0_reliability'),
    ('20241211_v2_schema_expansion'),
    ('20241213_ai_routing_layer'),
    ('20241214_ai_rls'),
    ('20241215_auto_apply_foundation'),
    ('20241216_enhance_jobs_for_matching'),
    ('20241216_jobs_effective_posted_date_cleanup'),
    ('20241216_source_guardrails'),
    ('20250110_create_companies_registry'),
    ('20250110_discovery_runs_audit'),
    ('20251220000000_linkedin_profiles'),
    ('20251220000001_portfolio_analyses'),
    ('20251220000002_notifications'),
    ('20251220000003_application_events'),
    ('20251220000004_networking'),
    ('20251220100000_search_queue'),
    ('20251220100001_wellness_checkins'),
    ('20251220100002_profile_narratives'),
    ('20251220100003_negotiation_suite'),
    ('20251220100004_career_priorities'),
    ('20251220100007_cover_letters'),
    ('20251221000001_job_interaction_patterns'),
    ('20251221000002_intelligence_layer'),
    ('20251221000003_proactive_ai'),
    ('20251221000004_interview_prep'),
    ('20251222000000_final_cull'),
    ('20251222000001_fix_search_queue_constraint'),
    ('20251222000002_add_sharing_to_analyses'),
    ('20251222000003_job_ingestion_state'),
    ('20251223000001_add_enrichment_fields_to_jobs')
) AS migrations(name);

-- 6. List all tables in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
