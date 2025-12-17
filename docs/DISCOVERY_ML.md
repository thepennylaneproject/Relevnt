# Phase 3 & 4: Auto-Discovery + ML Prioritization

## Overview

This document describes Phase 3 & 4 enhancements for maximum job ingestion:
- **Phase 3:** Auto-discovery from public sources + platform detection
- **Phase 4:** ML-based prioritization with hiring pattern analysis

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ Phase 3: Company Discovery Daemon (runs hourly)     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Discover New Companies                         │
│     • Y Combinator API (batches by year)           │
│     • Crunchbase API (filtered by stage)           │
│     • AngelList (tagged startups)                  │
│     → ~500-1000 new companies/week                 │
│                                                     │
│  2. Detect Job Board Platforms                     │
│     • Scan careers page HTML for Lever/Greenhouse  │
│     • Extract slugs/tokens via regex               │
│     • Batch process with concurrency control       │
│     → ~50-100 platforms/week                       │
│                                                     │
│  3. Add to Companies Registry                      │
│     • Upsert by domain (idempotent)                │
│     • Set priority_tier = 'standard'               │
│     → Ready for ingestion                          │
│                                                     │
└────────────────┬──────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Phase 4: ML Prioritization (continuous)             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Analyze Hiring Patterns:                          │
│  • Jobs posted (7d, 30d)                           │
│  • Growth momentum (week-over-week %)              │
│  • Hiring velocity (jobs/week)                     │
│  • Seasonal factors (Q4 surge, Q3 slowdown)        │
│                                                     │
│  Smart Priority Score:                             │
│  • Base score: 30% (from Phase 1)                  │
│  • Velocity: 35% (current activity)                │
│  • Momentum: 20% (accelerating/decelerating)       │
│  • Recency: 10% (freshness bonus)                  │
│  • Seasonality: 5% (market patterns)               │
│                                                     │
│  Result:                                           │
│  • High-growth companies: fetched every 6h         │
│  • Standard companies: fetched daily               │
│  • Low-velocity companies: fetched weekly          │
│                                                     │
│  Automatic Promotions/Demotions:                   │
│  • Hiring spike → promote to 'high'                │
│  • No activity for 90 days → demote to 'low'       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Phase 3: Auto-Discovery

### Data Sources

**1. Y Combinator API**
- Public, free, no auth required
- ~500 companies per batch (yearly)
- High-quality, early-stage companies
- Covered batches: S24, F23, S23, F22, S22
- **Confidence:** 95%

**2. Crunchbase API**
- Requires `CRUNCHBASE_API_KEY` environment variable
- Filters by funding stage (Series A, B, C, etc.)
- Company profile data (industry, employee count, founders)
- **Confidence:** 90%

**3. AngelList (Wellfound)**
- Public API, no auth required
- Startup-focused directory
- Tags: 'hiring', 'growth', 'remote', 'funded'
- **Confidence:** 80%

### Platform Detection

Scans careers pages for:
```
Lever indicators:
  - api.lever.co/v0/postings/{slug}
  - jobs.lever.co
  - lever- prefixed CSS classes

Greenhouse indicators:
  - boards.greenhouse.io/{board_token}
  - greenhouse.io form submissions
  - greenhouse tracking pixels
```

**Detection Flow:**
1. For each discovered company
2. Check 4 common careers URLs:
   - `https://{domain}/careers`
   - `https://{domain}/jobs`
   - `https://careers.{domain}`
   - `https://jobs.{domain}`
3. Parse HTML for platform indicators
4. Extract job board tokens/slugs
5. Store in companies registry

**Success Rate:** ~60-70% (many companies don't have public job boards)

### Usage

**Automatic (Recommended):**
```bash
# Run via Netlify scheduled function (netlify.toml)
[[functions]]
name = "discover_companies"
schedule = "0 * * * *"  # Every hour
```

**Manual Trigger:**
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/discover_companies \
  -H "X-Admin-Token: your-admin-secret"
```

**Configuration:**
```env
# Enable/disable individual sources
CRUNCHBASE_API_KEY=your-key  # Optional, enables Crunchbase
DISCOVER_MIN_FUNDING=100000   # Minimum funding for Crunchbase (future)
```

## Phase 4: ML Prioritization

### Scoring Algorithm

**Smart Priority Score = 100-point scale**

```
Score = (
  BaseScore         * 0.30 +  // From Phase 1 (priority tier, growth, velocity)
  HiringVelocity    * 0.35 +  // Jobs posted per week
  GrowthMomentum    * 0.20 +  // Week-over-week acceleration
  RecencyBonus      * 0.10 +  // Fresh syncs get bonus
  SeasonalityFactor * 0.05    // Q4 boost, Q3 penalty
)
```

### Hiring Velocity Component (0-50 points)

```typescript
// Scales weekly job posting rate to 0-50
hiringVelocity = Math.min(jobsPostedPerWeek * 5, 50)

Example:
  1 job/week   → 5 points
  5 jobs/week  → 25 points
  10 jobs/week → 50 points
```

### Growth Momentum Component (-20 to +20 points)

```typescript
// Compares this week to last week
momentum = (thisWeek - lastWeek) / lastWeek

Example:
  10 jobs → 15 jobs = +0.5 momentum = +10 points
  10 jobs → 5 jobs  = -0.5 momentum = -10 points
```

### Seasonality Factor (0.5-1.5x multiplier)

```
Q1 (Jan-Mar):  0.8x  // Moderate hiring
Q2 (Apr-Jun):  1.0x  // Baseline
Q3 (Jul-Sep):  0.7x  // Summer slowdown
Q4 (Oct-Dec):  1.3x  // Budget season surge
```

### Automatic Priority Tier Changes

```
Conditions:
  IF hiring_spike AND current_tier != 'high'
    → Promote to 'high' (fetch every 6-12 hours)

  IF momentum > 100% AND current_tier == 'low'
    → Promote to 'standard' (fetch daily)

  IF no_activity_for_90_days AND current_tier != 'low'
    → Demote to 'low' (fetch weekly)
```

### Hiring Spike Detection

```
Condition: This week > Last week * 2.0 (200% increase)
Effect: Immediate promotion, higher fetch frequency
Example: 5 jobs → 11 jobs = spike detected
```

### Forecasting

Based on historical patterns, predict future job postings:

```typescript
predictedJobs = (dailyRate * daysAhead) * seasonalFactor * momentumFactor

Example:
  10 jobs/week historically
  Forecast next 7 days
  Q4 seasonal boost (1.3x)
  Positive momentum (1.1x)
  Prediction: 10/7 * 7 * 1.3 * 1.1 = ~16 jobs
```

## Implementation Details

### New Files

**1. `company-discovery.ts` (450 lines)**
- `discoverFromYCombinator()` - YC batch scraper
- `discoverFromCrunchbase()` - Crunchbase API integration
- `discoverFromAngelList()` - AngelList scraper
- `detectPlatformsFromCareersPage()` - HTML parser
- `runCompanyDiscovery()` - Orchestrator

**2. `ml-prioritization.ts` (400 lines)**
- `calculateHiringVelocity()` - Query job history
- `calculateSmartPriorityScore()` - Weighted scoring
- `detectHiringSpikes()` - Spike detection
- `findGrowthCompanies()` - Identify accelerators
- `updateCompanyPrioritiesML()` - Auto-promote/demote
- `generateHiringForecast()` - Predict future jobs

**3. `discover_companies.ts` (280 lines)**
- `runDiscoveryDaemon()` - Main orchestrator
- `handler()` - HTTP endpoint
- Comprehensive logging

**4. Database Migrations**
- `discovery_runs` table - Audit trail
- `discovery_summary` view - Monitoring dashboard
- `company_ingestion_queue` view - ML-sorted companies

### Integration with Ingestion

Discovery populates `companies` table which is used by:
- `getCompaniesFromRegistry()` in ingest_jobs.ts
- Smart priority queue sorting
- Automatic fetch frequency selection

**Result:** No code changes needed, automatically benefits from ML prioritization.

## Monitoring & Observability

### Discovery Run Metrics

```
Discovery Run Log:
┌─────────────────────────────────┐
│ Run: discovery-1234567890000    │
│ Started: 2025-01-15T10:30:00Z   │
│ Duration: 245 seconds           │
│ Status: SUCCESS                 │
│                                 │
│ Discovered Companies:  847      │
│ Platforms Detected:    521      │
│ Companies Added:       156      │
│ Priorities Updated:    234      │
│ Growth Companies:      18       │
│                                 │
│ Sources:                        │
│ • Y Combinator: 125             │
│ • Crunchbase: 456               │
│ • AngelList: 266                │
└─────────────────────────────────┘
```

### Priority Distribution

```
Query: SELECT priority_tier, COUNT(*) FROM companies GROUP BY priority_tier

Result:
  high:     45  (5%)   - Fetched 6-12 hourly
  standard: 654 (70%)  - Fetched daily
  low:      236 (25%)  - Fetched weekly

  Total ingestion frequency:
  45 * 2-4x/day + 654 * 1x/day + 236 * 0.14x/day
  = 90-180 + 654 + 33
  = 777-867 company fetches/day
```

### Growth Companies Report

```
Top 10 companies by hiring growth:

1. TechStartup Inc (+450%, 22 jobs/week)
   - Promotion: low → standard
   - Forecast: 30 jobs next week

2. AICompany Ltd (+320%, 18 jobs/week)
   - Promotion: standard → high
   - Forecast: 24 jobs next week

...
```

## Cost Considerations

### API Calls

- **Y Combinator:** Free (~5 calls/discovery run)
- **Crunchbase:** Paid (~100-500 calls/run), requires API key
- **AngelList:** Free (~20 calls/run)
- **Careers page scan:** Free (~500-1000 HTTP requests/run)

### Compute

- **Hourly discovery daemon:** ~30 seconds
- **ML prioritization:** ~5 seconds
- **Total monthly:** ~22 hours compute

### Database

- **New companies table:** ~5 MB
- **Discovery runs audit:** ~1 MB/month
- **Total:** Minimal impact

## Configuration

### Environment Variables

```env
# Discovery enablement
ENABLE_DISCOVERY=true              # Run hourly daemon
DISCOVERY_SOURCES=yc,crunchbase,angellist

# Crunchbase (optional)
CRUNCHBASE_API_KEY=your-key        # Required for Crunchbase
CRUNCHBASE_MIN_FUNDING=100000      # Filter by funding

# ML Prioritization
ML_ENABLED=true                    # Use ML scores
ML_UPDATE_FREQUENCY_HOURS=6        # Update priorities every 6h
ML_SPIKE_THRESHOLD=2.0             # 200% growth = spike

# Monitoring
DISCOVERY_WEBHOOK_URL=             # Post results to webhook
DISCOVERY_ALERT_ON_ERROR=true      # Alert if discovery fails
```

### Netlify Configuration

```toml
# netlify.toml

[[functions]]
name = "discover_companies"
schedule = "0 * * * *"  # Every hour

[[functions]]
name = "ingest_jobs"
schedule = "*/15 * * * *"  # Every 15 minutes
```

## Troubleshooting

### Discovery Not Running
- Check Netlify scheduled functions logs
- Verify `ENABLE_DISCOVERY=true`
- Test manually: `curl -X POST /.netlify/functions/discover_companies`

### Low Platform Detection Rate
- Some companies don't have public job boards
- Some use custom job posting solutions
- Check `discovery_runs` table for detection stats

### Stale Priority Scores
- Run `updateCompanyPrioritiesML()` manually
- Check `ML_UPDATE_FREQUENCY_HOURS` setting
- Verify job history is populated

### Out of Memory
- Reduce batch size in `detectPlatformsInBatch()`
- Reduce concurrency from 5 to 3
- Increase timeout between company checks

## Future Enhancements

**Phase 5: Advanced ML**
- Deep Learning: Predict hiring cycles (LSTM)
- Anomaly detection: Unusual hiring patterns
- Classification: Company stage estimation
- Time-series forecasting: Multi-month predictions

**Phase 6: Integrations**
- Real-time notifications for hiring spikes
- Slack alerts for growth companies
- Dashboard: Live discovery and priority updates
- API: Expose rankings/forecasts to other services

## Files Modified/Created

**New Files:**
- ✅ `netlify/functions/utils/company-discovery.ts` (450 lines)
- ✅ `netlify/functions/utils/ml-prioritization.ts` (400 lines)
- ✅ `netlify/functions/discover_companies.ts` (280 lines)
- ✅ `supabase/migrations/20250110_discovery_runs_audit.sql`
- ✅ `docs/DISCOVERY_ML.md` (this file)

**Modified Files:**
- None (backwards compatible)

## Testing

### Unit Tests

```typescript
// Test discovery sources
describe('company-discovery', () => {
  test('discoverFromYCombinator returns valid companies', async () => {
    const companies = await discoverFromYCombinator()
    expect(companies.length).toBeGreaterThan(0)
    expect(companies[0]).toHaveProperty('name')
    expect(companies[0]).toHaveProperty('domain')
  })

  test('detectPlatformsFromCareersPage finds Lever', async () => {
    const result = await detectPlatformsFromCareersPage({
      name: 'Test Company',
      domain: 'example.com'
    })
    // Mocked response
    expect(result.lever_slug).toBeDefined()
  })
})

// Test ML prioritization
describe('ml-prioritization', () => {
  test('calculateSmartPriorityScore weights components correctly', () => {
    const signals = {
      jobs_posted_7d: 10,
      jobs_posted_30d: 30,
      growth_momentum: 0.5,
      seasonal_factor: 1.3
    }
    const score = calculateSmartPriorityScore(50, signals, 12)
    expect(score.final_score).toBeGreaterThan(50)
    expect(score.confidence).toBeGreaterThan(0.5)
  })
})
```

### Integration Tests

```bash
# Run discovery daemon
npm run discover

# Check results
SELECT * FROM discovery_runs ORDER BY started_at DESC LIMIT 1

# Verify companies added
SELECT COUNT(*) FROM companies WHERE discovered_via = 'careers_page'
```
