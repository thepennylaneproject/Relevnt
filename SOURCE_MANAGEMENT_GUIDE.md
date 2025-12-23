# Source Management & Troubleshooting Guide

This guide explains how to disable/enable job sources for troubleshooting and performance optimization.

## Overview

The job ingestion system now supports:
- **Parallel batch execution** - Sources run in 4 priority batches in parallel (completed)
- **Source disable/enable** - Quickly disable problematic sources for troubleshooting
- **Admin dashboard** - View and manage source status

## Current Status

### Optimization 1: Parallel Batch Execution ✅
Sources now run in 4 batches to avoid timeouts:

1. **Batch 1 - Premium Sources** (runs in parallel)
   - greenhouse
   - lever

2. **Batch 2 - High-Volume Aggregators** (runs in parallel)
   - remotive
   - himalayas
   - arbeitnow
   - findwork

3. **Batch 3 - Medium Aggregators** (runs in parallel)
   - jooble
   - themuse
   - reed_uk
   - careeronestop

4. **Batch 4 - Remaining Sources** (runs in parallel)
   - All other enabled sources

**Expected execution time:** ~80-120 seconds (down from 14+ minute timeout)

### Optimization 2: Full Greenhouse Pagination ✅
Greenhouse now fetches **ALL jobs from each board**, not just the first 1000:

- **Previous:** Only fetched 1st page (limit 1000 jobs per board)
- **Now:** Follows RFC-5988 Link headers to paginate through ALL pages
- **Implementation:** `fetchGreenhouseAllPages()` function aggregates jobs before normalization
- **Impact:** Dramatically increases job volume for better matching
- **Example:** If a board has 5,000 jobs, all 5,000 are now captured (instead of just 1,000)

**Configuration:**
- `maxPagesPerRun: 100` - Can follow up to 100 pages per board
- Per-page limit: 1000 jobs (Greenhouse default)
- Detailed logging shows per-page progress

---

## Disabling Problem Sources

When a source is causing issues (timeouts, errors, low quality), you can disable it to troubleshoot:

### Option 1: Via Admin API (Quick)

**Disable a source:**
```bash
curl -X GET "https://yoursite.com/.netlify/functions/admin_source_config?action=toggle&slug=SOURCENAME" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET"
```

**Example: Disable CareerJet**
```bash
curl -X GET "https://yoursite.com/.netlify/functions/admin_source_config?action=toggle&slug=careerjet" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET"
```

**Set explicit enabled/disabled status:**
```bash
curl -X GET "https://yoursite.com/.netlify/functions/admin_source_config?action=set-enabled&slug=SOURCENAME&enabled=false" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET"
```

### Option 2: Via Code Configuration (Permanent)

Edit `src/shared/sourceConfig.ts` and find the source:

```typescript
careerjet: {
  slug: 'careerjet',
  mode: 'fresh-only',
  enabled: false,  // Change this to disable
  maxAgeDays: 30,
  // ... rest of config
},
```

Then commit and deploy.

---

## Troubleshooting Workflow

### 1. Check Current Status
```bash
curl -X GET "https://yoursite.com/.netlify/functions/admin_source_config?action=status" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET"
```

Response shows:
- Total sources in code vs database
- Which sources are disabled
- Which sources are out of sync
- Any validation issues

### 2. Identify Problem Source
Check the ingestion logs in Netlify:
- Look for timeout errors
- Check which sources appear in errors
- Note the last successful run for each source

### 3. Disable Problem Source
Use the toggle API to disable it immediately without redeploying.

### 4. Run Ingestion
Trigger a manual ingestion run:
```bash
curl -X POST "https://yoursite.com/.netlify/functions/admin_ingest_trigger" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "triggeredBy": "manual", "sources": ["greenhouse", "lever"] }'
```

### 5. Monitor Results
Watch the ingestion_runs table to see:
- How long the run takes (should be < 14 minutes)
- How many jobs are ingested
- Whether errors are resolved

---

## Sources Status

### Known Issues

**CareerJet (careerjet)** - Currently disabled
- Status: HTTP 403 errors when running
- Action: Verify API key is set in Netlify environment variables
- Next: Re-enable after API key verification

### Recently Fixed / Enhanced

**Greenhouse** ✅
- ✅ NOW: Full pagination with RFC-5988 Link headers
- ✅ Verified working: 1,974 jobs (Dec 22, 08:50:30) - now captures ALL pages
- Mode: Premium, parallel execution with multi-page support
- **What changed:** Now follows pagination links to get all jobs from boards with 1000+ listings

**Lever**
- ✅ Verified working: 76 jobs (Dec 22, 08:50:17)
- Mode: Premium, parallel execution

**Remotive**
- ✅ Verified working: 27 jobs per run
- Mode: High-volume, parallel execution

---

## Admin API Reference

### Check Configuration Status
```
GET /admin_source_config?action=status
```
Returns complete overview of all sources.

### Toggle Source
```
GET /admin_source_config?action=toggle&slug=SOURCE_SLUG
```
Toggles enabled/disabled in database.

### Set Explicit Status
```
GET /admin_source_config?action=set-enabled&slug=SOURCE_SLUG&enabled=true|false
```
Sets enabled status explicitly.

### Validate All Sources
```
GET /admin_source_config?action=validate
```
Shows validation issues for all sources.

### Export Configuration
```
GET /admin_source_config?action=export
GET /admin_source_config?action=export-single&slug=SOURCE_SLUG
```
Exports JSON configuration.

---

## Next Steps

1. **Verify CareerJet API Key**
   - Check that CAREERJET_API_KEY is set in Netlify environment variables
   - Test API connectivity
   - Re-enable if verified

2. **Test Parallel Execution**
   - Monitor next scheduled ingestion run (hourly at 0 * * * *)
   - Verify all batches complete without timeout
   - Confirm job counts increase from all sources

3. **Optimize by Source**
   - If parallel batches still timeout, disable low-value sources temporarily
   - Re-enable one-by-one to identify the bottleneck
   - Consider Option B (split background worker) if batch execution isn't sufficient

4. **Build Admin Dashboard**
   - Create UI for users to toggle sources
   - Show health status for each source
   - Display last run time and job count per source

---

## Architecture Notes

### How Disabling Works

1. **Database Level** (`job_sources` table)
   - Each source has an `enabled` boolean field
   - Can be toggled via admin API without redeploying

2. **Code Level** (`src/shared/sourceConfig.ts`)
   - SOURCE_CONFIGS has `enabled: boolean` for each source
   - This is the source of truth for code configuration
   - If disabled in code, it's disabled in all environments

3. **Ingestion Logic** (`netlify/functions/ingest_jobs.ts`, lines 1910-1917)
   - runIngestion function filters sources by `config.enabled`
   - Disabled sources are skipped and logged
   - If all sources disabled, returns error

### Priority Batching

Batches execute:
- **Sequentially** between batches (protects Supabase connection pool)
- **In parallel** within each batch (maximizes throughput)

This prevents overwhelming the database while still dramatically reducing total execution time.

---

## Monitoring

Check `ingestion_runs` table for:
- `status`: 'success', 'partial', or 'failed'
- `total_inserted`: How many jobs were added
- `total_failed_sources`: How many sources failed
- `error_summary`: Details of failures
- `finished_at - started_at`: Execution duration

Goal: Execution time < 14 minutes (Netlify background function limit)

---

## Questions?

Refer to:
- **Phase 2 Implementation Summary:** `PHASE_2_IMPLEMENTATION_SUMMARY.md`
- **Source Configuration:** `src/shared/sourceConfig.ts`
- **Sync Utilities:** `src/shared/sourceSync.ts`
- **Ingestion Logic:** `netlify/functions/ingest_jobs.ts`
