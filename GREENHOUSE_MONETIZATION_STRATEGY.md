# Greenhouse Integration & Monetization Strategy

## 🎯 Strategic Goal
Transform Relevnt from a job aggregator into a **Greenhouse-powered recruiting channel** that creates mutual value:
- **For Candidates:** Better job discovery + multiple application paths + salary benchmarking
- **For Greenhouse Recruiters:** Sourced candidates with attribution + cross-company job visibility
- **For Relevnt:** Recurring revenue + data advantage + partnership leverage

---

## 📊 Three API Integration Layers

### Layer 1: Job Board API (Current ✅)
**What we have:**
- Public job postings from Greenhouse boards
- No authentication required
- Pagination via RFC-5988 Link headers
- Full job descriptions, salary ranges, requirements

**Data collected:**
- ~1,974 jobs from Greenhouse boards
- Company name, location, job title, description
- External URLs for direct posting links

---

### Layer 2: Harvest API (Premium Integration)
**What we can access (with API key):**
- Internal jobs from Greenhouse recruiting system
- More detailed job metadata (hiring manager, pipeline stage)
- Candidate applications and their status
- Interview feedback and offer details
- EEOC/demographic data (if permitted)

**Authentication:**
```
GET /v1/jobs HTTP/1.1
Authorization: Basic {Base64(HARVEST_API_KEY:)}
Host: harvest.greenhouse.io
```

**Key Endpoints:**
```
GET /v1/jobs                    → List all jobs (paginated, per_page: 1-500)
GET /v1/jobs/:id                → Specific job details
GET /v1/candidates              → List candidates
GET /v1/candidates/:id          → Candidate details + application history
GET /v1/applications            → All applications (paginated)
GET /v1/applications/:id        → Application detail + interview stage
PATCH /v1/applications/:id/move → Move application between stages
```

**Pagination Model:**
```
per_page: 500 (max per page)
Link: <...?page=2>; rel="next", <...?page=last>; rel="last"
```

**Use Case:**
```typescript
// Fetch ALL jobs from a Greenhouse organization
// Not just public boards, but internal recruiting pipeline
async function fetchAllGreenhouseJobs(apiKey: string) {
  let allJobs = []
  let nextUrl = 'https://harvest.greenhouse.io/v1/jobs?per_page=500'

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Basic ${btoa(apiKey + ':')}`
      }
    })
    const data = await response.json()
    allJobs.push(...data)

    // Follow Link header for next page
    const linkHeader = response.headers.get('link')
    nextUrl = extractNextLink(linkHeader)
  }

  return allJobs
}
```

---

### Layer 3: Candidate Ingestion API (Revenue Loop)
**What we can do:**
- Submit candidates FROM Relevnt TO Greenhouse
- Candidates appear in recruiter's pipeline with source attribution
- Greenhouse sees "quality sourced candidates"

**Authentication:**
```
POST /v1/candidates HTTP/1.1
Authorization: Basic {Base64(CANDIDATE_INGESTION_KEY:)}
```

**Endpoints:**
```
POST /v1/candidates             → Submit a new candidate/prospect
GET /v1/candidates/:id/status   → Check candidate status in recruiting pipeline
POST /v1/candidates/:id/attach  → Attach resume or documents
```

**Revenue Model:**
```
When Relevnt user applies to Greenhouse job:
1. Extract: user profile, resume, job_id
2. POST to /v1/candidates
   {
     "first_name": "Sarah",
     "last_name": "Chen",
     "email": "sarah@example.com",
     "phone": "555-1234",
     "job_id": "12345",
     "resume_url": "https://relevnt.com/resumes/sarah.pdf",
     "source": "relevnt",  // Attribution!
     "custom_fields": {
       "source_platform": "Relevnt",
       "referral_type": "matching_algorithm"
     }
   }
3. Greenhouse recruiter sees:
   ✓ New candidate Sarah Chen
   ✓ Applied to: Senior Engineer role
   ✓ Source: Relevnt (not random job board)
   ✓ Resume already attached
4. Relevnt gets credit → Partner relationship → Revenue share potential
```

---

## 💰 Revenue Model Breakdown

### Model A: Premium Subscription Tiers

**Free Tier:**
- View jobs from Greenhouse + Lever (2 sources)
- Basic deduplication
- Apply directly to company websites

**Pro Tier ($9.99/month):**
- All 14 job sources deduped
- "Apply to same role at 5 companies" feature
- Salary benchmarking across platforms
- Job alerts with cross-source tracking
- Application tracking (which companies responded)

**Enterprise Tier ($29.99/month):**
- All Pro features
- Saved search profiles
- Company salary trends
- Candidate feedback reports
- API access for resume uploads

**Revenue potential:** 10,000 active users × $9.99 = $99,900/month

---

### Model B: Greenhouse Partnership Revenue Share

**Scenario:** Greenhouse values sourced candidates

```
When Relevnt user applies via Candidate Ingestion API:
  → Greenhouse sees candidate source attribution
  → If candidate gets hired
    → Greenhouse (or employer) pays Relevnt $50-100 per hire

Example:
  - 1,000 Relevnt applications per month
  - 5% conversion to hire = 50 hires
  - $75 per hire = $3,750/month
  - Annual: $45,000
```

**Implementation:**
1. Get permission from Greenhouse customers for Candidate Ingestion
2. Track which candidates you sourced
3. Request feedback: "Who got hired from Relevnt?"
4. Build partnership proposal with data

---

### Model C: Employer Outreach Tools

**Enterprise employers** (companies posting on Greenhouse) might pay for:
- "Where else is this role being posted?" analysis
- Competitor salary benchmarking
- Talent market saturation reports
- "Best channels to source this role" analytics

**Revenue potential:** $500-2000 per employer per month

---

## 🛠️ Implementation Phases

### Phase 1: Database Setup (3 hours)

```sql
-- Track Greenhouse API access per customer
CREATE TABLE greenhouse_integrations (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE,
  organization_name TEXT,
  harvest_api_key TEXT (encrypted),
  ingestion_api_key TEXT (encrypted),
  last_synced TIMESTAMPTZ,
  synced_job_count INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track which candidates came from Relevnt
CREATE TABLE candidate_submissions (
  id UUID PRIMARY KEY,
  candidate_id UUID REFERENCES auth.users(id),
  job_id UUID REFERENCES jobs(id),
  greenhouse_job_id TEXT,  -- Job ID in Greenhouse
  greenhouse_candidate_id TEXT,  -- Response from Candidate Ingestion API
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  hired_at TIMESTAMPTZ,  -- When Greenhouse tells us they hired
  hired BOOLEAN DEFAULT false
);

-- Cross-reference jobs across sources (deduplication)
CREATE TABLE job_cross_references (
  canonical_job_id UUID PRIMARY KEY REFERENCES jobs(id),
  source_jobs JSONB,  -- {"greenhouse": "id1", "lever": "id2"}
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  location TEXT,
  salary_min INT,
  salary_max INT,
  salary_sources TEXT[],  -- Which sources reported salary
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cross_ref_company_title
  ON job_cross_references(company_name, job_title);
```

### Phase 2: Harvest API Integration (4 hours)

```typescript
// netlify/functions/sync_greenhouse_harvest.ts
export const handler: Handler = async (event) => {
  const supabase = createAdminClient()

  // Get all active Greenhouse integrations
  const { data: integrations } = await supabase
    .from('greenhouse_integrations')
    .select('*')
    .eq('is_active', true)

  for (const integration of integrations) {
    try {
      // Fetch ALL jobs from this Greenhouse organization
      const jobs = await fetchGreenhouseHarvestJobs(
        integration.harvest_api_key
      )

      // Store richer job data
      // (more detailed than public board API)

      // Compare with public board API
      // Find jobs that appear in both
      // Mark as "also available via" in cross_references

      console.log(`Synced ${jobs.length} jobs from ${integration.organization_name}`)
    } catch (err) {
      console.error(`Harvest sync failed for ${integration.organization_id}:`, err)
    }
  }

  return createResponse(200, { success: true })
}
```

### Phase 3: Candidate Submission Flow (3 hours)

```typescript
// When user applies
async function submitCandidateToGreenhouse(
  userId: string,
  jobId: string,
  sourceType: 'greenhouse' | 'lever' | 'other'
) {
  const supabase = createAdminClient()

  // Get candidate profile
  const { data: candidate } = await supabase
    .from('auth.users')
    .select('*')
    .eq('id', userId)
    .single()

  // Get job details (including Greenhouse ID)
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  // If job came from Greenhouse, submit via Candidate Ingestion
  if (sourceType === 'greenhouse' && job.greenhouse_job_id) {
    const ingestionResponse = await submitViaGreenhouseIngestion(
      candidate,
      job,
      process.env.GREENHOUSE_CANDIDATE_INGESTION_KEY
    )

    // Track submission
    await supabase
      .from('candidate_submissions')
      .insert({
        candidate_id: userId,
        job_id: jobId,
        greenhouse_job_id: job.greenhouse_job_id,
        greenhouse_candidate_id: ingestionResponse.id,
        submission_date: new Date().toISOString()
      })
  }
}

async function submitViaGreenhouseIngestion(
  candidate,
  job,
  ingestionKey: string
) {
  const response = await fetch('https://api.greenhouse.io/v1/candidates', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(ingestionKey + ':')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone,
      job_id: job.greenhouse_job_id,
      resume_url: candidate.resume_url,
      source: 'relevnt',
      custom_fields: {
        source_platform: 'Relevnt',
        application_date: new Date().toISOString()
      }
    })
  })

  return await response.json()
}
```

### Phase 4: Job Cross-Reference UI (3 hours)

```typescript
// When displaying a job, show related postings
async function getJobWithAlternatives(jobId: string) {
  const supabase = createAdminClient()

  // Get the job
  const job = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  // Find if it's part of a cross-reference group
  const crossRef = await supabase
    .from('job_cross_references')
    .select('*')
    .contains('source_jobs', { [job.source_slug]: job.external_id })
    .single()

  if (crossRef) {
    // Fetch all jobs in this group
    const alternatives = await Promise.all(
      Object.entries(crossRef.source_jobs).map(async ([source, extId]) => {
        return supabase
          .from('jobs')
          .select('*')
          .eq('source_slug', source)
          .eq('external_id', extId)
          .single()
      })
    )

    return {
      ...job,
      alternatives: alternatives.map(a => a.data),
      salary_min: crossRef.salary_min,
      salary_max: crossRef.salary_max
    }
  }

  return job
}
```

---

## 📱 UI/UX for Users

### Job Card with Multiple Apply Options
```
┌─────────────────────────────────────────┐
│ Senior Engineer - Company A             │
│ San Francisco, CA                        │
│ $180,000 - $220,000 (avg from 3 posts)  │
│                                          │
│ Apply with:                              │
│ [Apply via Greenhouse] ← Primary         │
│ [Apply via Lever]                        │
│ [Apply via LinkedIn]                     │
│                                          │
│ 💡 Pro tip: Same role, 3 applications  │
│             Max your chances!            │
└─────────────────────────────────────────┘
```

### Cross-Source Salary Benchmarking
```
Salary for "Senior Engineer" in SF:
• Company A: $180-220k (Greenhouse)
• Company B: $190-230k (Lever)
• Company C: $200-250k (LinkedIn)

Average: $190-233k
Range: $180-250k
```

### Application Status Tracking
```
Your Applications
├─ Senior Engineer @ Company A
│  ├─ Applied via Greenhouse: In Progress
│  ├─ Applied via Lever: No Response
│  └─ Applied via LinkedIn: Rejected
├─ Product Manager @ Company B
│  └─ Applied via Greenhouse: Phone Screen
└─ Data Scientist @ Company C
   └─ Applied via Greenhouse: Interview Next Week
```

---

## 🔐 Security Considerations

**API Key Management:**
- Store Harvest/Ingestion keys encrypted in database
- Use environment variables for main Relevnt Harvest key
- Rotate keys quarterly
- Log all API access
- Rate limit to 100 requests/min per API key

**Data Privacy:**
- Only access data with explicit permission
- Don't store passwords or sensitive data
- Comply with GDPR/CCPA for candidate data
- Clear data retention policies

---

## 📈 Success Metrics to Track

**Phase 1 (MVP):**
- [ ] Greenhouse Harvest API integration working
- [ ] 50+ jobs synced from Harvest vs Public Board API
- [ ] Cross-reference matching algorithm working
- [ ] Candidate submission flow tested

**Phase 2 (Growth):**
- [ ] 100 active users with "apply everywhere" feature
- [ ] 10+ applications submitted via Candidate Ingestion API
- [ ] Average salary benchmark calculated across 3+ sources
- [ ] User engagement +25% (from dedup + alternatives)

**Phase 3 (Revenue):**
- [ ] 500 Pro subscribers at $9.99/month = $4,995/month
- [ ] 1st partnership agreement with Greenhouse or customer
- [ ] 10 candidate placements with attribution
- [ ] $10k+ monthly recurring revenue target

---

## 🚀 Implementation Timeline

**Week 1:** Database schema + Harvest API integration + basic sync
**Week 2:** Candidate Ingestion API + submission flow
**Week 3:** Job cross-referencing + UI updates
**Week 4:** Testing + monitoring + documentation

---

## 📚 References

- [Harvest API Documentation](https://developers.greenhouse.io/harvest.html)
- [Candidate Ingestion API](https://developers.greenhouse.io/candidate-ingestion.html)
- [Manage API Key Permissions](https://support.greenhouse.io/hc/en-us/articles/115000521723-Manage-Harvest-API-Key-Permissions)
- [Create Harvest API Key](https://support.greenhouse.io/hc/en-us/articles/5888163769883-Create-a-Harvest-API-key-for-an-integration)

---

## 💡 Key Insight

Most job boards aggregate and display jobs. **You can be the only platform that:**

1. Shows jobs across multiple ATSs (Greenhouse + Lever + others)
2. Shows candidates ALL application paths for same role
3. Returns candidates to the source (Greenhouse sees "quality from Relevnt")
4. Creates measurable ROI for Greenhouse (hires per application)

This creates a **virtuous loop:**
- Greenhouse customers see their jobs in Relevnt
- Relevnt candidates apply through Greenhouse
- Greenhouse sees value (sourced candidates)
- Greenhouse promotes Relevnt to other customers
- More customers = more jobs = better matches
