# Job Sources Recommendations & Expansion Guide

## Current Sources Summary

### Active & Healthy Sources (13)
- **RemoteOK** (`remoteok`) - Remote jobs API
- **Remotive** (`remotive`) - High-quality curated remote jobs, excellent data quality
- **Himalayas** (`himalayas`) - Niche remote-focused board, low volume, high quality
- **Findwork** (`findwork`) - Developer-focused aggregator
- **CareerOneStop** (`careeronestop`) - US government-backed aggregator
- **Arbeitnow** (`arbeitnow`) - Europe + remote, good coverage
- **Jooble** (`jooble`) - Global aggregator, high volume
- **The Muse** (`themuse`) - Curated signal source, strong editorial quality
- **Reed UK** (`reed_uk`) - UK-focused jobs
- **USAJOBS** (`usajobs`) - US federal government jobs
- **TheirStack** (`theirstack`) - Tech jobs with technographic data
- **Greenhouse** (`greenhouse`) - Meta-source for company career boards
- **RSS** (`rss`) - Generic RSS/Atom feed support

### Disabled Sources (Pending Review)
- **Adzuna US** (`adzuna_us`) - Returns zero results, credentials need verification
- **Jobicy** (`jobicy`) - Dead source, adds noise
- **Lever** (`lever`) - Premium job board, disabled by default

---

## High-Priority New Sources to Add

### 1. **Stack Overflow Jobs** (HIGH PRIORITY)
**Why:** Tech-heavy platform with excellent data quality
- **Type:** API + RSS available
- **URL:** https://stackoverflow.com/jobs/feed
- **Region:** Global with strong US/EU coverage
- **Data Quality:** High (developer-focused, curated)
- **Trust Level:** High
- **Implementation Notes:**
  - Offers public RSS feed at `/jobs/feed`
  - Can also scrape job listings page
  - Jobs have programming language tags
  - Estimated: 500-2000 jobs available
- **Setup:** Add RSS feed endpoint or scrape https://stackoverflow.com/jobs

### 2. **GitHub Jobs** (HIGH PRIORITY)
**Why:** Direct access to tech company job postings
- **Type:** Archive/historical feed available (jobs API was sunset, but alternatives exist)
- **URL:** https://jobs.github.com/ (legacy) or via RSS aggregators
- **Region:** Global, strong open-source company focus
- **Data Quality:** High (direct from companies)
- **Trust Level:** High
- **Implementation Notes:**
  - Original API was deprecated but data still available via Wayback Machine or RSS
  - Alternative: Scrape job listing pages
  - Consider parsing GitHub repositories for career page links
- **Setup:** Use RSS feed or web scraping

### 3. **LinkedIn Jobs API** (HIGH PRIORITY - if access available)
**Why:** Largest job database globally
- **Type:** Official API (requires enterprise access) or unofficial scraping
- **URL:** https://www.linkedin.com/jobs/search
- **Region:** Global
- **Data Quality:** Very High
- **Trust Level:** High
- **Implementation Notes:**
  - Official API requires partnership agreement
  - Scraping is limited by terms of service but widely used
  - Offers extensive filtering options
  - Rich employment type and salary data
- **Setup:** Would require separate API integration

### 4. **Indeed Jobs API** (HIGH PRIORITY)
**Why:** Largest general job board globally
- **Type:** Official REST API available
- **URL:** https://opensource.indeedapis.com/
- **Region:** Global (country-specific endpoints)
- **Data Quality:** High
- **Trust Level:** High (official API)
- **Implementation Notes:**
  - Free API available via Indeed
  - Requires API key registration
  - Rate limits: reasonable for ingestion
  - Extensive job filtering capabilities
  - Good salary data coverage
- **Setup:**
  ```bash
  export INDEED_PUBLISHER_ID=your_publisher_id
  export INDEED_API_VERSION=2
  ```

### 5. **AngelList** (MEDIUM-HIGH PRIORITY)
**Why:** Startup job board with unique opportunities
- **Type:** Official API (v2)
- **URL:** https://api.angel.co/
- **Region:** Global, startup-focused
- **Data Quality:** High (verified startups)
- **Trust Level:** High
- **Implementation Notes:**
  - Curated startup job listings
  - Includes company funding info
  - Strong equity/salary transparency
  - API requires authentication
- **Setup:**
  ```bash
  export ANGELLIST_API_KEY=your_api_key
  ```

### 6. **WeWorkRemotely** (MEDIUM-HIGH PRIORITY)
**Why:** Quality curated remote jobs
- **Type:** RSS + Scraping
- **URL:** https://weworkremotely.com/
- **Region:** Global, remote-focused
- **Data Quality:** High (curated)
- **Trust Level:** High
- **Implementation Notes:**
  - RSS feed available at /feed
  - High signal-to-noise ratio
  - Strong design/product roles
- **Setup:** RSS feed at https://weworkremotely.com/feed

### 7. **PeoplePerHour** (MEDIUM PRIORITY)
**Why:** Freelance-to-fulltime job portal
- **Type:** Scraping or API (if available)
- **URL:** https://www.peopleperhour.com/
- **Region:** Global, UK-focused
- **Data Quality:** Medium-High
- **Trust Level:** Medium
- **Implementation Notes:**
  - Mix of freelance and full-time roles
  - Good for capturing emerging opportunities
  - May require scraping due to API limitations
- **Setup:** Web scraper implementation

### 8. **Upwork** (MEDIUM PRIORITY)
**Why:** Largest freelance platform with full-time options
- **Type:** Official API available
- **URL:** https://www.upwork.com/
- **Region:** Global
- **Data Quality:** Medium (mixed quality, high volume)
- **Trust Level:** Medium
- **Implementation Notes:**
  - Public API for job search
  - Requires OAuth
  - High volume of listings
  - Newer listings frequently
- **Setup:**
  ```bash
  export UPWORK_CLIENT_ID=your_client_id
  export UPWORK_CLIENT_SECRET=your_secret
  ```

---

## Specialized/Regional Sources (MEDIUM PRIORITY)

### Tech-Specific Job Boards
- **PyJobs** - Python developers
  - URL: https://pyjobs.github.io/
  - Type: RSS feed available
  - Region: Global

- **RustJobs** - Rust developers
  - URL: https://www.rustjobs.dev/
  - Type: RSS feed
  - Region: Global

- **GoJobs** - Go/Golang developers
  - URL: https://gojobs.dev/
  - Type: Job listings + RSS
  - Region: Global

### Regional Boards
- **Seek** (Australia/NZ)
  - URL: https://www.seek.com.au/
  - Type: Scraping
  - Data: ~100k+ jobs

- **Indeed UK** - UK-specific
  - URL: https://www.indeed.co.uk/
  - Type: Indeed API with country filter
  - Data: High volume UK jobs

- **CakeResume** (Asia)
  - URL: https://www.cakeresume.com/
  - Type: Scraping/API
  - Region: Taiwan, Hong Kong, Singapore, Japan

- **Naukri.com** (India)
  - URL: https://www.naukri.com/
  - Type: Scraping (API limited)
  - Region: India, strong tech coverage

### Niche Markets
- **Dribbble Jobs** - Design jobs
  - URL: https://dribbble.com/jobs
  - Type: RSS + API
  - Specialization: Design/Creative roles

- **Dev.to Jobs** - Developer jobs
  - URL: https://dev.to/jobs
  - Type: API (DEV API) + RSS
  - Specialization: Developer/tech roles

- **Product Hunt Makers** - Founder/indie hacker jobs
  - URL: https://www.producthunt.com/
  - Type: Scraping
  - Specialization: Startup/indie roles

- **Toptal** - High-end freelance/contract
  - URL: https://www.toptal.com/jobs
  - Type: Scraping or API
  - Specialization: Senior remote roles

- **Landing.jobs** (Europe)
  - URL: https://landing.jobs/
  - Type: Scraping + API (if available)
  - Region: Europe-focused, strong tech

- **Authentic Jobs** - Creative jobs
  - URL: https://www.authenticjobs.com/
  - Type: RSS feed
  - Specialization: Design/Creative roles

---

## Implementation Priority Matrix

### Phase 1 (Immediate - High ROI)
1. **Indeed** - Largest source, official API
2. **Stack Overflow Jobs** - Tech quality, RSS available
3. **LinkedIn Jobs** - Scale and reach (via RSS/scraping)
4. **AngelList** - Startup ecosystem, unique data

### Phase 2 (Near-term)
1. **WeWorkRemotely** - Quality remote jobs
2. **GitHub Jobs** - Preserved via alternatives
3. **Upwork** - High volume, emerging roles
4. **Regional specialization** (pick 2-3 based on target market)

### Phase 3 (Enhancement)
1. **Tech-specific boards** (PyJobs, RustJobs, GoJobs)
2. **Niche markets** (Dribbble, Dev.to, ProductHunt)
3. **Geographic expansion** (Seek, Naukri, CakeResume)

---

## Setup Instructions

### For RSS Feed Sources
1. Add new source in admin console with mode: `rss`
2. Add feed URL in endpoint_url
3. Configure:
   - max_age_days: 30 (reasonable for feeds)
   - max_pages_per_run: N/A
   - trust_level: medium (unless curated)
   - update_frequency: daily

### For API Sources (General Pattern)
1. Register for API key with service
2. Add to environment variables:
   ```bash
   export {SERVICE}_API_KEY=xxx
   export {SERVICE}_API_SECRET=xxx
   ```
3. Create service file: `src/services/jobSources/{service}.service.ts`
4. Implement normalization function
5. Add source to `job_sources.ts`
6. Test with admin trigger

### For Scraping Sources
1. Create scraper service: `src/services/jobSources/{service}.scraper.ts`
2. Use established patterns from existing scrapers
3. Implement respectful rate limiting
4. Test on staging before production
5. Monitor for changes in HTML structure

---

## Configuration Recommendations by Source Type

### High-Quality Curated Sources (Remotive, WeWorkRemotely, etc.)
```
trust_level: high
max_age_days: 30
max_pages_per_run: 5
update_frequency: daily
cooldown_minutes: 1440 (24 hours)
```

### High-Volume Aggregators (Indeed, Jooble, etc.)
```
trust_level: medium
max_age_days: 14
max_pages_per_run: 20
update_frequency: daily
cooldown_minutes: 360 (6 hours)
```

### Specialty/Tech Boards (Stack Overflow, Dribbble)
```
trust_level: high
max_age_days: 30
max_pages_per_run: 3
update_frequency: daily
cooldown_minutes: 1440
```

### Regional Sources
```
trust_level: medium
max_age_days: 20
max_pages_per_run: 15
update_frequency: daily
cooldown_minutes: 480 (8 hours)
```

---

## Monitoring & Health Checks

Once sources are added, monitor:
- **Insertion rate:** Should increase proportionally
- **Freshness ratio:** Jobs should be new, not recycled
- **Error rate:** Monitor consecutive failures
- **Coverage:** Regional/tech distribution
- **Deduplication rate:** High duplicates = low quality

Use the admin console **Ingestion** tab to view:
- Source health status
- Last successful run
- Jobs inserted per run
- Error messages and patterns

---

## Notes on API Key Management

- Store all API keys in environment variables, never in code
- Use staging/development keys for testing
- Rotate keys regularly
- Monitor usage against rate limits
- Set up alerts for auth failures

## Testing New Sources

1. Add source to admin console
2. Enable "Test Connection" feature in Sources tab
3. Trigger single ingestion run
4. Check admin logs for errors
5. Verify job count increased
6. Check sample jobs for correct normalization
7. Monitor for 24 hours before enabling scheduled runs
