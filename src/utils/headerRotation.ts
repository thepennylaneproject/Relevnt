/**
 * Header Rotation Utility
 *
 * Rotates request headers for job sources with generous free tiers to:
 * 1. Avoid rate limiting / IP blocking
 * 2. Bypass basic bot detection
 * 3. Maximize free tier usage
 *
 * Applies to:
 * - RemoteOK (public free API)
 * - Himalayas (low quota, but free)
 * - Arbeitnow (free tier)
 * - Remotive (generous free tier)
 */

interface UserAgent {
  value: string
  platform: string
  version: string
}

interface HeaderProfile {
  userAgent: string
  acceptLanguage: string
  acceptEncoding: string
  referer?: string
  dnt?: string
}

/**
 * User-Agent strings from various browsers and platforms
 * Rotates to avoid bot detection
 */
const USER_AGENTS: UserAgent[] = [
  {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    platform: 'Windows',
    version: 'Chrome 120',
  },
  {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    platform: 'macOS',
    version: 'Chrome 120',
  },
  {
    value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    platform: 'Linux',
    version: 'Chrome 120',
  },
  {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    platform: 'Windows',
    version: 'Firefox 121',
  },
  {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    platform: 'macOS',
    version: 'Safari 17',
  },
  {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    platform: 'iOS',
    version: 'Safari Mobile',
  },
  {
    value: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    platform: 'Android',
    version: 'Chrome Mobile',
  },
]

const ACCEPT_LANGUAGE_VARIANTS = [
  'en-US,en;q=0.9',
  'en-US,en;q=0.9,es;q=0.8',
  'en-US,en;q=0.9,fr;q=0.8',
  'en;q=0.9,en-US;q=0.8',
  'en-GB,en;q=0.9',
  'en-AU,en;q=0.9',
]

const ACCEPT_ENCODING_VARIANTS = [
  'gzip, deflate, br',
  'gzip, deflate',
  'gzip, deflate, br, zstd',
]

/**
 * Get a random item from an array
 */
function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Build a realistic header profile for a given source
 */
function buildHeaderProfile(sourceSlug: string): HeaderProfile {
  const userAgent = pickRandom(USER_AGENTS)

  return {
    userAgent: userAgent.value,
    acceptLanguage: pickRandom(ACCEPT_LANGUAGE_VARIANTS),
    acceptEncoding: pickRandom(ACCEPT_ENCODING_VARIANTS),
    // Vary referer to appear like coming from different sources
    referer: pickRandom([
      'https://www.google.com/',
      'https://www.bing.com/',
      'https://duckduckgo.com/',
      'https://www.reddit.com/',
      undefined,
    ]),
    // Some browsers send DNT header
    dnt: Math.random() > 0.7 ? '1' : undefined,
  }
}

/**
 * Sources that benefit from header rotation
 * (Those with generous free tiers that might have basic bot detection)
 */
const SOURCES_WITH_GENEROUS_TIERS = [
  'remoteok',      // Free public API
  'himalayas',     // Low quota but free
  'arbeitnow',     // Free tier
  'remotive',      // Generous free tier
  'findwork',      // Free tier available
  'themuse',       // Free tier with limits
  'reed_uk',       // Free tier
]

/**
 * Check if a source should use header rotation
 */
export function shouldRotateHeaders(sourceSlug: string): boolean {
  return SOURCES_WITH_GENEROUS_TIERS.includes(sourceSlug.toLowerCase())
}

/**
 * Get rotating headers for a source
 * Each call returns a different combination to avoid patterns
 */
export function getRotatingHeaders(sourceSlug: string): Record<string, string> {
  if (!shouldRotateHeaders(sourceSlug)) {
    // Return standard headers for other sources
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    }
  }

  const profile = buildHeaderProfile(sourceSlug)

  const headers: Record<string, string> = {
    'User-Agent': profile.userAgent,
    'Accept': 'application/json',
    'Accept-Language': profile.acceptLanguage,
    'Accept-Encoding': profile.acceptEncoding,
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
  }

  if (profile.referer) {
    headers['Referer'] = profile.referer
  }

  if (profile.dnt) {
    headers['DNT'] = profile.dnt
  }

  return headers
}

/**
 * Calculate optimal request frequency for a source with free tier
 * Returns delay in milliseconds between requests
 */
export function getOptimalRequestDelay(sourceSlug: string): number {
  // Map of sources to minimum delay (ms) between requests
  // This prevents rate limiting and allows more generous free tier usage
  const delays: Record<string, number> = {
    'remoteok': 500,      // Public API, generous
    'himalayas': 1000,    // Low quota per time window
    'arbeitnow': 800,     // Moderate rate limit
    'remotive': 600,      // Decent free tier
    'findwork': 700,      // API rate limited
    'themuse': 1200,      // Strict rate limits
    'reed_uk': 1000,      // Moderate limits
  }

  return delays[sourceSlug.toLowerCase()] || 0
}

/**
 * Get request timeout for a source
 * Some free APIs are slower
 */
export function getOptimalTimeout(sourceSlug: string): number {
  const timeouts: Record<string, number> = {
    'remoteok': 10000,    // Fast API
    'himalayas': 15000,   // Slower API
    'arbeitnow': 12000,
    'remotive': 10000,
    'findwork': 12000,
    'themuse': 15000,     // Known to be slower
    'reed_uk': 15000,
  }

  return timeouts[sourceSlug.toLowerCase()] || 10000 // Default 10s
}

/**
 * Get maximum concurrent requests for a source
 * Prevents overwhelming the API with parallel requests
 */
export function getMaxConcurrentRequests(sourceSlug: string): number {
  const limits: Record<string, number> = {
    'remoteok': 5,        // Can handle parallel
    'himalayas': 2,       // Very restrictive
    'arbeitnow': 3,
    'remotive': 3,
    'findwork': 3,
    'themuse': 1,         // Single thread only
    'reed_uk': 2,
  }

  return limits[sourceSlug.toLowerCase()] || 3 // Default 3 concurrent
}

/**
 * Get estimated free tier capacity per day
 * Returns approximate number of API calls allowed
 */
export function getFreeTierDailyCapacity(sourceSlug: string): number {
  const capacities: Record<string, number> = {
    'remoteok': 100000,   // Effectively unlimited
    'himalayas': 500,     // Very limited
    'arbeitnow': 2000,    // Moderate
    'remotive': 5000,     // Good
    'findwork': 3000,     // Moderate
    'themuse': 200,       // Very limited
    'reed_uk': 1000,      // Limited
  }

  return capacities[sourceSlug.toLowerCase()] || 1000
}

/**
 * Rate limit tracker for each source
 * Helps ensure we don't exceed free tier limits
 */
class RateLimitTracker {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map()

  isAllowed(sourceSlug: string): boolean {
    const now = Date.now()
    const key = sourceSlug.toLowerCase()
    const tracker = this.requestCounts.get(key)

    // Reset if time window has passed (24 hours)
    if (!tracker || now > tracker.resetTime) {
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + 24 * 60 * 60 * 1000,
      })
      return true
    }

    const capacity = getFreeTierDailyCapacity(sourceSlug)
    if (tracker.count < capacity) {
      tracker.count++
      return true
    }

    return false
  }

  getRemaining(sourceSlug: string): number {
    const key = sourceSlug.toLowerCase()
    const tracker = this.requestCounts.get(key)
    if (!tracker) return getFreeTierDailyCapacity(sourceSlug)

    return Math.max(0, getFreeTierDailyCapacity(sourceSlug) - tracker.count)
  }

  reset(sourceSlug: string): void {
    this.requestCounts.delete(sourceSlug.toLowerCase())
  }
}

export const rateLimitTracker = new RateLimitTracker()
