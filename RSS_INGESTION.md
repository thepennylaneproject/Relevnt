# RSS Job Ingestion Module

A generic RSS/Atom feed job ingestion module that allows Relevnt to ingest jobs from any RSS or Atom feed source.

## Overview

The RSS ingestion module provides:
- **Safe RSS/Atom parsing** with error handling that doesn't crash on malformed feeds
- **Multi-feed parallel fetching** - fetch up to 25 RSS feeds concurrently
- **HTML stripping** from descriptions for clean text
- **Automatic deduplication** by link/guid
- **Freshness filtering** using job posting dates
- **Per-feed configuration** with company/location defaults
- **Comprehensive logging** of per-feed ingest results

## Architecture

### Files

- **`netlify/functions/utils/rssParser.ts`** - RSS/Atom feed parser utility
- **`src/shared/jobSources.ts`** - RSSSource definition (includes getRSSSources helper)
- **`src/shared/sourceConfig.ts`** - RSS source configuration (sourceConfig.rss)
- **`netlify/functions/ingest_jobs.ts`** - RSS feed fetching and normalization integration
- **Tests:**
  - `netlify/functions/__tests__/rssParser.test.ts` - Parser tests
  - `netlify/functions/__tests__/rss-source.test.ts` - Normalization tests

### Data Flow

```
RSS_FEEDS_JSON env var
        ↓
getRSSSources()
        ↓
fetchFromAllRSSFeedsInParallel()
        ↓
fetchAndParseRSSFeed() [for each feed]
        ↓
parseRSSFeed() [parse XML]
        ↓
RSSSource.normalize() [standardize fields]
        ↓
filterByFreshness() [apply age cutoff]
        ↓
upsertJobs() [dedup + insert into DB]
```

## Environment Variables

### Enable/Disable

```bash
ENABLE_SOURCE_RSS=true
```
- **Type:** Boolean (string "true"/"false")
- **Default:** false (disabled by default)
- **Description:** Master switch to enable RSS ingestion
- **Required:** No (defaults to disabled)

### RSS Feeds Configuration

```bash
RSS_FEEDS_JSON='[
  {
    "name": "HackerNews Jobs",
    "feedUrl": "https://news.ycombinator.com/rss",
    "defaultCompany": null,
    "defaultLocation": null,
    "trustLevel": "medium"
  },
  {
    "name": "GitHub Jobs",
    "feedUrl": "https://jobs.github.com/positions.atom",
    "defaultCompany": null,
    "defaultLocation": null,
    "trustLevel": "medium"
  },
  {
    "name": "Company Careers Page",
    "feedUrl": "https://company.com/careers/rss",
    "defaultCompany": "Acme Corp",
    "defaultLocation": "San Francisco, CA",
    "trustLevel": "high"
  }
]'
```

- **Type:** JSON array
- **Default:** Empty array (no feeds)
- **Required:** No

#### Feed Configuration Schema

```typescript
interface RSSFeedSource {
  name: string              // Display name for logging
  feedUrl: string          // URL to RSS/Atom feed (required)
  defaultCompany?: string  // Company name to apply to all jobs from this feed
  defaultLocation?: string // Location to apply if not in feed item
  trustLevel?: 'high' | 'medium' | 'low' // For future trust-based filtering
}
```

### Pagination & Performance

```bash
RSS_MAX_FEEDS_PER_RUN=25
```
- **Type:** Integer
- **Default:** 25
- **Description:** Maximum number of RSS feeds to fetch per ingestion run
- **Notes:**
  - Feeds are fetched in parallel (Promise.all)
  - Each feed has a 10-second timeout
  - If you have more than 25 feeds, they'll be fetched in order

```bash
RSS_MAX_ITEMS_PER_FEED=50
```
- **Type:** Integer
- **Default:** 50
- **Description:** Reserved for future use - will limit items per feed
- **Current Status:** Not implemented; feeds return all available items

## How to Add a Feed

### Step 1: Identify the Feed URL

Find the RSS or Atom feed URL for your job source. Common patterns:

- **Standard RSS:** `/rss`, `/feed`, `/feed.xml`, `/feeds/jobs`
- **Standard Atom:** `/atom`, `/feed.atom`, `/feeds/jobs.atom`

Examples:
- GitHub Jobs: `https://jobs.github.com/positions.atom`
- HackerNews: `https://news.ycombinator.com/rss`
- Generic company page: `https://company.com/careers/rss`

### Step 2: Update RSS_FEEDS_JSON

Add your feed to the environment variable:

```bash
export RSS_FEEDS_JSON='[
  {
    "name": "My Job Board",
    "feedUrl": "https://jobboard.com/feed.xml",
    "defaultCompany": "Tech Corp",
    "defaultLocation": "New York, NY",
    "trustLevel": "medium"
  }
]'
```

### Step 3: Test the Feed

Use the fetch and parse utilities:

```typescript
import { fetchAndParseRSSFeed } from './netlify/functions/utils/rssParser'

const result = await fetchAndParseRSSFeed('https://jobboard.com/feed.xml')
console.log(`Parsed ${result.items.length} items`)
console.log('Errors:', result.error)
```

### Step 4: Enable RSS Ingestion

```bash
export ENABLE_SOURCE_RSS=true
```

### Step 5: Trigger Ingestion

```bash
curl -X POST http://localhost:8888/.netlify/functions/admin_ingest_trigger?source=rss
```

## Configuration Examples

### Tech Job Boards

```json
[
  {
    "name": "HackerNews Jobs",
    "feedUrl": "https://news.ycombinator.com/rss",
    "trustLevel": "medium"
  },
  {
    "name": "GitHub Jobs",
    "feedUrl": "https://jobs.github.com/positions.atom",
    "trustLevel": "medium"
  },
  {
    "name": "RemoteOK (Atom)",
    "feedUrl": "https://remoteok.io/feed.xml",
    "trustLevel": "medium"
  }
]
```

### Company Career Pages

```json
[
  {
    "name": "Stripe Careers",
    "feedUrl": "https://stripe.com/careers/feed",
    "defaultCompany": "Stripe",
    "defaultLocation": "San Francisco, CA",
    "trustLevel": "high"
  },
  {
    "name": "GitHub Careers",
    "feedUrl": "https://github.com/careers/feed",
    "defaultCompany": "GitHub",
    "trustLevel": "high"
  }
]
```

### Geographic Focus

```json
[
  {
    "name": "UK Tech Jobs",
    "feedUrl": "https://uk-tech-jobs.com/feed.xml",
    "defaultLocation": "United Kingdom",
    "trustLevel": "medium"
  },
  {
    "name": "Berlin Startups",
    "feedUrl": "https://berlin-startups.io/jobs.xml",
    "defaultLocation": "Berlin, Germany",
    "trustLevel": "medium"
  }
]
```

## Field Normalization

### RSS Item Fields → NormalizedJob

| RSS Field | Maps To | Notes |
|-----------|---------|-------|
| `title` | `title` | Required; items without title are skipped |
| `link` | `external_url` | Direct link to job listing |
| `description` \| `summary` \| `content` | `description` | HTML tags stripped |
| `pubDate` \| `published` \| `updated` | `posted_date` | ISO date format (YYYY-MM-DD) |
| `guid` \| `id` \| `link` | `external_id` | Used for deduplication (key: `rss:{value}`) |
| Feed config | `company` | Via `defaultCompany` |
| Feed config | `location` | Via `defaultLocation`; infers `remote_type` |
| (computed) | `remote_type` | Inferred from location string |

### Fields Set to Null

- `employment_type` - RSS feeds rarely include this
- `salary_min`, `salary_max` - RSS feeds rarely include structured salary
- `competitiveness_level` - No data available

## Error Handling

The RSS module is designed to **never crash the entire ingestion run** due to a single bad feed.

### Per-Feed Error Handling

- **Network timeout:** Logged as warning, continues to next feed
- **Malformed XML:** Parsed error logged, feed skipped
- **Invalid response:** HTTP error logged, continues
- **Empty feed:** Logged as info, no jobs ingested

### Example Log Output

```
ingest_jobs: fetching from 3 RSS feeds (max: 25)
ingest_jobs: fetching RSS feed: Tech Jobs (https://jobs.example.com/feed.xml)
ingest_jobs: fetching RSS feed: Company Careers (https://company.com/careers/feed)
ingest_jobs: fetching RSS feed: Bad Feed (https://badhost.invalid/feed)

ingest_jobs: got 15 items from RSS feed: Tech Jobs
ingest_jobs: got 8 items from RSS feed: Company Careers
ingest_jobs: RSS feed error for Bad Feed: Failed to fetch feed: getaddrinfo ENOTFOUND badhost.invalid

ingest_jobs: fetched 23 total items from 3 RSS feeds
ingest_jobs: normalizing 23 RSS items
ingest_jobs: upserting 22 fresh RSS jobs
ingest_jobs: finished RSS ingest: 19 inserted, 3 duplicates
```

## Deduplication

The module deduplicates jobs based on:

1. **`rss:{guid}`** - If feed provides `<guid>` or `id` attribute
2. **`rss:{link}`** - If guid missing, uses canonical feed item link
3. **`rss:{title}::{pubDate}`** - Fallback for items with neither guid nor link

Deduplication happens at two levels:

- **In-memory:** During normalization (filter duplicates within batch)
- **Database:** UPSERT on `(source_slug='rss', external_id)` constraint

## Freshness Control

RSS jobs are filtered by age before insertion:

```typescript
const maxAgeDays = sourceConfig.maxAgeDays // 30 days default
const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000)

// Skip jobs posted before cutoff
const fresh = jobs.filter(job => {
  if (!job.posted_date) return true // Accept undated items
  return new Date(job.posted_date) > cutoff
})
```

### Configuration

Edit `src/shared/sourceConfig.ts`:

```typescript
rss: {
  slug: 'rss',
  mode: 'wide-capped',
  enabled: false,
  maxAgeDays: 30,  // ← Change this
  maxPagesPerRun: 1,
  resetPaginationEachRun: true,
  trustLevel: 'medium',
  trackFreshnessRatio: true,
  notes: 'RSS/Atom feed support.',
},
```

## Testing

### Run Tests

```bash
npm run test -- rssParser.test.ts
npm run test -- rss-source.test.ts
```

### Test Coverage

#### Parser Tests (`rssParser.test.ts`)
- ✅ Parse RSS 2.0 feeds
- ✅ Parse Atom feeds
- ✅ Handle multiple items
- ✅ Handle missing optional fields
- ✅ Handle HTML content in descriptions
- ✅ Handle encoded content
- ✅ Return error for empty/invalid feeds
- ✅ Handle feeds with no items
- ✅ Extract pubDate in various formats
- ✅ Handle Buffer input
- ✅ Handle special characters and HTML entities

#### Normalization Tests (`rss-source.test.ts`)
- ✅ Normalize basic RSS items
- ✅ Use item link for dedup ID
- ✅ Use title+date as fallback ID
- ✅ Infer remote type from location
- ✅ Skip items without title
- ✅ Skip invalid items
- ✅ Handle empty input
- ✅ Strip HTML from descriptions
- ✅ Handle multiple feeds simultaneously
- ✅ Preserve raw item data

### Manual Testing

Test with a public feed:

```bash
# Set a test feed
export RSS_FEEDS_JSON='[{
  "name": "HackerNews",
  "feedUrl": "https://news.ycombinator.com/rss",
  "trustLevel": "medium"
}]'
export ENABLE_SOURCE_RSS=true

# Trigger ingestion
npm run dev

# In another terminal:
curl -X POST http://localhost:8888/.netlify/functions/admin_ingest_trigger?source=rss
```

Monitor the Netlify function logs for output.

## Logs and Metrics

The RSS module logs:

- Per-feed fetch counts and errors
- Total items fetched
- Normalization results
- Freshness filtering stats
- Upsert results (inserted, duplicates)

Example metrics in logs:

```
ingest_jobs: fetched 23 total items from 3 RSS feeds
ingest_jobs: normalized 23 → 22 fresh jobs from rss
ingest_jobs: upserted 19 jobs from rss
ingest_jobs: finished rss ingest: 19 inserted, 3 duplicates
```

## Limitations & Future Work

### Current Limitations

- **No salary extraction:** RSS feeds rarely have structured salary data
- **No employment type:** Most feeds don't provide employment type
- **No item-level trust override:** Trust level is per-feed, not per-item
- **No deduplication across sources:** An RSS item and a Lever job posting won't dedupe even if same company/title

### Future Enhancements

- **RSS_MAX_ITEMS_PER_FEED:** Implement per-feed item cap
- **Item-level trust filtering:** Parse trustLevel from feed source config
- **Salary extraction:** Regex-based salary mining from descriptions
- **Employment type inference:** Extract from title/description keywords
- **Atom entry extensions:** Support structured data in `<entry>` extensions
- **Feed validation:** Pre-flight checks for feed health
- **Retry logic:** Exponential backoff for transient failures

## Troubleshooting

### No jobs ingested

**Check:**
1. `ENABLE_SOURCE_RSS=true` is set
2. `RSS_FEEDS_JSON` is valid JSON
3. Feed URLs are correct and accessible

**Debug:**
```typescript
const feeds = getRSSSources()
console.log('Configured feeds:', feeds)

const result = await fetchAndParseRSSFeed('https://...')
console.log('Parse result:', result)
```

### Jobs filtered as stale

**Solution:** Increase `maxAgeDays` in `sourceConfig.ts`:

```typescript
rss: {
  maxAgeDays: 60, // Increased from 30
}
```

### Duplicate jobs

**Cause:** Feed item's `guid`/`link` changes between runs

**Solution:** Check feed for stable identifiers in RSS item XML

### Slow ingestion with many feeds

**Solution:** Reduce `RSS_MAX_FEEDS_PER_RUN`:

```bash
export RSS_MAX_FEEDS_PER_RUN=10
```

## Support

For issues, check:
1. Feed URL is accessible: `curl https://feed.url`
2. Feed returns valid XML
3. Netlify function logs for error messages
4. Test file examples for expected behavior

## References

- [RSS 2.0 Specification](https://www.rssboard.org/rss-specification)
- [Atom 1.0 Specification](https://tools.ietf.org/html/rfc4287)
- [Fast XML Parser](https://github.com/NaturalIntelligence/fast-xml-parser)
