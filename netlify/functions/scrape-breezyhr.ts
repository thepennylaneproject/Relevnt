// netlify/functions/scrape-breezyhr.ts
import type { Config, Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { upsertJobs, type NormalizedJob } from './ingest_jobs'
import {
  getEligibleCompanyTargets,
  updateCompanyTargetFailure,
  updateCompanyTargetSuccess
} from './utils/ingestionRotation'

const MAX_TARGETS_PER_RUN = 15

interface BreezyPosition {
  id: string
  name: string
  department: string | null
  location: {
    name: string | null
    city: string | null
    state: string | null
    country: string | null
    is_remote: boolean
  }
  type: { name: string } | null
  experience: { name: string } | null
  education: { name: string } | null
  published_date: string
  friendly_id: string
}

async function scrapeBreezyHR(companySlug: string): Promise<NormalizedJob[]> {
  const url = `https://${companySlug}.breezy.hr/json`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Relevnt Job Aggregator'
    }
  })

  if (!response.ok) {
    throw new Error(`BreezyHR API error: ${response.status}`)
  }

  const positions: BreezyPosition[] = await response.json()
  return positions.map((position) => {
    const loc = position.location
    const locationParts = [loc?.city, loc?.state, loc?.country].filter(Boolean)
    const location = loc?.name || locationParts.join(', ') || null

    return {
      source_slug: 'breezyhr',
      external_id: `breezyhr-${companySlug}-${position.id}`,
      title: position.name,
      company: companySlug,
      location,
      employment_type: position.type?.name || null,
      remote_type: loc?.is_remote ? 'remote' : null,
      external_url: `https://${companySlug}.breezy.hr/p/${position.friendly_id}`,
      posted_date: position.published_date,
      salary_min: null,
      salary_max: null,
      description: null,
      competitiveness_level: position.experience?.name || null,
      data_raw: position
    }
  })
}

async function processTargets() {
  const supabase = createAdminClient()
  const targets = await getEligibleCompanyTargets(supabase, MAX_TARGETS_PER_RUN, 'breezyhr')

  if (!targets.length) {
    return { processed: 0, results: [] }
  }

  const results: Array<{ target: string; jobs: number; status: string; error?: string }> = []

  for (const target of targets) {
    try {
      const jobs = await scrapeBreezyHR(target.company_slug)

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

    await new Promise((resolve) => setTimeout(resolve, 300))
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
    console.error('[ScrapeBreezyHR] Fatal error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Scraper failed' })
    }
  }
}

export const config: Config = {
  schedule: '35 * * * *'
}
