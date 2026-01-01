/**
 * Job URL Enrichment Service
 *
 * Finds direct company career page URLs for jobs from aggregators
 * Bypasses subscription-required job boards by linking to company sources
 */

import type { NormalizedJob } from '../../../src/shared/jobSources'
import type { Company } from '../../../src/shared/companiesRegistry'
import { detectATS } from './atsDetector'

export interface EnrichedJobURL {
  original_url: string | null
  enriched_url: string | null
  is_direct: boolean // true if URL is from company's own ATS/careers page
  ats_type?: 'lever' | 'greenhouse' | 'workday' | 'unknown'
  enrichment_method?: 'registry_lookup' | 'ats_detection' | 'fallback'
  enrichment_confidence: number // 0-1
}

/**
 * Check if a URL appears to be from a company's own ATS/careers site
 */
function isDirectCompanyURL(url: string | null, companyName: string | null): boolean {
  if (!url || !companyName) return false

  const urlLower = url.toLowerCase()
  const companyLower = (companyName || '').toLowerCase()

  // Direct company ATS patterns
  if (urlLower.includes(companyLower)) return true
  if (urlLower.includes('jobs.lever.co') && urlLower.includes(companyLower)) return true
  if (urlLower.includes('greenhouse.io') && urlLower.includes(companyLower)) return true
  if (urlLower.includes('/careers')) return true
  if (urlLower.includes('/jobs')) return true

  return false
}

/**
 * Enrich a job's external URL with direct company link if available
 *
 * Priority:
 * 1. If URL already direct, use it
 * 2. If company in registry with careers_page_url, use that
 * 3. Try ATS detection from current URL
 * 4. Try to detect ATS from company domain
 * 5. Fallback to original URL
 */
export async function enrichJobURL(
  job: NormalizedJob,
  companyRegistry?: Map<string, Company>
): Promise<EnrichedJobURL> {
  const originalUrl = job.external_url

  try {
    // Step 1: Check if already direct
    if (isDirectCompanyURL(originalUrl, job.company)) {
      return {
        original_url: originalUrl,
        enriched_url: originalUrl,
        is_direct: true,
        enrichment_confidence: 1.0,
      }
    }

    // Step 2: Try registry lookup (cached ATS info)
    if (companyRegistry && job.company) {
      const registryKey = job.company.toLowerCase().trim()
      const cachedCompany = companyRegistry.get(registryKey)

      if (cachedCompany?.careers_page_url) {
        return {
          original_url: originalUrl,
          enriched_url: cachedCompany.careers_page_url,
          is_direct: true,
          ats_type: cachedCompany.ats_type,
          enrichment_method: 'registry_lookup',
          enrichment_confidence: 0.95,
        }
      }
    }

    // Step 3: ATS detection from URL and domain
    const detected = await detectATS(originalUrl, job.company, job.company)

    if (detected && detected.careersUrl) {
      return {
        original_url: originalUrl,
        enriched_url: detected.careersUrl,
        is_direct: true,
        ats_type: detected.type,
        enrichment_method: 'ats_detection',
        enrichment_confidence: detected.confidence,
      }
    }

    // Step 4: If we detected an ATS but no URL, try to build one
    if (detected && detected.type === 'lever' && detected.slug) {
      const leverUrl = `https://${detected.slug}.lever.co/jobs`
      return {
        original_url: originalUrl,
        enriched_url: leverUrl,
        is_direct: true,
        ats_type: 'lever',
        enrichment_method: 'ats_detection',
        enrichment_confidence: detected.confidence,
      }
    }

    // Step 5: Fallback to original
    return {
      original_url: originalUrl,
      enriched_url: originalUrl,
      is_direct: false,
      enrichment_confidence: 0.0,
      enrichment_method: 'fallback',
    }
  } catch (error) {
    console.warn('Job URL enrichment error:', error)

    // Safe fallback
    return {
      original_url: originalUrl,
      enriched_url: originalUrl,
      is_direct: false,
      enrichment_confidence: 0.0,
      enrichment_method: 'fallback',
    }
  }
}

/**
 * Batch enrich multiple jobs
 * Results are returned in the same order as input jobs
 */
export async function enrichJobURLs(
  jobs: NormalizedJob[],
  companyRegistry?: Map<string, Company>,
  concurrency: number = 5
): Promise<EnrichedJobURL[]> {
  // Handle empty array case
  if (jobs.length === 0) {
    return []
  }

  // Pre-allocate results array to maintain order
  const results: (EnrichedJobURL | null)[] = new Array(jobs.length).fill(null)
  let nextIndex = 0
  let running = 0
  let completed = 0

  return new Promise((resolve) => {
    const process = () => {
      while (running < concurrency && nextIndex < jobs.length) {
        const currentIndex = nextIndex
        const job = jobs[currentIndex]
        nextIndex++
        running++

        enrichJobURL(job, companyRegistry)
          .then((result) => {
            // Store result at the correct index to maintain order
            results[currentIndex] = result
          })
          .catch((error) => {
            console.error('Batch enrichment error:', error)
            // Store fallback at the correct index
            results[currentIndex] = {
              original_url: job.external_url,
              enriched_url: job.external_url,
              is_direct: false,
              enrichment_confidence: 0.0,
            }
          })
          .finally(() => {
            running--
            completed++
            if (completed < jobs.length) {
              process()
            } else {
              // All jobs processed, resolve with results (filter out any remaining nulls as safety)
              resolve(results.filter((r): r is EnrichedJobURL => r !== null))
            }
          })
      }
    }

    process()
  })
}

/**
 * Apply enrichment results back to jobs
 */
export function applyURLEnrichment(
  jobs: NormalizedJob[],
  enrichmentResults: EnrichedJobURL[]
): NormalizedJob[] {
  return jobs.map((job, index) => {
    const enrichment = enrichmentResults[index]
    if (enrichment?.enriched_url && enrichment.enriched_url !== job.external_url) {
      return {
        ...job,
        external_url: enrichment.enriched_url,
      }
    }
    return job
  })
}
