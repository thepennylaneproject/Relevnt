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
  type?: 'board' | 'aggregator' | string
  region?: string
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
  type: 'board',
  region: 'global',

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
// Findwork
// ---------------------------------------------------------------------------

export const FindworkSource: JobSource = {
  slug: 'findwork',
  displayName: 'Findwork',
  fetchUrl: 'https://findwork.dev/api/jobs/',
  type: 'aggregator',
  region: 'global',

  normalize: (raw) => {
    const rows = asArray<any>((raw as any)?.results)
    if (!rows.length) return []

    const nowIso = new Date().toISOString()

    return rows
      .map((row): NormalizedJob | null => {
        if (!row || !row.id) return null

        const title = row.role ?? row.title ?? ''
        if (!title) return null

        const location = (row.location as string | undefined) ?? null
        const remoteField = (row as any)?.remote
        let remote_type: RemoteType = inferRemoteTypeFromLocation(location)
        if (typeof remoteField === 'boolean') {
          remote_type = remoteField ? 'remote' : 'onsite'
        }

        const employmentType =
          typeof row.employment_type === 'string' ? row.employment_type : null

        const description = row.description ?? row.text ?? null
        const externalUrl = row.url ?? null
        const posted = safeDate(row.date_posted)

        return {
          source_slug: 'findwork',
          external_id: String(row.id),

          title,
          company: row.company_name ?? null,
          location,
          employment_type: employmentType,
          remote_type,

          posted_date: posted,
          created_at: nowIso,
          external_url: externalUrl,

          salary_min: null,
          salary_max: null,
          competitiveness_level: null,

          description,
          data_raw: row,
        }
      })
      .filter((job): job is NormalizedJob => Boolean(job))
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
// CareerOneStop (US gov-backed, broad roles)
// ---------------------------------------------------------------------------

export const CareerOneStopSource: JobSource = {
  slug: 'careeronestop',
  displayName: 'CareerOneStop',
  fetchUrl: 'https://api.careeronestop.org',
  type: 'aggregator',
  region: 'us',

  normalize: (raw) => {
    const anyRaw = raw as any

    // CareerOneStop v2 API response structure
    const candidate =
      anyRaw?.Jobs ??
      anyRaw?.JobsList ??
      anyRaw?.jobs ??
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
      // Map CareerOneStop v2 API fields
      const id = row.JvId ?? row.jvId ?? null
      const title = row.JobTitle ?? row.Title ?? ''
      const company = row.Company ?? row.CompanyName ?? null
      const location = row.Location ?? row.City ?? null
      const url = row.URL ?? row.Url ?? row.JobDetailsURL ?? null
      const description = row.JobDesc ?? row.Description ?? row.JobDescription ?? null
      const posted = safeDate(row.DatePosted ?? row.AccquisitionDate ?? row.AcquisitionDate)

      // Generate stable external_id: prefer JvId, fallback to URL, then hash
      let externalId: string
      if (id) {
        externalId = `careeronestop:${id}`
      } else if (url) {
        externalId = `careeronestop:${url}`
      } else {
        // Fallback to hash of title+company for deduplication
        externalId = `careeronestop:${title}::${company || 'unknown'}`
      }

      return {
        source_slug: 'careeronestop',
        external_id: externalId,

        title,
        company,
        location,
        employment_type: row.EmploymentType ?? null,
        remote_type: inferRemoteTypeFromLocation(location),

        posted_date: posted,
        created_at: nowIso,
        external_url: url,

        salary_min: parseNumber(row.MinSalary ?? row.SalaryMin),
        salary_max: parseNumber(row.MaxSalary ?? row.SalaryMax),
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
// USAJOBS (US federal roles)
// ---------------------------------------------------------------------------

export const USAJobsSource: JobSource = {
  slug: 'usajobs',
  displayName: 'USAJOBS',
  fetchUrl: 'https://data.usajobs.gov/api/Search',
  type: 'aggregator',
  region: 'us',

  normalize: (raw) => {
    const searchResult = (raw as any)?.SearchResult
    const items = asArray<any>(searchResult?.SearchResultItems)
    if (!items.length) return []

    const nowIso = new Date().toISOString()
    const jobs: NormalizedJob[] = []

    for (const item of items) {
      try {
        if (!item || !item.MatchedObjectId) continue

        const descriptor = item.MatchedObjectDescriptor || {}
        const title = descriptor.PositionTitle ?? ''
        const company = descriptor.OrganizationName ?? null

        const firstLocation = asArray<any>(descriptor.PositionLocation)[0]
        const location =
          (firstLocation &&
            [
              firstLocation.LocationName,
              firstLocation.CityName,
              firstLocation.CountrySubDivisionCode,
              firstLocation.CountryCode,
            ]
              .filter((part) => typeof part === 'string' && part.trim().length)
              .map((part) => String(part).trim())
              .join(', ')) ||
          (typeof descriptor.PositionLocationDisplay === 'string'
            ? descriptor.PositionLocationDisplay
            : null)

        const schedule = asArray<any>(descriptor.PositionSchedule)[0]
        const employment_type =
          (typeof schedule?.Name === 'string' && schedule.Name) ??
          (typeof schedule?.Code === 'string' && schedule.Code) ??
          null

        const remuneration = asArray<any>(descriptor.PositionRemuneration)[0]
        const salary_min = parseNumber(remuneration?.MinimumRange)
        const salary_max = parseNumber(remuneration?.MaximumRange)

        const description =
          (descriptor as any)?.UserArea?.Details?.JobSummary ??
          descriptor.QualificationSummary ??
          null

        const job: NormalizedJob = {
          source_slug: 'usajobs',
          external_id: String(item.MatchedObjectId),

          title,
          company,
          location,
          employment_type,
          remote_type: inferRemoteTypeFromLocation(location),

          posted_date: safeDate(descriptor.PublicationStartDate),
          created_at: nowIso,
          external_url: descriptor.PositionURI ?? null,

          salary_min,
          salary_max,
          competitiveness_level: null,

          description,
          data_raw: item,
        }

        jobs.push(job)
      } catch (err) {
        console.warn('USAJobsSource: skipping malformed item', err)
        continue
      }
    }

    return jobs
  },
}

// ---------------------------------------------------------------------------
// Jooble (POST-based API, global aggregator)
// ---------------------------------------------------------------------------

export const JoobleSource: JobSource = {
  slug: 'jooble',
  displayName: 'Jooble',
  // Note: Jooble uses POST requests; the URL is built dynamically with API key
  fetchUrl: 'https://jooble.org/api/',
  type: 'aggregator',
  region: 'global',

  normalize: (raw) => {
    const anyRaw = raw as any
    const rows = asArray<any>(anyRaw?.jobs ?? anyRaw)
    if (!rows.length) {
      console.log(
        'Jooble: no rows in response, top-level keys:',
        anyRaw && typeof anyRaw === 'object' ? Object.keys(anyRaw) : 'non-object'
      )
      return []
    }

    const nowIso = new Date().toISOString()

    return rows.map((row: any): NormalizedJob => {
      const id = row.id != null ? String(row.id) : ''
      const title = row.title ?? ''
      const company = row.company ?? null
      const location = row.location ?? null
      const url = row.link ?? null

      // Jooble returns salary as string like "$50,000 - $70,000"
      let salaryMin: number | null = null
      let salaryMax: number | null = null
      if (typeof row.salary === 'string' && row.salary.length > 0) {
        const nums = row.salary.match(/[\d,]+/g)
        if (nums && nums.length >= 1) {
          salaryMin = parseNumber(nums[0].replace(/,/g, ''))
          if (nums.length >= 2) {
            salaryMax = parseNumber(nums[1].replace(/,/g, ''))
          }
        }
      }

      const posted = safeDate(row.updated)

      return {
        source_slug: 'jooble',
        external_id: `jooble:${id || url || title}`,

        title,
        company,
        location,
        employment_type: row.type ?? null,
        remote_type: inferRemoteTypeFromLocation(location),

        posted_date: posted,
        created_at: nowIso,
        external_url: url,

        salary_min: salaryMin,
        salary_max: salaryMax,
        competitiveness_level: null,

        description: row.snippet ?? null,
        data_raw: row,
      }
    })
  },
}

// ---------------------------------------------------------------------------
// The Muse (free tier with API key, US-focused)
// ---------------------------------------------------------------------------

export const TheMuseSource: JobSource = {
  slug: 'themuse',
  displayName: 'The Muse',
  fetchUrl: 'https://www.themuse.com/api/public/jobs',
  type: 'aggregator',
  region: 'us',

  normalize: (raw) => {
    const anyRaw = raw as any
    const rows = asArray<any>(anyRaw?.results ?? anyRaw)
    if (!rows.length) {
      console.log(
        'The Muse: no rows in response, top-level keys:',
        anyRaw && typeof anyRaw === 'object' ? Object.keys(anyRaw) : 'non-object'
      )
      return []
    }

    const nowIso = new Date().toISOString()

    return rows.map((row: any): NormalizedJob => {
      const id = row.id != null ? String(row.id) : ''
      const title = row.name ?? row.title ?? ''
      const company = row.company?.name ?? null

      // The Muse has locations as array of objects
      const locations = asArray<any>(row.locations)
      const location = locations.length > 0
        ? locations.map((loc: any) => loc.name).filter(Boolean).join(', ')
        : null

      // The Muse has categories/levels for employment type
      const levels = asArray<any>(row.levels)
      const employmentType = levels.length > 0
        ? levels.map((lvl: any) => lvl.name).join(', ')
        : null

      const url = row.refs?.landing_page ?? null
      const posted = safeDate(row.publication_date)

      return {
        source_slug: 'themuse',
        external_id: `themuse:${id}`,

        title,
        company,
        location,
        employment_type: employmentType,
        remote_type: inferRemoteTypeFromLocation(location),

        posted_date: posted,
        created_at: nowIso,
        external_url: url,

        salary_min: null, // The Muse doesn't provide salary in API
        salary_max: null,
        competitiveness_level: null,

        description: row.contents ?? null,
        data_raw: row,
      }
    })
  },
}

// ---------------------------------------------------------------------------
// Reed UK (free tier with API key, UK-focused)
// ---------------------------------------------------------------------------

export const ReedUKSource: JobSource = {
  slug: 'reed_uk',
  displayName: 'Reed UK',
  fetchUrl: 'https://www.reed.co.uk/api/1.0/search',
  type: 'aggregator',
  region: 'uk',

  normalize: (raw) => {
    const anyRaw = raw as any
    const rows = asArray<any>(anyRaw?.results ?? anyRaw)
    if (!rows.length) {
      console.log(
        'Reed UK: no rows in response, top-level keys:',
        anyRaw && typeof anyRaw === 'object' ? Object.keys(anyRaw) : 'non-object'
      )
      return []
    }

    const nowIso = new Date().toISOString()

    return rows.map((row: any): NormalizedJob => {
      const id = row.jobId != null ? String(row.jobId) : ''
      const title = row.jobTitle ?? ''
      const company = row.employerName ?? null
      const location = row.locationName ?? null
      const url = row.jobUrl ?? null

      const salaryMin = parseNumber(row.minimumSalary)
      const salaryMax = parseNumber(row.maximumSalary)

      const posted = safeDate(row.date ?? row.datePosted)

      // Reed has explicit contract/permanent fields
      let employmentType: string | null = null
      if (row.contractType) {
        employmentType = row.contractType
      } else if (row.isPermanent !== undefined) {
        employmentType = row.isPermanent ? 'permanent' : 'contract'
      }

      return {
        source_slug: 'reed_uk',
        external_id: `reed_uk:${id}`,

        title,
        company,
        location,
        employment_type: employmentType,
        remote_type: inferRemoteTypeFromLocation(location),

        posted_date: posted,
        created_at: nowIso,
        external_url: url,

        salary_min: salaryMin,
        salary_max: salaryMax,
        competitiveness_level: null,

        description: row.jobDescription ?? null,
        data_raw: row,
      }
    })
  },
}

// ---------------------------------------------------------------------------
// TheirStack (tech job aggregator with technographic data)
// ---------------------------------------------------------------------------

export const TheirStackSource: JobSource = {
  slug: 'theirstack',
  displayName: 'TheirStack',
  fetchUrl: 'https://api.theirstack.com/v1/jobs/search',
  type: 'aggregator',
  region: 'global',

  normalize: (raw) => {
    const anyRaw = raw as any
    const rows = asArray<any>(anyRaw?.data ?? anyRaw)
    if (!rows.length) {
      console.log(
        'TheirStack: no rows in response, top-level keys:',
        anyRaw && typeof anyRaw === 'object' ? Object.keys(anyRaw) : 'non-object'
      )
      return []
    }

    const nowIso = new Date().toISOString()

    return rows.map((row: any): NormalizedJob => {
      const id = row.id != null ? String(row.id) : ''
      const title = row.title ?? ''
      const company = row.company ?? row.company_name ?? null
      const location = row.location ?? null
      const url = row.url ?? row.apply_url ?? null

      // TheirStack has explicit remote flag
      let remote_type: RemoteType = null
      if (row.remote === true) {
        remote_type = 'remote'
      } else if (row.hybrid === true) {
        remote_type = 'hybrid'
      } else if (typeof row.remote === 'string') {
        remote_type = inferRemoteTypeFromLocation(row.remote)
      } else {
        remote_type = inferRemoteTypeFromLocation(location)
      }

      // Parse posted date
      const posted = safeDate(row.posted_at ?? row.date_posted ?? row.created_at)

      // Map employment type
      const employmentType = row.employment_type ?? row.job_type ?? null

      // Map seniority from level field
      const level = row.seniority_level ?? row.level ?? null

      return {
        source_slug: 'theirstack',
        external_id: `theirstack:${id || url || title}`,

        title,
        company,
        location,
        employment_type: employmentType || level,
        remote_type,

        posted_date: posted,
        created_at: nowIso,
        external_url: url,

        salary_min: parseNumber(row.salary_min),
        salary_max: parseNumber(row.salary_max),
        competitiveness_level: null,

        description: row.body ?? row.description ?? null,
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
  FindworkSource,
  AdzunaUSSource,
  USAJobsSource,
  CareerOneStopSource,
  JobicySource,
  ArbeitnowSource,
  JoobleSource,
  TheMuseSource,
  ReedUKSource,
  TheirStackSource,
]

