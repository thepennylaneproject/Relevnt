# Job Source Synchronization & Repair Guide

## Executive Summary

Your job ingestion system has **11 active sources** producing 22k+ jobs, but:
- **Geographic bias**: Very few US jobs despite USAJOBS being enabled
- **Missing specialization**: No dedicated social media marketing sources
- **Configuration sync issues**: Sources defined in code but not always accessible in admin console
- **5 disabled sources** need investigation or removal

This guide provides diagnostics and fixes for all issues.

---

## Part 1: Understanding the Architecture Problem

### The Dual-Configuration Problem

Your system has **two separate source configurations** that must stay in sync:

```
┌─────────────────────────────────────────┐
│ 1. CODE (Single Source of Truth)        │
│    - src/shared/sourceConfig.ts         │
│    - src/shared/jobSources.ts           │
│    - Defines guardrails, modes, trust   │
│    - Enables/disables sources           │
└─────────────────────────────────────────┘
                    ↓ (Manual sync required)
┌─────────────────────────────────────────┐
│ 2. DATABASE (Runtime Configuration)     │
│    - job_sources table                  │
│    - job_source_health table            │
│    - What admin console manages         │
│    - Reflects current state             │
└─────────────────────────────────────────┘
```

**The Problem**: These can drift out of sync. If you update `sourceConfig.ts` but don't update the database, the admin console shows different settings than what the ingestion engine uses.

**The Solution**: We need a synchronization mechanism.

---

## Part 2: Current Source Status

### ✅ ACTIVE SOURCES (11)

| Source | Trust | Mode | Coverage | Issues |
|--------|-------|------|----------|--------|
| Remotive | ⭐⭐⭐ High | curated | Remote-focused | Low volume |
| Himalayas | ⭐⭐⭐ High | curated | Remote niche | Very low volume, 6h cooldown |
| The Muse | ⭐⭐⭐ High | curated | Editorial | Limited geographic scope |
| TheirStack | ⭐⭐ Medium | fresh | Tech-focused | Tech jobs only |
| Findwork | ⭐⭐ Medium | curated | Tech-focused | Tech jobs only |
| CareerOneStop | ⭐⭐ Medium | wide | **US-focused** | May be underperforming |
| Arbeitnow | ⭐⭐ Medium | wide | EU + remote | Europe-heavy |
| Reed UK | ⭐⭐ Medium | wide | UK-focused | UK jobs only |
| Jooble | ⭐ Low | fresh | Global | High volume, low quality |
| USAJOBS | ⭐⭐ Medium | wide | **US Federal** | Government jobs only |
| Greenhouse | ⭐⭐⭐ High | curated | Company-dependent | Needs configuration |

**Observation**: Only 2 sources (USAJOBS, CareerOneStop) are US-focused, and only one (Jooble) is truly global with high volume. This explains why you have few US jobs.

### ⚠️ DISABLED SOURCES (5) - Needs Action

| Source | Status | Reason | Fix |
|--------|--------|--------|-----|
| RemoteOK | ❌ Disabled | Returns 0 jobs | Verify API endpoint and auth |
| Adzuna US | ❌ Disabled | Returns 0 jobs | Check credentials and location params |
| Jobicy | ❌ Disabled | Dead source | Mark for removal |
| Lever | ❌ Disabled | Needs config | Requires LEVER_SOURCES_JSON env var |
| RSS | ❌ Disabled | Needs config | Requires RSS_FEEDS_JSON env var |

---

## Part 3: Diagnostic Queries

### Check Current Source Health (in Supabase)

```sql
-- View all job sources in database
SELECT id, name, slug, enabled, trust_level, max_age_days,
       last_sync, last_error, updated_at
FROM job_sources
ORDER BY enabled DESC, name;

-- View source health status
SELECT source, is_degraded, last_success_at, last_error_at,
       consecutive_failures, last_counts, updated_at
FROM job_source_health
ORDER BY source;

-- Count jobs by source (see geographic distribution)
SELECT source_slug, COUNT(*) as job_count,
       COUNT(DISTINCT location) as unique_locations,
       COUNT(CASE WHEN location LIKE '%US%' OR location LIKE '%United States%' THEN 1 END) as us_count
FROM jobs
GROUP BY source_slug
ORDER BY job_count DESC;

-- Find jobs with marketing/social keywords by source
SELECT source_slug, COUNT(*) as marketing_jobs
FROM jobs
WHERE title ILIKE '%marketing%'
   OR title ILIKE '%social media%'
   OR title ILIKE '%content%'
   OR title ILIKE '%creator%'
GROUP BY source_slug
ORDER BY marketing_jobs DESC;
```

---

## Part 4: Fixing Disabled Sources

### Option A: RemoteOK - Investigate

**Status**: Returns 0 jobs consistently

**Diagnostic Steps**:
```bash
# 1. Test the API endpoint manually
curl "https://remoteok.com/api" | head -20

# 2. Check if API is returning valid JSON
curl -s "https://remoteok.com/api" | jq '.[0]'

# 3. Verify the response schema matches jobSources.ts normalization
```

**If API works**:
- Update `src/shared/jobSources.ts` - RemoteOKSource normalization may have changed
- Re-enable in sourceConfig.ts and test with admin console

**If API is dead**:
- Remove from jobSources.ts and sourceConfig.ts
- Delete from job_sources table (set enabled = false)

### Option B: Adzuna US - Credentials Check

**Status**: Returns 0 jobs, likely credential issue

**Required Environment Variables**:
```bash
ADZUNA_APP_ID=xxx
ADZUNA_APP_KEY=xxx
```

**Diagnostic Steps**:
```bash
# Check environment variables are set
echo "App ID: ${ADZUNA_APP_ID}"
echo "App Key: ${ADZUNA_APP_KEY}"

# Test API endpoint with credentials
curl "https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&location__name=United+States&results_per_page=5"
```

**If credentials valid**:
1. Verify location param is correct (should be "United States")
2. Check if API is rate-limited or has quota issues
3. Re-enable in sourceConfig.ts
4. Test with single page first

**If credentials missing/invalid**:
1. Get valid credentials from adzuna.com
2. Update environment variables
3. Deploy and test

### Option C: Jobicy - Mark for Removal

**Status**: Marked as "dead source"

**Recommendation**: Complete removal
```typescript
// In src/shared/jobSources.ts: DELETE this entire object
export const JobicySource: JobSource = { ... }

// In src/shared/sourceConfig.ts: DELETE this entry
jobicy: { ... }

// In database:
DELETE FROM job_sources WHERE slug = 'jobicy';
```

### Option D: Lever - Enable with Configuration

**Status**: Disabled, requires company configuration

**Setup Steps**:
1. Create environment variable with company configs:
```bash
export LEVER_SOURCES_JSON='[
  {
    "company_name": "ExampleCorp",
    "company_url": "https://examplecorp.lever.co",
    "api_key": "optional_key"
  }
]'
```

2. In sourceConfig.ts:
```typescript
lever: {
    slug: 'lever',
    enabled: true,  // Change from false to true
    // ... rest of config
}
```

3. In admin console, re-enable Lever and test

### Option E: RSS - Enable with Feed Configuration

**Status**: Disabled, requires RSS feed URLs

**Setup Steps**:
1. Create environment variable with feed URLs:
```bash
export RSS_FEEDS_JSON='[
  {
    "url": "https://example.com/jobs/feed",
    "company": "Example Company",
    "location_default": "Remote",
    "trust_level": "high"
  },
  {
    "url": "https://marketing-jobs.com/feed.xml",
    "company": "Marketing Job Board",
    "location_default": null,
    "trust_level": "medium"
  }
]'
```

2. In sourceConfig.ts:
```typescript
rss: {
    slug: 'rss',
    enabled: true,  // Change from false to true
    // ... rest of config
}
```

3. In admin console, re-enable RSS and test

---

## Part 5: Adding New Sources for US & Marketing Coverage

### HIGH PRIORITY - Add These Now

#### 1. **Indeed** (Largest US Job Board)
- **Coverage**: 22M+ jobs globally, strong US presence
- **Type**: Official API
- **Setup Cost**: Low (free API with rate limits)
- **Implementation**: 3-4 hours

**Environment Variables**:
```bash
INDEED_PUBLISHER_ID=xxx  # Sign up at opensource.indeedapis.com
```

**Configuration**:
```typescript
// In sourceConfig.ts
indeed: {
  slug: 'indeed',
  mode: 'wide-capped',
  enabled: true,
  maxAgeDays: 14,  // Indeed jobs age quickly
  maxPagesPerRun: 10,
  resetPaginationEachRun: false,
  trustLevel: 'medium',
  trackFreshnessRatio: true,
  notes: 'Largest US job board. Requires INDEED_PUBLISHER_ID env var.',
}
```

**Benefits for Your Use Case**:
- ✅ Massive US job coverage (estimated 50k+ jobs)
- ✅ Good marketing/social media job selection
- ✅ Location filtering available
- ✅ Salary data included

---

#### 2. **Glassdoor** (US-Focused, Reviews + Jobs)
- **Coverage**: 1.5M+ jobs, heavily US
- **Type**: Unofficial API or scraping
- **Setup Cost**: Medium (scraping needed)
- **Implementation**: 4-5 hours

**Configuration**:
```typescript
// In sourceConfig.ts
glassdoor: {
  slug: 'glassdoor',
  mode: 'wide-capped',
  enabled: true,
  maxAgeDays: 14,
  maxPagesPerRun: 5,
  resetPaginationEachRun: true,
  trustLevel: 'medium',
  trackFreshnessRatio: true,
  notes: 'US-focused with company reviews. Good for marketing/creative roles.',
}
```

**Benefits**:
- ✅ Strong US presence
- ✅ Good marketing role coverage
- ✅ Company ratings included
- ✅ Salary transparency data

---

#### 3. **FlexJobs** (US Remote & Marketing Specialist)
- **Coverage**: 50k+ vetted jobs, heavily US
- **Type**: Unofficial API or scraping
- **Setup Cost**: Medium
- **Implementation**: 3-4 hours

**Configuration**:
```typescript
// In sourceConfig.ts
flexjobs: {
  slug: 'flexjobs',
  mode: 'shallow-curated',
  enabled: true,
  maxAgeDays: 30,
  maxPagesPerRun: 5,
  resetPaginationEachRun: false,
  trustLevel: 'high',  // Curated, vetted jobs
  trackFreshnessRatio: false,
  notes: 'Curated remote and flexible jobs. Strong marketing/social media coverage.',
}
```

**Benefits**:
- ✅ US-focused remote jobs
- ✅ All jobs are vetted (no scams)
- ✅ Excellent marketing job selection
- ✅ Flexible work opportunities

---

### MARKETING-SPECIFIC SOURCES

#### 4. **MarketingHire** (Marketing Jobs Specialist)
- **Coverage**: 10k+ marketing-specific jobs
- **Type**: Niche job board
- **Setup Cost**: Low (RSS or API)
- **Implementation**: 2-3 hours

```typescript
marketinghire: {
  slug: 'marketinghire',
  mode: 'shallow-curated',
  enabled: true,
  maxAgeDays: 30,
  maxPagesPerRun: 3,
  resetPaginationEachRun: false,
  trustLevel: 'high',
  trackFreshnessRatio: false,
  notes: 'Specialized marketing jobs board. 100% relevant for marketing roles.',
}
```

#### 5. **ProBlogger/Copyblogger Jobs** (Content/Marketing)
- **Coverage**: 500-2000 content marketing jobs
- **Type**: RSS Feed
- **Setup Cost**: Very Low (RSS only)
- **Implementation**: 1 hour

Add via RSS_FEEDS_JSON:
```json
{
  "url": "https://www.problogger.com/feed/",
  "company": "ProBlogger Jobs",
  "location_default": "Remote",
  "trust_level": "high"
}
```

#### 6. **Social Media Management Boards**
- **HubSpot Blog Job Board** (RSS)
- **Social Media Marketing Institute** (RSS)
- **Content Marketing Institute** (RSS)

All available as RSS feeds - very low implementation cost.

#### 7. **LinkedIn Jobs** (Unofficial RSS/Scraping)
- **Coverage**: 20M+ jobs including marketing
- **Type**: Via RSS or web scraping
- **Setup Cost**: Medium
- **Implementation**: 4 hours

```typescript
linkedin: {
  slug: 'linkedin',
  mode: 'wide-capped',
  enabled: true,
  maxAgeDays: 7,  // LinkedIn jobs move fast
  maxPagesPerRun: 10,
  resetPaginationEachRun: true,
  trustLevel: 'low',  // Lower trust due to spam
  trackFreshnessRatio: true,
  notes: 'Largest global job board. Requires RSS or scraping. Wide range of marketing roles.',
}
```

---

## Part 6: Implementation Priority & Roadmap

### IMMEDIATE (Week 1)
1. Fix syntax error in sourceConfig.ts ✅
2. Investigate RemoteOK and Adzuna US
3. Enable Indeed (highest ROI for US jobs)
4. Set up FlexJobs (marketing specialist)
5. Add ProBlogger RSS feed

### SHORT TERM (Week 2-3)
1. Implement Glassdoor scraper
2. Add MarketingHire source
3. Add social media RSS feeds (3-4 feeds)
4. Test geographic distribution

### MEDIUM TERM (Week 4+)
1. Implement LinkedIn scraper/RSS
2. Add additional regional sources
3. Set up source health dashboards
4. Optimize freshness ratios

---

## Part 7: Admin Console Sync Issues

### Current Limitation

The admin console shows all sources from the `job_sources` database table, but:
- **Code configuration** (sourceConfig.ts) is the actual source of truth
- **Database configuration** can drift from code
- **You can edit in admin console**, but changes don't update the code

### Solution: Create Two Views in Admin Console

**View A: Database Configuration** (Current)
- Edit mode: ✅ Enabled (runtime adjustments)
- What you see: Current database state
- What affects ingestion: ❌ No (ingestion uses code config)

**View B: Code Configuration** (New)
- Edit mode: ❌ Disabled (requires code deploy)
- What you see: Source of truth from sourceConfig.ts
- What affects ingestion: ✅ Yes (ingestion uses this)

### Quick Fix for Admin Console

Add a new **"Source Configuration"** tab showing:

```
Source Comparison View
═════════════════════════════════════════════════════════════════

Source         │ Code Enabled │ DB Enabled │ Trust Level │ Max Age │ Status
───────────────┼──────────────┼────────────┼─────────────┼─────────┼─────────
indeed         │ ✅ (new)     │ ❌        │ medium      │ 14d     │ ⚠️ Needs sync
remoteok       │ ❌           │ ✅        │ medium      │ 30d     │ 🔴 Out of sync
usajobs        │ ✅           │ ✅        │ medium      │ 30d     │ ✅ In sync
remotive       │ ✅           │ ✅        │ high        │ 30d     │ ✅ In sync
```

**Sync Utility Button**: "Sync all to code configuration" (one-click fix)

---

## Part 8: Database Cleanup

### Clean Up Unused/Broken Sources

```sql
-- Identify sources with zero jobs for 30 days
SELECT s.slug, s.name, COUNT(j.id) as job_count,
       MAX(j.created_at) as last_job_added
FROM job_sources s
LEFT JOIN jobs j ON j.source_slug = s.slug AND j.created_at > NOW() - INTERVAL '30 days'
WHERE s.enabled = true
GROUP BY s.slug, s.name
HAVING COUNT(j.id) = 0
ORDER BY s.name;

-- Delete broken sources (after confirmation)
DELETE FROM job_sources WHERE slug IN ('jobicy', 'broken_source_name');
```

---

## Part 9: Testing Your New Setup

### Step-by-Step Verification

1. **Verify Source is in Code**:
   ```bash
   grep -n "indeed" src/shared/sourceConfig.ts
   grep -n "indeed" src/shared/jobSources.ts
   ```

2. **Verify Environment Variables**:
   ```bash
   env | grep INDEED
   env | grep GLASSDOOR
   env | grep FLEXJOBS
   ```

3. **Test Single Source Ingestion** (via admin console):
   - Go to Sources tab
   - Find "Indeed"
   - Click "Test Connection" button
   - Click "▶ Trigger Ingestion"
   - Check results in Ingestion tab

4. **Verify Jobs Are Ingested**:
   ```sql
   SELECT COUNT(*) FROM jobs WHERE source_slug = 'indeed';
   SELECT COUNT(DISTINCT location) FROM jobs WHERE source_slug = 'indeed';
   SELECT location, COUNT(*) FROM jobs
   WHERE source_slug = 'indeed' GROUP BY location LIMIT 10;
   ```

5. **Check for Marketing Jobs**:
   ```sql
   SELECT COUNT(*) FROM jobs
   WHERE source_slug = 'indeed'
   AND (title ILIKE '%marketing%' OR title ILIKE '%social media%');
   ```

---

## Part 10: Expected Results After Implementation

### Current State (22k jobs, few US)
```
Total Jobs: 22,432
US Jobs: ~500 (2%)
Marketing Jobs: ~200 (0.9%)
```

### After Indeed + FlexJobs + Marketing Feeds (Estimated)
```
Total Jobs: 75,000+ (3.3x increase)
US Jobs: ~40,000 (53%)
Marketing Jobs: ~5,000 (6.7%)
```

### Geographic Distribution Target
```
US:         50-55%
EU:         15-20%
Remote:     15-20%
Other:      10-15%
```

### By Role Category Target
```
Software/Tech:     35-40%
Marketing/Sales:   15-20%
Design/Creative:   10-15%
Admin/Support:     10-15%
Management:        8-10%
Other:             10-15%
```

---

## Part 11: Monitoring & Health Checks

### Weekly Checklist

- [ ] Check source health (Ingestion tab in admin)
- [ ] Verify no sources have consecutive failures > 3
- [ ] Monitor job count trend (should stay stable or increase)
- [ ] Check for geographic outliers (all jobs from one country?)
- [ ] Monitor freshness ratio (new vs resurfaced jobs)
- [ ] Check US job percentage (target: 50%+)
- [ ] Check marketing job percentage (target: 10-15%)

### Monthly Tasks

- [ ] Review disabled sources (fix or remove)
- [ ] Optimize cooldown times based on quality metrics
- [ ] Add 1-2 new specialized sources
- [ ] Update source trust levels based on data quality
- [ ] Archive old jobs (>90 days) to keep database clean

---

## Next Steps

1. **Run diagnostics** (use SQL queries above)
2. **Fix disabled sources** (RemoteOK, Adzuna, decide on Jobicy)
3. **Implement Indeed** (highest priority, quickest ROI)
4. **Add FlexJobs** (marketing focus)
5. **Set up RSS feeds** (ProBlogger, etc.)
6. **Test thoroughly** before enabling on schedule
7. **Monitor closely** for first 2 weeks
8. **Expand sources** based on initial results

Let me know which sources you want to prioritize and I'll help with the implementation!
