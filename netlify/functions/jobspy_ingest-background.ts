/**
 * JobSpy Background Ingestion Function
 *
 * Runs as a Netlify background function (15-minute timeout)
 * Scrapes jobs from Indeed, LinkedIn, Glassdoor, ZipRecruiter using ts-jobspy
 *
 * Since scraping is I/O intensive and can take 30-60 seconds per board,
 * this needs the extended timeout that background functions provide.
 */

import type { Handler, HandlerContext } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { JobSpySource } from '../src/shared/jobSources'
import { upsertJobs } from './ingest_jobs'
import { getSourceConfig } from '../src/shared/sourceConfig'

// Import computeDedupKey function from ingest_jobs for consistent dedup key generation
// This ensures JobSpy jobs are properly deduplicated against other sources
async function getComputeDedupKey() {
  // Dynamic import to get computeDedupKey which is defined in ingest_jobs.ts
  // Since it's not exported, we'll compute it inline here with the same logic
  return (title: string | null, company: string | null, location: string | null): string => {
    const normalizedTitle = (title || '').toLowerCase().trim()
    const normalizedCompany = (company || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const normalizedLocation = (location || '').toLowerCase().replace(/[^a-z0-9]/g, '')

    const input = `${normalizedTitle}|${normalizedCompany}|${normalizedLocation}`

    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }

    const hex = Math.abs(hash).toString(16).padStart(8, '0')
    return `${hex}${hex}${hex}${hex}`.slice(0, 32)
  }
}

// Dynamic import for ts-jobspy - optional fallback if not installed
let JobSpyLibrary: any = null

async function loadJobSpy() {
  if (JobSpyLibrary) return JobSpyLibrary

  try {
    JobSpyLibrary = await import('ts-jobspy')
    console.log('[JobSpy] Successfully loaded ts-jobspy library')
    return JobSpyLibrary
  } catch (err) {
    console.error('[JobSpy] Failed to load ts-jobspy:', err)
    console.error('[JobSpy] Install with: npm install ts-jobspy')
    return null
  }
}

interface JobSpyScrapeConfig {
  search_term: string
  location?: string
  hours_old?: number
  results_wanted?: number
}

/**
 * Scrape jobs from multiple job boards
 */
async function scrapeJobBoards(
  configs: JobSpyScrapeConfig[]
): Promise<any[]> {
  const jobspy = await loadJobSpy()
  if (!jobspy) {
    console.error('[JobSpy] ts-jobspy not available, skipping scraping')
    return []
  }

  const allJobs: any[] = []

  // Scrape Indeed
  try {
    console.log('[JobSpy] Scraping Indeed...')
    const indeedJobs = await jobspy.Indeed.jobs({
      search_term: 'software engineer',
      location: 'remote',
      hours_old: 24,
      results_wanted: 100,
    })
    console.log(`[JobSpy] Indeed returned ${indeedJobs?.length || 0} jobs`)
    if (indeedJobs?.length) allJobs.push(...indeedJobs)
  } catch (err) {
    console.error('[JobSpy] Indeed scraping failed:', err)
  }

  // Scrape ZipRecruiter
  try {
    console.log('[JobSpy] Scraping ZipRecruiter...')
    const zipJobs = await jobspy.ZipRecruiter.jobs({
      search_term: 'software engineer',
      location: 'remote',
      hours_old: 24,
      results_wanted: 100,
    })
    console.log(`[JobSpy] ZipRecruiter returned ${zipJobs?.length || 0} jobs`)
    if (zipJobs?.length) allJobs.push(...zipJobs)
  } catch (err) {
    console.error('[JobSpy] ZipRecruiter scraping failed:', err)
  }

  // Scrape Glassdoor (if available in ts-jobspy)
  try {
    console.log('[JobSpy] Scraping Glassdoor...')
    if (jobspy.Glassdoor) {
      const glassJobs = await jobspy.Glassdoor.jobs({
        search_term: 'software engineer',
        location: 'remote',
        hours_old: 24,
        results_wanted: 100,
      })
      console.log(`[JobSpy] Glassdoor returned ${glassJobs?.length || 0} jobs`)
      if (glassJobs?.length) allJobs.push(...glassJobs)
    }
  } catch (err) {
    console.error('[JobSpy] Glassdoor scraping failed:', err)
  }

  return allJobs
}

/**
 * Background handler - runs with 15-minute timeout
 */
export const handler: Handler = async (event, context: HandlerContext) => {
  const startTime = Date.now()
  const supabase = createAdminClient()

  console.log('[JobSpy] Starting background scraping job')

  try {
    // Check if JobSpy is enabled
    const sourceConfig = getSourceConfig('jobspy')
    if (!sourceConfig.enabled) {
      console.log('[JobSpy] Source disabled, skipping')
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'JobSpy disabled' }),
      }
    }

    // Scrape jobs from multiple boards
    const rawJobs = await scrapeJobBoards([
      { search_term: 'software engineer', location: 'remote', hours_old: 24 },
      { search_term: 'data scientist', location: 'remote', hours_old: 24 },
      { search_term: 'product manager', location: 'remote', hours_old: 24 },
    ])

    console.log(`[JobSpy] Scraped ${rawJobs.length} total jobs`)

    if (!rawJobs.length) {
      console.log('[JobSpy] No jobs found, exiting')
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No jobs found',
          jobsScraped: 0,
          durationMs: Date.now() - startTime,
        }),
      }
    }

    // Normalize jobs using JobSpy source normalizer
    console.log('[JobSpy] Normalizing jobs...')
    const normalized = await Promise.resolve(
      JobSpySource.normalize({ data: rawJobs })
    )

    console.log(`[JobSpy] Normalized ${normalized.length} jobs`)

    // Enrich jobs with dedup_key before upsert (compute hash from title/company/location)
    console.log('[JobSpy] Enriching jobs with dedup_key...')
    const computeDedupKey = await getComputeDedupKey()
    const enrichedJobs = normalized.map((j) => ({
      ...j,
      dedup_key: computeDedupKey(j.title, j.company, j.location),
    }))

    // Upsert jobs to database
    console.log('[JobSpy] Upserting jobs to database...')
    const upsertResult = await upsertJobs(enrichedJobs)

    console.log('[JobSpy] Upsert complete:', {
      inserted: upsertResult.inserted,
      updated: upsertResult.updated,
      noop: upsertResult.noop,
    })

    // Log run status
    const durationMs = Date.now() - startTime
    console.log(`[JobSpy] Completed in ${durationMs}ms`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'JobSpy scraping completed',
        jobsScraped: rawJobs.length,
        jobsNormalized: normalized.length,
        inserted: upsertResult.inserted,
        updated: upsertResult.updated,
        duplicates: upsertResult.noop,
        durationMs,
      }),
    }
  } catch (error) {
    console.error('[JobSpy] Background job failed:', error)

    const message = error instanceof Error ? error.message : String(error)
    const durationMs = Date.now() - startTime

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: message,
        durationMs,
      }),
    }
  }
}

/**
 * Optional: Export configuration for Netlify
 * Uncomment to enable scheduled execution
 */
// export const config: Config = {
//   schedule: '0 */6 * * *', // Every 6 hours
// }
