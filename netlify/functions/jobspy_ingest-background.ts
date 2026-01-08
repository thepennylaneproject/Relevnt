/**
 * JobSpy Background Ingestion Function
 *
 * Runs as a Netlify background function (15-minute timeout)
 * Scrapes jobs from Indeed, LinkedIn, Glassdoor, ZipRecruiter using ts-jobspy
 *
 * Enhanced with:
 * - Dynamic search rotation from job_search_profiles table
 * - 24h call signature tracking to prevent duplicate scrapes
 */

import type { Handler, HandlerContext } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import { JobSpySource } from '../../src/shared/jobSources'
import { upsertJobs } from './ingest_jobs'
import { getSourceConfig } from '../../src/shared/sourceConfig'
import { shouldMakeCall, recordCall, buildCallSignature } from './utils/ingestionRouting'

// Compute dedup key inline (same logic as ingest_jobs.ts)
function computeDedupKey(title: string | null, company: string | null, location: string | null): string {
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

// Default search configs if database has none
const DEFAULT_SEARCH_CONFIGS: JobSpyScrapeConfig[] = [
  { search_term: 'software engineer', location: 'remote', hours_old: 24, results_wanted: 100 },
  { search_term: 'data scientist', location: 'remote', hours_old: 24, results_wanted: 100 },
  { search_term: 'product manager', location: 'remote', hours_old: 24, results_wanted: 100 },
  { search_term: 'devops engineer', location: 'remote', hours_old: 24, results_wanted: 100 },
  { search_term: 'frontend developer', location: 'remote', hours_old: 24, results_wanted: 100 },
  { search_term: 'backend developer', location: 'remote', hours_old: 24, results_wanted: 100 },
]

/**
 * Get search configs from database, falling back to defaults
 */
async function getSearchConfigs(
  supabase: ReturnType<typeof createAdminClient>,
  maxConfigs: number = 6
): Promise<JobSpyScrapeConfig[]> {
  try {
    // Get profiles that haven't been run recently (for jobspy source)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from('job_search_profiles')
      .select('keywords, location, priority')
      .eq('source', 'jobspy')
      .eq('enabled', true)
      .or(`last_run_at.is.null,last_run_at.lt.${cutoff}`)
      .order('priority', { ascending: false })
      .order('last_run_at', { ascending: true, nullsFirst: true })
      .limit(maxConfigs)

    if (error) {
      console.warn('[JobSpy] Failed to fetch search profiles:', error.message)
      return DEFAULT_SEARCH_CONFIGS.slice(0, maxConfigs)
    }

    if (!data || data.length === 0) {
      console.log('[JobSpy] No pending search profiles, using defaults')
      return DEFAULT_SEARCH_CONFIGS.slice(0, maxConfigs)
    }

    console.log(`[JobSpy] Got ${data.length} search profiles from database`)
    
    return data.map(p => ({
      search_term: p.keywords,
      location: p.location || 'remote',
      hours_old: 24,
      results_wanted: 100
    }))
  } catch (err) {
    console.error('[JobSpy] Error fetching search profiles:', err)
    return DEFAULT_SEARCH_CONFIGS.slice(0, maxConfigs)
  }
}

/**
 * Update last_run_at for processed search profiles
 */
async function markProfilesProcessed(
  supabase: ReturnType<typeof createAdminClient>,
  keywords: string[]
): Promise<void> {
  if (keywords.length === 0) return

  const { error } = await supabase
    .from('job_search_profiles')
    .update({ last_run_at: new Date().toISOString() })
    .eq('source', 'jobspy')
    .in('keywords', keywords)

  if (error) {
    console.warn('[JobSpy] Failed to update profile timestamps:', error.message)
  }
}

/**
 * Scrape jobs from multiple job boards for a single search config
 */
async function scrapeForConfig(
  jobspy: any,
  config: JobSpyScrapeConfig
): Promise<any[]> {
  const allJobs: any[] = []
  const { search_term, location, hours_old, results_wanted } = config

  // Scrape Indeed
  try {
    console.log(`[JobSpy] Indeed: "${search_term}" (${location})`)
    const indeedJobs = await jobspy.Indeed.jobs({
      search_term,
      location: location || 'remote',
      hours_old: hours_old || 24,
      results_wanted: results_wanted || 100,
    })
    console.log(`[JobSpy] Indeed returned ${indeedJobs?.length || 0} jobs for "${search_term}"`)
    if (indeedJobs?.length) allJobs.push(...indeedJobs)
  } catch (err) {
    console.error(`[JobSpy] Indeed failed for "${search_term}":`, err)
  }

  // Scrape ZipRecruiter
  try {
    console.log(`[JobSpy] ZipRecruiter: "${search_term}" (${location})`)
    const zipJobs = await jobspy.ZipRecruiter.jobs({
      search_term,
      location: location || 'remote',
      hours_old: hours_old || 24,
      results_wanted: results_wanted || 100,
    })
    console.log(`[JobSpy] ZipRecruiter returned ${zipJobs?.length || 0} jobs for "${search_term}"`)
    if (zipJobs?.length) allJobs.push(...zipJobs)
  } catch (err) {
    console.error(`[JobSpy] ZipRecruiter failed for "${search_term}":`, err)
  }

  // Scrape Glassdoor (if available in ts-jobspy)
  try {
    if (jobspy.Glassdoor) {
      console.log(`[JobSpy] Glassdoor: "${search_term}" (${location})`)
      const glassJobs = await jobspy.Glassdoor.jobs({
        search_term,
        location: location || 'remote',
        hours_old: hours_old || 24,
        results_wanted: results_wanted || 100,
      })
      console.log(`[JobSpy] Glassdoor returned ${glassJobs?.length || 0} jobs for "${search_term}"`)
      if (glassJobs?.length) allJobs.push(...glassJobs)
    }
  } catch (err) {
    console.error(`[JobSpy] Glassdoor failed for "${search_term}":`, err)
  }

  return allJobs
}

/**
 * Background handler - runs with 15-minute timeout
 */
export const handler: Handler = async (event, context: HandlerContext) => {
  const startTime = Date.now()
  const supabase = createAdminClient()

  console.log('[JobSpy] Starting background scraping job with dynamic rotation')

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

    const jobspy = await loadJobSpy()
    if (!jobspy) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'ts-jobspy library not available' }),
      }
    }

    // Get search configs (from database or defaults)
    const searchConfigs = await getSearchConfigs(supabase, 6)
    console.log(`[JobSpy] Processing ${searchConfigs.length} search configurations`)

    let totalRawJobs = 0
    let processedKeywords: string[] = []
    const allJobs: any[] = []

    // Process each config with 24h signature tracking
    for (const config of searchConfigs) {
      const signature = buildCallSignature('jobspy', {
        keywords: config.search_term,
        location: config.location || 'remote'
      })

      // Check if we've already scraped this config recently
      const { shouldProceed } = await shouldMakeCall(supabase, 'jobspy', { keywords: config.search_term, location: config.location }, 24)
      
      if (!shouldProceed) {
        console.log(`[JobSpy] Skipping "${config.search_term}" - scraped within 24h`)
        continue
      }

      const jobs = await scrapeForConfig(jobspy, config)
      allJobs.push(...jobs)
      totalRawJobs += jobs.length
      processedKeywords.push(config.search_term)

      // Record the call for 24h tracking
      await recordCall(supabase, 'jobspy', signature, jobs.length)
    }

    console.log(`[JobSpy] Scraped ${totalRawJobs} total jobs from ${processedKeywords.length} configs`)

    // Mark profiles as processed for rotation
    await markProfilesProcessed(supabase, processedKeywords)

    if (!allJobs.length) {
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
      JobSpySource.normalize({ data: allJobs })
    )

    console.log(`[JobSpy] Normalized ${normalized.length} jobs`)

    // Enrich jobs with dedup_key before upsert
    console.log('[JobSpy] Enriching jobs with dedup_key...')
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

    const durationMs = Date.now() - startTime
    console.log(`[JobSpy] Completed in ${durationMs}ms`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'JobSpy scraping completed',
        searchConfigs: processedKeywords,
        jobsScraped: totalRawJobs,
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

