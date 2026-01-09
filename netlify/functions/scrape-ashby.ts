// netlify/functions/scrape-ashby.ts
/**
 * Ashby ATS Scraper
 *
 * Scrapes job listings from companies using Ashby ATS.
 * Ashby uses a GraphQL API at: https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams
 *
 * This function:
 * 1. Gets eligible Ashby targets from company_targets table
 * 2. Fetches jobs via Ashby's GraphQL API
 * 3. Upserts jobs to the jobs table
 * 4. Updates target metrics (success/failure, consecutive empty runs)
 */
import type { Config, Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { upsertJobs, type NormalizedJob } from './ingest_jobs'
import {
  getEligibleCompanyTargets,
  updateCompanyTargetSuccess,
  updateCompanyTargetFailure,
  type CompanyTarget
} from './utils/ingestionRotation'

const ASHBY_API_URL = 'https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams'
const MAX_TARGETS_PER_RUN = 10

interface AshbyJob {
  id: string
  title: string
  employmentType: string | null
  locationName: string | null
  isRemote: boolean
  compensationTierSummary: string | null
}

interface AshbyTeam {
  id: string
  name: string
  jobs: AshbyJob[]
}

interface AshbyResponse {
  data?: {
    jobBoard?: {
      teams?: AshbyTeam[]
    }
  }
  errors?: Array<{ message: string }>
}

async function scrapeAshby(companySlug: string): Promise<NormalizedJob[]> {
  const query = `
    query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
      jobBoard: jobBoardWithTeams(
        organizationHostedJobsPageName: $organizationHostedJobsPageName
      ) {
        teams {
          id
          name
          jobs {
            id
            title
            employmentType
            locationName
            isRemote
            compensationTierSummary
          }
        }
      }
    }
  `

  const response = await fetch(ASHBY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      operationName: 'ApiJobBoardWithTeams',
      variables: { organizationHostedJobsPageName: companySlug },
      query
    })
  })

  if (!response.ok) {
    throw new Error(`Ashby API error: ${response.status} ${response.statusText}`)
  }

  const data: AshbyResponse = await response.json()

  if (data.errors && data.errors.length > 0) {
    throw new Error(`Ashby GraphQL error: ${data.errors[0].message}`)
  }

  if (!data?.data?.jobBoard?.teams) {
    return []
  }

  const jobs: NormalizedJob[] = []
  const now = new Date().toISOString()

  for (const team of data.data.jobBoard.teams) {
    for (const job of team.jobs || []) {
      // Parse compensation if available
      let salaryMin: number | null = null
      let salaryMax: number | null = null

      if (job.compensationTierSummary) {
        // Try to parse salary from strings like "$120K - $180K" or "$150,000 - $200,000"
        const salaryMatch = job.compensationTierSummary.match(/\$?([\d,]+)K?\s*[-–]\s*\$?([\d,]+)K?/i)
        if (salaryMatch) {
          let min = parseInt(salaryMatch[1].replace(/,/g, ''), 10)
          let max = parseInt(salaryMatch[2].replace(/,/g, ''), 10)
          // If values are small (like 120), they're in K
          if (min < 1000) min *= 1000
          if (max < 1000) max *= 1000
          salaryMin = min
          salaryMax = max
        }
      }

      // Determine remote type
      let remoteType: 'remote' | 'hybrid' | 'onsite' | null = null
      if (job.isRemote) {
        remoteType = 'remote'
      } else if (job.locationName?.toLowerCase().includes('hybrid')) {
        remoteType = 'hybrid'
      } else if (job.locationName) {
        remoteType = 'onsite'
      }

      // Map employment type
      let employmentType: string | null = null
      if (job.employmentType) {
        const et = job.employmentType.toLowerCase()
        if (et.includes('full')) employmentType = 'full-time'
        else if (et.includes('part')) employmentType = 'part-time'
        else if (et.includes('contract')) employmentType = 'contract'
        else if (et.includes('intern')) employmentType = 'internship'
        else employmentType = job.employmentType
      }

      jobs.push({
        source_slug: 'ashby',
        external_id: `ashby-${companySlug}-${job.id}`,
        title: job.title,
        company: companySlug, // Will be enriched with actual company name later
        location: job.locationName,
        employment_type: employmentType,
        remote_type: remoteType,
        posted_date: now, // Ashby doesn't provide posted date
        external_url: `https://jobs.ashbyhq.com/${companySlug}/${job.id}`,
        salary_min: salaryMin,
        salary_max: salaryMax,
        description: null, // Would need separate API call per job
        data_raw: job
      })
    }
  }

  return jobs
}

export const handler: Handler = async (event) => {
  const startedAt = Date.now()
  const supabase = createAdminClient()

  console.log('[ScrapeAshby] Starting Ashby scraper')

  try {
    // Get eligible Ashby targets
    const targets = await getEligibleCompanyTargets(supabase, MAX_TARGETS_PER_RUN, 'ashby' as any)

    if (targets.length === 0) {
      console.log('[ScrapeAshby] No eligible Ashby targets found')
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No eligible targets',
          processed: 0
        })
      }
    }

    console.log(`[ScrapeAshby] Processing ${targets.length} Ashby targets`)

    const results: Array<{ target: string; jobs: number; status: string; error?: string }> = []
    let totalJobsInserted = 0

    for (const target of targets) {
      try {
        console.log(`[ScrapeAshby] Scraping ${target.company_slug}`)

        const jobs = await scrapeAshby(target.company_slug)

        if (jobs.length > 0) {
          // Enrich jobs with company_id if available
          const enrichedJobs = jobs.map(j => ({
            ...j,
            company: target.company_id ? undefined : j.company // Will be resolved by upsertJobs
          }))

          // Upsert jobs
          const upsertResult = await upsertJobs(enrichedJobs as any)
          const insertedCount = upsertResult.inserted

          console.log(`[ScrapeAshby] ${target.company_slug}: ${jobs.length} jobs fetched, ${insertedCount} inserted`)

          // Update target with success
          await updateCompanyTargetSuccess(supabase, target.id, insertedCount)

          totalJobsInserted += insertedCount
          results.push({
            target: target.company_slug,
            jobs: jobs.length,
            status: 'success'
          })
        } else {
          // No jobs found - still a success but track empty run
          await updateCompanyTargetSuccess(supabase, target.id, 0)

          results.push({
            target: target.company_slug,
            jobs: 0,
            status: 'success'
          })
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`[ScrapeAshby] ${target.company_slug} failed:`, errorMessage)

        await updateCompanyTargetFailure(supabase, target.id, errorMessage)

        results.push({
          target: target.company_slug,
          jobs: 0,
          status: 'error',
          error: errorMessage
        })
      }
    }

    const durationMs = Date.now() - startedAt
    console.log(`[ScrapeAshby] Completed: ${results.length} targets, ${totalJobsInserted} jobs inserted in ${durationMs}ms`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        durationMs,
        processed: results.length,
        totalJobsInserted,
        results
      })
    }

  } catch (err) {
    console.error('[ScrapeAshby] Fatal error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err)
      })
    }
  }
}

// Also export as background function for longer timeout
export const config: Config = {
  schedule: '30 * * * *' // Every hour at :30
}
