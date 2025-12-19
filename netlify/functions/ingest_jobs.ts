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

export type IngestResult = {
  source: string;
  count: number;
  normalized: number;
  duplicates: number;
  staleFiltered: number;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  skipReason?: string;
}
type IngestionCursor = { page?: number; since?: string | null }
type IngestionState = { cursor: IngestionCursor; last_run_at: string | null }

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
  // TheirStack uses POST with limit in body
  theirstack: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 100, maxPagesPerRun: 1 },
  // CareerOneStop uses path params with startRecord for pagination
  careeronestop: {
    pageParam: 'startRecord',
    pageSizeParam: 'pageSize',
    pageSize: 50,
    maxPagesPerRun: parseInt(process.env.CAREERONESTOP_MAX_PAGES_PER_RUN || '3', 10),
  },
  // Greenhouse doesn't use pagination; fetches all jobs in single request per board
  greenhouse: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 1000, maxPagesPerRun: 1 },
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
  const envJson = process.env.GREENHOUSE_BOARDS_JSON

  if (envJson) {
    try {
      const parsed = JSON.parse(envJson)
      if (Array.isArray(parsed)) {
        boards.push(...parsed)
      }
    } catch (e) {
      console.error('ingest_jobs: Failed to parse GREENHOUSE_BOARDS_JSON:', e)
    }
  }

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
  cursor?: IngestionCursor
): string | null {
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
      what: 'marketing',
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
    const keyword = '0' // '0' = all jobs
    const location = 'US' // Nationwide
    const radius = '0' // Not used for nationwide
    const sortColumns = 'DatePosted' // Sort by post date for freshness
    const sortOrder = 'DESC'
    const days = '30' // Last 30 days

    const baseUrl = `https://api.careeronestop.org/v2/jobsearch/${userId}/${encodeURIComponent(
      keyword
    )}/${encodeURIComponent(location)}/${radius}/${sortColumns}/${sortOrder}/${startRecord}/${pageSize}/${days}`

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

  // JobDataFeeds uses standard page/page_size pagination
  if (source.slug === 'jobdatafeeds') {
    const config = SOURCE_PAGINATION[source.slug] || {}
    const page = cursor?.page ?? 1
    const pageSize = config.pageSize ?? 100

    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      title: 'all',  // Search for all jobs
    })
    return `${source.fetchUrl}?${params.toString()}`
  }

  // CareerJet uses page/pagesize with required parameters
  if (source.slug === 'careerjet') {
    const config = SOURCE_PAGINATION[source.slug] || {}
    const page = cursor?.page ?? 1
    const pageSize = config.pageSize ?? 50

    const params = new URLSearchParams({
      affid: process.env.CAREERJET_AFFILIATE_ID || 'partner',  // Affiliate ID
      keywords: 'jobs',  // Generic search
      page: String(page),
      pagesize: String(pageSize),
      user_ip: '0.0.0.0',  // Required but not used for backend
      user_agent: 'relevnt-job-ingest/1.0',  // Required but not used for backend
      url: 'https://relevnt.io',  // Required but not used for backend
    })
    return `${source.fetchUrl}?${params.toString()}`
  }

  // WhatJobs uses page/limit pagination
  if (source.slug === 'whatjobs') {
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
function buildHeaders(source?: JobSource): Record<string, string> {
  if (source?.slug === 'usajobs') {
    const apiKey = process.env.USAJOBS_API_KEY
    const userAgent = process.env.USAJOBS_USER_AGENT
    if (!apiKey || !userAgent) {
      console.error('ingest_jobs: missing USAJOBS_API_KEY or USAJOBS_USER_AGENT')
      return {
        'User-Agent': 'relevnt-job-ingest/1.0',
        Accept: 'application/json',
      }
    }

    return {
      'User-Agent': userAgent,
      'Authorization-Key': apiKey,
      Accept: 'application/json',
    }
  }

  if (source?.slug === 'careeronestop') {
    const apiKey = process.env.CAREERONESTOP_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing CAREERONESTOP_API_KEY')
      return {
        'User-Agent': 'relevnt-job-ingest/1.0',
        Accept: 'application/json',
      }
    }
    return {
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'relevnt-job-ingest/1.0',
      Accept: 'application/json',
    }
  }

  if (source?.slug === 'findwork') {
    const apiKey = process.env.FINDWORK_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing FINDWORK_API_KEY')
      return {
        'User-Agent': 'relevnt-job-ingest/1.0',
        Accept: 'application/json',
      }
    }

    return {
      Authorization: `Token ${apiKey}`,
      'User-Agent': 'relevnt-job-ingest/1.0',
      Accept: 'application/json',
    }
  }

  // JobDataFeeds uses Bearer token authentication
  if (source?.slug === 'jobdatafeeds') {
    const apiKey = process.env.JOBDATAFEEDS_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing JOBDATAFEEDS_API_KEY')
      return {
        'User-Agent': 'relevnt-job-ingest/1.0',
        Accept: 'application/json',
      }
    }

    return {
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'relevnt-job-ingest/1.0',
      Accept: 'application/json',
    }
  }

  // WhatJobs uses a custom x-api-key header
  if (source?.slug === 'whatjobs') {
    const apiKey = process.env.WHATJOBS_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing WHATJOBS_API_KEY')
      return {
        'User-Agent': 'relevnt-job-ingest/1.0',
        Accept: 'application/json',
      }
    }

    return {
      'x-api-key': apiKey,
      'User-Agent': 'relevnt-job-ingest/1.0',
      Accept: 'application/json',
    }
  }

  // Fantastic Jobs uses Bearer token authentication
  if (source?.slug === 'fantastic') {
    const apiKey = process.env.FANTASTIC_JOBS_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing FANTASTIC_JOBS_API_KEY')
      return {
        'User-Agent': 'relevnt-job-ingest/1.0',
        Accept: 'application/json',
      }
    }

    return {
      Authorization: `Bearer ${apiKey}`,
      'User-Agent': 'relevnt-job-ingest/1.0',
      Accept: 'application/json',
    }
  }

  // Reed UK uses HTTP Basic Auth with API key as username, no password
  if (source?.slug === 'reed_uk') {
    const apiKey = process.env.REED_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing REED_API_KEY')
      return {
        'User-Agent': 'relevnt-job-ingest/1.0',
        Accept: 'application/json',
      }
    }

    // Basic auth: base64 encode "apiKey:"
    const credentials = Buffer.from(`${apiKey}:`).toString('base64')
    return {
      Authorization: `Basic ${credentials}`,
      'User-Agent': 'relevnt-job-ingest/1.0',
      Accept: 'application/json',
    }
  }

  // Jooble needs Content-Type for POST
  if (source?.slug === 'jooble') {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'relevnt-job-ingest/1.0',
      Accept: 'application/json',
    }
  }

  // The Muse - no special headers needed, api_key is in URL
  if (source?.slug === 'themuse') {
    return {
      'User-Agent': 'relevnt-job-ingest/1.0',
      Accept: 'application/json',
    }
  }

  // TheirStack uses Bearer token auth
  if (source?.slug === 'theirstack') {
    const apiKey = process.env.THEIRSTACK_API_KEY
    if (!apiKey) {
      return {
        'User-Agent': 'relevnt-job-ingest/1.0',
        Accept: 'application/json',
      }
    }
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'relevnt-job-ingest/1.0',
      Accept: 'application/json',
    }
  }

  // RemoteOK is sensitive to scrapers
  if (source?.slug === 'remoteok') {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
  cursor?: IngestionCursor
): Promise<any | null> {
  try {
    const headers: Record<string, string> = buildHeaders(source)

    // Jooble requires POST with keywords and pagination in body
    if (source?.slug === 'jooble') {
      const config = SOURCE_PAGINATION[source.slug] || {}
      const page = cursor?.page ?? 1
      const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE

      const body = JSON.stringify({
        keywords: 'software developer',
        location: '',
        page: page,
        ResultOnPage: pageSize,
      })

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
      })

      if (!res.ok) {
        console.error(`ingest_jobs: fetch failed for ${url}`, res.status, res.statusText)
        return null
      }

      const data = await res.json().catch((err) => {
        console.error(`ingest_jobs: failed to parse JSON for ${url}`, err)
        return null
      })

      return data
    }

    // TheirStack requires POST with search parameters in body
    if (source?.slug === 'theirstack') {
      const maxResults = parseInt(process.env.THEIRSTACK_MAX_RESULTS_PER_RUN || '25', 10)
      const config = SOURCE_PAGINATION[source.slug] || {}
      const maxAgeDays = config.maxAgeDays || 30

      const body = JSON.stringify({
        limit: maxResults,
        order_by: [{ desc: true, field: 'date_posted' }],
        posted_at_max_age_days: maxAgeDays, // Required by TheirStack API
        // Include tech jobs broadly - the pipeline will filter
      })

      console.log(`ingest_jobs: TheirStack POST body:`, body)

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'unknown error')
        console.error(`ingest_jobs: TheirStack fetch failed`, res.status, res.statusText, errorText)
        return null
      }

      const data = await res.json().catch((err) => {
        console.error(`ingest_jobs: failed to parse JSON for TheirStack`, err)
        return null
      })

      console.log(`ingest_jobs: TheirStack response keys:`, data ? Object.keys(data) : 'null')
      return data
    }

    // Default: GET request
    const res = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!res.ok) {
      console.error(`ingest_jobs: fetch failed for ${url}`, res.status, res.statusText)
      return null
    }

    const data = await res.json().catch((err) => {
      console.error(`ingest_jobs: failed to parse JSON for ${url}`, err)
      return null
    })

    return data
  } catch (err) {
    console.error(`ingest_jobs: network error for ${url}`, err)
    return null
  }
}

// ============================================================================
// COMPANY REGISTRY FUNCTIONS
// ============================================================================

/**
 * Get companies from registry for a given platform
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

    // Fallback: query companies table directly
    if (companies.length === 0) {
      const platformField = platform === 'lever' ? 'lever_slug' : 'greenhouse_board_token';
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .not(platformField, 'is', null)
        .order(
          'job_creation_velocity',
          { ascending: false, nullsFirst: false }
        )
        .order('growth_score', { ascending: false })
        .limit(maxCompanies);

      if (error) {
        console.error(`Failed to query ${platform} companies:`, error);
        // Fall back to JSON config for backwards compatibility
        return platform === 'lever' ? getLeverSourcesAsCompanies() : [];
      }

      companies = data || [];
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

// Upsert a batch of normalized jobs into the jobs table
async function upsertJobs(jobs: NormalizedJob[]) {
  if (!jobs.length) return { inserted: 0 }

  // 🔹 De-dupe by (source_slug, external_id) so Postgres does not try to
  // update the same row twice in a single ON CONFLICT command.
  const seen = new Set<string>()
  const uniqueJobs = jobs.filter((j) => {
    const key = `${j.source_slug}::${j.external_id}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })

  if (uniqueJobs.length < jobs.length) {
    console.warn(
      `ingest_jobs: filtered ${jobs.length - uniqueJobs.length} duplicate jobs before upsert`
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

  // Enrich jobs with ATS metadata
  const enrichedJobs = urlEnrichedJobs.map((j) => {
    const enrichment = enrichJob(j.title, j.description || '')
    return {
      source_slug: j.source_slug,
      external_id: j.external_id,

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

      // ATS enrichment fields
      seniority_level: enrichment.seniority_level,
      experience_years_min: enrichment.experience_years_min,
      experience_years_max: enrichment.experience_years_max,
      required_skills: enrichment.required_skills.length > 0 ? enrichment.required_skills : null,
      preferred_skills: enrichment.preferred_skills.length > 0 ? enrichment.preferred_skills : null,
      education_level: enrichment.education_level,
      industry: enrichment.industry,
    }
  })

  const { data, error } = await supabase
    .from('jobs')
    .upsert(enrichedJobs, {
      onConflict: 'source_slug,external_id',
      ignoreDuplicates: false,
    })
    .select('id')

  if (error) {
    console.error('ingest_jobs: upsert error', error)
    throw error
  }

  return { inserted: data?.length ?? 0 }
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

        const raw = await fetchJson(boardUrl, source, { page: 1 })
        if (!raw) {
          console.warn(`ingest_jobs: no data from Greenhouse board ${board.companyName}`)
          continue
        }

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

        const { inserted } = await upsertJobs(jobsToInsert)
        totalInserted += inserted
        totalDuplicates += duplicateCount - inserted
        console.log(
          `ingest_jobs: upserted ${inserted} jobs from Greenhouse board ${board.companyName}`
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
    sourceError = ingestError instanceof Error ? ingestError.message : String(ingestError)
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
        duplicate_count: totalDuplicates,
        error_message: sourceError,
        cursor_out: { page: 1, since: runStartedAt },
      })
      .eq('id', sourceRunId)
  }

  // Update source health
  await supabase.from('job_source_health').upsert(
    {
      source: source.slug,
      last_run_at: finishedAt,
      last_success_at: sourceStatus === 'success' ? finishedAt : undefined,
      last_error_at: sourceStatus === 'failed' ? finishedAt : undefined,
      consecutive_failures: sourceStatus === 'failed' ? 1 : 0,
      last_counts: {
        normalized: totalNormalized,
        inserted: totalInserted,
        duplicates: totalDuplicates,
        staleFiltered: totalStaleFiltered,
        freshnessRatio,
      },
      is_degraded: sourceStatus === 'failed',
    },
    { onConflict: 'source' }
  )

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

async function ingest(source: JobSource, runId?: string): Promise<IngestResult> {
  const supabase = createAdminClient()
  const pagination = SOURCE_PAGINATION[source.slug] || {}
  const sourceConfig = getSourceConfig(source.slug)
  const state = await loadIngestionState(supabase, source.slug)

  // Check cooldown
  if (state.last_run_at && shouldSkipDueToCooldown(source.slug, new Date(state.last_run_at))) {
    console.log(`ingest_jobs: skipping ${source.slug} due to cooldown`)
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
    `ingest_jobs: starting ingest for ${source.slug} with cursor`,
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
      const { inserted } = await upsertJobs(fresh)
      totalInserted = inserted
      totalDuplicates = fresh.length - inserted

      console.log(`ingest_jobs: finished RSS ingest: ${totalInserted} inserted, ${totalDuplicates} duplicates`)
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
      const { inserted } = await upsertJobs(fresh)
      totalInserted = inserted
      totalDuplicates = fresh.length - inserted

      console.log(`ingest_jobs: finished ${platform} ingest: ${totalInserted} inserted, ${totalDuplicates} duplicates`)
    } else {
      // Standard pagination-based ingestion for other sources
      for (let i = 0; i < maxPages; i++) {
        const url = buildSourceUrl(source, { page, since })

        if (!url) {
          console.warn(`ingest_jobs: no URL for ${source.slug}, skipping`)
          break
        }

        console.log(
          `ingest_jobs: fetching from ${source.slug} (${url}) [page ${page}]`
        )

        const raw = await fetchJson(url, source, { page, since })
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

        const { inserted } = await upsertJobs(fresh)
        totalInserted += inserted
        totalDuplicates += (duplicateCount - inserted)
        console.log(
          `ingest_jobs: upserted ${inserted} jobs from ${source.slug} on page ${page}`
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
    sourceError = ingestError instanceof Error ? ingestError.message : String(ingestError)
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
        duplicate_count: totalDuplicates,
        error_message: sourceError,
        cursor_out: { page, since: runStartedAt },
        // New fields for freshness tracking (will be ignored if columns don't exist yet)
        // stale_filtered_count: totalStaleFiltered,
        // freshness_ratio: freshnessRatio,
      })
      .eq('id', sourceRunId)
  }

  // Update source health
  await supabase.from('job_source_health').upsert(
    {
      source: source.slug,
      last_run_at: finishedAt,
      last_success_at: sourceStatus === 'success' ? finishedAt : undefined,
      last_error_at: sourceStatus === 'failed' ? finishedAt : undefined,
      consecutive_failures: sourceStatus === 'failed' ? 1 : 0, // simplified logic
      last_counts: {
        normalized: totalNormalized,
        inserted: totalInserted,
        duplicates: totalDuplicates,
        staleFiltered: totalStaleFiltered,
        freshnessRatio
      },
      is_degraded: sourceStatus === 'failed',
    },
    { onConflict: 'source' }
  )

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
  if (requestedSlug) {
    sourcesToRun = ALL_SOURCES.filter((s) => s.slug === requestedSlug)
  } else {
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
  const results: IngestResult[] = []
  let failedSourceCount = 0

  // Run sources in parallel with limited concurrency to avoid timeouts
  // We use Promise.allSettled so one failure doesn't stop the entire run
  const CONCURRENCY_LIMIT = 3
  const chunks = []
  for (let i = 0; i < sourcesToRun.length; i += CONCURRENCY_LIMIT) {
    chunks.push(sourcesToRun.slice(i, i + CONCURRENCY_LIMIT))
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.allSettled(
      chunk.map(async (source) => {
        // Use special handler for Greenhouse since it manages multiple boards
        return source.slug === 'greenhouse'
          ? await ingestGreenhouseBoards(source, runId || undefined)
          : await ingest(source, runId || undefined)
      })
    )

    chunkResults.forEach((settled, index) => {
      const source = chunk[index]
      if (settled.status === 'fulfilled') {
        const result = settled.value
        results.push(result)
        if (result.status === 'failed') {
          failedSourceCount++
        }
      } else {
        console.error(`ingest_jobs: fatal error while ingesting ${source.slug}`, settled.reason)
        results.push({
          source: source.slug,
          count: 0,
          normalized: 0,
          duplicates: 0,
          staleFiltered: 0,
          status: 'failed',
          error: settled.reason instanceof Error ? settled.reason.message : String(settled.reason),
        })
        failedSourceCount++
      }
    })
  }

  const summary = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.source] = r.count
    return acc
  }, {})
  console.log('ingest_jobs: completed ingestion run', summary)

  // Update run record
  if (runId) {
    const totalNormalized = results.reduce((sum, r) => sum + r.normalized, 0)
    const totalInserted = results.reduce((sum, r) => sum + r.count, 0)
    const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates, 0)
    const overallStatus = failedSourceCount === sourcesToRun.length ? 'failed' :
      failedSourceCount > 0 ? 'partial' : 'success'

    await supabase
      .from('job_ingestion_runs')
      .update({
        finished_at: new Date().toISOString(),
        status: overallStatus,
        total_normalized: totalNormalized,
        total_inserted: totalInserted,
        total_duplicates: totalDuplicates,
        total_failed_sources: failedSourceCount,
        error_summary: failedSourceCount > 0 ?
          `${failedSourceCount}/${sourcesToRun.length} sources failed` : null,
      })
      .eq('id', runId)
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
