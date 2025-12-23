# 🚀 Deployment Checklist - Job Posting API

## Pre-Deployment Status ✅

### Code Ready
- ✅ Parallel batch execution (4 sources per batch)
- ✅ Greenhouse full pagination (fetches ALL jobs)
- ✅ Source enable/disable admin API
- ✅ URL enrichment data storage (is_direct, ats_type, enrichment_confidence)
- ✅ All commits pushed to `claude/product-coherence-audit-VLIOX`

### Migrations Ready
- ✅ `20251222000003_job_ingestion_state.sql` - Pagination cursor tracking
- ✅ `20251223000001_add_enrichment_fields_to_jobs.sql` - Direct apply link fields

### Documentation Complete
- ✅ SOURCE_MANAGEMENT_GUIDE.md - Source troubleshooting
- ✅ GREENHOUSE_MONETIZATION_STRATEGY.md - Revenue & integration paths
- ✅ DIRECT_APPLY_LINKS_STRATEGY.md - UI implementation guide

---

## Deployment Steps

### Step 1: Merge to Main (Auto-Deploy)
```bash
git checkout main
git merge claude/product-coherence-audit-VLIOX
git push origin main
```

**What happens:**
- Netlify detects push to main
- Automatically starts build
- Supabase runs migrations (in order)
- Functions deploy with new code
- Background worker activates

**Expected deployment time:** 3-5 minutes

### Step 2: Monitor Deployment
Watch Netlify dashboard:
- Build logs
- Function deployment status
- No errors = success ✅

### Step 3: Verify Migrations Applied
```bash
# Check if tables exist (can run in Supabase SQL editor)
SELECT * FROM job_ingestion_state LIMIT 1;
SELECT COUNT(*) FROM jobs WHERE is_direct = true;
```

---

## Post-Deployment Verification

### Verify Database Migrations
```sql
-- Check enrichment columns exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'jobs' AND column_name IN ('is_direct', 'ats_type', 'enrichment_confidence');

-- Expected result: 3 rows (is_direct, ats_type, enrichment_confidence)
```

### Test Admin API
```bash
# Check source status
curl -s https://your-site.com/.netlify/functions/admin_source_config?action=status \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" | jq .

# Expected: List of all sources with health status
```

### Monitor First Ingestion Run
**Timing:** The background worker runs at 0 * * * * (top of each hour)

**Watch for:**
1. Parallel batches start (should see Batch 1, 2, 3, 4)
2. Greenhouse pagination working (page 1, 2, 3... until done)
3. All 14 sources processed
4. Total execution time: 80-120 seconds
5. Jobs added to database with is_direct flag set

**View logs in Netlify:**
- Functions → ingest_jobs_worker-background → Logs
- Filter for: `[Ingest]` to see ingestion progress

---

## Expected Results on First Run

### Job Counts (approximate)
```
Greenhouse (with pagination): 1,974+ jobs
Lever:                        76+ jobs
Remotive:                     27+ jobs
Jooble:                       ~500+ jobs
Himalayas:                    ~100+ jobs
Arbeitnow:                    ~200+ jobs
Findwork:                     ~300+ jobs
...and 7 other sources

Total: 3,500-4,500 jobs ✅
```

### Data Fields Captured
```json
{
  "id": "uuid",
  "title": "Senior Engineer",
  "company": "Acme Corp",
  "location": "San Francisco, CA",
  "external_url": "greenhouse.io/jobs/123",
  "is_direct": true,
  "ats_type": "greenhouse",
  "enrichment_confidence": 0.9,
  "salary_min": 150000,
  "salary_max": 200000,
  "seniority_level": "senior",
  "required_skills": ["TypeScript", "React", "Node.js"],
  "source_slug": "greenhouse",
  "is_active": true
}
```

### Execution Timeline
```
[Ingest] Running 16 sources in 4 parallel batches
[Ingest] Starting batch 1/4 (2 sources): greenhouse, lever
[Ingest: greenhouse] Fetching page 1
[Ingest: greenhouse] Fetching page 2
[Ingest: greenhouse] Fetching page 3
...
[Ingest: greenhouse] Reached last page at page 2 (1,974 jobs)
[Ingest: lever] Fetched 76 jobs
[Ingest] Batch 1 completed in 14,234ms with 2/2 successful

[Ingest] Starting batch 2/4 (4 sources): remotive, himalayas, arbeitnow, findwork
...
[Ingest] Batch 2 completed in 38,102ms with 4/4 successful
...
[Ingest] All batches completed in 89,456ms
[Ingest] Upserted 3,847 jobs (1,234 duplicates filtered)
```

---

## Post-Deployment Tasks

### Immediate (After verification)
- [ ] Confirm jobs in database with `SELECT COUNT(*) FROM jobs`
- [ ] Check is_direct flag set: `SELECT COUNT(*) FROM jobs WHERE is_direct = true`
- [ ] Test admin API to disable a source
- [ ] Review Netlify logs for errors

### This Week
- [ ] Update JobCard UI to show direct apply links prominently
- [ ] Add "Apply on careers page" CTA button
- [ ] Add tooltip explaining why direct apply is better

### Next Week
- [ ] Add click tracking for apply links
- [ ] Build analytics dashboard
- [ ] Monitor direct vs aggregator apply rates

---

## Rollback Plan

If something goes wrong:

```bash
# Revert to previous main
git revert HEAD
git push origin main

# OR reset to known-good state
git reset --hard <commit-hash>
git push origin main --force  # Only if necessary
```

---

## Success Criteria ✅

After deployment, you should see:

1. ✅ No deployment errors in Netlify
2. ✅ Migrations applied successfully
3. ✅ Background worker runs at next hour
4. ✅ 3,500+ jobs in database
5. ✅ `is_direct` field populated for Greenhouse/Lever jobs
6. ✅ Admin API responds to status request
7. ✅ Logs show parallel batch execution
8. ✅ Execution time under 120 seconds

---

## Contact/Support

If something fails:
- Check Netlify function logs
- Check Supabase migration status
- Verify environment variables are set
- Review SOURCE_MANAGEMENT_GUIDE.md for troubleshooting

---

## 🎉 Ready to Deploy!

```bash
git checkout main
git merge claude/product-coherence-audit-VLIOX
git push origin main
```

Then watch the magic happen! ✨
