/**
 * greenhouse.scraper.ts
 *
 * Scrapes job listings from Greenhouse-hosted company career boards
 *
 * Companies using Greenhouse have URLs like: https://[company-name].greenhouse.io/jobs
 *
 * Configuration via environment variable:
 * GREENHOUSE_COMPANIES_JSON = [
 *   { "name": "company-name", "url": "https://company-name.greenhouse.io" },
 *   ...
 * ]
 */
import greenhouseCompaniesData from '../../data/jobSources/greenhouse_companies.json'

import type { NormalizedJob } from '../../shared/jobSources'

interface GreenhouseCompany {
  name: string
  url: string
}

interface GreenhouseJob {
  id: number
  title: string
  location?: {
    name?: string
  }
  department?: {
    name?: string
  }
  absolute_url?: string
  updated_at?: string
  created_at?: string
  content?: string
}

interface GreenhouseJobsResponse {
  jobs: GreenhouseJob[]
}

/**
 * Parse GREENHOUSE_COMPANIES_JSON environment variable
 */
export function getGreenhouseCompanies(): GreenhouseCompany[] {
  const companies: GreenhouseCompany[] = [...(greenhouseCompaniesData as GreenhouseCompany[])]
  const envVar = process.env.GREENHOUSE_COMPANIES_JSON

  if (envVar) {
    try {
      const parsed = JSON.parse(envVar)
      if (Array.isArray(parsed)) {
        companies.push(...parsed)
      }
    } catch (e) {
      console.error('Failed to parse GREENHOUSE_COMPANIES_JSON:', e)
    }
  }

  return companies.filter((company) => company && company.name && company.url)
}

/**
 * Fetch jobs from a single Greenhouse company board
 */
async function fetchGreenhouseJobsForCompany(company: GreenhouseCompany): Promise<GreenhouseJob[]> {
  try {
    // Greenhouse has a public API endpoint for jobs
    // URL format: https://[company].greenhouse.io/api/v1/boards/[company]/jobs
    const apiUrl = `${company.url}/api/v1/boards/${company.name}/jobs`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)',
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      console.warn(`Failed to fetch Greenhouse jobs for ${company.name}: ${response.status}`)
      return []
    }

    const data = (await response.json()) as GreenhouseJobsResponse
    return data.jobs || []
  } catch (err) {
    console.error(`Error fetching Greenhouse jobs for ${company.name}:`, err)
    return []
  }
}

/**
 * Normalize Greenhouse job to standard format
 */
function normalizeGreenhouseJob(raw: GreenhouseJob, companyName: string): NormalizedJob {
  const postedDate = raw.updated_at || raw.created_at

  return {
    source_slug: 'greenhouse',
    external_id: `greenhouse-${raw.id}`,

    title: raw.title || 'Untitled',
    company: companyName,
    location: raw.location?.name || null,
    employment_type: null, // Greenhouse doesn't provide this in API
    remote_type: raw.location?.name?.toLowerCase().includes('remote') ? 'remote' : null,

    posted_date: postedDate ? new Date(postedDate).toISOString().split('T')[0] : null,
    created_at: new Date().toISOString(),
    external_url: raw.absolute_url || null,

    salary_min: null, // Greenhouse API doesn't include salary
    salary_max: null,
    competitiveness_level: null,

    description: raw.content || null,
    data_raw: raw,
  }
}

/**
 * Scrape all Greenhouse company career boards
 */
export async function scrapeGreenhouseJobs(): Promise<NormalizedJob[]> {
  console.log('Starting Greenhouse scraper...')

  const companies = getGreenhouseCompanies()
  if (companies.length === 0) {
    console.warn('No Greenhouse companies configured')
    return []
  }

  console.log(`Scraping ${companies.length} Greenhouse companies...`)

  const allJobs: NormalizedJob[] = []
  let successCount = 0
  let failureCount = 0

  // Fetch companies in parallel but with rate limiting
  const batchSize = 5 // Process 5 companies at a time
  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(company => fetchGreenhouseJobsForCompany(company))
    )

    batchResults.forEach((jobs, index) => {
      const company = batch[index]
      if (jobs.length > 0) {
        successCount++
        console.log(`  ✓ ${company.name}: ${jobs.length} jobs`)

        const normalized = jobs.map(job => normalizeGreenhouseJob(job, company.name))
        allJobs.push(...normalized)
      } else {
        failureCount++
        console.warn(`  ✗ ${company.name}: 0 jobs (check company name/URL)`)
      }
    })

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < companies.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.log(
    `Greenhouse scraper complete: ${successCount} companies succeeded, ${failureCount} failed, ${allJobs.length} total jobs`
  )

  return allJobs
}

export default {
  scrapeGreenhouseJobs,
  getGreenhouseCompanies,
}
