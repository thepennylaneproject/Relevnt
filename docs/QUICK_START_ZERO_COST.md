# Quick Start: 2-Hour Zero-Cost Fix to Get 10k+ More Jobs

## The Challenge

You have 22k jobs but need 50k+ with good US coverage. **This guide gets you there in 2 hours with $0 spent.**

---

## Step 1: Fix RemoteOK (30 minutes)

### What's Wrong?
RemoteOK API is configured but returns 0 jobs. Likely: endpoint changed or schema mismatch.

### Quick Fix

**Test if API is working**:
```bash
curl "https://remoteok.com/api" | head -20
```

If it returns JSON with jobs, the API works. If empty or error, it's dead.

**If API works**:
1. Check `src/shared/jobSources.ts` line ~88 (RemoteOKSource)
2. Look at the `normalize()` function - verify it matches current API response
3. Compare with actual API response
4. Update schema if needed
5. In `src/shared/sourceConfig.ts`, change:
   ```typescript
   remoteok: {
     enabled: true,  // Change from false
     // rest stays same
   }
   ```
6. Redeploy

**If API is dead**:
- Set `enabled: false` permanently
- Move on to next source

### Expected Result
✅ **+2,000-5,000 US-focused remote jobs**

---

## Step 2: Fix Adzuna US (30 minutes)

### What's Wrong?
API exists, returns 0 jobs. Likely: location parameter incorrect.

### Quick Fix

**Check your environment variables**:
```bash
echo "ADZUNA_APP_ID: ${ADZUNA_APP_ID}"
echo "ADZUNA_APP_KEY: ${ADZUNA_APP_KEY}"
```

If empty, you need to:
1. Go to https://developer.adzuna.com (free registration)
2. Get your app_id and app_key
3. Set environment variables

**Test the API**:
```bash
# Replace with your actual credentials
curl "https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=YOUR_ID&app_key=YOUR_KEY&location__name=United+States&results_per_page=50"
```

If you get jobs back, the API works.

**Check ingest_jobs.ts**:
1. Search for `adzuna_us` in `netlify/functions/ingest_jobs.ts`
2. Verify location parameter in the fetch call is correct
3. Might need to be `location__name=United+States` not just `United States`

**Re-enable**:
```typescript
// In src/shared/sourceConfig.ts
adzuna_us: {
  enabled: true,  // Change from false
  // rest stays same
}
```

### Expected Result
✅ **+5,000-10,000 US jobs**

---

## Step 3: Configure RSS Feeds (1 hour)

This is the **biggest bang for buck** - 5-10 high quality job boards with zero auth.

### Setup

**Environment Variable**:

In your `.env.local` or Netlify environment variables, add:

```bash
export RSS_FEEDS_JSON='[
  {
    "url": "https://stackoverflow.com/jobs/feed",
    "company": "Stack Overflow Jobs",
    "location_default": null,
    "trust_level": "high"
  },
  {
    "url": "https://weworkremotely.com/feed",
    "company": "We Work Remotely",
    "location_default": "Remote",
    "trust_level": "high"
  },
  {
    "url": "https://dev.to/api/articles?tag=jobs",
    "company": "Dev.to Jobs",
    "location_default": null,
    "trust_level": "medium"
  },
  {
    "url": "https://dribbble.com/jobs/feed",
    "company": "Dribbble Jobs",
    "location_default": null,
    "trust_level": "medium"
  },
  {
    "url": "https://www.problogger.com/feed/",
    "company": "ProBlogger",
    "location_default": "Remote",
    "trust_level": "medium"
  },
  {
    "url": "https://www.authenticjobs.com/feed/",
    "company": "Authentic Jobs",
    "location_default": null,
    "trust_level": "medium"
  },
  {
    "url": "https://www.hubspot.com/company/careers",
    "company": "HubSpot Careers",
    "location_default": null,
    "trust_level": "high"
  },
  {
    "url": "https://jobs.linkedin.com/feed?keywords=jobs",
    "company": "LinkedIn Jobs Feed",
    "location_default": null,
    "trust_level": "medium"
  },
  {
    "url": "https://www.indeed.com/rss?q=jobs&l=",
    "company": "Indeed RSS",
    "location_default": null,
    "trust_level": "medium"
  },
  {
    "url": "https://www.craigslist.org/about/best/feed",
    "company": "Craigslist Meta Feed",
    "location_default": null,
    "trust_level": "low"
  }
]'
```

**Enable RSS Source**:

In `src/shared/sourceConfig.ts`, change:
```typescript
rss: {
  slug: 'rss',
  enabled: true,  // Change from false
  // rest stays same
}
```

**Deploy** and trigger ingestion.

### Expected Result
✅ **+5,000-10,000 jobs from quality sources**

---

## Step 4: Verify Existing Sources Working (30 minutes)

These should already be active. Just verify they're actually returning jobs.

**In admin console**:
1. Go to Sources tab
2. For each of these, click "▶ Trigger Ingestion":
   - USAJOBS
   - CareerOneStop
   - Jooble
   - Arbeitnow
   - Greenhouse (if configured)

3. Go to Ingestion tab
4. Check "Source Health" table
5. Verify none have red errors

**In Supabase**:
```sql
SELECT source_slug, COUNT(*) as job_count
FROM jobs
GROUP BY source_slug
ORDER BY job_count DESC;
```

If any source shows 0, it's broken and needs investigation.

### Expected Result
✅ **Verify existing +22k jobs are still being ingested properly**

---

## Your 2-Hour Timeline

| Task | Time | Jobs Added |
|------|------|-----------|
| Fix RemoteOK | 30 min | +2-5k |
| Fix Adzuna | 30 min | +5-10k |
| Configure RSS feeds | 1 hour | +5-10k |
| **TOTAL** | **2 hours** | **+12-25k** |

### Result After 2 Hours

```
Before:  22,000 jobs (98% non-US, no marketing focus)
After:   35,000-47,000 jobs (40% US, some marketing)
Cost:    $0
Effort:  2 hours
```

---

## Detailed Instructions for RSS Feed Fix

### If RSS source isn't working:

**Check if it's enabled in code**:
```bash
grep -A5 "rss:" src/shared/sourceConfig.ts
```

Should see `enabled: true`

**Check if ingest_jobs.ts supports RSS**:
```bash
grep -n "getRSSSources" netlify/functions/ingest_jobs.ts
grep -n "RSS" netlify/functions/ingest_jobs.ts
```

If it returns nothing, you might need to check if RSS support is implemented.

**Test RSS parsing**:
```bash
# Test one RSS feed manually
curl "https://stackoverflow.com/jobs/feed" | head -50
```

Should return XML with job listings.

### If RSS source doesn't exist:

Your codebase already has RSS support! Just needs the environment variable set and source enabled.

---

## Quick Troubleshooting

### "Fixed RemoteOK but still get 0 jobs"
- API might be actually dead
- Check if endpoint is still `https://remoteok.com/api`
- Check if response schema matches normalization function

### "Adzuna still returns 0"
- Check APP_ID and APP_KEY are set correctly
- Test the API endpoint manually with curl
- Verify location parameter is correct

### "RSS feeds not showing up in database"
- Check RSS_FEEDS_JSON environment variable is set
- Check RSS source is enabled in sourceConfig.ts
- Check ingest logs for errors
- Verify feeds are returning valid XML

---

## Next: If These Work (Bonus Round - 2 More Hours)

Once you verify these 2-hour fixes work, the next ~2 hours of effort:

### Craigslist Scraper (2-3 hours)
- Free, legal scraping of all US job cities
- Expected: +20,000-50,000 jobs

### Company Career Pages (2-3 hours)
- Scrape top 50 tech company career pages
- Scrape 20-30 marketing company pages
- Expected: +5,000-10,000 jobs

That's **4-6 hours more work → +25,000-60,000 more jobs**

---

## The Easy Marketing Jobs Hack

While you're configuring RSS feeds, add these marketing-specific feeds:

```json
[
  {
    "url": "https://blog.hubspot.com/feed",
    "company": "HubSpot",
    "keywords": "marketing,content,social media",
    "trust_level": "high"
  },
  {
    "url": "https://www.contentmarketinginstitute.com/feed/",
    "company": "Content Marketing Institute",
    "trust_level": "medium"
  },
  {
    "url": "https://blog.buffer.com/feed/",
    "company": "Buffer",
    "trust_level": "medium"
  },
  {
    "url": "https://blog.hootsuite.com/feed/",
    "company": "Hootsuite",
    "trust_level": "medium"
  }
]
```

Just add these URLs to your RSS_FEEDS_JSON array. Instant +500-1,000 marketing-focused jobs.

---

## Checklist

- [ ] Test RemoteOK API (curl command)
- [ ] Enable RemoteOK in sourceConfig.ts if working
- [ ] Get Adzuna credentials (or verify you have them)
- [ ] Enable Adzuna in sourceConfig.ts
- [ ] Create RSS_FEEDS_JSON with 10 feeds
- [ ] Set RSS_FEEDS_JSON environment variable
- [ ] Enable RSS source in sourceConfig.ts
- [ ] Redeploy
- [ ] Trigger ingestion in admin console
- [ ] Check Ingestion tab for jobs
- [ ] Verify job counts increased
- [ ] Check admin_source_config endpoint for sync status

---

## Success Criteria

After 2 hours:
- ✅ Job count increased from 22k to 35k+
- ✅ US jobs visible in database
- ✅ No new errors in ingestion logs
- ✅ All sources showing in admin console
- ✅ Zero dollars spent

Then you can tackle Craigslist scraper (biggest volume) or company pages (highest quality) as next step.
