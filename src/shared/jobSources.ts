// src/shared/jobSources.ts

export type RemoteType = 'remote' | 'onsite' | 'hybrid' | null

export interface NormalizedJob {
  source_slug: string
  external_id: string

  title: string
  company: string | null
  location: string | null
  employment_type: string | null
  remote_type: RemoteType

  posted_date: string | null
  created_at: string
  external_url: string | null

  salary_min: number | null
  salary_max: number | null
  competitiveness_level: string | null

  description: string | null

  // Keep the raw payload around for debugging or future enrichment
  data_raw?: unknown
}

export interface JobSource {
  slug: string
  displayName: string
  fetchUrl: string
  // allow normalization to return either a sync array or a promise
  normalize: (raw: unknown) => NormalizedJob[] | Promise<NormalizedJob[]>
}

// Small helper so we never throw on weird values
function asArray<T = any>(value: unknown): T[] {
  if (!value) return []
  if (Array.isArray(value)) return value as T[]
  return []
}

function parseNumber(value: unknown): number | null {
  if (value == null) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function inferRemoteTypeFromLocation(location: string | null): RemoteType {
  if (!location) return null
  const lower = location.toLowerCase()
  if (lower.includes('remote')) return 'remote'
  if (lower.includes('hybrid')) return 'hybrid'
  return null
}

function safeDate(value: any): string | null {
  if (!value) return null

  // If it’s already a valid date string
  const asString = String(value)
  if (!isNaN(Date.parse(asString))) {
    return new Date(asString).toISOString().slice(0, 10)
  }

  // If it's a pure integer, check if it's a unix timestamp (seconds or ms)
  if (typeof value === 'number') {
    // Reject crazy huge numbers
    if (value > 10000000000000) return null

    // Seconds → ms
    const ms = value < 20000000000 ? value * 1000 : value
    const d = new Date(ms)
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10)
    }
  }

  return null
}
// ---------------------------------------------------------------------------
// RemoteOK
// ---------------------------------------------------------------------------

export const RemoteOKSource: JobSource = {
  slug: 'remoteok',
  displayName: 'RemoteOK',
  fetchUrl: 'https://remoteok.com/api',

  normalize: (raw) => {
    const rows = asArray<any>(raw)
    if (!rows.length) return []

    const nowIso = new Date().toISOString()

    return rows
      .filter((row) => row && row.id && row.position)
      .map((row): NormalizedJob => {
        const location =
          (row.location as string | undefined) ??
          (row.region as string | undefined) ??
          null

        const remote_type: RemoteType = 'remote' // RemoteOK is mostly remote by design

        return {
          source_slug: 'remoteok',
          external_id: String(row.id),

          title: row.position ?? '',
          company: row.company ?? null,
          location,
          employment_type: row.employment_type ?? null,
          remote_type,

          posted_date: row.date ?? null,
          created_at: nowIso,
          external_url: row.url ?? row.apply_url ?? null,

          salary_min: parseNumber(row.salary_min),
          salary_max: parseNumber(row.salary_max),
          competitiveness_level: null, // Placeholder for future modeling

          description: row.description ?? null,

          data_raw: row,
        }
      })
  },
}

// ---------------------------------------------------------------------------
// Remotive
// ---------------------------------------------------------------------------

export const RemotiveSource: JobSource = {
  slug: 'remotive',
  displayName: 'Remotive',
  fetchUrl: 'https://remotive.com/api/remote-jobs',

  normalize: (raw) => {
    const jobs = (raw as any)?.jobs
    const rows = asArray<any>(jobs)
    if (!rows.length) return []

    const nowIso = new Date().toISOString()

    return rows.map((row): NormalizedJob => {
      const location =
        (row.candidate_required_location as string | undefined) ??
        (row.job_type as string | undefined) ??
        null

      const remote_type = inferRemoteTypeFromLocation(location ?? 'remote')

      return {
        source_slug: 'remotive',
        external_id: String(row.id),

        title: row.title ?? '',
        company: row.company_name ?? null,
        location,
        employment_type: row.job_type ?? null,
        remote_type,

        posted_date: row.publication_date ?? null,
        created_at: nowIso,
        external_url: row.url ?? null,

        salary_min: parseNumber(row.salary_min),
        salary_max: parseNumber(row.salary_max),
        competitiveness_level: null,

        description: row.description ?? null,

        data_raw: row,
      }
    })
  },
}

// ---------------------------------------------------------------------------
// Himalayas
// ---------------------------------------------------------------------------

export const HimalayasSource: JobSource = {
  slug: 'himalayas',
  displayName: 'Himalayas',
  fetchUrl: 'https://himalayas.app/jobs/api',

  normalize: (raw) => {
    const jobs = (raw as any)?.jobs
    const rows = asArray<any>(jobs)
    if (!rows.length) return []

    const nowIso = new Date().toISOString()

    return rows.map((row): NormalizedJob => {
      const location = (row.location as string | undefined) ?? null

      const remote_type: RemoteType =
        inferRemoteTypeFromLocation(location ?? 'remote')

      const companyName =
        row.company?.name ??
        row.company_name ??
        null

      return {
        source_slug: 'himalayas',
        external_id: String(row.id),

        title: row.role ?? row.title ?? '',
        company: companyName,
        location,
        employment_type: row.employment_type ?? null,
        remote_type,

        posted_date: row.published_at ?? row.created_at ?? null,
        created_at: nowIso,
        external_url: row.url ?? row.apply_url ?? null,

        salary_min: parseNumber(row.salary_min),
        salary_max: parseNumber(row.salary_max),
        competitiveness_level: null,

        description: row.description ?? null,

        data_raw: row,
      }
    })
  },
}

// ---------------------------------------------------------------------------
// Adzuna US (marketing-focused slice)
// ---------------------------------------------------------------------------

export const AdzunaUSSource: JobSource = {
  slug: 'adzuna_us',
  displayName: 'Adzuna US (Marketing roles)',
  fetchUrl: 'https://api.adzuna.com/v1/api/jobs/us/search',

  normalize: async (raw) => {
    const rawAny = raw as any

    // Logging raw once
    try {
      console.log('AdzunaUSSource RAW:', JSON.stringify(rawAny).slice(0, 5000))
    } catch (err) {
      console.log('AdzunaUSSource RAW logging failed:', err)
    }

    const results: any[] =
      Array.isArray(rawAny) ? rawAny :
        Array.isArray(rawAny?.results) ? rawAny.results :
          Array.isArray(rawAny?.data?.results) ? rawAny.data.results :
            Array.isArray(rawAny?.jobs) ? rawAny.jobs :
              []

    if (!results.length) {
      console.log('AdzunaUSSource: NO RESULTS FOUND. Raw keys:', rawAny ? Object.keys(rawAny) : 'raw was empty')
      return []
    }

    const nowIso = new Date().toISOString()

    return results
      .map((r: any): NormalizedJob | null => {
        if (!r || typeof r !== 'object') return null

        const id = r.id != null ? String(r.id) : ''
        const title = typeof r.title === 'string' ? r.title.trim() : ''
        const url = typeof r.redirect_url === 'string' ? r.redirect_url : null

        if (!id || !title || !url) {
          console.log('AdzunaUSSource: SKIPPING job (missing id/title/url)', { id, title, url })
          return null
        }

        const company = typeof r.company?.display_name === 'string' ? r.company.display_name : null
        const location = typeof r.location?.display_name === 'string' ? r.location.display_name : null
        const description = typeof r.description === 'string' ? r.description : null
        const salaryMin = parseNumber(r.salary_min)
        const salaryMax = parseNumber(r.salary_max)
        const posted = typeof r.created === 'string' ? r.created.slice(0, 10) : null
        const employmentType = typeof r.contract_time === 'string' ? r.contract_time.toLowerCase() : null
        const remote_type: RemoteType = inferRemoteTypeFromLocation(location)

        return {
          source_slug: 'adzuna_us',
          external_id: `adzuna_us:${id}`,
          title,
          company,
          location,
          employment_type: employmentType,
          remote_type,
          posted_date: posted,
          created_at: nowIso,
          external_url: url,
          salary_min: salaryMin,
          salary_max: salaryMax,
          competitiveness_level: null,
          description,
          data_raw: r,
        }
      })
      .filter((job): job is NormalizedJob => Boolean(job))
  },
}

// ---------------------------------------------------------------------------
// CareerOneStop (US gov-backed, broad roles) – DEFINED BUT DISABLED IN ALL_SOURCES
// ---------------------------------------------------------------------------

export const CareerOneStopSource: JobSource = {
  slug: 'careeronestop',
  displayName: 'CareerOneStop',
  fetchUrl: 'https://api.careeronestop.org',

  normalize: (raw) => {
    const anyRaw = raw as any

    const candidate =
      anyRaw?.Jobs ??
      anyRaw?.jobsearchresult ??
      anyRaw

    const rows = asArray<any>(candidate)
    if (!rows.length) {
      console.log(
        'CareerOneStop: no rows in response, top-level keys:',
        anyRaw && typeof anyRaw === 'object' ? Object.keys(anyRaw) : 'non-object'
      )
      return []
    }

    const nowIso = new Date().toISOString()

    return rows.map((row: any): NormalizedJob => {
      const title = row.JobTitle ?? ''
      const company = row.Company ?? null
      const location = row.Location ?? null
      const url = row.URL ?? null
      const description = row.Description ?? null
      const posted = row.AcquisitionDate ?? null

      return {
        source_slug: 'careeronestop',
        external_id: `careeronestop:${url || title}`,

        title,
        company,
        location,
        employment_type: null,
        remote_type: inferRemoteTypeFromLocation(location),

        posted_date: posted,
        created_at: nowIso,
        external_url: url,

        salary_min: null,
        salary_max: null,
        competitiveness_level: null,

        description,
        data_raw: row,
      }
    })
  },
}

// ---------------------------------------------------------------------------
// Jobicy (remote-only, JSON API v2)
// ---------------------------------------------------------------------------

export const JobicySource: JobSource = {
  slug: 'jobicy',
  displayName: 'Jobicy',
  // count=50 to keep payload sane; can bump later
  fetchUrl: 'https://jobicy.com/api/v2/remote-jobs?count=50',

  normalize: (raw) => {
    const anyRaw = raw as any
    const rows = asArray<any>(anyRaw?.jobs ?? anyRaw)
    if (!rows.length) {
      console.log(
        'Jobicy: no rows in response, top-level keys:',
        anyRaw && typeof anyRaw === 'object' ? Object.keys(anyRaw) : 'non-object'
      )
      return []
    }

    const nowIso = new Date().toISOString()

    return rows.map((row: any): NormalizedJob => {
      const id = row.id != null ? String(row.id) : ''
      const title = row.jobTitle ?? row.title ?? ''
      const company = row.companyName ?? null
      const location = row.jobGeo ?? null
      const url = row.url ?? row.jobUrl ?? null

      const employmentType =
        Array.isArray(row.jobType) && row.jobType.length
          ? String(row.jobType[0])
          : (row.jobType as string | null) ?? null

      const posted =
        row.jobPostedAt ??
        row.jobPostedAtDatetime ??
        row.jobPostedAtDate ??
        null

      const salaryMin = parseNumber(row.annualSalaryMin ?? row.salaryMin)
      const salaryMax = parseNumber(row.annualSalaryMax ?? row.salaryMax)

      return {
        source_slug: 'jobicy',
        external_id: `jobicy:${id || url || title}`,

        title,
        company,
        location,
        employment_type: employmentType,
        remote_type: 'remote', // Jobicy remote-jobs endpoint is remote-only

        posted_date: posted,
        created_at: nowIso,
        external_url: url,

        salary_min: salaryMin,
        salary_max: salaryMax,
        competitiveness_level: null,

        description: row.jobDescription ?? row.description ?? null,
        data_raw: row,
      }
    })
  },
}

// ---------------------------------------------------------------------------
// Arbeitnow (Europe + remote, free JSON API)
// ---------------------------------------------------------------------------

export const ArbeitnowSource: JobSource = {
  slug: 'arbeitnow',
  displayName: 'Arbeitnow',
  fetchUrl: 'https://www.arbeitnow.com/api/job-board-api',

  normalize: (raw) => {
    const anyRaw = raw as any

    // The API may return either an array or an object with a jobs-like array;
    // start simple and log if we don't see rows.
    const rows = asArray<any>(anyRaw?.data ?? anyRaw?.jobs ?? anyRaw)
    if (!rows.length) {
      console.log(
        'Arbeitnow: no rows in response, top-level keys:',
        anyRaw && typeof anyRaw === 'object' ? Object.keys(anyRaw) : 'non-object'
      )
      return []
    }

    const nowIso = new Date().toISOString()

    return rows.map((row: any): NormalizedJob => {
      const title = row.title ?? ''
      const company = row.company_name ?? row.company ?? null
      const location = row.location ?? null
      const url = row.url ?? row.apply_url ?? null

      const remoteField = row.remote
      let remote_type: RemoteType = null
      if (typeof remoteField === 'boolean') {
        remote_type = remoteField ? 'remote' : null
      } else if (typeof remoteField === 'string') {
        remote_type = inferRemoteTypeFromLocation(remoteField)
      } else {
        remote_type = inferRemoteTypeFromLocation(location)
      }

      const posted =
        row.date ??
        row.published_at ??
        row.created_at ??
        null

      return {
        source_slug: 'arbeitnow',
        external_id: `arbeitnow:${row.slug || url || title}`,

        title,
        company,
        location,
        employment_type: row.employment_type ?? row.job_type ?? null,
        remote_type,

        posted_date: safeDate(posted),
        created_at: nowIso,
        external_url: url,

        salary_min: parseNumber(row.salary_min ?? row.salary_from),
        salary_max: parseNumber(row.salary_max ?? row.salary_to),
        competitiveness_level: null,

        description: row.description ?? row.content ?? null,
        data_raw: row,
      }
    })
  },
}

// ---------------------------------------------------------------------------
// Combined export for ingest_jobs
// ---------------------------------------------------------------------------

export const ALL_SOURCES: JobSource[] = [
  RemoteOKSource,
  RemotiveSource,
  HimalayasSource,
  AdzunaUSSource,
  // CareerOneStopSource, // temporarily disabled while auth is blocked
  JobicySource,
  ArbeitnowSource,
]