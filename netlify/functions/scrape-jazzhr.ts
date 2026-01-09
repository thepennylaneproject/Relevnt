// netlify/functions/scrape-jazzhr.ts
import type { Config, Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { upsertJobs, type NormalizedJob } from './ingest_jobs'
import {
  getEligibleCompanyTargets,
  updateCompanyTargetFailure,
  updateCompanyTargetSuccess
} from './utils/ingestionRotation'

const MAX_TARGETS_PER_RUN = 15

interface JazzHRJob {
  id: string
  title: string
  city: string
  state: string
  country_id: string
  department: string
  description: string
  board_code: string
  hiring_lead: string
  send_to_job_boards: boolean
}

async function scrapeJazzHR(companySlug: string): Promise<NormalizedJob[]> {
  const urls = [
    `https://${companySlug}.applytojob.com/apply/jobs`,
    `https://app.jazz.co/widgets/basic/create/${companySlug}`
  ]

  const jobs: NormalizedJob[] = []

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' }
      })

      if (!response.ok) {
        continue
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        continue
      }

      const data = await response.json()
      const list = Array.isArray(data) ? data : data.jobs || []

      if (!list.length) {
        continue
      }

      for (const job of list) {
        jobs.push({
          source_slug: 'jazzhr',
          external_id: `jazzhr-${companySlug}-${job.id}`,
          title: job.title,
          company: companySlug,
          location: [job.city, job.state, job.country_id].filter(Boolean).join(', ') || null,
          employment_type: null,
          remote_type: job.title?.toLowerCase().includes('remote') ? 'remote' : null,
          external_url: `https://${companySlug}.applytojob.com/apply/${job.board_code}/${job.id}`,
          posted_date: null,
          salary_min: null,
          salary_max: null,
          description: job.description || null,
          competitiveness_level: job.department || null,
          data_raw: job
        })
      }

      if (jobs.length > 0) {
        break
      }
    } catch {
      continue
    }
  }

  return jobs
}

async function processTargets() {
  const supabase = createAdminClient()
  const targets = await getEligibleCompanyTargets(supabase, MAX_TARGETS_PER_RUN, 'jazzhr')

  if (!targets.length) {
    return { processed: 0, results: [] }
  }

  const results: Array<{ target: string; jobs: number; status: string; error?: string }> = []

  for (const target of targets) {
    try {
      const jobs = await scrapeJazzHR(target.company_slug)

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

    await new Promise((resolve) => setTimeout(resolve, 400))
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
    console.error('[ScrapeJazzHR] Fatal error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Scraper failed' })
    }
  }
}

export const config: Config = {
  schedule: '50 * * * *'
}
