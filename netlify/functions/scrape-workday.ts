// netlify/functions/scrape-workday.ts
import type { Config, Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { upsertJobs, type NormalizedJob } from './ingest_jobs'
import {
  getEligibleCompanyTargets,
  updateCompanyTargetFailure,
  updateCompanyTargetSuccess
} from './utils/ingestionRotation'

const MAX_TARGETS_PER_RUN = 5
const PAGE_LIMIT = 50

interface WorkdayJob {
  title: string
  externalPath: string
  locationsText: string
  postedOn: string
  bulletFields: string[]
  subtitles?: Array<{ text: string }>
}

interface WorkdayResponse {
  jobPostings: WorkdayJob[]
  total: number
}

function parseWorkdayDate(dateStr: string): string | null {
  try {
    if (dateStr.includes('30+ Days')) {
      const date = new Date()
      date.setDate(date.getDate() - 30)
      return date.toISOString()
    }
    if (dateStr.includes('Yesterday')) {
      const date = new Date()
      date.setDate(date.getDate() - 1)
      return date.toISOString()
    }
    if (dateStr.includes('Today')) {
      return new Date().toISOString()
    }
    const parsed = new Date(dateStr.replace('Posted ', ''))
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
    return null
  } catch {
    return null
  }
}

async function scrapeWorkday(tenantUrl: string, companySlug: string): Promise<NormalizedJob[]> {
  const baseUrl = tenantUrl.endsWith('/') ? tenantUrl.slice(0, -1) : tenantUrl
  const jobs: NormalizedJob[] = []
  let offset = 0

  while (true) {
    const url = `${baseUrl}/jobs`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; Relevnt/1.0)'
      },
      body: JSON.stringify({
        appliedFacets: {},
        limit: PAGE_LIMIT,
        offset,
        searchText: ''
      })
    })

    if (!response.ok) {
      throw new Error(`Workday API error: ${response.status}`)
    }

    const data: WorkdayResponse = await response.json()
    const postings = data.jobPostings || []

    if (!postings.length) {
      break
    }

    for (const job of postings) {
      const jobIdMatch = job.externalPath?.match(/\/job\/([^\/]+)/)
      const jobId = jobIdMatch ? jobIdMatch[1] : job.externalPath
      jobs.push({
        source_slug: 'workday',
        external_id: `workday-${companySlug}-${jobId}`,
        title: job.title,
        company: companySlug,
        location: job.locationsText || null,
        employment_type: null,
        remote_type: job.locationsText?.toLowerCase().includes('remote') ? 'remote' : 'onsite',
        external_url: `${baseUrl}${job.externalPath}`,
        posted_date: job.postedOn ? parseWorkdayDate(job.postedOn) : null,
        salary_min: null,
        salary_max: null,
        description: job.bulletFields?.join(' ') || null,
        competitiveness_level: null,
        data_raw: job
      })
    }

    if (postings.length < PAGE_LIMIT || offset + PAGE_LIMIT >= (data.total || postings.length)) {
      break
    }

    offset += PAGE_LIMIT
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  return jobs
}

async function processTargets() {
  const supabase = createAdminClient()
  const targets = await getEligibleCompanyTargets(
    supabase,
    MAX_TARGETS_PER_RUN,
    'workday'
  )

  if (!targets.length) {
    return { processed: 0, results: [] }
  }

  const results: Array<{ target: string; jobs: number; status: string; error?: string }> = []

  for (const target of targets) {
    try {
      if (!target.company_id) {
        throw new Error('Missing company_id for target')
      }

      const { data: company, error } = await supabase
        .from('companies')
        .select('workday_tenant_url')
        .eq('id', target.company_id)
        .maybeSingle()

      if (error) {
        throw new Error(`Failed to load company: ${error.message}`)
      }

      const tenantUrl = company?.workday_tenant_url

      if (!tenantUrl) {
        throw new Error('No workday_tenant_url configured for company')
      }

      const jobs = await scrapeWorkday(tenantUrl, target.company_slug)

      if (jobs.length > 0) {
        const enriched = jobs.map((j) => ({
          ...j,
          company_id: target.company_id
        }))
        const upsertResult = await upsertJobs(enriched as any)
        await updateCompanyTargetSuccess(supabase, target.id, upsertResult.inserted)
        results.push({
          target: target.company_slug,
          jobs: upsertResult.inserted,
          status: 'success'
        })
      } else {
        await updateCompanyTargetSuccess(supabase, target.id, 0)
        results.push({
          target: target.company_slug,
          jobs: 0,
          status: 'success'
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await updateCompanyTargetFailure(supabase, target.id, message)
      results.push({
        target: target.company_slug,
        jobs: 0,
        status: 'error',
        error: message
      })
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  return {
    processed: targets.length,
    results
  }
}

export const handler: Handler = async () => {
  try {
    const result = await processTargets()
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    }
  } catch (error) {
    console.error('[ScrapeWorkday] Fatal error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Scraper failed' })
    }
  }
}

export const config: Config = {
  schedule: '0 */2 * * *'
}
