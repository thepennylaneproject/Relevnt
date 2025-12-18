# Greenhouse & Lever Company Discovery - Implementation Guide

**Status**: Crawler ready ✅ | Company lists pending | Integration ready ✅

---

## Step 1: Run the Company Discovery Crawler

The crawler will find companies using Greenhouse and Lever, and save them to your database.

### Execute the local discovery script:

```bash
npx ts-node scripts/run-discovery-local.ts
```

### What it does:
1. Fetches companies from:
   - YC (Y Combinator companies)
   - AngelList (startup directory)
   - GitHub (tech company datasets)

2. Crawls their websites for:
   - Greenhouse board tokens (looks for `gh-board-token` in HTML)
   - Lever slugs (looks for `api.lever.co` calls)

3. Upserts discovered companies into Supabase with:
   - Company name
   - Website domain
   - Detected ATS type (greenhouse or lever)
   - ATS identifiers (board token or slug)

### Expected output:
- X companies discovered
- Y companies with Greenhouse detected
- Z companies with Lever detected
- Upserted to database

---

## Step 2: Export Companies from Supabase

Once the crawler completes, query your database for discovered companies:

```bash
# This will be created by the crawler - query companies with ATS detection

SELECT
  id,
  name,
  website_domain,
  ats_type,
  greenhouse_board_token,
  lever_slug
FROM companies
WHERE greenhouse_board_token IS NOT NULL
  OR lever_slug IS NOT NULL
ORDER BY ats_type;
```

---

## Step 3: Build Environment Variables

### For Greenhouse:

```bash
# Query: SELECT name, greenhouse_board_token FROM companies WHERE greenhouse_board_token IS NOT NULL

# Result will look like:
# [
#   { "companyName": "Shelf Engine", "boardToken": "shelfengine" },
#   { "companyName": "Stripe", "boardToken": "stripe" },
#   ...
# ]

# Set in Netlify:
GREENHOUSE_BOARDS_JSON=[{"companyName":"Shelf Engine","boardToken":"shelfengine"},{"companyName":"Stripe","boardToken":"stripe"},...ALL_100_COMPANIES...]
```

### For Lever:

```bash
# Query: SELECT name, lever_slug FROM companies WHERE lever_slug IS NOT NULL

# Result will look like:
# [
#   { "companyName": "Playys Inc", "leverSlug": "playys" },
#   { "companyName": "Adobe", "leverSlug": "adobe" },
#   ...
# ]

# Set in Netlify:
LEVER_SOURCES_JSON=[{"companyName":"Playys Inc","leverSlug":"playys"},{"companyName":"Adobe","leverSlug":"adobe"},...ALL_100_COMPANIES...]
```

---

## Step 4: Set Environment Variables in Netlify

1. Go to **Netlify Dashboard** → **Site Settings** → **Environment**
2. Add/update:
   ```
   GREENHOUSE_BOARDS_JSON=<JSON_ARRAY>
   LEVER_SOURCES_JSON=<JSON_ARRAY>
   ```
3. Save and close

---

## Step 5: Redeploy

1. Go to **Netlify** → **Deploys**
2. Click **Trigger Deploy**
3. Wait for build to complete
4. Check build logs for any errors

---

## Step 6: Test via Admin Console

Once deployed, test the sources:

1. Go to **Admin Console** → **Sources & APIs**
2. Look for "Greenhouse" and "Lever" in the source list
3. Click **▶ Trigger** next to Greenhouse
4. Wait 30 seconds
5. Go to **Ingestion** tab
6. See results - expected:
   - Greenhouse: 5,000-15,000 jobs (100 companies × 50-150 jobs each)
   - Lever: 5,000-15,000 jobs (100 companies × 50-150 jobs each)

---

## Expected Impact

### Current Jobs Per Run
- 10 integrated sources: 1,000-1,300 jobs
- Fantastic Jobs: +500-2,000 jobs
- **Subtotal**: 1,500-3,300 jobs/run

### After Greenhouse + Lever Activation
- Both sources: +10,000-30,000 jobs
- **Total**: 11,500-33,300 jobs/run
- **Daily (3 runs)**: ~35,000-100,000 jobs/day
- **Monthly**: 1,000,000+ total jobs

---

## Troubleshooting

### Crawler returns 0 companies
- Check network connectivity
- Verify GitHub API access
- Check Supabase connection string

### Greenhouse/Lever showing 0 jobs after deployment
- Verify JSON is valid (check Netlify logs)
- Check that board tokens/slugs are correct
- Manually test a few board tokens:
  ```bash
  curl "https://api.greenhouse.io/v1/boards/{boardToken}/jobs"
  curl "https://api.lever.co/v0/postings/{leverSlug}"
  ```

### Build fails after setting env vars
- Check JSON syntax (use https://jsonlint.com/)
- Ensure JSON is properly escaped
- Check Netlify logs for parsing errors

---

## Timeline

1. **Now**: Run discovery crawler (~5-10 minutes)
2. **Immediately after**: Export companies from database
3. **Within 5 minutes**: Set env vars in Netlify
4. **Within 2 minutes**: Trigger deploy
5. **After deploy**: Test via admin console

**Total time to full activation**: ~20 minutes

---

## What's Ready

✅ Discovery crawler implemented and tested
✅ Greenhouse integration code ready
✅ Lever integration code ready
✅ Admin console source management ready
✅ Job ingestion pipeline ready

**Just needs**: Company lists from crawler + env vars in Netlify

---

## Next Commands

After running the crawler:

```bash
# 1. Run discovery
npx ts-node scripts/run-discovery-local.ts

# 2. Export from database (query above)
# 3. Build JSON arrays
# 4. Set in Netlify
# 5. Redeploy
netlify deploy --prod

# 6. Test
# Go to admin console and trigger Greenhouse + Lever
```

---

**Ready to activate?** Run the discovery crawler now to find your companies!

