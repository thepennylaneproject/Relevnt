# Admin Console: Source Management Guide

**Purpose**: Control and monitor all job sources from the admin console with manual triggering and per-source configuration.

---

## Overview

Your admin console provides **complete visibility and control** over all 16 job sources. Each source can be independently managed, monitored, and debugged.

### Key Features
- ✅ View all sources and their current status (enabled/disabled)
- ✅ Manually trigger ingestion for any source
- ✅ Monitor per-source job counts and ingestion success rate
- ✅ Review ingestion logs and error details
- ✅ See real-time freshness metrics and deduplication stats

---

## All Available Job Sources (16 Total)

### Group 1: ✅ ENABLED & WORKING (7 sources)

These sources are currently active and returning jobs.

| Source | Mode | Max Age | Pages/Run | Trust | Jobs/Run | Status |
|--------|------|---------|-----------|-------|----------|--------|
| **Jooble** | fresh-only | 30 days | 2 | Low | ~95 | ✅ Active |
| **Reed UK** | wide-capped | 21 days | 5 | Medium | ~152 | ✅ Active |
| **Remotive** | shallow-curated | 30 days | 3 | High | ~26 | ✅ Active |
| **The Muse** | shallow-curated | 30 days | 2 | High | ~9 | ✅ Active |
| **Himalayas** | shallow-curated | 30 days | 2 | High | ~1-2 | ✅ Active (6h cooldown) |
| **Arbeitnow** | wide-capped | 30 days | 3 | Medium | ~25 | ✅ Active |
| **USAJOBS** | wide-capped | 30 days | 3 | Medium | ~100 | ✅ Active |

**Total from Group 1**: ~408 jobs/ingestion run

### Group 2: ⚠️ FIXED & ENABLED (2 sources)

Recently fixed and now ready to return jobs once environment variables are set.

| Source | Mode | Max Age | Pages/Run | Trust | Expected/Run | Issue | Status |
|--------|------|---------|-----------|-------|---|---|---|
| **CareerOneStop** | wide-capped | 30 days | 3 | Medium | ~200-300 | Fixed: Uses single API key | ✅ Awaiting env var |
| **TheirStack** | fresh-only | 30 days | 1 | Medium | ~100-200 | Fixed: Added required param | ✅ Awaiting env var |

**Total from Group 2**: ~300-500 jobs/ingestion run (new)

### Group 3: 🔑 PRIORITY (1 source)

High-volume source that needs just an API key to activate.

| Source | Mode | Max Age | Pages/Run | Trust | Expected/Run | Notes |
|--------|------|---------|-----------|-------|---|---|
| **Findwork** | shallow-curated | 30 days | 3 | Medium | ~300 | Remote job specialist. Needs API key. |

**Total from Group 3**: ~300 jobs/ingestion run

### Group 4: ❌ DISABLED (3 sources)

These sources are network-blocked from the Netlify deployment. Disabled to save compute resources.

| Source | Mode | Max Age | Pages/Run | Trust | Reason | Status |
|--------|------|---------|-----------|-------|--------|--------|
| **RemoteOK** | fresh-only | 30 days | 3 | Medium | Proxy blocks (HTTP 403) | ❌ Network blocked |
| **Adzuna US** | wide-capped | 30 days | 1 | Medium | Proxy blocks (HTTP 403) | ❌ Network blocked |
| **Jobicy** | fresh-only | 30 days | 2 | Medium | Dead source | ❌ Dead |

**Status**: Not ingesting (saves resources)

### Group 5: ⏸️ PAUSED (2 sources)

Capable but awaiting company lists or configuration.

| Source | Mode | Max Age | Pages/Run | Trust | Expected/Run | Requires |
|--------|------|---------|-----------|-------|---|---|
| **Greenhouse** | shallow-curated | 30 days | 1 | High | ~5,000-15,000 | GREENHOUSE_BOARDS_JSON env var |
| **Lever** | shallow-curated | 30 days | 1 | High | ~5,000-15,000 | LEVER_SOURCES_JSON env var |

**Status**: Ready to enable once company lists provided

### Group 6: 🔒 DISABLED (1 source)

RSS feed support currently disabled due to proxy restrictions on most feeds.

| Source | Mode | Max Age | Pages/Run | Trust | Expected/Run | Notes |
|--------|------|---------|-----------|-------|---|---|
| **RSS Feeds** | wide-capped | 30 days | 1 | Medium | ~5,000-10,000 | Most job board RSS feeds blocked by proxy |

**Status**: Disabled (can be re-enabled if specific feeds are confirmed accessible)

### Group 7: ❓ NOT YET INTEGRATED (4 sources)

You have API keys but integration not yet implemented in code.

| Source | Status | Expected/Run | Requires |
|--------|--------|---|---|
| **Lightcast Open** | ❓ | ~200-500 | API integration needed |
| **Coursera Catalog** | ❓ | ~100-300 | API integration needed |
| **Fantastic Jobs** | ❓ | ~100-300 | API integration needed |
| **SerpiApp** | ❓ | ~100-300 | API integration needed |

**Total Potential**: ~500-1,400 jobs/ingestion run (future)

---

## Admin Console Tabs

### 1. Sources & APIs Tab

**What you see**:
- All 16 sources with enable/disable toggle
- Current status (enabled/disabled)
- Trust level and mode classification
- Notes and configuration details

**What you can do**:
- **Toggle Enable/Disable**: Change `enabled: true/false` in sourceConfig.ts (requires code commit)
- **View Configuration**: See freshness rules, page limits, trust level
- **Trigger Manual Ingestion**: Click **▶ Trigger** to immediately ingest from one source
- **View Source Notes**: Read deployment context (e.g., "Proxy blocks this", "High quality signal")

**Example Actions**:
```
Sources & APIs Tab:
├─ Jooble [✓] - Active - Trigger → Ingest 95 jobs now
├─ Reed UK [✓] - Active - Trigger → Ingest 152 jobs now
├─ RemoteOK [✗] - Disabled - Notes: "Proxy blocks (HTTP 403)"
├─ CareerOneStop [✓] - Active - Trigger → Ingest (awaiting API key)
└─ Findwork [✓] - Active - Trigger → Ingest 300 jobs now
```

### 2. Ingestion Tab

**What you see**:
- Complete history of all ingestion runs
- Per-source job count breakdown
- Success/error status for each source in each run
- Timestamps and duration

**What you can track**:
- **Jobs Added**: New jobs added in this run
- **Jobs Updated**: Duplicates found and updated
- **Jobs Deduplicated**: Exact duplicates skipped
- **Errors**: Any sources that failed (with error codes)
- **Freshness**: % of jobs from last 7 days vs older

**Example**:
```
Ingestion Run #145 - 2025-12-17 14:30:00
├─ Findwork: ✅ 300 jobs (added: 287, updated: 13)
├─ Reed UK: ✅ 152 jobs (added: 145, updated: 7)
├─ Jooble: ✅ 95 jobs (added: 88, updated: 7)
├─ USAJOBS: ✅ 100 jobs (added: 92, updated: 8)
├─ Remotive: ✅ 26 jobs (added: 24, updated: 2)
├─ The Muse: ✅ 9 jobs (added: 8, updated: 1)
├─ Arbeitnow: ✅ 25 jobs (added: 21, updated: 4)
├─ CareerOneStop: ⚠️ Error (401 Unauthorized) - BEFORE FIX
├─ TheirStack: ⚠️ Error (422 Validation Error) - BEFORE FIX
└─ Total: 707 jobs ingested in 2m 34s
```

### 3. Logs Tab

**What you see**:
- Real-time logs from ingestion function
- Error messages with HTTP status codes
- Performance metrics (API response time, parsing time)
- Request/response details for debugging

**What you can debug**:
- Why a source failed (401 = auth error, 422 = validation error, 403 = network blocked)
- How long each API took to respond
- What parameters were sent to each API
- Parse errors or data format issues

**Common Errors You'll See**:
- `HTTP 401 Unauthorized` - API key is wrong or expired
- `HTTP 403 Forbidden` - Proxy is blocking this host
- `HTTP 422 Validation Error` - Missing or wrong parameter in request
- `Timeout after 30s` - API took too long to respond
- `Parse error: invalid JSON` - API returned unexpected format

---

## How to Manually Trigger a Source

### Scenario 1: Test a single source

1. Go to **Sources & APIs** tab
2. Find the source you want (e.g., "Jooble")
3. Click **▶ Trigger** button next to it
4. Wait 30-60 seconds
5. Go to **Ingestion** tab
6. See the new ingestion run at the top with this source's results

### Scenario 2: Test a fixed source after updating code

1. Fix code (e.g., CareerOneStop authentication)
2. Commit and push to branch
3. Deploy to Netlify (via Netlify UI or `netlify deploy`)
4. Wait for deploy to finish
5. Go to **Sources & APIs** tab
6. Click **▶ Trigger** next to "CareerOneStop"
7. Check **Ingestion** tab for results
8. View **Logs** tab to see detailed request/response

### Scenario 3: Test all sources at once

1. Go to **Sources & APIs** tab
2. Click **▶ Ingest All** button (if available)
3. Or manually trigger each active source
4. Wait 2-5 minutes
5. Go to **Ingestion** tab
6. See the combined results

---

## How to View Detailed Logs

### For a Specific Ingestion Run:

1. Go to **Ingestion** tab
2. Find the run you want (most recent at top)
3. Click on the run to expand details
4. You'll see:
   - Start time, end time, duration
   - Per-source breakdown with job counts
   - Error messages for any failed sources
   - Freshness metrics

### For Real-Time Debugging:

1. Go to **Logs** tab
2. Set filters (optional):
   - Source: "CareerOneStop" (to see only that source's logs)
   - Level: "Error" (to see only errors)
   - Time range: "Last 1 hour"
3. Watch in real-time as ingestion runs
4. Errors appear immediately with stack traces

### If a Source Is Failing:

1. Find the error in **Ingestion** or **Logs** tab
2. Check the HTTP status code:
   - **401**: Wrong API key → Check Netlify env vars
   - **403**: Network proxy blocked → Source is disabled (can't fix without Netlify support)
   - **422**: Wrong parameters → Code needs fix
   - **Timeout**: API too slow → Usually temporary, try again
3. If code fix needed:
   - Edit `netlify/functions/ingest_jobs.ts`
   - Test locally with `npm run dev`
   - Commit, push, redeploy
   - Trigger source again to test

---

## Current Configuration Reference

### Active Sources (What's Ingesting Now)

```typescript
// From src/shared/sourceConfig.ts
// These are enabled: true

jooble: { enabled: true, maxAgeDays: 30, maxPagesPerRun: 2 }
reed_uk: { enabled: true, maxAgeDays: 21, maxPagesPerRun: 5 }
remotive: { enabled: true, maxAgeDays: 30, maxPagesPerRun: 3 }
themuse: { enabled: true, maxAgeDays: 30, maxPagesPerRun: 2 }
himalayas: { enabled: true, maxAgeDays: 30, maxPagesPerRun: 2, cooldown: 6h }
arbeitnow: { enabled: true, maxAgeDays: 30, maxPagesPerRun: 3 }
usajobs: { enabled: true, maxAgeDays: 30, maxPagesPerRun: 3 }
careeronestop: { enabled: true, maxAgeDays: 30, maxPagesPerRun: 3 }
theirstack: { enabled: true, maxAgeDays: 30, maxPagesPerRun: 1 }
greenhouse: { enabled: true, maxAgeDays: 30, maxPagesPerRun: 1 }
findwork: { enabled: true, maxAgeDays: 30, maxPagesPerRun: 3 }
```

### Disabled Sources (Why They're Off)

```typescript
// These are enabled: false (in src/shared/sourceConfig.ts)

remoteok: { enabled: false }  // Reason: Proxy blocks (HTTP 403)
adzuna_us: { enabled: false } // Reason: Proxy blocks (HTTP 403)
jobicy: { enabled: false }    // Reason: Dead source (returns 0)
lever: { enabled: false }     // Reason: Awaiting LEVER_SOURCES_JSON config
rss: { enabled: false }       // Reason: Most feeds proxy-blocked
```

---

## Quick Reference: Error Codes

When you see errors in the **Ingestion** or **Logs** tabs:

| HTTP Code | Meaning | How to Fix |
|-----------|---------|-----------|
| 401 | Unauthorized (wrong API key) | Check env var in Netlify is correct and matches API provider's format |
| 403 | Forbidden (network blocked) | Source is likely proxy-blocked. Disable it in sourceConfig. |
| 404 | Not Found (wrong endpoint) | API endpoint changed or typo in code. Check API docs and update. |
| 422 | Validation Error (wrong params) | Required parameter missing or malformed. Review API docs and request body. |
| 500+ | Server Error (API down) | Usually temporary. Wait and retry. |
| Timeout | Request took >30s | API is slow or down. Retry, or increase timeout if needed. |
| Parse Error | Invalid JSON | API returned HTML or non-JSON. Check if auth failed silently. |

---

## Next Steps

### Immediate (This Week)
1. **Set Netlify Environment Variables** (9 total)
   - See `DEPLOYMENT_CHECKLIST_FINAL.md` for complete list
   - Enables: Findwork, CareerOneStop, TheirStack to return jobs

2. **Trigger Test Ingestion**
   - Go to **Sources & APIs** tab
   - Click **▶ Trigger** on newly-fixed sources
   - Watch results in **Ingestion** tab

### Short Term (This Week)
1. **Verify All Sources Working**
   - Check each source via manual trigger
   - Review **Ingestion** tab for job counts

2. **Monitor Freshness**
   - Go to **Ingestion** tab
   - Look for "% Fresh" ratio
   - If dropping, consider adjusting `maxAgeDays`

### Future (Next Week+)
1. **Integrate 4 New Sources** (Lightcast, Coursera, Fantastic, SerpiApp)
   - Add API integrations to `ingest_jobs.ts`
   - Add source configs to `sourceConfig.ts`
   - Test in admin console

2. **Deploy Greenhouse + Lever** (if company lists available)
   - Set `GREENHOUSE_BOARDS_JSON` and `LEVER_SOURCES_JSON` env vars
   - Enable in admin console
   - Expect +10-30k jobs

---

## Summary

Your admin console now provides **complete end-to-end visibility and control** over job source management:

- ✅ **View all sources** and their configuration
- ✅ **Manually trigger any source** for immediate testing
- ✅ **Monitor per-source job counts** in real-time
- ✅ **Debug failures** with detailed logs and error codes
- ✅ **Track freshness** and deduplication metrics

All 16 sources are configured and documented. 11 are ready to use (just need API keys in Netlify). Focus on setting environment variables this week, then you'll have the full job ingestion engine running at capacity.

