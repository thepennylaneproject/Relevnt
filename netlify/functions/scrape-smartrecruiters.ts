// netlify/functions/scrape-smartrecruiters.ts
import type { Config, Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { upsertJobs, type NormalizedJob } from './ingest_jobs'
import {
  getEligibleCompanyTargets,
  updateCompanyTargetFailure,
  updateCompanyTargetSuccess
} from './utils/ingestionRotation'

const MAX_TARGETS_PER_RUN = 10
const PAGE_LIMIT = 100

interface SmartRecruitersJob {
  id: string
  name: string
  department?: { label: string }
  location?: {
    city?: string
    region?: string
    country?: string
    remote?: boolean
  }
  typeOfEmployment?: { label: string }
  experienceLevel?: { label: string }
  releasedDate?: string
  customField?: Array<{ fieldLabel: string; valueLabel: string }>
}

interface SmartRecruitersResponse {
  content: SmartRecruitersJob[]
  totalFound: number
  offset: number
  limit: number
}

async function fetchSmartRecruitersPage(
  companySlug: string,
  offset: number
): Promise<SmartRecruitersResponse> {
  const baseUrl = `https://jobs.smartrecruiters.com/api/v1/companies/${companySlug}/jobs`
  const url = `${baseUrl}?offset=${offset}&limit=${PAGE_LIMIT}`

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Relevnt Job Aggregator'
    }
  })

  if (response.status === 404) {
    const altUrl = `https://careers.smartrecruiters.com/${companySlug}/api/jobs?offset=${offset}&limit=${PAGE_LIMIT}`
    const altResponse = await fetch(altUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Relevnt Job Aggregator'
      }
    })

    if (!altResponse.ok) {
      throw new Error(`SmartRecruiters API (alt) error: ${altResponse.status}`)
    }
    return await altResponse.json()
  }

  if (!response.ok) {
    throw new Error(`SmartRecruiters API error: ${response.status}`)
  }

  return await response.json()
}

async function scrapeSmartRecruiters(companySlug: string): Promise<NormalizedJob[]> {
  const jobs: NormalizedJob[] = []
  let offset = 0

  while (true) {
    const data = await fetchSmartRecruitersPage(companySlug, offset)

    for (const job of data.content || []) {
      const locationParts = [
        job.location?.city,
        job.location?.region,
        job.location?.country
      ].filter(Boolean)

      const locationString = locationParts.join(', ') || null
      const isRemote = job.location?.remote === true

      jobs.push({
        source_slug: 'smartrecruiters',
        external_id: `smartrecruiters-${companySlug}-${job.id}`,
        title: job.name,
        company: companySlug,
        location: locationString,
        employment_type: job.typeOfEmployment?.label || null,
        remote_type: isRemote ? 'remote' : 'onsite',
        external_url: `https://jobs.smartrecruiters.com/${companySlug}/${job.id}`,
        posted_date: job.releasedDate ? new Date(job.releasedDate).toISOString() : null,
        salary_min: null,
        salary_max: null,
        description: null,
        competitiveness_level: job.experienceLevel?.label || null,
        data_raw: job
      })
    }

    if (
      (data.content?.length || 0) < PAGE_LIMIT ||
      offset + PAGE_LIMIT >= data.totalFound
    ) {
      break
    }

    offset += PAGE_LIMIT
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  return jobs
}

async function processTargets() {
  const supabase = createAdminClient()
  const targets = await getEligibleCompanyTargets(
    supabase,
    MAX_TARGETS_PER_RUN,
    'smartrecruiters'
  )

  if (!targets.length) {
    return { processed: 0, results: [] }
  }

  const results: Array<{ target: string; jobs: number; status: string; error?: string }> = []

  for (const target of targets) {
    try {
      const jobs = await scrapeSmartRecruiters(target.company_slug)

      if (jobs.length > 0) {
        const enriched = jobs.map((j) => ({
          ...j,
          company_id: target.company_id
        }))

        const upsertResult = await upsertJobs(enriched as any)
        const inserted = upsertResult.inserted

        await updateCompanyTargetSuccess(supabase, target.id, inserted)

        results.push({
          target: target.company_slug,
          jobs: inserted,
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

    await new Promise((resolve) => setTimeout(resolve, 500))
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
    console.error('[ScrapeSmartRecruiters] Fatal error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Scraper failed' })
    }
  }
}

export const config: Config = {
  schedule: '45 * * * *'
}
