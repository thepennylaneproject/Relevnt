# Ingestion Rotation Strategy

This document describes how the job ingestion system maximizes unique jobs ingested per day while respecting rate limits and avoiding duplicate API calls.

## Overview

The system uses three key mechanisms:

1. **24h Call Signature Tracking** - Prevents duplicate API calls within 24 hours
2. **Company Rotation** - Rotates through Greenhouse/Lever companies based on staleness
3. **Search Profile Rotation** - Rotates through different keywords/locations for aggregators

---

## 24h Call Signature Tracking

### How It Works

Every API call is tracked in the `job_ingestion_calls` table with a unique signature. Before making a call, the system checks if the same signature was used in the last 24 hours.

**Signature Format:** `source:key1=value1&key2=value2`

Example: `jooble:keywords=software engineer&location=remote`

### Files Involved

- `utils/ingestionRouting.ts` - Core tracking utilities
- `ingest_jobs.ts` - Integration via `ingestFromSource()`
- `jobspy_ingest-background.ts` - JobSpy integration

### Key Functions

```typescript
// Build deterministic signature from params
buildCallSignature(source, params);

// Check if call was made within N hours (returns true to SKIP)
hasCalledRecently(supabase, source, signature, hours);

// Record a completed call
recordCall(supabase, source, signature, resultCount);
```

---

## Company Rotation (Greenhouse/Lever)

### How It Works

Companies are selected for sync based on their `last_synced_at_*` timestamp:

- Companies not synced in 12+ hours get priority
- Ordered by `job_creation_velocity` and `growth_score`

### Database Fields

```sql
-- On companies table
last_synced_at_greenhouse TIMESTAMPTZ
last_synced_at_lever TIMESTAMPTZ
```

### After Successful Fetch

The sync timestamp is updated so the company won't be selected again for 12 hours.

---

## Search Profile Rotation (Aggregators + JobSpy)

### How It Works

Search profiles are stored in `job_search_profiles` table:

```sql
source     | keywords           | location | priority | last_run_at
-----------+--------------------+----------+----------+-------------
jooble     | software engineer  | remote   | 80       | 2026-01-07
jooble     | data scientist     | remote   | 75       | NULL
jobspy     | product manager    | remote   | 75       | 2026-01-06
```

Each profile is called at most once per 24 hours. The system selects:

1. Enabled profiles for the source
2. Where `last_run_at` is NULL or older than 24h
3. Ordered by priority (high first), then staleness

---

## Monitoring

### Unique Jobs Per Source (Last 24h)

```sql
SELECT source_slug, COUNT(*) as job_count
FROM jobs
WHERE created_at > now() - interval '24 hours'
GROUP BY source_slug
ORDER BY job_count DESC;
```

### Call History

```sql
SELECT source, COUNT(*) as calls, SUM(result_count) as total_jobs
FROM job_ingestion_calls
WHERE called_at > now() - interval '24 hours'
GROUP BY source;
```

### Companies Due for Rotation

```sql
-- Greenhouse companies not synced in 12h
SELECT name, last_synced_at_greenhouse
FROM companies
WHERE is_active = true
  AND greenhouse_board_token IS NOT NULL
  AND (last_synced_at_greenhouse IS NULL OR last_synced_at_greenhouse < now() - interval '12 hours')
ORDER BY job_creation_velocity DESC
LIMIT 50;
```

---

## Tuning

### Increase Company Coverage

Adjust in environment variables or code:

- `GREENHOUSE_MAX_BOARDS_PER_RUN` (default: 50)
- `LEVER_MAX_COMPANIES_PER_RUN` (default: 50)

### Add Search Profiles

```sql
INSERT INTO job_search_profiles (source, keywords, location, priority, enabled) VALUES
('jooble', 'machine learning', 'remote', 70, true),
('reed_uk', 'data engineer', 'UK', 70, true);
```

### Adjust Call Window

Change the hours parameter in `shouldMakeCall()` calls (default: 24).

---

## Disabled Sources

These sources are disabled due to API issues:

- `jobdatafeeds` - 403 Forbidden (subscription required)
- `theirstack` - 402 Payment Required
- `careerjet` - 403 Forbidden (IP blocked)
- `usajobs` - 401 Unauthorized
- `careeronestop` - 401 Unauthorized
- `fantastic` - 404 Not Found
- `whatjobs` - Pending API key

See `src/shared/sourceConfig.ts` for details.
