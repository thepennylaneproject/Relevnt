// netlify/functions/ingest_jobs.ts
import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import {
  ALL_SOURCES,
  type JobSource,
  type NormalizedJob,
} from '../../src/shared/jobSources'

// Helper to build the fetch URL for a given source, supporting Adzuna etc.
function buildSourceUrl(source: JobSource): string | null {
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

    return `${base}?${params.toString()}`
  }

  if (source.slug === 'careeronestop') {
    const userId = process.env.CAREERONESTOP_USER_ID

    if (!userId) {
      console.error('ingest_jobs: missing CAREERONESTOP_USER_ID')
      return null
    }

    // Default search parameters
    const keyword = 'marketing'  // or maybe '' for all
    const location = 'US'        // maybe '0' or '' for national
    const radius = '500'
    const sortColumns = 'acquisitiondate'
    const sortOrder = 'DESC'
    const startRecord = '0'
    const pageSize = '50'
    const days = '30'

    return `${source.fetchUrl}/v2/jobsearch/${userId}/${encodeURIComponent(keyword)}/${encodeURIComponent(location)}/${radius}/${sortColumns}/${sortOrder}/${startRecord}/${pageSize}/${days}`
  }

  return source.fetchUrl
}

// Near the top (or wherever buildHeaders/buildSourceHeaders is):
function buildHeaders(source?: JobSource): Record<string, string> {
  if (source?.slug === 'careeronestop') {
    const apiKey = process.env.CAREERONESTOP_API_KEY
    if (!apiKey) {
      console.error('ingest_jobs: missing CAREERONESTOP_API_KEY')
      return {
        'User-Agent': 'relevnt-job-ingest/1.0',
        Accept: 'application/json',
      }
    }
    console.log('CareerOneStop API key present:', !!process.env.CAREERONESTOP_API_KEY);
    console.log('CareerOneStop userId:', process.env.CAREERONESTOP_USER_ID);
    return {
      Authorization: `Bearer ${apiKey}`,
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
  source?: JobSource
): Promise<any | null> {
  try {
    const headers: Record<string, string> = buildHeaders(source)

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

  const { data, error } = await supabase
    .from('jobs')
    .upsert(
      uniqueJobs.map((j) => ({
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
        // data_raw intentionally omitted until column exists in DB
        is_active: true,
      })),
      {
        onConflict: 'source_slug,external_id',
        ignoreDuplicates: false,
      }
    )
    .select('id')

  if (error) {
    console.error('ingest_jobs: upsert error', error)
    throw error
  }

  return { inserted: data?.length ?? 0 }
}

async function ingest(source: JobSource) {
  const supabase = createAdminClient()
  const url = buildSourceUrl(source)

  if (!url) {
    console.warn(`ingest_jobs: no URL for ${source.slug}, skipping`)
    return { source: source.slug, count: 0 }
  }

  console.log(`ingest_jobs: fetching from ${source.slug} (${url})`)

  const raw = await fetchJson(url, source)  
  if (!raw) {
    console.warn(`ingest_jobs: no data from ${source.slug}`)
    return { source: source.slug, count: 0 }
  }

  let normalized: NormalizedJob[] = []
  try {
    const normalizedResult = await Promise.resolve(source.normalize(raw))
    normalized = normalizedResult || []
  } catch (err) {
    console.error(`ingest_jobs: normalize failed for ${source.slug}`, err)
    return { source: source.slug, count: 0 }
  }

  if (!normalized.length) {
    console.log(`ingest_jobs: no jobs after normalize for ${source.slug}`)
    return { source: source.slug, count: 0 }
  }

  console.log(`ingest_jobs: normalized ${normalized.length} jobs from ${source.slug}`)

  const { inserted } = await upsertJobs(normalized)
  console.log(`ingest_jobs: upserted ${inserted} jobs from ${source.slug}`)

  // Update job_sources bookkeeping for this source on successful ingest
  try {
    const { error: statusError } = await supabase
      .from('job_sources')
      .update({
        last_sync: new Date().toISOString(),
        last_error: null, // clear any previous error
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

  return { source: source.slug, count: normalized.length }
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
        requestedSlug =
          body.source_slug ||
          body.source ||
          null
      } catch {
        // ignore JSON parse errors, treat as no specific source
      }
    }

    const sourcesToRun: JobSource[] = requestedSlug
      ? ALL_SOURCES.filter((s) => s.slug === requestedSlug)
      : ALL_SOURCES

    if (!sourcesToRun.length) {
      console.log('ingest_jobs: no matching sources for', requestedSlug)
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: `No matching job source for slug: ${requestedSlug}`,
        }),
      }
    }

    const results: { source: string; count: number }[] = []

    for (const source of sourcesToRun) {
      try {
        const result = await ingest(source)
        results.push(result)
      } catch (err) {
        console.error(`ingest_jobs: fatal error while ingesting ${source.slug}`, err)
        results.push({ source: source.slug, count: 0 })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        results,
      }),
    }
  } catch (err) {
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