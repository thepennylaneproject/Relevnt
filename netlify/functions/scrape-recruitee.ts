// netlify/functions/scrape-recruitee.ts
import type { Config, Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { upsertJobs, type NormalizedJob } from './ingest_jobs'
import {
  getEligibleCompanyTargets,
  updateCompanyTargetFailure,
  updateCompanyTargetSuccess
} from './utils/ingestionRotation'

const MAX_TARGETS_PER_RUN = 15

interface RecruiteeOffer {
  id: number
  slug: string
  title: string
  department: string | null
  location: string | null
  city: string | null
  country: string | null
  remote: boolean
  employment_type: string | null
  experience: string | null
  education: string | null
  published_at: string | null
  created_at: string
  careers_url: string
  min_salary: number | null
  max_salary: number | null
  salary_currency: string | null
}

interface RecruiteeResponse {
  offers: RecruiteeOffer[]
}

function buildSalaryLabel(offer: RecruiteeOffer): string | null {
  if (offer.min_salary || offer.max_salary) {
    const currency = offer.salary_currency || 'USD'
    if (offer.min_salary && offer.max_salary) {
      return `${currency} ${offer.min_salary.toLocaleString()} - ${offer.max_salary.toLocaleString()}`
    }
    if (offer.min_salary) {
      return `${currency} ${offer.min_salary.toLocaleString()}+`
    }
    return `Up to ${currency} ${offer.max_salary?.toLocaleString()}`
  }
  return null
}

async function scrapeRecruitee(companySlug: string): Promise<NormalizedJob[]> {
  const url = `https://${companySlug}.recruitee.com/api/offers`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Relevnt Job Aggregator'
    }
  })

  if (!response.ok) {
    throw new Error(`Recruitee API error: ${response.status}`)
  }

  const data: RecruiteeResponse = await response.json()
  const offers = data.offers || []

  return offers.map((offer) => {
    const locationParts = [offer.city, offer.country].filter(Boolean)
    const location = offer.location || locationParts.join(', ') || null
    const salaryLabel = buildSalaryLabel(offer)

    return {
      source_slug: 'recruitee',
      external_id: `recruitee-${companySlug}-${offer.id}`,
      title: offer.title,
      company: companySlug,
      location,
      employment_type: offer.employment_type,
      remote_type: offer.remote ? 'remote' : null,
      external_url: offer.careers_url,
      posted_date: offer.published_at || offer.created_at || null,
      salary_min: offer.min_salary,
      salary_max: offer.max_salary,
      description: null,
      competitiveness_level: salaryLabel || offer.experience || null,
      data_raw: offer
    }
  })
}

async function processTargets() {
  const supabase = createAdminClient()
  const targets = await getEligibleCompanyTargets(supabase, MAX_TARGETS_PER_RUN, 'recruitee')

  if (!targets.length) {
    return { processed: 0, results: [] }
  }

  const results: Array<{ target: string; jobs: number; status: string; error?: string }> = []

  for (const target of targets) {
    try {
      const jobs = await scrapeRecruitee(target.company_slug)

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
    console.error('[ScrapeRecruitee] Fatal error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Scraper failed' })
    }
  }
}

export const config: Config = {
  schedule: '20 * * * *'
}
