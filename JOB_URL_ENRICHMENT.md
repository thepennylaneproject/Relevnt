# Job URL Enrichment: Direct Company Career Pages

## Overview

This feature detects and links directly to company career pages instead of job aggregators, removing barriers like subscriptions and account requirements.

## Architecture

### Components

1. **ATS Detector** (`netlify/functions/utils/atsDetector.ts`)
   - Detects Applicant Tracking System type (Lever, Greenhouse, Workday)
   - Builds direct URLs to company career pages
   - Pattern matching on URLs and HTML content
   - Heuristic domain inference for company websites

2. **Job URL Enricher** (`netlify/functions/utils/jobURLEnricher.ts`)
   - Enriches job postings with direct company URLs
   - Uses registry lookups for cached company info
   - Fallback to ATS detection when cache miss
   - Confidence scoring for enrichment accuracy

3. **ATS Cache** (`netlify/functions/utils/atsCache.ts`)
   - In-memory cache for ATS detection results
   - TTL-based expiration for session-level caching
   - Reduces redundant HTTP requests
   - Hit/miss tracking for performance monitoring

4. **Ingest Pipeline Integration** (`netlify/functions/ingest_jobs.ts`)
   - URL enrichment called before storing jobs
   - Happens after deduplication, before ATS metadata enrichment
   - Error handling ensures original URL fallback
   - Logging of enrichment statistics

## Database Schema

### Companies Table
```sql
ALTER TABLE companies
ADD COLUMN ats_type TEXT CHECK (ats_type IN ('lever', 'greenhouse', 'workday', 'unknown'));
ADD COLUMN careers_page_url TEXT;
ADD COLUMN ats_detected_at TIMESTAMPTZ;
```

### Jobs Table
```sql
ALTER TABLE jobs
ADD COLUMN url_enriched BOOLEAN DEFAULT FALSE;
ADD COLUMN url_enrichment_confidence DECIMAL(3,2);
ADD COLUMN url_enrichment_method TEXT;
```

## How It Works

### Step 1: URL Enrichment Detection
When a job is ingested, the enricher checks:
1. **Direct check** - Is the URL already from the company's own careers page?
2. **Registry lookup** - Do we have cached company info with careers URL?
3. **ATS detection** - Can we detect the ATS from the current URL?
4. **Domain inference** - Can we find the ATS by checking the company's domain?

### Step 2: Detection Methods

**URL Pattern Matching**
```
lever.co → Extract slug → https://[slug].lever.co/jobs
greenhouse.io → Extract token → Company careers page
```

**HTML Parsing**
- Fetches company careers page (e.g., acme.com/careers)
- Parses HTML for embedded Lever/Greenhouse/Workday tokens
- Builds direct API URLs

**Heuristic Domain Building**
```
"Acme Inc" → acme.com → Check acme.com/careers, acme.com/jobs, etc.
```

### Step 3: Caching
Results cached for the duration of the ingestion function:
- Prevents repeated detection for same company
- Negative caches also stored (no ATS found)
- ~1 hour TTL per entry

## Configuration

### Environment Variables
```bash
# None required - feature works with defaults
# Uses built-in company registry when available
```

### Opt-in Company Enrichment
Companies can be manually tagged:
```typescript
company.ats_type = 'lever'
company.careers_page_url = 'https://company.lever.co/jobs'
company.ats_detected_at = new Date().toISOString()
```

## Performance Impact

### Optimizations
- **Caching**: Reduces 90%+ of detection work within a single ingest run
- **Pattern matching first**: Fast URL parsing before HTTP requests
- **Async execution**: Non-blocking, doesn't delay job storage
- **Timeout limits**: 5s HEAD check, 10s HTML fetch

### Cost Analysis
- **Free pattern matching**: All aggregator URLs checked instantly
- **One HTTP request per company** (amortized): Cached after first detection
- **Graceful degradation**: Falls back to original URL on timeout/error

## Testing

### Manual Testing
```typescript
import { detectATS } from './netlify/functions/utils/atsDetector'
import { enrichJobURL } from './netlify/functions/utils/jobURLEnricher'

// Test ATS detection
const detected = await detectATS(
  'https://boards.greenhouse.io/example',
  'Example Corp',
  'example.com'
)

// Test URL enrichment
const enrichment = await enrichJobURL(normalizedJob)
console.log(enrichment.enriched_url) // Direct company URL
```

### Integration Testing
```bash
# Run ingest with logging
ENABLE_SOURCE_CAREERONESTOP=false npm run dev

# Monitor logs for enrichment messages:
# "ingest_jobs: enriched 5 job URLs with direct company links"
```

### Monitoring
```typescript
const cache = getATSCache()
console.log(cache.stats())
// { size: 15, hits: 42, misses: 8 }
```

## Migration Steps

1. **Run SQL migrations**:
   ```sql
   psql < netlify/functions/migrations/001_add_ats_detection_fields.sql
   psql < netlify/functions/migrations/002_add_job_url_enrichment_tracking.sql
   ```

2. **Deploy code**:
   - New modules in place
   - ingest_jobs.ts updated
   - No breaking changes to existing functionality

3. **Monitor**:
   - Watch enrichment logs
   - Check cache hit rates
   - Verify job URLs are company-direct

## Limitations & Future Work

### Current Limitations
- Only detects Lever, Greenhouse, Workday
- Single-threaded detection (could parallelize)
- No intelligent retry on timeout
- Cache doesn't persist between deploys

### Future Enhancements
1. **More ATS support**: Workday, BambooHR, iCIMS, etc.
2. **Database caching**: Store detection results for persistence
3. **ML-based ranking**: Weight confidence scores
4. **Parallel detection**: Process multiple companies concurrently
5. **Company enrichment API**: Public endpoint to detect ATS for any company

## Debugging

### Enable debug logging
```typescript
import { getATSCache } from './netlify/functions/utils/atsCache'
const cache = getATSCache()

// After enrichment run
console.log(`Cache stats:`, cache.stats())
// Check hit/miss ratio
```

### Common Issues

**URLs not being enriched**
- Check if company domain is recognized
- Verify careers page exists and is accessible
- Check cache stats for detection attempts

**Slow enrichment**
- Review HTTP timeouts (5s/10s)
- Check network connectivity to company domains
- Monitor cache hit rate (should be >80% after first page)

**Wrong URLs detected**
- Verify HTML parsing regex in detectATSFromURL
- Check company domain extraction logic
- Consider manual company registration for high-priority companies

## API Reference

### detectATS(externalUrl, company, domain)
```typescript
export async function detectATS(
  externalUrl: string | null,
  company: string | null,
  domain?: string
): Promise<DetectedATS | null>
```

**Returns**: `{ type, slug, token, careersUrl, confidence, detectionMethod }`

### enrichJobURL(job, companyRegistry)
```typescript
export async function enrichJobURL(
  job: NormalizedJob,
  companyRegistry?: Map<string, Company>
): Promise<EnrichedJobURL>
```

**Returns**: `{ original_url, enriched_url, is_direct, confidence, enrichment_method }`

## Contributing

When adding support for new ATS platforms:
1. Add pattern to `detectATSFromURL()`
2. Update `ATSType` union
3. Add test cases
4. Update this documentation
