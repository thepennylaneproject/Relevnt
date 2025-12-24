# Migration Status & Verification Guide

## Quick Answer: How to Check If All Migrations Ran

### Method 1: Supabase SQL Editor (Easiest)

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor**
3. Copy & paste the queries from `MIGRATION_VERIFICATION.sql`
4. Run each query to check:
   - ✅ Tables exist
   - ✅ Columns were added
   - ✅ No errors

### Method 2: Check Specific Critical Tables

```sql
-- Run in Supabase SQL Editor

-- Check 1: Does job_ingestion_state exist?
SELECT * FROM job_ingestion_state LIMIT 1;

-- Check 2: Do enrichment columns exist on jobs?
SELECT is_direct, ats_type, enrichment_confidence FROM jobs LIMIT 1;

-- Check 3: Show all columns on jobs table
SELECT column_name FROM information_schema.columns
WHERE table_name = 'jobs'
ORDER BY ordinal_position;
```

**Results you should see:**
- ✅ No errors = migrations applied
- ❌ "Does not exist" = migration didn't run
- ✅ Column list includes: `is_direct`, `ats_type`, `enrichment_confidence`

---

## Migration Naming & Ordering

Your migrations follow **timestamp-based ordering** (auto-sorts correctly):

```
20241210_add_personas.sql              ← Dec 10, 2024
20241211_add_persona_resume_association.sql
20241211_v2_phase0_reliability.sql
...
20251222000003_job_ingestion_state.sql  ← Dec 22, 2024 (we added)
20251223000001_add_enrichment_fields_to_jobs.sql  ← Dec 23, 2024 (we added)
```

✅ **Good news:** Filenames starting with timestamps = they automatically sort in correct order

---

## Critical Migrations for Job Posting API

These MUST be applied (in this order):

### 1. **20251222000003_job_ingestion_state.sql**
- Creates `job_ingestion_state` table
- Tracks pagination cursors for each source
- **Status:** ✅ Created in this session
- **Required for:** Greenhouse pagination to work

### 2. **20251223000001_add_enrichment_fields_to_jobs.sql**
- Adds `is_direct`, `ats_type`, `enrichment_confidence` columns
- Tracks which jobs have direct apply links
- **Status:** ✅ Created in this session
- **Required for:** Direct apply UI feature

---

## Verification Checklist

Run each in Supabase SQL Editor:

```sql
-- ✅ Check 1: job_ingestion_state table
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'job_ingestion_state'
) as table_exists;
-- Expected: true

-- ✅ Check 2: job_ingestion_state columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'job_ingestion_state'
ORDER BY ordinal_position;
-- Expected columns: id, source, cursor, last_run_at, created_at, updated_at

-- ✅ Check 3: jobs enrichment columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'jobs'
AND column_name IN ('is_direct', 'ats_type', 'enrichment_confidence');
-- Expected: 3 rows (one for each column)

-- ✅ Check 4: job_sources table has 'enabled' column
SELECT column_name FROM information_schema.columns
WHERE table_name = 'job_sources'
AND column_name = 'enabled';
-- Expected: 1 row

-- ✅ Check 5: See all jobs table columns
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'jobs'
ORDER BY ordinal_position
LIMIT 20;
-- Should include: is_direct, ats_type, enrichment_confidence
```

---

## What If A Migration Didn't Run?

### Scenario 1: Table Doesn't Exist
```sql
-- The migration SQL didn't execute
-- Solution: Re-run the migration manually
-- Copy the SQL from the migration file and run it in Supabase SQL Editor
```

### Scenario 2: Column Is Missing
```sql
-- The table exists but column wasn't added
-- Solution: Run just that ALTER TABLE command
-- Example:
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_direct BOOLEAN DEFAULT false;
```

### Scenario 3: Multiple Migrations Failed
```sql
-- Run them in order manually
-- 1. First, run 20251222000003_job_ingestion_state.sql
-- 2. Then, run 20251223000001_add_enrichment_fields_to_jobs.sql
```

---

## How Supabase Tracks Migrations

Supabase automatically tracks applied migrations in the `extensions.migrations` table:

```sql
-- View applied migrations
SELECT version, name FROM extensions.migrations
ORDER BY version DESC;
```

**What you'll see:**
```
version | name
--------|------
15      | 20241210_add_personas
16      | 20241211_add_persona_resume_association
...
47      | 20251223000001_add_enrichment_fields_to_jobs
```

---

## Safe Re-Running Migrations

All our migrations use `IF NOT EXISTS` clauses, so they're **safe to run multiple times**:

```sql
-- Safe - won't error if already exists
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_direct BOOLEAN;

-- Safe - won't error if already created
CREATE TABLE IF NOT EXISTS job_ingestion_state (...)
```

This means: **If you accidentally run a migration twice, nothing bad happens.**

---

## Pre-Deployment Verification

**Before going live, ensure:**
- [ ] `job_ingestion_state` table exists
- [ ] `jobs.is_direct` column exists
- [ ] `jobs.ats_type` column exists
- [ ] `jobs.enrichment_confidence` column exists
- [ ] No error messages in Supabase logs

**Run this to verify all at once:**
```sql
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_ingestion_state') as job_ingestion_state_exists,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'is_direct') as is_direct_exists,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'ats_type') as ats_type_exists,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'enrichment_confidence') as enrichment_confidence_exists;
```

**Expected result:**
```
job_ingestion_state_exists | is_direct_exists | ats_type_exists | enrichment_confidence_exists
true                       | true             | true            | true
```

If all are `true`, you're ready to deploy! ✅

---

## Post-Deployment Verification

After deployment, run:

```sql
-- Check that data is being populated
SELECT COUNT(*) as total_jobs FROM jobs;
SELECT COUNT(*) as jobs_with_direct_links FROM jobs WHERE is_direct = true;
SELECT DISTINCT ats_type FROM jobs WHERE ats_type IS NOT NULL;

-- Expected:
-- total_jobs: 3,500+ (from our 14 sources)
-- jobs_with_direct_links: 2,000+ (most Greenhouse/Lever jobs should be direct)
-- ats_type: greenhouse, lever, workday (or null)
```

---

## Migration History Reference

### Our Recent Changes:
1. **20251222000003_job_ingestion_state.sql** - Pagination tracking
2. **20251223000001_add_enrichment_fields_to_jobs.sql** - Direct apply data

### Status:
- ✅ Both created with `IF NOT EXISTS` clauses
- ✅ Safe to apply multiple times
- ✅ Run in order (filename timestamps ensure this)

---

## Questions?

If migrations aren't working:
1. Check Supabase logs (Dashboard → Logs)
2. Run MIGRATION_VERIFICATION.sql to identify which tables exist
3. Run any missing migrations manually from their SQL files
4. Verify columns exist before deploying
