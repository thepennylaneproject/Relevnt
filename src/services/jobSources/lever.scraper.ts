/**
 * lever.scraper.ts
 *
 * Scrapes job listings from Lever-hosted company career boards
 *
 * Companies using Lever have URLs like: https://jobs.lever.co/[company-name]
 * or https://[company-name].lever.co
 *
 * Configuration via environment variable:
 * LEVER_COMPANIES_JSON = [
 *   { "name": "company-name", "url": "https://jobs.lever.co/company-name" },
 *   ...
 * ]
 */

import type { NormalizedJob } from '../../shared/jobSources'

interface LeverCompany {
  name: string
  url: string
}

interface LeverJob {
  id: string
  title: string
  location?: string
  team?: string
  description?: string
  posting_date?: number
  updated_at?: number
  shortlink?: string
  additional_information?: string
  commitment?: {
    title?: string
  }
}

interface LeverJobsResponse {
  postings: LeverJob[]
}

/**
 * Parse LEVER_COMPANIES_JSON environment variable
 */
export function getLeverCompanies(): LeverCompany[] {
  const envVar = process.env.LEVER_COMPANIES_JSON
  if (!envVar) {
    console.warn('LEVER_COMPANIES_JSON not set, using empty list')
    return []
  }

  try {
    const parsed = JSON.parse(envVar)
    if (!Array.isArray(parsed)) {
      console.error('LEVER_COMPANIES_JSON must be an array')
      return []
    }
    return parsed.filter((company: any) => company.name && company.url)
  } catch (err) {
    console.error('Failed to parse LEVER_COMPANIES_JSON:', err)
    return []
  }
}

/**
 * Extract company slug from URL
 * Handles both https://jobs.lever.co/slug and https://slug.lever.co formats
 */
function extractCompanySlug(url: string): string {
  try {
    const urlObj = new URL(url)

    // Format: https://jobs.lever.co/company-name
    if (urlObj.hostname === 'jobs.lever.co') {
      return urlObj.pathname.split('/').filter(Boolean)[0]
    }

    // Format: https://company-name.lever.co
    if (urlObj.hostname.endsWith('.lever.co')) {
      return urlObj.hostname.replace('.lever.co', '')
    }

    return url.split('/').pop() || ''
  } catch (err) {
    console.error(`Failed to extract company slug from ${url}:`, err)
    return ''
  }
}

/**
 * Fetch jobs from a single Lever company board
 */
async function fetchLeverJobsForCompany(company: LeverCompany): Promise<LeverJob[]> {
  try {
    const slug = extractCompanySlug(company.url)
    if (!slug) {
      console.warn(`Could not extract company slug from ${company.url}`)
      return []
    }

    // Lever has a public API endpoint for job postings
    // They also have an undocumented but stable API at: https://api.lever.co/v0/postings/[company-slug]
    const apiUrl = `https://api.lever.co/v0/postings/${slug}?limit=100`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobAggregator/1.0)',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.warn(`Failed to fetch Lever jobs for ${company.name}: ${response.status}`)
      return []
    }

    const data = (await response.json()) as LeverJobsResponse
    return data.postings || []
  } catch (err) {
    console.error(`Error fetching Lever jobs for ${company.name}:`, err)
    return []
  }
}

/**
 * Infer remote type from location string
 */
function inferRemoteType(location: string | undefined): 'remote' | 'onsite' | 'hybrid' | null {
  if (!location) return null

  const lower = location.toLowerCase()
  if (lower.includes('remote')) {
    if (lower.includes('hybrid')) return 'hybrid'
    return 'remote'
  }
  return null
}

/**
 * Parse employment type from commitment info
 */
function parseEmploymentType(commitment?: { title?: string }): string | null {
  if (!commitment?.title) return null

  const lower = commitment.title.toLowerCase()
  if (lower.includes('full-time') || lower.includes('fulltime')) return 'full_time'
  if (lower.includes('part-time') || lower.includes('parttime')) return 'part_time'
  if (lower.includes('contract')) return 'contractor'

  return commitment.title
}

/**
 * Normalize Lever job to standard format
 */
function normalizeLeverJob(raw: LeverJob, companyName: string): NormalizedJob {
  // Lever uses millisecond timestamps
  const postedDate = raw.posting_date
    ? new Date(raw.posting_date).toISOString().split('T')[0]
    : null

  return {
    source_slug: 'lever',
    external_id: `lever-${raw.id}`,

    title: raw.title || 'Untitled',
    company: companyName,
    location: raw.location || null,
    employment_type: parseEmploymentType(raw.commitment),
    remote_type: inferRemoteType(raw.location),

    posted_date: postedDate,
    created_at: new Date().toISOString(),
    external_url: raw.shortlink || null,

    salary_min: null, // Lever API doesn't include salary in public postings
    salary_max: null,
    competitiveness_level: null,

    description: raw.description || null,
    data_raw: raw,
  }
}

/**
 * Scrape all Lever company career boards
 */
export async function scrapeLeverJobs(): Promise<NormalizedJob[]> {
  console.log('Starting Lever scraper...')

  const companies = getLeverCompanies()
  if (companies.length === 0) {
    console.warn('No Lever companies configured')
    return []
  }

  console.log(`Scraping ${companies.length} Lever companies...`)

  const allJobs: NormalizedJob[] = []
  let successCount = 0
  let failureCount = 0

  // Fetch companies in parallel but with rate limiting
  const batchSize = 5 // Process 5 companies at a time
  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(company => fetchLeverJobsForCompany(company))
    )

    batchResults.forEach((jobs, index) => {
      const company = batch[index]
      if (jobs.length > 0) {
        successCount++
        console.log(`  ✓ ${company.name}: ${jobs.length} jobs`)

        const normalized = jobs.map(job => normalizeLeverJob(job, company.name))
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
    `Lever scraper complete: ${successCount} companies succeeded, ${failureCount} failed, ${allJobs.length} total jobs`
  )

  return allJobs
}

export default {
  scrapeLeverJobs,
  getLeverCompanies,
}
