/**
 * ATS Detection Service
 *
 * Detects Applicant Tracking System type from job URLs and company domains
 * Builds direct links to company career pages, bypassing aggregators
 */

import { getATSCache } from './atsCache'

export type ATSType = 'lever' | 'greenhouse' | 'workday' | 'unknown'

export interface DetectedATS {
  type: ATSType
  slug?: string // e.g., 'company-name' for Lever
  token?: string // e.g., board token for Greenhouse
  careersUrl?: string // Direct URL to company careers page
  confidence: number // 0-1, confidence in detection
  detectionMethod: 'url_pattern' | 'registry_lookup' | 'domain_inference'
}

/**
 * Pattern matching for ATS detection from URLs
 */
function detectATSFromURL(url: string): Partial<DetectedATS> | null {
  if (!url) return null

  const urlLower = url.toLowerCase()

  // Lever patterns
  if (urlLower.includes('lever.co')) {
    const leverSlugMatch = urlLower.match(/api\.lever\.co\/v0\/postings\/([a-z0-9-]+)/) ||
                           urlLower.match(/jobs\.lever\.co.*\/([a-z0-9-]+)/) ||
                           urlLower.match(/([a-z0-9-]+)\.lever\.co/)

    if (leverSlugMatch?.[1]) {
      return {
        type: 'lever',
        slug: leverSlugMatch[1],
        detectionMethod: 'url_pattern',
        confidence: 0.95,
      }
    }
  }

  // Greenhouse patterns
  if (urlLower.includes('greenhouse')) {
    const greenhouseMatch = urlLower.match(/boards\.greenhouse\.io.*board_token["\s=:]+([a-z0-9]+)/) ||
                            urlLower.match(/([a-z0-9]+)\.greenhouse\.io/)

    if (greenhouseMatch?.[1]) {
      return {
        type: 'greenhouse',
        token: greenhouseMatch[1],
        detectionMethod: 'url_pattern',
        confidence: 0.95,
      }
    }
  }

  // Workday patterns
  if (urlLower.includes('workday.com')) {
    return {
      type: 'workday',
      detectionMethod: 'url_pattern',
      confidence: 0.9,
    }
  }

  return null
}

/**
 * Build common careers page URL patterns from domain
 */
function buildCareerPageURLs(domain: string): string[] {
  if (!domain) return []

  const cleanDomain = domain.replace(/^(https?:\/\/)|(\/.*)?$/g, '').toLowerCase()

  return [
    `https://${cleanDomain}/careers`,
    `https://${cleanDomain}/jobs`,
    `https://careers.${cleanDomain}`,
    `https://jobs.${cleanDomain}`,
    `https://career.${cleanDomain}`,
    `https://work.${cleanDomain}`,
  ]
}

/**
 * Extract domain from company name or URL
 */
function extractDomainFromCompany(company: string): string | null {
  if (!company) return null

  // If it looks like a URL already
  if (company.includes('.')) {
    return company.split('/')[0]
  }

  // Convert company name to domain
  // "Acme Inc" → "acme.com" (heuristic)
  const slug = company
    .toLowerCase()
    .replace(/\s+inc\.?$/, '') // Remove Inc suffix
    .replace(/\s+llc\.?$/, '')  // Remove LLC suffix
    .replace(/\s+corp\.?$/, '')  // Remove Corp suffix
    .replace(/\s+/g, '')         // Remove spaces

  return `${slug}.com`
}

/**
 * Detect ATS from external URL
 * Attempts to find direct company URL if not available
 * Uses cache to avoid redundant lookups
 */
export async function detectATS(
  externalUrl: string | null,
  company: string | null,
  domain?: string
): Promise<DetectedATS | null> {
  try {
    const cache = getATSCache()
    const cacheKey = domain || extractDomainFromCompany(company)

    // Check cache first
    if (cache.has(company, cacheKey)) {
      const cached = cache.get(company, cacheKey)
      cache.recordHit()
      return cached || null
    }

    cache.recordMiss()

    // Method 1: Direct URL pattern matching
    if (externalUrl) {
      const detected = detectATSFromURL(externalUrl)
      if (detected && detected.type !== 'unknown') {
        const result: DetectedATS = {
          type: detected.type as ATSType,
          slug: detected.slug,
          token: detected.token,
          confidence: detected.confidence || 0.9,
          detectionMethod: 'url_pattern',
        }
        cache.set(company, cacheKey, result)
        return result
      }
    }

    // Method 2: Try to find careers page and detect from there
    const careersUrls = buildCareerPageURLs(cacheKey || '')
    if (careersUrls.length > 0) {
      for (const careersUrl of careersUrls) {
        try {
          const response = await fetch(careersUrl, {
            method: 'HEAD',
            timeout: 5000,
            headers: { 'User-Agent': 'Relevnt-JobFinder/1.0' },
          })

          if (response.ok) {
            // Found a valid careers page, try to get HTML to detect ATS
            const htmlResponse = await fetch(careersUrl, {
              timeout: 10000,
              headers: { 'User-Agent': 'Relevnt-JobFinder/1.0' },
            })

            if (htmlResponse.ok) {
              const html = await htmlResponse.text()
              const atsFromHtml = detectATSFromURL(html)

              if (atsFromHtml && atsFromHtml.type !== 'unknown') {
                const result: DetectedATS = {
                  type: atsFromHtml.type as ATSType,
                  slug: atsFromHtml.slug,
                  token: atsFromHtml.token,
                  careersUrl,
                  confidence: 0.85,
                  detectionMethod: 'domain_inference',
                }
                cache.set(company, cacheKey, result)
                return result
              }
            }
          }
        } catch (e) {
          // Continue to next URL
        }
      }
    }

    // Cache negative result
    cache.set(company, cacheKey, null)
    return null
  } catch (error) {
    console.warn('ATS detection error:', error)
    return null
  }
}

/**
 * Build direct Lever URL from slug
 */
export function buildLeverURL(slug: string): string {
  return `https://api.lever.co/v0/postings/${slug}`
}

/**
 * Build direct Greenhouse URL from token
 */
export function buildGreenhouseURL(token: string): string {
  return `https://api.greenhouse.io/v1/boards/${token}/jobs`
}

/**
 * Resolve job URL to most direct form
 * If job is from aggregator, try to find company's direct URL
 */
export async function resolveDirectJobURL(
  externalUrl: string | null,
  company: string | null,
  domain?: string
): Promise<string | null> {
  if (!externalUrl) return null

  // If it's already a direct company URL, return it
  if (externalUrl.includes(company || 'company')) {
    return externalUrl
  }

  // Try to detect ATS and build direct URL
  const detected = await detectATS(externalUrl, company, domain)

  if (detected) {
    if (detected.type === 'lever' && detected.slug) {
      return `https://${detected.slug}.lever.co/jobs`
    }

    if (detected.type === 'greenhouse' && detected.token) {
      return detected.careersUrl || externalUrl
    }

    if (detected.careersUrl) {
      return detected.careersUrl
    }
  }

  // Fallback: return original URL
  return externalUrl
}
