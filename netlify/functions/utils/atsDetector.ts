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
/**
 * Pattern matching for ATS detection from URLs or HTML content
 */
export function detectATSFromContent(content: string): Partial<DetectedATS> | null {
  if (!content) return null

  const contentLower = content.toLowerCase()

  // 1. Lever Detection
  // Check for Lever subdomains, API scripts, or data attributes
  if (
    contentLower.includes('lever.co') ||
    contentLower.includes('data-lever-job-id') ||
    contentLower.includes('data-lever-post-id') ||
    contentLower.includes('lever-job-id')
  ) {
    const leverSlugMatch =
      contentLower.match(/api\.lever\.co\/v0\/postings\/([a-z0-9-]+)/) ||
      contentLower.match(/jobs\.lever\.co\/([a-z0-9-]+)/) ||
      contentLower.match(/([a-z0-9-]+)\.lever\.co/) ||
      content.match(/data-lever-slug=["']([^"']+)["']/) ||
      contentLower.match(/lever\.co\/([a-z0-9-]+)/)

    if (leverSlugMatch?.[1]) {
      // Avoid catching 'api' or 'jobs' as slugs
      const slug = leverSlugMatch[1]
      if (slug !== 'api' && slug !== 'jobs' && slug !== 'v0') {
        return {
          type: 'lever',
          slug: slug,
          detectionMethod: 'url_pattern',
          confidence: 0.95,
        }
      }
    }
  }

  // 2. Greenhouse Detection
  // Check for Greenhouse board tokens, scripts, or iframes
  if (
    contentLower.includes('greenhouse.io') ||
    contentLower.includes('grnhse.io') ||
    contentLower.includes('gh-board-token') ||
    contentLower.includes('gh_src') ||
    contentLower.includes('grnhse')
  ) {
    const greenhouseMatch =
      contentLower.match(/boards\.greenhouse\.io\/([a-z0-9]+)/) ||
      contentLower.match(/boards\.greenhouse\.io.*board_token["\s=:]+([a-z0-9]+)/) ||
      contentLower.match(/([a-z0-9]+)\.greenhouse\.io/) ||
      content.match(/gh-board-token=["']([^"']+)["']/) ||
      content.match(/grnh_board_token\s*=\s*["']([^"']+)["']/) ||
      contentLower.match(/greenhouse\.io\/embed\/job_board\/js\?for=([a-z0-9]+)/) ||
      contentLower.match(/grnhse\.io\/([a-z0-9]+)/)

    if (greenhouseMatch?.[1]) {
      const token = greenhouseMatch[1]
      if (token !== 'boards' && token !== 'embed') {
        return {
          type: 'greenhouse',
          token: token,
          detectionMethod: 'url_pattern',
          confidence: 0.95,
        }
      }
    }

    // Check for Greenhouse JS inclusion without explicit token in URL
    if (
      contentLower.includes('grnh.js') ||
      contentLower.includes('greenhouse.io/embed') ||
      contentLower.includes('gh-board-token')
    ) {
      return {
        type: 'greenhouse',
        confidence: 0.7,
        detectionMethod: 'url_pattern'
      }
    }
  }

  // 3. Workday patterns
  if (contentLower.includes('workday.com') || contentLower.includes('myworkdayjobs.com')) {
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
    `https://${cleanDomain}/hiring`,
    `https://${cleanDomain}/join`,
    `https://${cleanDomain}/about/careers`,
    `https://${cleanDomain}/about/jobs`,
    `https://${cleanDomain}/company/careers`,
    `https://${cleanDomain}/company/jobs`,
    `https://careers.${cleanDomain}`,
    `https://jobs.${cleanDomain}`,
    `https://career.${cleanDomain}`,
    `https://work.${cleanDomain}`,
    `https://join.${cleanDomain}`,
  ]
}

function extractDomainFromCompany(company: string): string | null {
  if (!company) return null

  // If it looks like a URL already (e.g., "acme.com")
  if (company.includes('.') && !company.includes(' ')) {
    return company.split('/')[0].split('?')[0].toLowerCase()
  }

  // Convert company name to slug
  // "Acme Inc" -> "acme"
  const slug = company
    .toLowerCase()
    .replace(/\b(inc|llc|corp|corporation|ltd|limited|technologies|solutions|group|labs|software|international|systems|holding)\.?\b/g, '') // Remove common suffixes
    .replace(/[^a-z0-9 ]+/g, '') // Remove symbols but keep spaces for now
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens for slugs

  return slug || null
}

/**
 * Probabilistically probe known board hosts with company slug
 */
async function probeDirectBoards(slug: string): Promise<Partial<DetectedATS> | null> {
  if (!slug || slug.length < 2) return null

  const greenhouseUrl = `https://api.greenhouse.io/v1/boards/${slug}/jobs`
  const leverUrl = `https://api.lever.co/v0/postings/${slug}?limit=1`

  // Use a proper User-Agent to avoid being blocked by WAFs during probing
  const headers = {
    'User-Agent': BROWSER_USER_AGENT,
    'Accept': 'application/json'
  }

  // Try Greenhouse
  try {
    const ghRes = await fetch(greenhouseUrl, { method: 'HEAD', headers })
    if (ghRes.ok) {
      return { type: 'greenhouse', token: slug, confidence: 0.9, detectionMethod: 'url_pattern' }
    }
  } catch (e) { }

  // Try Lever
  try {
    const lvRes = await fetch(leverUrl, { method: 'HEAD', headers })
    if (lvRes.ok) {
      return { type: 'lever', slug: slug, confidence: 0.9, detectionMethod: 'url_pattern' }
    }
  } catch (e) { }

  return null
}

const BROWSER_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * Detect ATS from external URL
 * Attempts to find direct company URL if not available
 * Uses cache to avoid redundant lookups
 */
export async function detectATS(
  externalUrl: string | null,
  company: string | null,
  domain?: string,
  crawledUrl?: string | null
): Promise<DetectedATS | null> {
  try {
    const cache = getATSCache()
    const extracted = company ? extractDomainFromCompany(company) : null
    const cacheKey = (domain || extracted || undefined) as string | undefined

    // Check cache first
    if (cache.has(company, cacheKey)) {
      const cached = cache.get(company, cacheKey)
      cache.recordHit()
      return cached || null
    }

    cache.recordMiss()

    // 0. Prioritize Crawled URL (Methods 1-3 but focused on the crawled target)
    if (crawledUrl) {
      const detected = detectATSFromContent(crawledUrl)
      if (detected && detected.type !== 'unknown') {
        const result: DetectedATS = {
          type: detected.type as ATSType,
          slug: detected.slug,
          token: detected.token,
          careersUrl: crawledUrl,
          confidence: 0.95,
          detectionMethod: 'domain_inference',
        }
        cache.set(company, cacheKey, result)
        return result
      }
    }
    if (externalUrl) {
      const detected = detectATSFromContent(externalUrl)
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

    // Method 2: Try direct board probing with slug variations
    const domainPart = cacheKey ? cacheKey.split('.')[0] : null
    const companySlug = company ? extractDomainFromCompany(company) : null

    const slugsToTry = new Set<string>()
    if (domainPart) slugsToTry.add(domainPart)
    if (companySlug) {
      slugsToTry.add(companySlug)
      // Also try stripping hyphens for Greenhouse tokens which often omit them
      if (companySlug.includes('-')) {
        slugsToTry.add(companySlug.replace(/-/g, ''))
      }
    }

    for (const slug of slugsToTry) {
      const directDetected = await probeDirectBoards(slug)
      if (directDetected) {
        const result: DetectedATS = {
          type: directDetected.type as ATSType,
          slug: directDetected.slug,
          token: directDetected.token,
          confidence: directDetected.confidence || 0.9,
          detectionMethod: 'url_pattern',
        }
        cache.set(company, cacheKey, result)
        return result
      }
    }

    // Method 3: Try to find careers page and detect from there
    const careersUrls = buildCareerPageURLs(cacheKey || '')
    if (careersUrls.length > 0) {
      for (const careersUrl of careersUrls) {
        try {
          const response = await fetch(careersUrl, {
            method: 'GET',
            headers: {
              'User-Agent': BROWSER_USER_AGENT,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9'
            },
            redirect: 'follow'
          })

          if (response.ok) {
            const html = await response.text()
            const atsFromHtml = detectATSFromContent(html)

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
        } catch (e) {
          // Continue to next URL
        }
      }
    }

    // Cache negative result for 7 days (604800000 ms)
    cache.set(company, cacheKey, null, 604800000);
    return null;
  } catch (error) {
    console.warn('ATS detection error:', error);
    return null;
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
