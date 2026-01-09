// netlify/functions/scrape-personio.ts
import type { Config, Handler } from '@netlify/functions'
import { XMLParser } from 'fast-xml-parser'
import { createAdminClient } from './utils/supabase'
import { upsertJobs, type NormalizedJob } from './ingest_jobs'
import {
  getEligibleCompanyTargets,
  updateCompanyTargetFailure,
  updateCompanyTargetSuccess
} from './utils/ingestionRotation'

const MAX_TARGETS_PER_RUN = 15

async function scrapePersonio(companySlug: string): Promise<NormalizedJob[]> {
  const jsonUrl = `https://${companySlug}.jobs.personio.com/search.json`

  try {
    const response = await fetch(jsonUrl, {
      headers: { Accept: 'application/json' }
    })

    if (response.ok) {
      const data = await response.json()
      const positions = data.positions || []
      return positions.map((position: any) => ({
        source_slug: 'personio',
        external_id: `personio-${companySlug}-${position.id}`,
        title: position.name,
        company: companySlug,
        location: position.office || null,
        employment_type: position.employmentType || position.schedule || null,
        remote_type: position.office?.toLowerCase().includes('remote') ? 'remote' : null,
        external_url: `https://${companySlug}.jobs.personio.com/job/${position.id}`,
        posted_date: position.createdAt || null,
        salary_min: null,
        salary_max: null,
        description: null,
        competitiveness_level: position.schedule || null,
        data_raw: position
      }))
    }
  } catch {
    // Fallback to XML if JSON fails
  }

  const xmlUrl = `https://${companySlug}.jobs.personio.com/xml`
  const response = await fetch(xmlUrl)

  if (!response.ok) {
    throw new Error(`Personio error: ${response.status}`)
  }

  const xmlText = await response.text()
  const parser = new XMLParser()
  const parsed = parser.parse(xmlText)
  const positions = parsed?.workzag_jobs?.position || []
  const positionArray = Array.isArray(positions) ? positions : [positions]

  return positionArray.map((position: any) => ({
    source_slug: 'personio',
    external_id: `personio-${companySlug}-${position.id}`,
    title: position.name || position.title,
    company: companySlug,
    location: position.office || position.location || null,
    employment_type: position.schedule || position.employmentType || null,
    remote_type: null,
    external_url: `https://${companySlug}.jobs.personio.com/job/${position.id}`,
    posted_date: position.createdAt || null,
    salary_min: null,
    salary_max: null,
    description: null,
    competitiveness_level: position.schedule || null,
    data_raw: position
  }))
}

async function processTargets() {
  const supabase = createAdminClient()
  const targets = await getEligibleCompanyTargets(supabase, MAX_TARGETS_PER_RUN, 'personio')

  if (!targets.length) {
    return { processed: 0, results: [] }
  }

  const results: Array<{ target: string; jobs: number; status: string; error?: string }> = []

  for (const target of targets) {
    try {
      const jobs = await scrapePersonio(target.company_slug)

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
    console.error('[ScrapePersonio] Fatal error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Scraper failed' })
    }
  }
}

export const config: Config = {
  schedule: '25 * * * *'
}
