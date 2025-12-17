// netlify/functions/ingest_jobs.ts
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
} from '../../src/shared/jobSources'
import { enrichJob } from '../../src/lib/scoring/jobEnricher'
import {
  getSourceConfig,
  shouldSkipDueToCooldown,
  type SourceConfig,
} from '../../src/shared/sourceConfig'

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
}

const DEFAULT_PAGE_SIZE = 50
const DEFAULT_MAX_PAGES_PER_RUN = 3

const SOURCE_PAGINATION: Record<string, PaginationConfig> = {
  remoteok: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 50 },
  remotive: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 50, sinceParam: 'since' },
  himalayas: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 50 },
  adzuna_us: {
    pageParam: 'page',
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
  jobicy: { pageParam: 'page', pageSizeParam: 'count', pageSize: 50 },
  arbeitnow: { pageParam: 'page', pageSizeParam: 'limit', pageSize: 50 },
  // Jooble uses POST with body params, not URL params
  jooble: { pageParam: 'page', pageSizeParam: 'ResultOnPage', pageSize: 50, maxPagesPerRun: 2 },
  themuse: { pageParam: 'page', pageSizeParam: 'per_page', pageSize: 50, maxPagesPerRun: 3 },
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

    return applyCursorToUrl(`${base}?${params.toString()}`, source, cursor)
  }

  if (source.slug === 'careeronestop') {
    const userId = process.env.CAREERONESTOP_USER_ID
    const token = process.env.CAREERONESTOP_TOKEN

    if (!userId || !token) {
      console.error('ingest_jobs: missing CAREERONESTOP_USER_ID or CAREERONESTOP_TOKEN')
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
    const token = process.env.CAREERONESTOP_TOKEN
    if (!token) {
      console.error('ingest_jobs: missing CAREERONESTOP_TOKEN')
      return {
        'User-Agent': 'relevnt-job-ingest/1.0',
        Accept: 'application/json',
      }
    }
    return {
      Authorization: `Bearer ${token}`,
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

  return {
    'User-Agent': 'relevnt-job-ingest/1.0',
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
      const maxResults = parseInt(process.env.THEIRSTACK_MAX_RESULTS_PER_RUN || '300', 10)

      const body = JSON.stringify({
        limit: maxResults,
        order_by: [{ desc: true, field: 'date_posted' }],
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

  // Enrich jobs with ATS metadata
  const enrichedJobs = uniqueJobs.map((j) => {
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

  for (const source of sourcesToRun) {
    try {
      const result = await ingest(source, runId || undefined)
      results.push(result)
      if (result.status === 'failed') {
        failedSourceCount++
      }
    } catch (err) {
      console.error(`ingest_jobs: fatal error while ingesting ${source.slug}`, err)
      results.push({
        source: source.slug,
        count: 0,
        normalized: 0,
        duplicates: 0,
        staleFiltered: 0,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      })
      failedSourceCount++
    }
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
