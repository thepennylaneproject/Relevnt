// netlify/functions/ingest_jobs.ts
import greenhouseBoardsData from '../../src/data/jobSources/greenhouse_boards.json'
/*
SQL (Supabase) to create the ingestion state table for per-source cursors:
create table if not exists job_ingestion_state (
  source text primary key,
  cursor jsonb,
  last_run_at timestamptz
);
*/
import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import {
  ALL_SOURCES,
  type JobSource,
  type NormalizedJob,
  getLeverSources,
  buildLeverUrl,
  getRSSSources,
  type RSSFeedSource,
} from '../../src/shared/jobSources'
import { enrichJob } from '../../src/lib/scoring/jobEnricher'
import {
  getSourceConfig,
  shouldSkipDueToCooldown,
  type SourceConfig,
} from '../../src/shared/sourceConfig'
import {
  type Company,
  filterCompaniesDueForSync,
  calculatePriorityScore,
  groupCompaniesByPlatform,
} from '../../src/shared/companiesRegistry'
import { fetchCompaniesInParallel, fetchFromMultiplePlatforms } from './utils/concurrent-fetcher'
import { fetchAndParseRSSFeed } from './utils/rssParser'
import { enrichJobURL, enrichJobURLs } from './utils/jobURLEnricher'
import { shouldMakeCall, recordCall } from './utils/ingestionRouting'
import { updateAdaptiveState, shouldSkipDueToAdaptiveCooldown } from './utils/ingestionAdaptive'
import { resolveCompanyId } from './utils/companyResolver'

export type IngestResult = {
  source: string;
  count: number;         // Total jobs fetched from source
  normalized: number;    // Jobs after normalization
  duplicates: number;    // Jobs that already existed (updated + noop)
  updated?: number;      // Existing jobs that were updated with new data
  noop?: number;         // Existing jobs with no changes
  staleFiltered: number; // Jobs filtered out due to age
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  skipReason?: string;
}
type IngestionCursor = { page?: number; since?: string | null }
type IngestionState = { cursor: IngestionCursor; last_run_at: string | null }

// Discriminated union for fetch results - makes network failures unambiguous
type FetchOk = { ok: true; data: any; status: number }
type FetchErr = {
  ok: false
  kind: 'http' | 'parse' | 'network'
  status?: number
  message: string
  url: string
  sourceSlug?: string
}
type FetchResult = FetchOk | FetchErr

type PaginationConfig = {
  pageParam?: string
  pageSizeParam?: string
  pageSize?: number
  sinceParam?: string
  maxPagesPerRun?: number
  maxAgeDays?: number
}

// Greenhouse board configuration
export interface GreenhouseBoard {
  companyName: string
  boardToken: string
  careersUrl?: string // Optional careers page URL
}

const DEFAULT_PAGE_SIZE = 50
const DEFAULT_MAX_PAGES_PER_RUN = 3
const DEFAULT_GREENHOUSE_MAX_BOARDS_PER_RUN = 50
const DEFAULT_GREENHOUSE_MAX_JOBS_PER_BOARD = 200
const DEFAULT_LEVER_MAX_COMPANIES_PER_RUN = 50

const SOURCE_PAGINATION: Record<string, PaginationConfig> = {
  remoteok: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 50 },
  remotive: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 50, sinceParam: 'since' },
  himalayas: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 50 },
  adzuna_us: {
    // pageParam: 'page', // Adzuna uses page in the path, not query param, avoid redundant param
    pageSizeParam: 'results_per_page',
    pageSize: 50,
    maxPagesPerRun: 1, // keep Adzuna calls bounded since auth limits are stricter
  },
  usajobs: {
    pageParam: 'Page',
    pageSizeParam: 'ResultsPerPage',
    pageSize: 50,
    maxPagesPerRun: 3,
  },
  jobicy: {
    // pageParam: undefined, // Jobicy v2 is strict about query params, avoid sending page=1
    pageSizeParam: 'count',
    pageSize: 50
  },
  arbeitnow: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 50 },
  // Jooble uses POST with body params, not URL params
  jooble: { pageParam: 'page', pageSizeParam: 'ResultOnPage', pageSize: 50, maxPagesPerRun: 2 },
  themuse: { pageParam: 'page', pageSizeParam: 'per_page', pageSize: 50, maxPagesPerRun: 3 },
  fantastic: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 100, maxPagesPerRun: 5 },
  jobdatafeeds: { pageParam: 'page', pageSizeParam: 'page_size', pageSize: 100, maxPagesPerRun: 3 },
  careerjet: { pageParam: 'page', pageSizeParam: 'pagesize', pageSize: 50, maxPagesPerRun: 3 },
  whatjobs: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 50, maxPagesPerRun: 3 },
  reed_uk: { pageParam: 'resultsToSkip', pageSizeParam: 'resultsToTake', pageSize: 50, maxPagesPerRun: 2 },
  // TheirStack uses POST with limit in body - capped at 25 per API tier limit
  theirstack: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 25, maxPagesPerRun: 1 },
  // CareerOneStop uses path params with startRecord for pagination
  careeronestop: {
    pageParam: 'startRecord',
    pageSizeParam: 'pageSize',
    pageSize: 50,
    maxPagesPerRun: 3,
  },
  // Greenhouse: follows RFC-5988 Link headers for pagination across all pages per board
  greenhouse: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 1000, maxPagesPerRun: 100 },
  // Lever doesn't use pagination - it uses company-based fetching
  lever: {
    pageParam: undefined, // Not used for Lever
    maxPagesPerRun: 1,
  },
  // RSS doesn't use pagination - it fetches all configured feeds per run
  rss: {
    pageParam: undefined, // Not used for RSS
    maxPagesPerRun: 1,
  },
}

// Parse Greenhouse boards from env var
function parseGreenhouseBoards(): GreenhouseBoard[] {
  const boards: GreenhouseBoard[] = [...(greenhouseBoardsData as GreenhouseBoard[])]

  // Note: GREENHOUSE_BOARDS_JSON env var support removed to stay under 4KB limit.
  // Add new boards to src/data/jobSources/greenhouse_boards.json instead.

  // Validate each board has required fields
  const validBoards = boards.filter((board) => {
    if (!board.companyName || !board.boardToken) {
      console.warn(
        'ingest_jobs: Greenhouse board missing companyName or boardToken:',
        board
      )
      return false
    }
    return true
  })

  if (validBoards.length > 0) {
    console.log(`ingest_jobs: loaded ${validBoards.length} Greenhouse boards`)
  }

  return validBoards
}

// Helper to build the fetch URL for a given source, supporting Adzuna etc.
function applyCursorToUrl(
  urlString: string,
  source: JobSource,
  cursor?: IngestionCursor
): string {
  const config = SOURCE_PAGINATION[source.slug] || {}
  const page = cursor?.page ?? 1

  try {
    const url = new URL(urlString)

    if (config.pageParam) {
      url.searchParams.set(config.pageParam, String(page))
    }

    if (config.pageSizeParam && config.pageSize) {
      url.searchParams.set(config.pageSizeParam, String(config.pageSize))
    }

    if (config.sinceParam && cursor?.since) {
      url.searchParams.set(config.sinceParam, cursor.since)
    }

    return url.toString()
  } catch (err) {
    console.warn(
      'ingest_jobs: failed to apply cursor to URL; returning base URL',
      urlString,
      err
    )
    return urlString
  }
}

function buildSourceUrl(
  source: JobSource,
  cursor?: IngestionCursor,
  searchParams?: { keywords?: string; location?: string }
): string | null {
  const keywords = searchParams?.keywords || 'software developer'
  const location = searchParams?.location || 'US'
  if (source.slug === 'adzuna_us') {
    const base = source.fetchUrl
    const appId = process.env.ADZUNA_APP_ID
    const appKey = process.env.ADZUNA_APP_KEY

    if (!appId || !appKey) {
      console.error('ingest_jobs: missing ADZUNA_APP_ID or ADZUNA_APP_KEY')
      return null
    }

    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: '50',
      what: keywords,
      sort_by: 'date',
    })

    const page = cursor?.page ?? 1
    // Adzuna requires page in the path: /search/1
    return `${base}/${page}?${params.toString()}`
  }

  if (source.slug === 'careeronestop') {
    const userId = process.env.CAREERONESTOP_USER_ID
    const apiKey = process.env.CAREERONESTOP_API_KEY
    if (!userId || !apiKey) {
      console.error('ingest_jobs: missing CAREERONESTOP_USER_ID or CAREERONESTOP_API_KEY')
      return null
    }

    // Check if source is enabled via env var
    const enabled = process.env.ENABLE_SOURCE_CAREERONESTOP !== 'false'
    if (!enabled) {
      console.log('ingest_jobs: CareerOneStop disabled via ENABLE_SOURCE_CAREERONESTOP')
      return null
    }

    // CareerOneStop v2 API URL format:
    // /v2/jobsearch/{userId}/{keyword}/{location}/{radius}/{sortColumns}/{sortOrder}/{startRecord}/{pageSize}/{days}
    const config = SOURCE_PAGINATION[source.slug] || {}
    const page = cursor?.page ?? 1
    const pageSize = config.pageSize ?? 50
    const startRecord = (page - 1) * pageSize

    // Search parameters
    // '0' means all jobs in CareerOneStop API
    const keyword = keywords && keywords !== 'software developer' ? keywords : '0'
    const locationParam = location || 'US' // Nationwide
    const radius = '0' // Not used for nationwide
    const sortColumns = 'DatePosted' // Sort by post date for freshness
    const sortOrder = 'DESC'
    const days = '30' // Last 30 days

    const baseUrl = `https://api.careeronestop.org/v2/jobsearch/${userId}/${encodeURIComponent(
      keyword
    )}/${encodeURIComponent(locationParam)}/${radius}/${sortColumns}/${sortOrder}/${startRecord}/${pageSize}/${days}`

    return baseUrl
  }

  // Jooble uses POST with API key in the URL path
  if (source.slug === 'jooble') {
    const apiKey = process.env.JOOBLE_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing JOOBLE_API_KEY')
      return null
    }
    // Jooble URL includes the API key in the path
    // Pagination is handled in the POST body, not URL params
    return `${source.fetchUrl}${apiKey}`
  }

  // The Muse uses api_key as query param
  if (source.slug === 'themuse') {
    const apiKey = process.env.THEMUSE_API_KEY
    // The Muse works without API key but has lower rate limits
    const config = SOURCE_PAGINATION[source.slug] || {}
    const page = cursor?.page ?? 1
    const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE

    const params = new URLSearchParams({
      page: String(page),
      per_page: String(pageSize),
    })
    if (apiKey) {
      params.set('api_key', apiKey)
    }
    return `${source.fetchUrl}?${params.toString()}`
  }

  // Fantastic Jobs uses page and limit query params
  if (source.slug === 'fantastic') {
    const config = SOURCE_PAGINATION[source.slug] || {}
    const page = cursor?.page ?? 1
    const pageSize = config.pageSize ?? 100

    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
      remote: 'true', // Prefer remote jobs
    })
    return `${source.fetchUrl}?${params.toString()}`
  }

  // JobDataFeeds uses standard page/page_size pagination WITH keyword rotation
  if (source.slug === 'jobdatafeeds') {
    const config = SOURCE_PAGINATION[source.slug] || {}
    const page = cursor?.page ?? 1
    const pageSize = config.pageSize ?? 100

    // Use search rotation keywords, fallback to broad search
    const title = searchParams?.keywords ? searchParams.keywords : 'all'
    const location = searchParams?.location ? searchParams.location : null

    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      title: title,  // ✅ NOW USES KEYWORD ROTATION for targeted searches
    })

    // Add optional location/city filter if provided and not remote
    if (location && location.toLowerCase() !== 'remote') {
      params.set('city', location)
    }

    return `${source.fetchUrl}?${params.toString()}`
  }

  // CareerJet v4 API - uses Basic Auth and specific parameters
  if (source.slug === 'careerjet') {
    const apiKey = process.env.CAREERJET_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing CAREERJET_API_KEY - skipping source')
      return null
    }

    const config = SOURCE_PAGINATION[source.slug] || {}
    const page = cursor?.page ?? 1
    const pageSize = config.pageSize ?? 50

    const params = new URLSearchParams({
      locale_code: 'en_US',
      keywords: keywords,
      sort: 'date',
      page: String(page),
      page_size: String(pageSize),
      user_ip: getRandomIp(),
      user_agent: getRandomUserAgent(),
    })
    return `${source.fetchUrl}?${params.toString()}`
  }

  // WhatJobs uses page/limit pagination
  if (source.slug === 'whatjobs') {
    const apiKey = process.env.WHATJOBS_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing WHATJOBS_API_KEY - skipping source')
      return null
    }

    const config = SOURCE_PAGINATION[source.slug] || {}
    const page = cursor?.page ?? 1
    const pageSize = config.pageSize ?? 50

    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    })
    return `${source.fetchUrl}?${params.toString()}`
  }

  // Reed UK uses Basic auth with API key, pagination via resultsToSkip
  if (source.slug === 'reed_uk') {
    const apiKey = process.env.REED_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing REED_API_KEY')
      return null
    }
    const config = SOURCE_PAGINATION[source.slug] || {}
    const page = cursor?.page ?? 1
    const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE
    const skip = (page - 1) * pageSize

    const params = new URLSearchParams({
      resultsToTake: String(pageSize),
      resultsToSkip: String(skip),
      keywords: 'software engineer', // Default search
    })
    return `${source.fetchUrl}?${params.toString()}`
  }

  // USAJOBS requires a Keyword parameter for the API search
  if (source.slug === 'usajobs') {
    const config = SOURCE_PAGINATION[source.slug] || {}
    const page = cursor?.page ?? 1
    const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE

    const params = new URLSearchParams({
      Keyword: 'federal', // Search for federal jobs
      Page: String(page),
      ResultsPerPage: String(pageSize),
    })
    return `${source.fetchUrl}?${params.toString()}`
  }

  // Lever: handled specially in ingest() function, returns null here
  if (source.slug === 'lever') {
    return null
  }

  return applyCursorToUrl(source.fetchUrl, source, cursor)
}

// Near the top (or wherever buildHeaders/buildSourceHeaders is):
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0',
]

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

function getRandomIp(): string {
  // Generate a random US-looking IP to avoid 0.0.0.0 blocks
  // Using 67.x.x.x range (common US ISP)
  const part2 = Math.floor(Math.random() * 255)
  const part3 = Math.floor(Math.random() * 255)
  const part4 = Math.floor(Math.random() * 255)
  return `67.${part2}.${part3}.${part4}`
}

function buildHeaders(source?: JobSource): Record<string, string> {
  const userAgent = getRandomUserAgent()
  if (source?.slug === 'usajobs') {
    const apiKey = process.env.USAJOBS_API_KEY
    const envUserAgent = process.env.USAJOBS_USER_AGENT
    if (!apiKey || !envUserAgent) {
      console.error('ingest_jobs: missing USAJOBS_API_KEY or USAJOBS_USER_AGENT')
      return {
        'User-Agent': userAgent,
        Accept: 'application/json',
      }
    }

    return {
      'User-Agent': envUserAgent,
      'Authorization-Key': apiKey,
      Accept: 'application/json',
    }
  }

  if (source?.slug === 'careeronestop') {
    const apiKey = process.env.CAREERONESTOP_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing CAREERONESTOP_API_KEY')
      return {
        'User-Agent': userAgent,
        Accept: 'application/json',
      }
    }
    return {
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': userAgent,
      Accept: 'application/json',
    }
  }

  if (source?.slug === 'findwork') {
    const apiKey = process.env.FINDWORK_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing FINDWORK_API_KEY')
      return {
        'User-Agent': userAgent,
        Accept: 'application/json',
      }
    }

    return {
      Authorization: `Token ${apiKey}`,
      'User-Agent': userAgent,
      Accept: 'application/json',
    }
  }

  // JobDataFeeds uses Bearer token authentication
  if (source?.slug === 'jobdatafeeds') {
    const apiKey = process.env.JOBDATAFEEDS_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing JOBDATAFEEDS_API_KEY')
      return {
        'User-Agent': userAgent,
        Accept: 'application/json',
      }
    }

    return {
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': userAgent,
      Accept: 'application/json',
    }
  }

  // WhatJobs uses a custom x-api-key header
  if (source?.slug === 'whatjobs') {
    const apiKey = process.env.WHATJOBS_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing WHATJOBS_API_KEY')
      return {
        'User-Agent': userAgent,
        Accept: 'application/json',
      }
    }

    return {
      'x-api-key': apiKey,
      'User-Agent': userAgent,
      Accept: 'application/json',
    }
  }

  // Fantastic Jobs uses Bearer token authentication
  if (source?.slug === 'fantastic') {
    const apiKey = process.env.FANTASTIC_JOBS_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing FANTASTIC_JOBS_API_KEY')
      return {
        'User-Agent': userAgent,
        Accept: 'application/json',
      }
    }

    return {
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': userAgent,
      Accept: 'application/json',
    }
  }

  // Reed UK uses HTTP Basic Auth with API key as username, no password
  if (source?.slug === 'reed_uk') {
    const apiKey = process.env.REED_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing REED_API_KEY')
      return {
        'User-Agent': userAgent,
        Accept: 'application/json',
      }
    }

    // Basic auth: base64 encode "apiKey:"
    const credentials = Buffer.from(`${apiKey}:`).toString('base64')
    return {
      Authorization: `Basic ${credentials}`,
      'User-Agent': userAgent,
      Accept: 'application/json',
    }
  }

  // Jooble needs Content-Type for POST
  if (source?.slug === 'jooble') {
    return {
      'Content-Type': 'application/json',
      'User-Agent': userAgent,
      Accept: 'application/json',
    }
  }

  // CareerJet v4 API uses Basic Auth (API key as username, empty password)
  if (source?.slug === 'careerjet') {
    const apiKey = process.env.CAREERJET_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing CAREERJET_API_KEY')
      return {
        'User-Agent': userAgent,
        Accept: 'application/json',
      }
    }
    const credentials = Buffer.from(`${apiKey}:`).toString('base64')
    return {
      Authorization: `Basic ${credentials}`,
      'User-Agent': userAgent,
      Accept: 'application/json',
    }
  }

  // The Muse - no special headers needed, api_key is in URL
  if (source?.slug === 'themuse') {
    return {
      'User-Agent': userAgent,
      Accept: 'application/json',
    }
  }

  // TheirStack uses Bearer token auth
  if (source?.slug === 'theirstack') {
    const apiKey = process.env.THEIRSTACK_API_KEY
    if (!apiKey) {
      return {
        'User-Agent': userAgent,
        Accept: 'application/json',
      }
    }
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': userAgent,
      Accept: 'application/json',
    }
  }

  // Use rotating headers for sources with generous free tiers
  // This helps avoid rate limiting and bot detection
  try {
    // Dynamic import to avoid TypeScript issues with Netlify build
    const rotationModule = eval("require('../../src/utils/headerRotation')")
    if (rotationModule && rotationModule.getRotatingHeaders && source) {
      return rotationModule.getRotatingHeaders(source.slug)
    }
  } catch (err) {
    console.debug('Header rotation module not available, using standard headers')
  }

  // Fallback: Standard headers
  if (source?.slug === 'remoteok') {
    return {
      'User-Agent': userAgent,
      Accept: 'application/json',
    }
  }

  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json',
  }
}

// Then change fetchJson to:
async function fetchJson(
  url: string,
  source?: JobSource,
  cursor?: IngestionCursor,
  searchParams?: { keywords?: string; location?: string }
): Promise<FetchResult> {
  const keywords = searchParams?.keywords || 'software developer'
  const sourceSlug = source?.slug

  try {
    const headers: Record<string, string> = buildHeaders(source)

    // Jooble requires POST with keywords and pagination in body
    if (sourceSlug === 'jooble') {
      const config = SOURCE_PAGINATION[sourceSlug] || {}
      const page = cursor?.page ?? 1
      const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE

      const body = JSON.stringify({
        keywords,
        location: searchParams?.location || '',
        page,
        ResultOnPage: pageSize,
      })

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        return {
          ok: false,
          kind: 'http',
          status: res.status,
          message: `HTTP ${res.status} ${res.statusText} ${errorText}`.trim(),
          url,
          sourceSlug,
        }
      }

      try {
        const data = await res.json()
        return { ok: true, data, status: res.status }
      } catch (e: any) {
        return {
          ok: false,
          kind: 'parse',
          status: res.status,
          message: `Failed to parse JSON: ${e?.message || String(e)}`,
          url,
          sourceSlug,
        }
      }
    }

    // TheirStack requires POST with search parameters in body
    if (sourceSlug === 'theirstack') {
      const maxResults = Math.min(parseInt(process.env.THEIRSTACK_MAX_RESULTS_PER_RUN || '25', 10), 25)
      const config = SOURCE_PAGINATION[sourceSlug] || {}
      const maxAgeDays = config.maxAgeDays || 30

      const body = JSON.stringify({
        limit: maxResults,
        order_by: [{ desc: true, field: 'date_posted' }],
        posted_at_max_age_days: maxAgeDays,
      })

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        return {
          ok: false,
          kind: 'http',
          status: res.status,
          message: `TheirStack HTTP ${res.status} ${res.statusText} ${errorText}`.trim(),
          url,
          sourceSlug,
        }
      }

      try {
        const data = await res.json()
        console.log(`ingest_jobs: TheirStack response keys:`, data ? Object.keys(data) : 'null')
        return { ok: true, data, status: res.status }
      } catch (e: any) {
        return {
          ok: false,
          kind: 'parse',
          status: res.status,
          message: `TheirStack failed to parse JSON: ${e?.message || String(e)}`,
          url,
          sourceSlug,
        }
      }
    }

    // Default: GET request
    const res = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      return {
        ok: false,
        kind: 'http',
        status: res.status,
        message: `HTTP ${res.status} ${res.statusText} ${errorText}`.trim(),
        url,
        sourceSlug,
      }
    }

    try {
      const data = await res.json()
      return { ok: true, data, status: res.status }
    } catch (e: any) {
      return {
        ok: false,
        kind: 'parse',
        status: res.status,
        message: `Failed to parse JSON: ${e?.message || String(e)}`,
        url,
        sourceSlug,
      }
    }
  } catch (err: any) {
    return {
      ok: false,
      kind: 'network',
      message: err?.message || String(err),
      url,
      sourceSlug,
    }
  }
}

// ============================================================================
// COMPANY REGISTRY FUNCTIONS
// ============================================================================
/**
 * Get companies from registry for a given platform
 * Prioritizes companies not synced recently (null or >12h ago) for better rotation.
 */
async function getCompaniesFromRegistry(
  supabase: ReturnType<typeof createAdminClient>,
  platform: 'lever' | 'greenhouse'
): Promise<Company[]> {
  try {
    const maxCompanies = parseInt(
      platform === 'lever'
        ? process.env.LEVER_MAX_COMPANIES_PER_RUN || String(DEFAULT_LEVER_MAX_COMPANIES_PER_RUN)
        : process.env.GREENHOUSE_MAX_BOARDS_PER_RUN || String(DEFAULT_GREENHOUSE_MAX_BOARDS_PER_RUN),
      10
    );

    // Calculate 12 hour cutoff for rotation
    const syncCutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    const syncField = platform === 'lever' ? 'last_synced_at_lever' : 'last_synced_at_greenhouse'
    const platformField = platform === 'lever' ? 'lever_slug' : 'greenhouse_board_token'

    // Try to use priority queue view if available, fall back to table query
    let companies: any[] = [];
    try {
      const { data, error } = await supabase
        .from('companies_priority_queue')
        .select('*')
        .limit(maxCompanies);

      if (!error && data) {
        companies = data;
      }
    } catch (e) {
      // View may not exist, fall back to table query
      console.log('Priority queue view not available, using table query');
    }

    // Fallback: query companies table directly with rotation logic
    if (companies.length === 0) {
      // First: get companies that haven't been synced recently (or ever)
      const { data: staleCompanies, error: staleError } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .not(platformField, 'is', null)
        .or(`${syncField}.is.null,${syncField}.lt.${syncCutoff}`)
        .order('job_creation_velocity', { ascending: false, nullsFirst: false })
        .order('growth_score', { ascending: false })
        .limit(maxCompanies);

      if (!staleError && staleCompanies && staleCompanies.length > 0) {
        companies = staleCompanies;
        console.log(`ingest_jobs: got ${companies.length} ${platform} companies due for rotation (not synced in 12h)`);
      } else {
        // Fallback: all active companies if rotation filter returns nothing
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('is_active', true)
          .not(platformField, 'is', null)
          .order('job_creation_velocity', { ascending: false, nullsFirst: false })
          .order('growth_score', { ascending: false })
          .limit(maxCompanies);

        if (error) {
          console.error(`Failed to query ${platform} companies:`, error);
          return platform === 'lever' ? getLeverSourcesAsCompanies() : [];
        }

        companies = data || [];
      }
    }

    console.log(
      `ingest_jobs: got ${companies.length} ${platform} companies from registry`
    );
    return companies;
  } catch (err) {
    console.error(`Failed to get ${platform} companies from registry:`, err);
    // Fall back to JSON config
    return platform === 'lever' ? getLeverSourcesAsCompanies() : [];
  }
}


/**
 * Convert Lever JSON config to Company objects (backwards compatibility)
 */
function getLeverSourcesAsCompanies(): Company[] {
  const sources = getLeverSources();
  return sources.map((source) => ({
    id: `lever-${source.companyName?.toLowerCase().replace(/\s+/g, '-')}`,
    name: source.companyName || 'Unknown',
    lever_slug: source.leverSlug || source.leverApiUrl?.split('/').pop(),
    priority_tier: 'standard',
    sync_frequency_hours: 24,
    is_active: true,
  }));
}

/**
 * Fetch Lever jobs for a company with concurrent rate limiting
 */
async function fetchLeverJobsForCompany(
  company: Company
): Promise<any[]> {
  if (!company.lever_slug) return [];

  try {
    const url = buildLeverUrl({
      companyName: company.name,
      leverSlug: company.lever_slug,
    });

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'relevnt-job-ingest/1.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.error(
        `Lever fetch failed for ${company.name}`,
        res.status
      );
      return [];
    }

    const data = await res.json().catch(() => null);
    if (!data) return [];

    const postings = Array.isArray(data) ? data : data.postings ?? [];
    console.log(
      `ingest_jobs: got ${postings.length} postings from Lever for ${company.name}`
    );
    return postings;
  } catch (err) {
    console.error(`Error fetching Lever jobs for ${company.name}:`, err);
    return [];
  }
}

/**
 * Fetch Greenhouse jobs for a company with concurrent rate limiting
 */
async function fetchGreenhouseJobsForCompany(
  company: Company
): Promise<any[]> {
  if (!company.greenhouse_board_token) return [];

  try {
    const maxJobs = parseInt(
      process.env.GREENHOUSE_MAX_JOBS_PER_BOARD || '200',
      10
    );
    const url = `https://boards.greenhouse.io/api/v1/boards/${company.greenhouse_board_token}/jobs?content=true`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'relevnt-job-ingest/1.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.error(
        `Greenhouse fetch failed for ${company.name}`,
        res.status
      );
      return [];
    }

    const data = await res.json().catch(() => null);
    if (!data) return [];

    const jobs = Array.isArray(data.jobs)
      ? data.jobs.slice(0, maxJobs)
      : [];
    console.log(
      `ingest_jobs: got ${jobs.length} jobs from Greenhouse for ${company.name}`
    );
    return jobs;
  } catch (err) {
    console.error(`Error fetching Greenhouse jobs for ${company.name}:`, err);
    return [];
  }
}

/**
 * Fetch from all RSS feeds in parallel
 */
async function fetchFromAllRSSFeedsInParallel(
  maxFeeds: number = 25
): Promise<Array<{ item: any; feedSource: RSSFeedSource; feedUrl: string }>> {
  const feeds = getRSSSources()
  if (!feeds.length) {
    console.log('ingest_jobs: no RSS feeds configured')
    return []
  }

  const feedsToFetch = feeds.slice(0, maxFeeds)
  console.log(
    `ingest_jobs: fetching from ${feedsToFetch.length} RSS feeds (max: ${maxFeeds})`
  )

  const results: Array<{ item: any; feedSource: RSSFeedSource; feedUrl: string }> = []

  // Fetch feeds in parallel with error handling
  const promises = feedsToFetch.map(async (feed) => {
    try {
      console.log(`ingest_jobs: fetching RSS feed: ${feed.name} (${feed.feedUrl})`)
      const parsed = await fetchAndParseRSSFeed(feed.feedUrl)

      if (parsed.error) {
        console.warn(
          `ingest_jobs: RSS feed error for ${feed.name}: ${parsed.error}`
        )
        return []
      }

      if (!parsed.items.length) {
        console.log(`ingest_jobs: no items in RSS feed: ${feed.name}`)
        return []
      }

      console.log(
        `ingest_jobs: got ${parsed.items.length} items from RSS feed: ${feed.name}`
      )

      // Convert items to normalized format for RSSSource
      return parsed.items.map((item) => ({
        item,
        feedSource: feed,
        feedUrl: feed.feedUrl,
      }))
    } catch (err) {
      console.error(`ingest_jobs: error fetching RSS feed ${feed.name}:`, err)
      return []
    }
  })

  const feedResults = await Promise.all(promises)
  for (const items of feedResults) {
    results.push(...items)
  }

  console.log(
    `ingest_jobs: fetched ${results.length} total items from ${feedsToFetch.length} RSS feeds`
  )

  return results
}

/**
 * Fetch from all companies in parallel using concurrent fetcher
 */
async function fetchFromAllCompaniesInParallel(
  supabase: ReturnType<typeof createAdminClient>,
  platforms: ('lever' | 'greenhouse')[]
): Promise<{
  lever: any[];
  greenhouse: any[];
}> {
  const allJobs: { lever: any[]; greenhouse: any[] } = { lever: [], greenhouse: [] };

  for (const platform of platforms) {
    try {
      const companies = await getCompaniesFromRegistry(supabase, platform);

      if (!companies.length) {
        console.log(
          `ingest_jobs: no ${platform} companies to fetch`
        );
        continue;
      }

      // Fetch in parallel with rate limiting
      const tasks = companies.map((company) => ({
        companyId: company.id,
        companyName: company.name,
        fetchFn:
          platform === 'lever'
            ? () => fetchLeverJobsForCompany(company)
            : () => fetchGreenhouseJobsForCompany(company),
      }));

      const results = await fetchCompaniesInParallel(tasks, {
        concurrency: 8,
        interval: 60000, // 1 minute
        intervalCap: 100, // 100 requests/minute
      });

      // Aggregate results
      const successfulResults = results.filter(
        (r) => r.status === 'success'
      );
      const totalJobs = successfulResults.reduce(
        (sum, r) => sum + (r.jobCount || 0),
        0
      );
      const failedCount = results.filter(
        (r) => r.status === 'failed'
      ).length;

      console.log(
        `ingest_jobs: ${platform} parallel fetch complete:`,
        JSON.stringify({
          total_companies: companies.length,
          successful: successfulResults.length,
          failed: failedCount,
          total_jobs: totalJobs,
        })
      );

      // Update sync timestamps for successfully fetched companies
      const syncField = platform === 'lever' ? 'last_synced_at_lever' : 'last_synced_at_greenhouse'
      const successCompanyIds = successfulResults.map(r => r.companyId).filter(Boolean)
      
      if (successCompanyIds.length > 0) {
        const { error: syncUpdateError } = await supabase
          .from('companies')
          .update({ [syncField]: new Date().toISOString() })
          .in('id', successCompanyIds)
        
        if (syncUpdateError) {
          console.warn(`Failed to update ${platform} sync timestamps:`, syncUpdateError.message)
        } else {
          console.log(`ingest_jobs: updated ${platform} sync timestamps for ${successCompanyIds.length} companies`)
        }
      }

      for (const result of successfulResults) {
        allJobs[platform].push(...(result.jobs || []));
      }
    } catch (err) {
      console.error(
        `Failed to fetch from ${platform} companies:`,
        err
      );
    }
  }

  return allJobs;
}

async function loadIngestionState(
  supabase: ReturnType<typeof createAdminClient>,
  sourceSlug: string
): Promise<IngestionState> {
  try {
    const { data, error } = await supabase
      .from('job_ingestion_state')
      .select('cursor,last_run_at')
      .eq('source', sourceSlug)
      .maybeSingle()

    if (error) {
      console.warn(
        'ingest_jobs: could not load ingestion state for',
        sourceSlug,
        error.message
      )
      return { cursor: { page: 1, since: null }, last_run_at: null }
    }

    if (!data) {
      return { cursor: { page: 1, since: null }, last_run_at: null }
    }

    return {
      cursor: (data.cursor as IngestionCursor) || { page: 1, since: null },
      last_run_at: (data.last_run_at as string | null) ?? null,
    }
  } catch (err) {
    console.warn(
      'ingest_jobs: failed loading ingestion state, defaulting to page 1 for',
      sourceSlug,
      err
    )
    return { cursor: { page: 1, since: null }, last_run_at: null }
  }
}

async function persistIngestionState(
  supabase: ReturnType<typeof createAdminClient>,
  sourceSlug: string,
  cursor: IngestionCursor,
  lastRunAt: string
) {
  const { error } = await supabase
    .from('job_ingestion_state')
    .upsert(
      {
        source: sourceSlug,
        cursor,
        last_run_at: lastRunAt,
      },
      { onConflict: 'source' }
    )

  if (error) {
    console.error('ingest_jobs: failed to persist ingestion state', sourceSlug, error)
  }
}

/**
 * Compute a dedup_key for cross-source deduplication
 * Uses MD5 hash of normalized title + company + location
 */
function computeDedupKey(title: string | null, company: string | null, location: string | null, companyId?: string | null): string {
  const normalizedTitle = (title || '').toLowerCase().trim()
  const normalizedCompany = companyId || (company || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const normalizedLocation = (location || '').toLowerCase().replace(/[^a-z0-9]/g, '')

  // Simple hash function (same logic as SQL function)
  const input = `${normalizedTitle}|${normalizedCompany}|${normalizedLocation}`

  // Use a simple hash for JS side (crypto.subtle not available in all envs)
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Convert to hex string padded to 32 chars (like MD5)
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return `${hex}${hex}${hex}${hex}`.slice(0, 32)
}

// Return type for upsertJobs with accurate counts
type UpsertResult = {
  inserted: number  // Truly new jobs
  updated: number   // Existing jobs that were updated
  noop: number      // Jobs that matched but had no changes
}

// Upsert a batch of normalized jobs into the jobs table
export async function upsertJobs(jobs: NormalizedJob[]): Promise<UpsertResult> {
  if (!jobs.length) return { inserted: 0, updated: 0, noop: 0 }

  // 🔹 De-dupe by (source_slug, external_id) so Postgres does not try to
  // update the same row twice in a single ON CONFLICT command.
  // Also de-dupe by computed dedup_key to prevent processing the same
  // logical job multiple times in one batch (cross-source within batch).
  const seenSourceExternal = new Set<string>()
  const seenDedupKey = new Set<string>()
  let filteredSourceExternal = 0
  let filteredDedupKey = 0

  const uniqueJobs = jobs.filter((j) => {
    // First check source_slug::external_id
    const sourceKey = `${j.source_slug}::${j.external_id}`
    if (seenSourceExternal.has(sourceKey)) {
      filteredSourceExternal++
      return false
    }
    seenSourceExternal.add(sourceKey)

    // Then check dedup_key to skip same logical job from different sources in same batch
    const dedupKey = computeDedupKey(j.title, j.company, j.location, (j as any).company_id)
    if (dedupKey && seenDedupKey.has(dedupKey)) {
      filteredDedupKey++
      return false
    }
    if (dedupKey) seenDedupKey.add(dedupKey)

    return true
  })

  if (filteredSourceExternal > 0 || filteredDedupKey > 0) {
    console.log(
      `ingest_jobs: pre-filtered ${filteredSourceExternal} source/id dupes, ${filteredDedupKey} cross-source dupes before upsert`
    )
  }

  const supabase = createAdminClient()

  // Enrich job URLs with direct company links (batch approach for speed)
  let urlEnrichmentCount = 0

  // Use batch enrichment with concurrency 5 to avoid overloading
  const enrichmentResults = await enrichJobURLs(uniqueJobs, undefined, 5)

  const urlEnrichedJobs = uniqueJobs.map((job, index) => {
    const enrichment = enrichmentResults[index]
    if (enrichment?.enriched_url && enrichment.enriched_url !== job.external_url) {
      urlEnrichmentCount++
      return {
        ...job,
        external_url: enrichment.enriched_url,
      }
    }
    return job
  })

  if (urlEnrichmentCount > 0) {
    console.log(`ingest_jobs: enriched ${urlEnrichmentCount} job URLs with direct company links`)
  }

  // Enrich jobs with ATS metadata and URL enrichment data
  const enrichedJobs = urlEnrichedJobs.map((j, index) => {
    const atsEnrichment = enrichJob(j.title, j.description || '')
    const urlEnrichment = enrichmentResults[index]

    // Compute dedup_key with multi-layer fallback
    // 1. Try hash of title|company|location
    let dedupKey = computeDedupKey(j.title, j.company, j.location)

    // 2. If that fails, try source:external_id (but validate external_id isn't literally "undefined")
    if (!dedupKey || j.external_id === 'undefined' || j.external_id === 'null') {
      if (j.external_id && j.external_id !== 'undefined' && j.external_id !== 'null') {
        dedupKey = `${j.source_slug}:${j.external_id}`
      } else {
        // 3. Ultimate fallback: hash of url if available, else source + sequential
        dedupKey = j.external_url
          ? computeDedupKey(j.external_url, j.title, j.company)
          : computeDedupKey(j.title, j.company, j.location)
      }
    }

    // Validate we have something before the database sees it
    if (!dedupKey || dedupKey.length === 0) {
      console.error(`ingest_jobs: unable to compute dedup_key for ${j.source_slug}:${j.external_id} (${j.title} @ ${j.company})`)
      dedupKey = `${j.source_slug}:${j.external_id}:${Date.now()}`
    }

    return {
      source: j.source_slug || 'unknown', // GUARD: source must NEVER be null
      source_slug: j.source_slug,
      external_id: j.external_id,
      dedup_key: dedupKey,

      title: j.title,
      company: j.company,
      location: j.location,
      employment_type: j.employment_type,
      remote_type: j.remote_type,

      posted_date: j.posted_date,
      created_at: j.created_at,
      external_url: j.external_url,

      salary_min: j.salary_min,
      salary_max: j.salary_max,
      competitiveness_level: j.competitiveness_level,

      description: j.description,
      is_active: true,

      // FRESHNESS TRACKING - always set to now() for proper cleanup decisions
      last_seen_at: new Date().toISOString(),

      // URL enrichment fields (from jobURLEnricher)
      is_direct: urlEnrichment?.is_direct ?? false,
      ats_type: urlEnrichment?.ats_type ?? null,
      enrichment_confidence: urlEnrichment?.enrichment_confidence ?? 0.5,

      // ATS enrichment fields
      seniority_level: atsEnrichment.seniority_level,
      experience_years_min: atsEnrichment.experience_years_min,
      experience_years_max: atsEnrichment.experience_years_max,
      required_skills: atsEnrichment.required_skills.length > 0 ? atsEnrichment.required_skills : null,
      preferred_skills: atsEnrichment.preferred_skills.length > 0 ? atsEnrichment.preferred_skills : null,
      education_level: atsEnrichment.education_level,
      industry: atsEnrichment.industry,
    }
  })

  // Try using the RPC function for accurate counts
  try {
    const { data: rpcResult, error: rpcError, status } = await supabase
      .rpc('upsert_jobs_counted', { jobs: enrichedJobs })

    if (rpcError) {
      console.error(`ingest_jobs: RPC upsert_jobs_counted failed [status=${status}]:`, {
        message: rpcError.message,
        code: (rpcError as any)?.code,
        details: (rpcError as any)?.details,
        hint: (rpcError as any)?.hint,
      })
    } else if (!rpcResult || rpcResult.length === 0) {
      console.error('ingest_jobs: RPC returned empty result:', { rpcResult, jobsCount: enrichedJobs.length })
    } else {
      const { inserted_count, updated_count, noop_count } = rpcResult[0]
      console.log(
        `ingest_jobs: upserted via RPC - ${inserted_count} inserted, ${updated_count} updated, ${noop_count} unchanged`
      )
      return {
        inserted: inserted_count ?? 0,
        updated: updated_count ?? 0,
        noop: noop_count ?? 0,
      }
    }

    // If RPC failed, log that we're falling back
    console.warn(`ingest_jobs: RPC upsert_jobs_counted not available, using direct upsert (counts will be inaccurate)`)
  } catch (rpcErr) {
    console.error('ingest_jobs: RPC call threw exception, falling back to direct upsert:', {
      error: rpcErr instanceof Error ? rpcErr.message : String(rpcErr),
      stack: rpcErr instanceof Error ? rpcErr.stack : undefined,
    })
  }

  // Validate all jobs have source_slug BEFORE enrichment
  const jobsWithoutSource = enrichedJobs.filter(j => !j.source_slug || j.source_slug.length === 0)
  if (jobsWithoutSource.length > 0) {
    console.error(`ingest_jobs: CRITICAL - ${jobsWithoutSource.length} jobs missing source_slug, rejecting batch:`)
    jobsWithoutSource.slice(0, 3).forEach(j => {
      console.error(`  - external_id=${j.external_id}, title="${j.title}", source_slug="${j.source_slug}"`)
    })
    throw new Error(`Ingestion validation failed: ${jobsWithoutSource.length} jobs have NULL source_slug`)
  }

  // Safety net: Ensure every job has dedup_key before upserting
  // This prevents NOT NULL constraint violations if enrichment failed somewhere
  const invalidJobs: any[] = []
  const safeJobs = enrichedJobs
    .map((j) => {
      if (j.dedup_key) return j
      const computedKey = computeDedupKey(j.title, j.company, j.location)
      if (!computedKey) {
        // Invalid job - mark for filtering
        invalidJobs.push({
          source: j.source_slug,
          external_id: j.external_id,
          title: j.title,
          company: j.company,
          reason: 'no title/company/location for dedup_key'
        })
        return null
      }
      return { ...j, dedup_key: computedKey || `${j.source_slug}:${j.external_id}` }
    })
    .filter((j) => j !== null) as typeof enrichedJobs

  // Log validation result
  if (invalidJobs.length > 0) {
    console.warn(`ingest_jobs: filtering ${invalidJobs.length} invalid jobs (missing dedup_key):`)
    invalidJobs.slice(0, 3).forEach(job => {
      console.warn(`  - ${job.source}:${job.external_id} (${job.title} @ ${job.company}): ${job.reason}`)
    })
  }

  if (safeJobs.length === 0) {
    console.warn('ingest_jobs: all jobs filtered out before insert, returning 0')
    return { inserted: 0, updated: 0, noop: 0 }
  }

  // Fallback: Direct upsert (counts will be inaccurate because we can't distinguish inserts from updates)
  console.log(`ingest_jobs: FALLBACK - upserting ${safeJobs.length} jobs without RPC accuracy`)
  const { data, error, count } = await supabase
    .from('jobs')
    .upsert(safeJobs, {
      onConflict: 'dedup_key',  // Cross-source deduplication
      ignoreDuplicates: false,  // Update existing jobs with fresh data
      count: 'exact',
    })
    .select('id')

  if (error) {
    console.error('ingest_jobs: fallback upsert error', error)
    throw error
  }

  // Log what we got back from Supabase
  console.log(`ingest_jobs: fallback upsert response - data.length=${data?.length}, count=${count}, safeJobs.length=${safeJobs.length}`)

  // CRITICAL: This count includes BOTH inserts and updates
  // We cannot distinguish between them without RPC, so table growth will appear stalled
  // if most jobs are updates of existing records
  const upsertedCount = data?.length ?? count ?? safeJobs.length
  console.error(`ingest_jobs: CRITICAL - Reported ${upsertedCount} "inserted" but this includes updates. Actual new inserts unknown (RPC unavailable)`)

  // Return with updated=0 since we can't distinguish without RPC
  return { inserted: upsertedCount, updated: 0, noop: 0 }
}

/**
 * Filter jobs by freshness based on source config
 * Jobs older than maxAgeDays are filtered out
 */
function filterByFreshness(
  jobs: NormalizedJob[],
  config: SourceConfig
): { fresh: NormalizedJob[]; staleCount: number } {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.maxAgeDays);
  const cutoffTime = cutoffDate.getTime();

  const fresh: NormalizedJob[] = [];
  let staleCount = 0;

  for (const job of jobs) {
    // If no posted_date, assume it's fresh (conservative)
    if (!job.posted_date) {
      fresh.push(job);
      continue;
    }

    const postedDate = new Date(job.posted_date);
    if (isNaN(postedDate.getTime())) {
      // Invalid date, assume fresh
      fresh.push(job);
      continue;
    }

    if (postedDate.getTime() >= cutoffTime) {
      fresh.push(job);
    } else {
      staleCount++;
    }
  }

  return { fresh, staleCount };
}

/**
 * Special ingest handler for Greenhouse that iterates through multiple configured boards
 */
/**
 * Fetch all jobs from a Greenhouse board, following pagination links
 * Greenhouse uses RFC-5988 Link headers for pagination
 */
async function fetchGreenhouseAllPages(
  boardUrl: string,
  source: JobSource,
  maxPages: number = 100
): Promise<any[]> {
  const allJobs: any[] = []
  let currentUrl: string | null = boardUrl
  let pageCount = 0

  while (currentUrl && pageCount < maxPages) {
    try {
      pageCount++
      console.log(`ingest_jobs: Greenhouse fetching page ${pageCount}: ${currentUrl}`)

      const headers: Record<string, string> = buildHeaders(source)
      const res = await fetch(currentUrl, {
        method: 'GET',
        headers,
      })

      if (!res.ok) {
        console.error(
          `ingest_jobs: Greenhouse page ${pageCount} failed:`,
          res.status,
          res.statusText
        )
        break
      }

      const pageData = await res.json().catch((err) => {
        console.error(`ingest_jobs: Greenhouse failed to parse page ${pageCount}:`, err)
        return null
      })

      if (!pageData) break

      // Extract jobs from this page
      if (Array.isArray(pageData.jobs)) {
        allJobs.push(...pageData.jobs)
        console.log(
          `ingest_jobs: Greenhouse page ${pageCount} fetched ${pageData.jobs.length} jobs (total: ${allJobs.length})`
        )
      }

      // Check for next page via Link header (RFC-5988)
      const linkHeader = res.headers.get('link')
      currentUrl = null

      if (linkHeader) {
        // Parse Link header: <url>; rel="next", <url>; rel="prev", etc.
        const links = linkHeader.split(',').map((link) => link.trim())
        for (const link of links) {
          const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/)
          if (match && match[2] === 'next') {
            currentUrl = match[1]
            break
          }
        }
      }

      if (!currentUrl) {
        console.log(
          `ingest_jobs: Greenhouse reached last page at page ${pageCount} (${allJobs.length} total jobs)`
        )
      }
    } catch (err) {
      console.error(`ingest_jobs: Greenhouse page ${pageCount} error:`, err)
      break
    }
  }

  if (pageCount >= maxPages) {
    console.warn(
      `ingest_jobs: Greenhouse hit max pages limit (${maxPages}). May have more jobs available.`
    )
  }

  return allJobs
}

async function ingestGreenhouseBoards(
  source: JobSource,
  runId?: string
): Promise<IngestResult> {
  const supabase = createAdminClient()
  const sourceConfig = getSourceConfig(source.slug)
  const boards = parseGreenhouseBoards()

  if (!boards.length) {
    console.log('ingest_jobs: no Greenhouse boards configured')
    return {
      source: source.slug,
      count: 0,
      normalized: 0,
      duplicates: 0,
      staleFiltered: 0,
      status: 'skipped',
      skipReason: 'no boards configured',
    }
  }

  const maxBoardsPerRun = parseInt(
    process.env.GREENHOUSE_MAX_BOARDS_PER_RUN || String(DEFAULT_GREENHOUSE_MAX_BOARDS_PER_RUN),
    10
  )
  const maxJobsPerBoard = parseInt(
    process.env.GREENHOUSE_MAX_JOBS_PER_BOARD || String(DEFAULT_GREENHOUSE_MAX_JOBS_PER_BOARD),
    10
  )

  const runStartedAt = new Date().toISOString()
  let totalNormalized = 0
  let totalInserted = 0
  let totalUpdated = 0
  let totalNoop = 0
  let totalDuplicates = 0
  let totalStaleFiltered = 0
  let sourceStatus: 'success' | 'failed' = 'success'
  let sourceError: string | null = null

  // Create source run log if runId provided
  let sourceRunId: string | null = null
  if (runId) {
    const { data: sourceRun, error: sourceRunError } = await supabase
      .from('job_ingestion_run_sources')
      .insert({
        run_id: runId,
        source: source.slug,
        started_at: runStartedAt,
        status: 'running',
        page_start: 1,
        cursor_in: { page: 1, since: null },
      })
      .select('id')
      .single()

    if (!sourceRunError && sourceRun) {
      sourceRunId = sourceRun.id
    }
  }

  console.log(
    `ingest_jobs: starting Greenhouse ingest with ${boards.length} boards (max ${maxBoardsPerRun} per run)`
  )

  try {
    // Cap boards processed per run
    const boardsToProcess = boards.slice(0, maxBoardsPerRun)

    for (const board of boardsToProcess) {
      try {
        console.log(`ingest_jobs: fetching jobs from Greenhouse board: ${board.companyName}`)

        // Build Greenhouse API URL for this board
        const boardUrl = `https://api.greenhouse.io/v1/boards/${board.boardToken}/jobs?content=true`

        // Fetch ALL pages from this board using Link header pagination
        const allJobsFromPages = await fetchGreenhouseAllPages(boardUrl, source)
        if (!allJobsFromPages || !allJobsFromPages.length) {
          console.warn(`ingest_jobs: no data from Greenhouse board ${board.companyName}`)
          continue
        }

        // Create a synthetic response object that matches the expected structure
        const raw = { jobs: allJobsFromPages }

        // Normalize the response
        let normalized: NormalizedJob[] = []
        try {
          const normalizedResult = await Promise.resolve(source.normalize(raw))
          normalized = normalizedResult || []
        } catch (err) {
          console.error(
            `ingest_jobs: normalize failed for Greenhouse board ${board.companyName}`,
            err
          )
          continue
        }

        if (!normalized.length) {
          console.log(
            `ingest_jobs: no jobs after normalize for Greenhouse board ${board.companyName}`
          )
          continue
        }

        // Enrich jobs with company name from board config
        const enrichedNormalized = normalized.map((job) => ({
          ...job,
          company: job.company || board.companyName,
        }))

        // Apply freshness filter
        const { fresh, staleCount } = filterByFreshness(enrichedNormalized, sourceConfig)
        totalStaleFiltered += staleCount

        if (staleCount > 0) {
          console.log(
            `ingest_jobs: filtered ${staleCount} stale jobs from Greenhouse board ${board.companyName}`
          )
        }

        totalNormalized += normalized.length

        if (!fresh.length) {
          console.log(
            `ingest_jobs: all jobs stale after freshness filter for Greenhouse board ${board.companyName}`
          )
          continue
        }

        // Cap jobs per board
        const jobsToInsert = fresh.slice(0, maxJobsPerBoard)
        if (jobsToInsert.length < fresh.length) {
          console.log(
            `ingest_jobs: capping Greenhouse jobs for ${board.companyName}: ${jobsToInsert.length} of ${fresh.length}`
          )
        }

        const duplicateCount = jobsToInsert.length
        console.log(
          `ingest_jobs: normalized ${normalized.length} → ${jobsToInsert.length} fresh jobs from Greenhouse board ${board.companyName}`
        )

        // Resolve company_id and enrich jobs with dedup_key before upsert
        const enrichedJobsToInsert = await Promise.all(jobsToInsert.map(async (j) => {
          const companyId = await resolveCompanyId(j.company)
          return {
            ...j,
            company_id: companyId,
            dedup_key: computeDedupKey(j.title, j.company, j.location, companyId),
          }
        }))

        const upsertResult = await upsertJobs(enrichedJobsToInsert)
        totalInserted += upsertResult.inserted
        totalUpdated += upsertResult.updated
        totalNoop += upsertResult.noop
        totalDuplicates += upsertResult.updated + upsertResult.noop
        console.log(
          `ingest_jobs: upserted ${upsertResult.inserted} new, ${upsertResult.updated} updated from Greenhouse board ${board.companyName}`
        )
      } catch (boardError) {
        console.error(
          `ingest_jobs: error processing Greenhouse board ${board.companyName}`,
          boardError
        )
        // Continue with next board
      }
    }

    // Log if we capped boards
    if (boardsToProcess.length < boards.length) {
      console.log(
        `ingest_jobs: Greenhouse cap enforced: processed ${boardsToProcess.length}/${boards.length} boards`
      )
    }
  } catch (ingestError) {
    sourceStatus = 'failed'
    // Properly handle Supabase error objects
    if (ingestError instanceof Error) {
      sourceError = ingestError.message
    } else if (typeof ingestError === 'object' && ingestError !== null) {
      sourceError = (ingestError as any).message || JSON.stringify(ingestError, null, 2)
    } else {
      sourceError = String(ingestError)
    }
    console.error(`ingest_jobs: error during Greenhouse ingest`, ingestError)
  }

  const finishedAt = new Date().toISOString()

  // Calculate freshness ratio
  const freshnessRatio = totalNormalized > 0
    ? ((totalNormalized - totalStaleFiltered) / totalNormalized)
    : 1

  console.log(
    `ingest_jobs: finished Greenhouse ingest`,
    JSON.stringify({
      totalNormalized,
      totalInserted,
      totalDuplicates,
      totalStaleFiltered,
      freshnessRatio: freshnessRatio.toFixed(4),
      status: sourceStatus,
    })
  )

  // Update source run log
  if (sourceRunId) {
    await supabase
      .from('job_ingestion_run_sources')
      .update({
        finished_at: finishedAt,
        status: sourceStatus,
        page_end: 1,
        normalized_count: totalNormalized,
        inserted_count: totalInserted,
        updated_count: totalUpdated,
        noop_count: totalNoop,
        duplicate_count: totalDuplicates,
        error_message: sourceError,
        cursor_out: { page: 1, since: runStartedAt },
      })
      .eq('id', sourceRunId)
  }

  // Update source health with error details
  const ghHealthUpdate: Record<string, any> = {
    source: source.slug,
    last_run_at: finishedAt,
    last_counts: {
      normalized: totalNormalized,
      inserted: totalInserted,
      updated: totalUpdated,
      noop: totalNoop,
      duplicates: totalDuplicates,
      staleFiltered: totalStaleFiltered,
      freshnessRatio,
    },
  }

  if (sourceStatus === 'success') {
    ghHealthUpdate.last_success_at = finishedAt
    ghHealthUpdate.consecutive_failures = 0
    ghHealthUpdate.is_degraded = false
    ghHealthUpdate.last_error_message = null
  } else {
    ghHealthUpdate.last_error_at = finishedAt
    ghHealthUpdate.consecutive_failures = 1
    ghHealthUpdate.is_degraded = true
    ghHealthUpdate.last_error_message = sourceError ? sourceError.slice(0, 500) : 'Unknown error'
  }

  await supabase.from('job_source_health').upsert(ghHealthUpdate, { onConflict: 'source' })

  // Update adaptive cooldown state based on run performance
  await updateAdaptiveState(source.slug, totalInserted, totalUpdated, totalNoop)

  // Persist state
  await persistIngestionState(
    supabase,
    source.slug,
    { page: 1, since: runStartedAt },
    runStartedAt
  )

  // Update job_sources bookkeeping
  try {
    const { error: statusError } = await supabase
      .from('job_sources')
      .update({
        last_sync: runStartedAt,
        last_error: sourceError,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', source.slug)

    if (statusError) {
      console.error(
        'ingest_jobs: failed to update job_sources status for Greenhouse',
        statusError
      )
    }
  } catch (e) {
    console.error('ingest_jobs: exception while updating job_sources status for Greenhouse', e)
  }

  return {
    source: source.slug,
    count: totalInserted,
    normalized: totalNormalized,
    duplicates: totalDuplicates,
    staleFiltered: totalStaleFiltered,
    status: sourceStatus,
    error: sourceError || undefined,
  }
}

async function ingest(
  source: JobSource, 
  runId?: string,
  searchParams?: { keywords?: string; location?: string;[key: string]: any }
): Promise<IngestResult> {
  const supabase = createAdminClient()
  const pagination = SOURCE_PAGINATION[source.slug] || {}
  const sourceConfig = getSourceConfig(source.slug)
  const state = await loadIngestionState(supabase, source.slug)

  // Check adaptive cooldown
  if (state.last_run_at && await shouldSkipDueToAdaptiveCooldown(source.slug, sourceConfig.cooldownMinutes, new Date(state.last_run_at))) {
    console.log(`[Ingest: ${source.slug}] Skipping due to adaptive cooldown`)
    return {
      source: source.slug,
      count: 0,
      normalized: 0,
      duplicates: 0,
      staleFiltered: 0,
      status: 'skipped',
      skipReason: 'cooldown',
    }
  }

  // Use config for pagination, with fallback to old SOURCE_PAGINATION
  let page = sourceConfig.resetPaginationEachRun ? 1 : (state.cursor.page ?? 1)
  const since = state.cursor.since ?? state.last_run_at ?? null
  const maxPages = sourceConfig.maxPagesPerRun ?? pagination.maxPagesPerRun ?? DEFAULT_MAX_PAGES_PER_RUN
  const expectedPageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE

  const runStartedAt = new Date().toISOString()
  let totalNormalized = 0
  let totalInserted = 0
  let totalUpdated = 0
  let totalNoop = 0
  let totalDuplicates = 0
  let totalStaleFiltered = 0
  let sourceStatus: 'success' | 'failed' = 'success'
  let sourceError: string | null = null

  // Create source run log if runId provided
  let sourceRunId: string | null = null
  if (runId) {
    const { data: sourceRun, error: sourceRunError } = await supabase
      .from('job_ingestion_run_sources')
      .insert({
        run_id: runId,
        source: source.slug,
        started_at: runStartedAt,
        status: 'running',
        page_start: page,
        cursor_in: { page, since },
      })
      .select('id')
      .single()

    if (!sourceRunError && sourceRun) {
      sourceRunId = sourceRun.id
    }
  }

  console.log(
    `[Ingest: ${source.slug}] Starting with cursor`,
    JSON.stringify({ page, since, maxPages, mode: sourceConfig.mode, maxAgeDays: sourceConfig.maxAgeDays })
  )

  try {
    // Special handling for RSS: fetch all configured feeds
    if (source.slug === 'rss') {
      const enabled = process.env.ENABLE_SOURCE_RSS !== 'false'

      if (!enabled) {
        console.log('ingest_jobs: RSS disabled via ENABLE_SOURCE_RSS')
        return {
          source: source.slug,
          count: 0,
          normalized: 0,
          duplicates: 0,
          staleFiltered: 0,
          status: 'skipped',
          skipReason: 'disabled',
        }
      }

      const maxFeeds = parseInt(process.env.RSS_MAX_FEEDS_PER_RUN || '25', 10)
      const feedItems = await fetchFromAllRSSFeedsInParallel(maxFeeds)

      if (!feedItems.length) {
        console.log('ingest_jobs: no items from RSS feeds')
        return {
          source: source.slug,
          count: 0,
          normalized: 0,
          duplicates: 0,
          staleFiltered: 0,
          status: 'success',
        }
      }

      console.log(`ingest_jobs: normalizing ${feedItems.length} RSS items`)

      let normalized: NormalizedJob[] = []
      try {
        const normalizedResult = await Promise.resolve(source.normalize(feedItems))
        normalized = normalizedResult || []
      } catch (err) {
        console.error('ingest_jobs: normalize failed for RSS', err)
        sourceStatus = 'failed'
        sourceError = err instanceof Error ? err.message : String(err)
        throw err
      }

      totalNormalized = normalized.length

      // Apply freshness filter
      const { fresh, staleCount } = filterByFreshness(normalized, sourceConfig)
      totalStaleFiltered = staleCount

      if (staleCount > 0) {
        console.log(
          `ingest_jobs: filtered ${staleCount} stale RSS jobs (>${sourceConfig.maxAgeDays} days old)`
        )
      }

      if (!fresh.length) {
        console.log('ingest_jobs: all RSS jobs filtered by freshness')
        return {
          source: source.slug,
          count: 0,
          normalized: totalNormalized,
          duplicates: 0,
          staleFiltered: totalStaleFiltered,
          status: 'success',
        }
      }

      console.log(`ingest_jobs: upserting ${fresh.length} fresh RSS jobs`)

      // Resolve company_id and enrich jobs with dedup_key before upsert
      const enrichedFresh = await Promise.all(fresh.map(async (j) => {
        const companyId = await resolveCompanyId(j.company)
        return {
          ...j,
          company_id: companyId,
          dedup_key: computeDedupKey(j.title, j.company, j.location, companyId),
        }
      }))

      const upsertResult = await upsertJobs(enrichedFresh)
      totalInserted = upsertResult.inserted
      totalUpdated = upsertResult.updated
      totalNoop = upsertResult.noop
      totalDuplicates = upsertResult.updated + upsertResult.noop

      console.log(`ingest_jobs: finished RSS ingest: ${totalInserted} inserted, ${upsertResult.updated} updated, ${upsertResult.noop} unchanged`)
    } // Special handling for Lever and Greenhouse: multi-company parallel fetch
    else if (source.slug === 'lever' || source.slug === 'greenhouse') {
      const platform = source.slug as 'lever' | 'greenhouse';
      const enabled =
        platform === 'lever'
          ? process.env.ENABLE_SOURCE_LEVER !== 'false'
          : process.env.ENABLE_SOURCE_GREENHOUSE !== 'false';

      if (!enabled) {
        console.log(`ingest_jobs: ${platform} disabled via ENABLE_SOURCE_${platform.toUpperCase()}`)
        return {
          source: source.slug,
          count: 0,
          normalized: 0,
          duplicates: 0,
          staleFiltered: 0,
          status: 'skipped',
          skipReason: 'disabled',
        }
      }

      // Fetch from all companies in parallel using registry
      const allJobs = await fetchFromAllCompaniesInParallel(supabase, [platform]);
      // Note: We don't propagate searchParams to Lever/Greenhouse yet as they are company-specific,
      // but in the future we could filter the returned jobs by keyword if needed.
      const jobsList = allJobs[platform] || [];

      if (!jobsList.length) {
        console.log(`ingest_jobs: no jobs from ${platform} companies`)
        return {
          source: source.slug,
          count: 0,
          normalized: 0,
          duplicates: 0,
          staleFiltered: 0,
          status: 'success',
        }
      }

      console.log(`ingest_jobs: normalizing ${jobsList.length} jobs from ${platform}`)

      let normalized: NormalizedJob[] = []
      try {
        const normalizedResult = await Promise.resolve(source.normalize(jobsList))
        normalized = normalizedResult || []
      } catch (err) {
        console.error(`ingest_jobs: normalize failed for ${platform}`, err)
        sourceStatus = 'failed'
        sourceError = err instanceof Error ? err.message : String(err)
        throw err
      }

      totalNormalized = normalized.length

      // Apply freshness filter
      const { fresh, staleCount } = filterByFreshness(normalized, sourceConfig)
      totalStaleFiltered = staleCount

      if (staleCount > 0) {
        console.log(
          `ingest_jobs: filtered ${staleCount} stale jobs (>${sourceConfig.maxAgeDays} days old) from ${platform}`
        )
      }

      if (!fresh.length) {
        console.log(`ingest_jobs: all ${platform} jobs filtered by freshness`)
        return {
          source: source.slug,
          count: 0,
          normalized: totalNormalized,
          duplicates: 0,
          staleFiltered: totalStaleFiltered,
          status: 'success',
        }
      }

      console.log(`ingest_jobs: upserting ${fresh.length} fresh ${platform} jobs`)

      // Resolve company_id and enrich jobs with dedup_key before upsert
      const enrichedFresh = await Promise.all(fresh.map(async (j) => {
        const companyId = await resolveCompanyId(j.company)
        return {
          ...j,
          company_id: companyId,
          dedup_key: computeDedupKey(j.title, j.company, j.location, companyId),
        }
      }))

      const upsertResult = await upsertJobs(enrichedFresh)
      totalInserted = upsertResult.inserted
      totalUpdated = upsertResult.updated
      totalNoop = upsertResult.noop
      totalDuplicates = upsertResult.updated + upsertResult.noop

      console.log(`ingest_jobs: finished ${platform} ingest: ${totalInserted} inserted, ${upsertResult.updated} updated, ${upsertResult.noop} unchanged`)
    } else {
      // Standard pagination-based ingestion for other sources
      for (let i = 0; i < maxPages; i++) {
        const url = buildSourceUrl(source, { page, since }, searchParams)

        if (!url) {
          console.warn(`ingest_jobs: no URL for ${source.slug}, skipping`)
          break
        }

        console.log(
          `ingest_jobs: fetching from ${source.slug} (${url}) [page ${page}]`
        )

        const result = await fetchJson(url, source, { page, since }, searchParams)

        if (!result.ok) {
          // Classify the error type for better observability
          let failureClassification = 'unknown'
          if (result.status === 401 || result.status === 403) {
            failureClassification = 'blocked (auth/access denied)'
          } else if (result.status === 429) {
            failureClassification = 'rate_limited'
          } else if (result.kind === 'network') {
            failureClassification = 'network_error'
          } else if (result.kind === 'parse') {
            failureClassification = 'parse_error'
          }

          console.error(
            `ingest_jobs: fetch failed for ${source.slug} on page ${page} [${failureClassification}]`,
            {
              kind: result.kind,
              status: result.status,
              message: result.message,
            }
          )
          // Network/HTTP errors should stop the pagination loop for this source
          sourceStatus = 'failed'
          sourceError = `[${failureClassification}] ${result.message}`
          break
        }

        const raw = result.data
        if (!raw) {
          console.warn(`ingest_jobs: no data from ${source.slug} on page ${page}`)
          break
        }

        let normalized: NormalizedJob[] = []
        try {
          const normalizedResult = await Promise.resolve(source.normalize(raw))
          normalized = normalizedResult || []
        } catch (err) {
          console.error(`ingest_jobs: normalize failed for ${source.slug}`, err)
          break
        }

        if (!normalized.length) {
          console.log(
            `ingest_jobs: no jobs after normalize for ${source.slug} on page ${page}`
          )
          page = 1 // reset so next run starts at beginning
          break
        }

        // Apply freshness filter
        const { fresh, staleCount } = filterByFreshness(normalized, sourceConfig)
        totalStaleFiltered += staleCount

        if (staleCount > 0) {
          console.log(
            `ingest_jobs: filtered ${staleCount} stale jobs (>${sourceConfig.maxAgeDays} days old) from ${source.slug}`
          )
        }

        totalNormalized += normalized.length // Track pre-filter count

        if (!fresh.length) {
          console.log(
            `ingest_jobs: all jobs stale after freshness filter for ${source.slug} on page ${page}`
          )
          // If all jobs are stale, we might be paginating into history - stop
          page = 1
          break
        }

        const duplicateCount = fresh.length
        console.log(
          `ingest_jobs: normalized ${normalized.length} → ${fresh.length} fresh jobs from ${source.slug} on page ${page}`
        )

        // Resolve company_id and enrich jobs with dedup_key before upsert
        const enrichedFresh = await Promise.all(fresh.map(async (j) => {
          const companyId = await resolveCompanyId(j.company)
          return {
            ...j,
            company_id: companyId,
            dedup_key: computeDedupKey(j.title, j.company, j.location, companyId),
          }
        }))

        const upsertResult = await upsertJobs(enrichedFresh)
        totalInserted += upsertResult.inserted
        totalUpdated += upsertResult.updated
        totalNoop += upsertResult.noop
        totalDuplicates += upsertResult.updated + upsertResult.noop
        console.log(
          `ingest_jobs: upserted ${upsertResult.inserted} new, ${upsertResult.updated} updated from ${source.slug} on page ${page}`
        )

        if (normalized.length < expectedPageSize) {
          // Likely the last page; reset cursor so next run starts from the beginning
          page = 1
          break
        }

        page += 1
      }
    }
  } catch (ingestError) {
    sourceStatus = 'failed'
    // Properly handle Supabase error objects
    if (ingestError instanceof Error) {
      sourceError = ingestError.message
    } else if (typeof ingestError === 'object' && ingestError !== null) {
      sourceError = (ingestError as any).message || JSON.stringify(ingestError, null, 2)
    } else {
      sourceError = String(ingestError)
    }
    console.error(`ingest_jobs: error during ingest for ${source.slug}`, ingestError)
  }

  const finishedAt = new Date().toISOString()

  // Calculate freshness ratio
  const freshnessRatio = totalNormalized > 0
    ? ((totalNormalized - totalStaleFiltered) / totalNormalized)
    : 1

  console.log(
    `ingest_jobs: finished ingest for ${source.slug}`,
    JSON.stringify({
      totalNormalized,
      totalInserted,
      totalDuplicates,
      totalStaleFiltered,
      freshnessRatio: freshnessRatio.toFixed(4),
      nextPage: page,
      status: sourceStatus,
    })
  )

  // Update source run log
  if (sourceRunId) {
    await supabase
      .from('job_ingestion_run_sources')
      .update({
        finished_at: finishedAt,
        status: sourceStatus,
        page_end: page,
        normalized_count: totalNormalized,
        inserted_count: totalInserted,
        updated_count: totalUpdated,
        noop_count: totalNoop,
        duplicate_count: totalDuplicates,
        error_message: sourceError,
        cursor_out: { page, since: runStartedAt },
      })
      .eq('id', sourceRunId)
  }

  // Update source health with error details for debugging
  // Note: consecutive_failures should ideally be incremented via SQL, but using upsert for simplicity
  // The healer will still work since it checks consecutive_failures > 0
  const healthUpdate: Record<string, any> = {
    source: source.slug,
    last_run_at: finishedAt,
    last_counts: {
      normalized: totalNormalized,
      inserted: totalInserted,
      updated: totalUpdated,
      noop: totalNoop,
      duplicates: totalDuplicates,
      staleFiltered: totalStaleFiltered,
      freshnessRatio,
    },
  }

  if (sourceStatus === 'success') {
    healthUpdate.last_success_at = finishedAt
    healthUpdate.consecutive_failures = 0
    healthUpdate.is_degraded = false
    healthUpdate.last_error_message = null
  } else {
    healthUpdate.last_error_at = finishedAt
    healthUpdate.consecutive_failures = 1 // Will be incremented by healer if needed
    healthUpdate.is_degraded = true
    healthUpdate.last_error_message = sourceError ? sourceError.slice(0, 500) : 'Unknown error'
  }

  await supabase.from('job_source_health').upsert(healthUpdate, { onConflict: 'source' })

  // Update adaptive cooldown state based on run performance
  await updateAdaptiveState(source.slug, totalInserted, totalUpdated, totalNoop)

  await persistIngestionState(
    supabase,
    source.slug,
    { page, since: runStartedAt },
    runStartedAt
  )

  // Update job_sources bookkeeping for this source on successful ingest
  try {
    const { error: statusError } = await supabase
      .from('job_sources')
      .update({
        last_sync: runStartedAt,
        last_error: sourceError,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', source.slug)

    if (statusError) {
      console.error(
        'ingest_jobs: failed to update job_sources status for',
        source.slug,
        statusError
      )
    }
  } catch (e) {
    console.error(
      'ingest_jobs: exception while updating job_sources status for',
      source.slug,
      e
    )
  }

  return {
    source: source.slug,
    count: totalInserted,
    normalized: totalNormalized,
    duplicates: totalDuplicates,
    staleFiltered: totalStaleFiltered,
    status: sourceStatus,
    error: sourceError || undefined,
  }
}

export async function runIngestion(
  requestedSlug: string | null = null,
  triggeredBy: 'schedule' | 'manual' | 'admin' = 'manual'
): Promise<IngestResult[]> {
  const supabase = createAdminClient()

  // Filter sources: if a specific slug is requested, use it; otherwise use all enabled sources
  let sourcesToRun: JobSource[]
  const isSyncRequest = triggeredBy === 'manual' || triggeredBy === 'admin'

  if (requestedSlug) {
    sourcesToRun = ALL_SOURCES.filter((s) => s.slug === requestedSlug)
  } else {
    // If no slug requested but triggered via sync (manual/admin), we reject if it's too many
    // This forces the use of background workers for full syncs
    if (isSyncRequest) {
      console.warn('ingest_jobs: blocking multi-source sync request to prevent 499 timeout. Use background worker.')
      throw new Error('Multi-source sync via HTTP is disabled to prevent timeouts. Trigger a specific source or use the background worker.')
    }

    // Filter to only enabled sources based on sourceConfig
    sourcesToRun = ALL_SOURCES.filter((s) => {
      const config = getSourceConfig(s.slug)
      if (!config.enabled) {
        console.log(`ingest_jobs: skipping disabled source ${s.slug}`)
        return false
      }
      return true
    })
  }

  if (!sourcesToRun.length) {
    throw new Error(`No matching job source for slug: ${requestedSlug}`)
  }

  const startedAt = new Date().toISOString()

  // Create ingestion run record
  const { data: run, error: runError } = await supabase
    .from('job_ingestion_runs')
    .insert({
      started_at: startedAt,
      status: 'running',
      triggered_by: triggeredBy,
      sources_requested: sourcesToRun.map((s) => s.slug),
    })
    .select('id')
    .single()

  if (runError || !run) {
    console.error('ingest_jobs: failed to create run record', runError)
    // Continue without run tracking
  }

  const runId = run?.id || null
  const startTime = Date.now()
  const MAX_DURATION = 14 * 60 * 1000 // 14 minutes (just under Netlify's 15-min limit)
  const results: IngestResult[] = []
  let failedSourceCount = 0

  // Organize sources into batches for parallel execution within each batch
  // Batches run sequentially to avoid overwhelming Supabase connection pool
  const priorityBatches = [
    // Batch 1: Premium sources (high value, special handling)
    sourcesToRun.filter(s => ['greenhouse', 'lever'].includes(s.slug)),
    // Batch 2: High-volume aggregators (remotive, himalayas, arbeitnow, findwork)
    sourcesToRun.filter(s => ['remotive', 'himalayas', 'arbeitnow', 'findwork'].includes(s.slug)),
    // Batch 3: Medium aggregators (jooble, themuse, reed_uk, careeronestop)
    sourcesToRun.filter(s => ['jooble', 'themuse', 'reed_uk', 'careeronestop'].includes(s.slug)),
    // Batch 4: Remaining sources (low volume, specialized)
    sourcesToRun.filter(s => !['greenhouse', 'lever', 'remotive', 'himalayas', 'arbeitnow', 'findwork', 'jooble', 'themuse', 'reed_uk', 'careeronestop'].includes(s.slug)),
  ].filter(batch => batch.length > 0)

  console.log(`[Ingest] Running ${sourcesToRun.length} sources in ${priorityBatches.length} parallel batches`)

  // Run batches sequentially, but sources within each batch in parallel
  for (let batchIdx = 0; batchIdx < priorityBatches.length; batchIdx++) {
    const batch = priorityBatches[batchIdx]

    // Check if we are approaching the Netlify timeout limit
    if (Date.now() - startTime > MAX_DURATION) {
      const remainingBatches = priorityBatches.slice(batchIdx).flat().map(s => s.slug).join(', ')
      console.warn(`[Ingest] Approaching 15-minute limit. Stopping gracefully. Remaining sources: ${remainingBatches}`)
      break
    }

    console.log(`[Ingest] Starting batch ${batchIdx + 1}/${priorityBatches.length} (${batch.length} sources): ${batch.map(s => s.slug).join(', ')}`)
    const batchStartTime = Date.now()

    // Execute all sources in this batch in parallel
    const batchPromises = batch.map(async (source) => {
      try {
        console.log(`[Ingest: ${source.slug}] Starting...`)
        const result = source.slug === 'greenhouse'
          ? await ingestGreenhouseBoards(source, runId || undefined)
          : await ingest(source, runId || undefined)

        console.log(`[Ingest: ${source.slug}] Finished. Count: ${result.count} in ${Date.now() - batchStartTime}ms`)
        return result
      } catch (err) {
        console.error(`[Ingest: ${source.slug}] Fatal error:`, err)
        return {
          source: source.slug,
          count: 0,
          normalized: 0,
          duplicates: 0,
          staleFiltered: 0,
          status: 'failed' as const,
          error: err instanceof Error ? err.message : String(err),
        }
      }
    })

    // Wait for all sources in this batch to complete
    const batchResults = await Promise.all(batchPromises)

    // Collect results from batch
    batchResults.forEach(result => {
      results.push(result)
      if (result.status === 'failed') {
        failedSourceCount++
      }
    })

    const batchDuration = Date.now() - batchStartTime
    console.log(`[Ingest] Batch ${batchIdx + 1} completed in ${batchDuration}ms with ${batchResults.filter(r => r.status === 'success').length}/${batchResults.length} successful`)
  }

  const summary = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.source] = r.count
    return acc
  }, {})
  console.log('ingest_jobs: completed ingestion run', summary)

  // Build detailed error summary for failed sources
  const failedSources = results.filter(r => r.status === 'failed')
  const errorDetails = failedSources.slice(0, 3).map(r => r.error).filter(e => e)
  const errorSummary = failedSourceCount > 0 ? [
    `${failedSourceCount}/${sourcesToRun.length} sources failed`,
    ...errorDetails
  ].join(' | ') : null

  // Update run record
  const finishedAt = new Date().toISOString()
  if (runId) {
    const totalNormalized = results.reduce((sum, r) => sum + r.normalized, 0)
    const totalInserted = results.reduce((sum, r) => sum + r.count, 0)
    const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates, 0)
    const overallStatus = failedSourceCount === sourcesToRun.length ? 'failed' :
      failedSourceCount > 0 ? 'partial' : 'success'

    await supabase
      .from('job_ingestion_runs')
      .update({
        finished_at: finishedAt,
        status: overallStatus,
        total_normalized: totalNormalized,
        total_inserted: totalInserted,
        total_duplicates: totalDuplicates,
        total_failed_sources: failedSourceCount,
        error_summary: errorSummary,
      })
      .eq('id', runId)
  }

  // Log ingestion activity to admin dashboard
  try {
    const totalNormalized = results.reduce((sum, r) => sum + r.normalized, 0)
    const totalInserted = results.reduce((sum, r) => sum + r.count, 0)
    const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates, 0)
    const overallStatus = failedSourceCount === sourcesToRun.length ? 'failed' :
      failedSourceCount > 0 ? 'partial' : 'success'

    const adminSecret = process.env.ADMIN_SECRET
    if (adminSecret) {
      // Use Netlify-provided URL to avoid DNS issues with hardcoded domains
      const baseUrl = process.env.URL
      if (!baseUrl) {
        console.warn('ingest_jobs: ADMIN_SECRET set but process.env.URL is empty, cannot log to admin dashboard')
      } else {
        const adminLogUrl = `${baseUrl}/.netlify/functions/admin_log_ingestion`
        console.log(`ingest_jobs: logging to admin dashboard: ${adminLogUrl}`)
        await fetch(adminLogUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': adminSecret,
          },
          body: JSON.stringify({
            sources_requested: sourcesToRun.map(s => s.slug),
            trigger_type: triggeredBy === 'schedule' ? 'scheduled' : triggeredBy,
            status: overallStatus,
            total_inserted: totalInserted,
            total_duplicates: totalDuplicates,
            total_failed_sources: failedSourceCount,
            started_at: startedAt,
            finished_at: finishedAt,
            error_message: failedSourceCount > 0 ? `${failedSourceCount} sources failed` : undefined,
          }),
        }).catch(err => {
          console.warn('ingest_jobs: failed to log to admin dashboard', {
            url: adminLogUrl,
            error: err instanceof Error ? err.message : String(err),
            code: (err as any)?.code,
          })
        })
      }
    }
  } catch (err) {
    console.warn('ingest_jobs: exception while logging to admin dashboard', err)
  }

  return results
}

export const handler: Handler = async (event) => {
  try {
    const qs = event.queryStringParameters || {}

    let requestedSlug: string | null =
      (qs.source as string | undefined) ||
      (qs.source_slug as string | undefined) ||
      null

    // Fallback to body if nothing in query string
    if (!requestedSlug && event.body) {
      try {
        const body = JSON.parse(event.body)
        requestedSlug = body.source_slug || body.source || null
      } catch {
        // ignore JSON parse errors, treat as no specific source
      }
    }

    const results = await runIngestion(requestedSlug)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        results,
      }),
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Internal error in ingest_jobs handler'
    if (message.startsWith('No matching job source')) {
      console.error('ingest_jobs:', message)
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: message,
        }),
      }
    }

    console.error('ingest_jobs: fatal error', err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal error in ingest_jobs handler',
      }),
    }
  }
}

/**
 * Queue-driven ingestion for a single source with dynamic parameters
 * Used by search_queue_cron.ts for diverse, targeted searches
 * 
 * Enforces 24h call signature tracking to prevent duplicate API calls.
 */
export async function ingestFromSource(
  sourceSlug: string,
  searchParams: { keywords?: string; location?: string;[key: string]: any },
  triggeredBy: 'queue' | 'manual' = 'queue'
): Promise<number> {
  const supabase = createAdminClient()

  const source = ALL_SOURCES.find(s => s.slug === sourceSlug)
  if (!source) {
    console.error(`ingestFromSource: unknown source ${sourceSlug}`)
    return 0
  }

  const config = getSourceConfig(sourceSlug)
  if (!config.enabled) {
    console.log(`ingestFromSource: source ${sourceSlug} is disabled`)
    return 0
  }

  // 24h call signature tracking: skip if this exact call was made recently
  const { shouldProceed, signature } = await shouldMakeCall(
    supabase,
    sourceSlug,
    {
      keywords: searchParams.keywords || 'software developer',
      location: searchParams.location || 'US',
      ...searchParams
    },
    24 // hours
  )

  if (!shouldProceed) {
    console.log(`ingestFromSource: skipping ${sourceSlug} - same params called within 24h`)
    return 0
  }

  console.log(`ingestFromSource: ${sourceSlug} with params:`, searchParams)

  try {
    // Use existing ingest function (it handles state internally)
    const result = await ingest(source, undefined, searchParams)

    // Record this call for 24h tracking
    await recordCall(supabase, sourceSlug, signature, result.count)

    console.log(`ingestFromSource: ${sourceSlug} completed with ${result.count} jobs`)
    return result.count
  } catch (err) {
    console.error(`ingestFromSource: ${sourceSlug} failed:`, err)
    // Still record the call to prevent retry storms on errors
    await recordCall(supabase, sourceSlug, signature, 0)
    return 0
  }
}
