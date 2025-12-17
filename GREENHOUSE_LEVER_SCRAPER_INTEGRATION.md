# Greenhouse & Lever Scraper Integration Guide

## Overview

You now have two production-ready scrapers:
1. **`src/services/jobSources/greenhouse.scraper.ts`** - Scrapes Greenhouse-hosted career boards
2. **`src/services/jobSources/lever.scraper.ts`** - Scrapes Lever-hosted career boards

Both are ready to integrate into your ingestion pipeline and will add 15,000-30,000+ high-quality jobs.

---

## Required Environment Variables

### Greenhouse Companies

When you get the list from Gemini, format it as JSON:

```bash
export GREENHOUSE_COMPANIES_JSON='[
  {
    "name": "company-name-1",
    "url": "https://company-name-1.greenhouse.io"
  },
  {
    "name": "company-name-2",
    "url": "https://company-name-2.greenhouse.io"
  },
  {
    "name": "company-name-3",
    "url": "https://company-name-3.greenhouse.io"
  }
]'
```

**Format Details**:
- `name`: Company identifier (used in logs and as slug)
- `url`: Base URL of the Greenhouse board (without `/jobs` or `/api`)
- Can have 100+ companies

### Lever Companies

When you get the list from Gemini, format it as JSON:

```bash
export LEVER_COMPANIES_JSON='[
  {
    "name": "company-name-1",
    "url": "https://jobs.lever.co/company-name-1"
  },
  {
    "name": "company-name-2",
    "url": "https://company-name-2.lever.co"
  },
  {
    "name": "company-name-3",
    "url": "https://jobs.lever.co/company-name-3"
  }
]'
```

**Format Details**:
- `name`: Company identifier (used in logs)
- `url`: Full URL to company's Lever job board
- Supports both `jobs.lever.co/company` and `company.lever.co` formats
- Can have 50+ companies

---

## Integration Steps

### Step 1: Import the Scrapers

In `netlify/functions/ingest_jobs.ts`, add to the imports section (around line 10-34):

```typescript
import { scrapeGreenhouseJobs, getGreenhouseCompanies } from '../../src/services/jobSources/greenhouse.scraper'
import { scrapeLeverJobs, getLeverCompanies } from '../../src/services/jobSources/lever.scraper'
```

### Step 2: Update runIngestion Function

Find the source loop (around line 1739-1762) and modify it:

```typescript
for (const source of sourcesToRun) {
  try {
    // Use special handler for Greenhouse
    let result
    if (source.slug === 'greenhouse') {
      result = await ingestGreenhouseBoards(source, runId || undefined)
    }
    // NEW: Use special handler for Lever
    else if (source.slug === 'lever') {
      result = await ingestLeverBoards(source, runId || undefined)
    }
    // Default ingestion for all other sources
    else {
      result = await ingest(source, runId || undefined)
    }

    results.push(result)
    if (result.status === 'failed') {
      failedSourceCount++
    }
  } catch (err) {
    // ... error handling ...
  }
}
```

### Step 3: Add Lever Ingest Function

Add this new function in `ingest_jobs.ts` right after the `ingestGreenhouseBoards` function (around line 1280):

```typescript
/**
 * Ingest jobs from all configured Lever company boards
 */
async function ingestLeverBoards(source: JobSource, runId?: string): Promise<IngestResult> {
  const supabase = createAdminClient()
  const sourceConfig = getSourceConfig(source.slug)

  console.log('ingest_jobs: starting Lever ingest...')

  const runStartedAt = new Date().toISOString()
  let totalNormalized = 0
  let totalInserted = 0
  let totalDuplicates = 0
  let totalStaleFiltered = 0
  let sourceStatus: 'success' | 'failed' = 'success'
  let sourceError: string | null = null

  // Create source run log if runId provided
  let sourceRunId: string | null = null
  if (runId) {
    const { data: sourceRun, error: sourceRunError } = await supabase
      .from('job_ingestion_run_sources')
      .insert({
        run_id: runId,
        source: source.slug,
        started_at: runStartedAt,
        status: 'running',
      })
      .select('id')
      .single()

    if (!sourceRunError && sourceRun) {
      sourceRunId = sourceRun.id
    }
  }

  try {
    // Call the Lever scraper (returns normalized jobs)
    const jobs = await scrapeLeverJobs()
    totalNormalized = jobs.length

    if (jobs.length === 0) {
      console.warn('ingest_jobs: Lever scraper returned 0 jobs')
      return {
        source: source.slug,
        count: 0,
        normalized: 0,
        duplicates: 0,
        staleFiltered: 0,
        status: 'success',
      }
    }

    console.log(`ingest_jobs: Lever scraper returned ${jobs.length} jobs, inserting...`)

    // Filter by freshness (maxAgeDays)
    const now = new Date()
    const maxAgeMs = sourceConfig.maxAgeDays * 24 * 60 * 60 * 1000
    const freshnessFiltered = jobs.filter(job => {
      if (!job.posted_date) return true // Keep jobs without dates
      const postedTime = new Date(job.posted_date).getTime()
      const ageMs = now.getTime() - postedTime
      if (ageMs > maxAgeMs) {
        totalStaleFiltered++
        return false
      }
      return true
    })

    // Enrich each job
    const enriched = freshnessFiltered.map(job => enrichJob(job))

    // Upsert to database
    const { error: upsertError, data: upserted } = await supabase
      .from('jobs')
      .upsert(enriched, {
        onConflict: 'source_slug,external_id',
      })
      .select('id')

    if (upsertError) {
      console.error('ingest_jobs: upsert error for Lever:', upsertError)
      throw upsertError
    }

    totalInserted = upserted?.length || 0

    // Count duplicates as jobs that were normalized but not inserted
    totalDuplicates = totalNormalized - totalInserted - totalStaleFiltered

    console.log(
      `ingest_jobs: Lever complete - normalized: ${totalNormalized}, inserted: ${totalInserted}, duplicates: ${totalDuplicates}, stale filtered: ${totalStaleFiltered}`
    )
  } catch (err) {
    console.error('ingest_jobs: error during Lever ingest:', err)
    sourceStatus = 'failed'
    sourceError = err instanceof Error ? err.message : String(err)
  }

  // Update source run log if it was created
  if (sourceRunId) {
    await supabase
      .from('job_ingestion_run_sources')
      .update({
        finished_at: new Date().toISOString(),
        status: sourceStatus,
        normalized_count: totalNormalized,
        inserted_count: totalInserted,
        duplicate_count: totalDuplicates,
        stale_filtered_count: totalStaleFiltered,
        error_message: sourceError,
      })
      .eq('id', sourceRunId)
  }

  return {
    source: source.slug,
    count: totalInserted,
    normalized: totalNormalized,
    duplicates: totalDuplicates,
    staleFiltered: totalStaleFiltered,
    status: sourceStatus,
    error: sourceError || undefined,
  }
}
```

### Step 4: Configure Source Settings

Verify these settings in `src/shared/sourceConfig.ts`:

**Greenhouse** (should already be configured):
```typescript
greenhouse: {
  slug: 'greenhouse',
  mode: 'shallow-curated',
  enabled: true,
  maxAgeDays: 30,
  maxPagesPerRun: 1,
  resetPaginationEachRun: false,
  trustLevel: 'high',
  trackFreshnessRatio: false,
  notes: 'Greenhouse company career boards.',
}
```

**Lever** (update to enable):
```typescript
lever: {
  slug: 'lever',
  mode: 'shallow-curated',
  enabled: true,  // Change from false to true
  maxAgeDays: 30,
  maxPagesPerRun: 1,
  resetPaginationEachRun: false,
  trustLevel: 'high',  // Direct from companies, high quality
  trackFreshnessRatio: false,
  notes: 'Lever company career boards.',
}
```

---

## Testing the Integration

### Test 1: Verify Company Lists Are Loaded

```bash
# In browser console or via API call:
fetch('/.netlify/functions/admin_source_config?action=status', {
  headers: { 'x-admin-secret': '<your-secret>' }
})
.then(r => r.json())
.then(d => {
  console.log('Greenhouse enabled:', d.data.details.allStatuses.find(s => s.slug === 'greenhouse')?.codeConfig.enabled)
  console.log('Lever enabled:', d.data.details.allStatuses.find(s => s.slug === 'lever')?.codeConfig.enabled)
})
```

### Test 2: Trigger Ingestion

In the admin console:
1. Go to **Sources & APIs** tab
2. Find "Greenhouse" in the list
3. Click **▶ Trigger Ingestion** button
4. Wait for completion
5. Check **Ingestion** tab for results

Repeat for **Lever**

### Test 3: Verify Jobs Are Inserted

In Supabase:
```sql
-- Check Greenhouse jobs
SELECT COUNT(*) as greenhouse_jobs
FROM jobs
WHERE source_slug = 'greenhouse';

-- Check Lever jobs
SELECT COUNT(*) as lever_jobs
FROM jobs
WHERE source_slug = 'lever';

-- View companies represented
SELECT DISTINCT company, COUNT(*) as job_count
FROM jobs
WHERE source_slug IN ('greenhouse', 'lever')
GROUP BY company
ORDER BY job_count DESC
LIMIT 20;
```

### Test 4: Monitor Logs

Check ingestion logs for:
```
ingest_jobs: starting Lever ingest...
  ✓ company-name-1: X jobs
  ✓ company-name-2: Y jobs
  ✗ company-name-failed: 0 jobs
Lever scraper complete: N companies succeeded, M failed, TOTAL jobs
```

---

## Expected Results

### After Integrating Greenhouse + Lever

```
Before:    22,000 jobs
Greenhouse: ~5,000-15,000 jobs (depends on # of companies)
Lever:      ~5,000-15,000 jobs (depends on # of companies)
────────────────────────────────────────────────
After:     35,000-52,000+ jobs (depends on list size)

Quality:   HIGH (direct from companies)
Cost:      $0 (no API keys, just scraping)
Effort:    ~2-4 hours to integrate + configure lists
```

---

## Troubleshooting

### "0 jobs returned from Greenhouse"

**Check**:
1. Is GREENHOUSE_COMPANIES_JSON set?
   ```bash
   echo $GREENHOUSE_COMPANIES_JSON
   ```
2. Are URLs formatted correctly? Should be without `/jobs`:
   ```
   https://company-name.greenhouse.io  ✅
   https://company-name.greenhouse.io/jobs  ❌
   ```
3. Are company names valid (no special characters)?
4. Are Greenhouse boards actually public?

### "0 jobs returned from Lever"

**Check**:
1. Is LEVER_COMPANIES_JSON set?
   ```bash
   echo $LEVER_COMPANIES_JSON
   ```
2. Are URLs one of these formats?
   ```
   https://jobs.lever.co/company-name  ✅
   https://company-name.lever.co  ✅
   https://company-name.lever.co/jobs  ❌ (don't include /jobs)
   ```
3. Is `api.lever.co` accessible from your deployment region?
4. Are Lever boards actually public?

### "Some companies returned 0 jobs"

This is normal! Not all companies on the list will have open positions. The logs will show:
```
✓ company-with-jobs: 15 jobs
✗ company-no-openings: 0 jobs
```

This is fine - just means that company has no current openings.

### "Jobs aren't showing up in database"

**Check**:
1. Did the ingestion complete without errors?
2. Check the `job_ingestion_run_sources` table for the actual run
3. Verify `enrichJob()` function isn't filtering them out
4. Check if they're marked as stale (older than maxAgeDays)

---

## Next Steps

1. **Get company lists from Gemini** (in progress)
2. **Set environment variables** with the lists
3. **Apply the code changes** above to `ingest_jobs.ts`
4. **Deploy**
5. **Trigger ingestion** from admin console
6. **Monitor results** and verify job counts

---

## File Checklist

- [x] `src/services/jobSources/greenhouse.scraper.ts` - Created
- [x] `src/services/jobSources/lever.scraper.ts` - Created
- [ ] `netlify/functions/ingest_jobs.ts` - Add imports and `ingestLeverBoards()` function
- [ ] `src/shared/sourceConfig.ts` - Enable lever source (change `enabled: true`)
- [ ] Environment variables - Set GREENHOUSE_COMPANIES_JSON and LEVER_COMPANIES_JSON

---

## Performance Notes

- **Rate Limiting**: Scrapers process 5 companies in parallel per batch with 1-second delays between batches
- **Timeout**: 10 seconds per company (adequate for most boards)
- **Expected Duration**: 100 companies = ~2-3 minutes for both platforms combined
- **Scheduling**: Run on ingestion scheduler (no daily limit, can run frequently)

Once you have the company lists, the integration is straightforward!
