// src/pages/JobsPage.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'
import { RelevntFeedPanel } from '../components/RelevntFeedPanel'
import { useAuth } from '../contexts/AuthContext'
import type { JobRow } from '../shared/types'
import useMatchJobs from '../hooks/useMatchJobs'
import useCareerTracks from '../hooks/useCareerTracks'

type JobSourceRow = {
  id: string
  name: string
  source_key: string
  enabled: boolean
}

// cheap structural guard so we never treat an error array as jobs
function isJobRowArray(data: unknown): data is JobRow[] {
  if (!Array.isArray(data)) return false
  return data.every((item) => {
    if (!item || typeof item !== 'object') return false
    const obj = item as Record<string, unknown>
    return typeof obj.id === 'string' && typeof obj.title === 'string'
  })
}

type SortBy =
  | 'recent'
  | 'salary-high'
  | 'salary-low'
  | 'match'
  | 'company'

const PAGE_SIZE = 50

// shared styles
const pageWrapper: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '24px 24px 40px',
}

const headerTitle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 650,
  letterSpacing: 0.2,
  marginBottom: 4,
}

const headerSub: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-subtle, #666)',
  maxWidth: 560,
}

const tabsRow: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  borderBottom: '1px solid var(--border, #e2e2e2)',
  marginTop: 20,
  marginBottom: 20,
}

const tabButtonBase: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: '8px 14px',
  fontSize: 13,
  cursor: 'pointer',
  borderRadius: 999,
}

const filtersCard: React.CSSProperties = {
  borderRadius: 16,
  padding: 16,
  border: '1px solid var(--border, #e2e2e2)',
  background: 'var(--surface, #ffffff)',
  marginBottom: 16,
}

const pillInput: React.CSSProperties = {
  height: 36,
  borderRadius: 999,
  border: '1px solid #e2e2e2',
  padding: '0 12px',
  fontSize: 13,
  width: '100%',
  backgroundColor: '#fff',
  boxSizing: 'border-box',
}

const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  marginBottom: 4,
  color: '#555',
}

const primaryButton: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid #d6a65c',
  background: '#f7ecda',
  fontSize: 12,
  cursor: 'pointer',
  color: '#4b3a1d',
}

const subtleButton: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 999,
  border: '1px solid var(--border, #ddd)',
  background: 'var(--surface, #fff)',
  fontSize: 12,
  cursor: 'pointer',
}

const jobCard: React.CSSProperties = {
  borderRadius: 14,
  padding: 16,
  border: '1px solid var(--border-subtle, #eee)',
  background: 'var(--surface, #fff)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const jobTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
}

const jobMetaRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  fontSize: 12,
  color: '#666',
}

const tagRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 4,
}

const tagPill: React.CSSProperties = {
  padding: '3px 8px',
  borderRadius: 999,
  border: '1px solid #eee',
  fontSize: 11,
  color: '#555',
}

const chipRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 8,
}

const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 999,
  border: '1px solid var(--border-subtle, #eee)',
  fontSize: 11,
  color: 'var(--text-subtle, #666)',
}

// main page
export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'browse'>('feed')
  const { user } = useAuth()


  // browse side (jobs list from Supabase)
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobsError, setJobsError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [remoteOnlyBrowse, setRemoteOnlyBrowse] = useState(false)
  const [sourceKey, setSourceKey] = useState<string | ''>('')
  const [employmentType, setEmploymentType] = useState<string | ''>('')
  const [postedSince, setPostedSince] = useState<'7d' | '30d' | '90d' | ''>('')
  const [minSalaryBrowse, setMinSalaryBrowse] = useState(0)
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<SortBy>('recent')

  const [sources, setSources] = useState<JobSourceRow[]>([])
  const [savedJobIds, setSavedJobIds] = useState<string[]>([])

  const fetchSources = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('job_sources')
        .select('id, name, source_key, enabled')
        .eq('enabled', true)
        .order('name', { ascending: true })

      if (error) throw error
      setSources((data || []) as JobSourceRow[])
    } catch (err) {
      console.warn('Failed to load job sources', err)
    }
  }, [])

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true)
    setJobsError(null)

    try {
      let query = supabase
        .from('jobs')
        .select(
          [
            'id',
            'title',
            'company',
            'location',
            'employment_type',
            'remote_type',
            'source_slug',
            'external_url',
            'posted_date',
            'created_at',
            'salary_min',
            'salary_max',
            'competitiveness_level',
            'match_score',
          ].join(', ')
        )
        .eq('is_active', true)
        .order('posted_date', { ascending: false, nullsFirst: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      if (search.trim()) {
        const term = `%${search.trim()}%`
        query = query.or(
          `title.ilike.${term},company.ilike.${term},location.ilike.${term}`
        )
      }

      if (locationFilter.trim()) {
        const loc = `%${locationFilter.trim()}%`
        query = query.ilike('location', loc)
      }

      if (remoteOnlyBrowse) {
        query = query.or('remote_type.eq.remote,location.ilike.%Remote%')
      }

      if (sourceKey) {
        query = query.eq('source_slug', sourceKey)
      }

      if (employmentType) {
        switch (employmentType) {
          case 'full-time':
            // matches "full time", "full-time", "full_time", "Full Time", etc.
            query = query.ilike('employment_type', '%full%')
            break

          case 'part-time':
            query = query.ilike('employment_type', '%part%')
            break

          case 'contract':
            query = query.ilike('employment_type', '%contract%')
            break

          case 'temporary':
            query = query.ilike('employment_type', '%temp%')
            break

          default:
            // future-proof fallback: no filter
            break
        }
      }

      if (postedSince) {
        const now = new Date()
        const days =
          postedSince === '7d' ? 7 : postedSince === '30d' ? 30 : 90
        const cutoff = new Date(
          now.getTime() - days * 24 * 60 * 60 * 1000
        )
        const isoDate = cutoff.toISOString().slice(0, 10)
        query = query.gte('posted_date', isoDate)
      }

      if (minSalaryBrowse > 0) {
        query = query.gte('salary_max', minSalaryBrowse)
      }

      const { data, error } = await query

      if (error) {
        console.error('Jobs fetch failed', error)
        setJobsError('We could not load jobs right now.')
        setJobs([])
        return
      }

      if (!data || !isJobRowArray(data)) {
        console.warn('Unexpected jobs payload', data)
        setJobs([])
        return
      }

      setJobs(data)
    } catch (err) {
      console.error('Unexpected error loading jobs', err)
      setJobsError('Something went wrong while loading jobs.')
      setJobs([])
    } finally {
      setJobsLoading(false)
    }
  }, [
    search,
    locationFilter,
    remoteOnlyBrowse,
    sourceKey,
    employmentType,
    postedSince,
    minSalaryBrowse,
    page,
  ])

  // saved jobs for current user
  const loadSavedJobs = useCallback(async () => {
    if (!user) {
      setSavedJobIds([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('job_id')
        .eq('user_id', user.id)

      if (error) {
        console.warn('Failed to load saved jobs', error)
        return
      }

      const ids = (data || []).map(
        (row: { job_id: string }) => row.job_id
      )
      setSavedJobIds(ids)
    } catch (err) {
      console.warn('Unexpected error loading saved jobs', err)
    }
  }, [user])

  const toggleSavedJob = useCallback(
    async (jobId: string) => {
      if (!user) {
        // future: open sign in prompt
        return
      }

      const isSaved = savedJobIds.includes(jobId)

      try {
        if (isSaved) {
          const { error } = await supabase
            .from('saved_jobs')
            .delete()
            .eq('user_id', user.id)
            .eq('job_id', jobId)

          if (error) {
            console.warn('Failed to unsave job', error)
            return
          }

          setSavedJobIds((prev) =>
            prev.filter((id) => id !== jobId)
          )
        } else {
          const { error } = await supabase
            .from('saved_jobs')
            .insert({
              user_id: user.id,
              job_id: jobId,
            })

          if (error) {
            console.warn('Failed to save job', error)
            return
          }

          setSavedJobIds((prev) =>
            prev.includes(jobId) ? prev : [...prev, jobId]
          )
        }
      } catch (err) {
        console.warn('Unexpected error toggling saved job', err)
      }
    },
    [user, savedJobIds]
  )

  // sorted view of jobs for rendering
  const sortedJobs = useMemo(() => {
    if (jobs.length === 0) return jobs

    if (sortBy === 'recent') {
      // already ordered by posted_date desc from DB
      return jobs
    }

    const copy = [...jobs]

    if (sortBy === 'company') {
      copy.sort((a, b) =>
        (a.company || '').localeCompare(b.company || '')
      )
      return copy
    }

    if (sortBy === 'match') {
      copy.sort(
        (a, b) =>
          (b.match_score ?? 0) - (a.match_score ?? 0)
      )
      return copy
    }

    if (sortBy === 'salary-high' || sortBy === 'salary-low') {
      const sign = sortBy === 'salary-high' ? -1 : 1
      copy.sort((a, b) => {
        const aVal =
          (a.salary_max ?? a.salary_min ?? 0) as number
        const bVal =
          (b.salary_max ?? b.salary_min ?? 0) as number
        if (aVal === bVal) return 0
        return aVal < bVal ? sign : -sign
      })
      return copy
    }

    return jobs
  }, [jobs, sortBy])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchJobs()
    }
  }, [activeTab, fetchJobs])

  useEffect(() => {
    loadSavedJobs()
  }, [loadSavedJobs])

  // helpers
  const renderFeedTab = () => {
    return (
      <div style={{ marginTop: 16 }}>
        <RelevntFeedPanel />
      </div>
    )
  }

  const renderBrowseTab = () => {
    return (
      <>
        <div style={filtersCard}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(0, 2fr) minmax(0, 2fr) minmax(0, 1.5fr)',
              gap: 12,
              marginBottom: 12,
            }}
          >
            {/* search */}
            <div>
              <label style={sectionLabel}>
                Search title or company
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                placeholder="Product designer, marketing, security…"
                style={pillInput}
              />
            </div>

            {/* location */}
            <div>
              <label style={sectionLabel}>
                Location
              </label>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(
                    e.target.value
                  )
                  setPage(0)
                }}
                placeholder="Remote, New York, Europe…"
                style={pillInput}
              />
            </div>

            {/* source */}
            <div>
              <label style={sectionLabel}>
                Source
              </label>
              <select
                value={sourceKey}
                onChange={(e) => {
                  setSourceKey(e.target.value)
                  setPage(0)
                }}
                style={pillInput}
              >
                <option value="">
                  All sources
                </option>
                {sources.map((s) => (
                  <option
                    key={s.id}
                    value={s.source_key}
                  >
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* second row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr)',
              gap: 12,
              alignItems: 'center',
            }}
          >
            {/* employment type */}
            <div>
              <label style={sectionLabel}>
                Employment type
              </label>
              <select
                value={employmentType}
                onChange={(e) => {
                  setEmploymentType(
                    e.target.value
                  )
                  setPage(0)
                }}
                style={pillInput}
              >
                <option value="">
                  Any
                </option>
                <option value="full-time">
                  Full time
                </option>
                <option value="part-time">
                  Part time
                </option>
                <option value="contract">
                  Contract
                </option>
                <option value="temporary">
                  Temporary
                </option>
              </select>
            </div>

            {/* posted since */}
            <div>
              <label style={sectionLabel}>
                Posted within
              </label>
              <select
                value={postedSince}
                onChange={(e) => {
                  setPostedSince(
                    e.target.value as
                    | '7d'
                    | '30d'
                    | '90d'
                    | ''
                  )
                  setPage(0)
                }}
                style={pillInput}
              >
                <option value="">
                  Anytime
                </option>
                <option value="7d">
                  Last 7 days
                </option>
                <option value="30d">
                  Last 30 days
                </option>
                <option value="90d">
                  Last 90 days
                </option>
              </select>
            </div>

            {/* min salary browse */}
            <div>
              <label style={sectionLabel}>
                Min salary (USD)
              </label>
              <input
                type="number"
                min={0}
                step={5000}
                value={minSalaryBrowse}
                onChange={(e) => {
                  const raw = e.target.value
                  const numeric =
                    raw.replace(/[^\d]/g, '')
                  const num =
                    numeric === ''
                      ? 0
                      : Number(numeric)
                  const next =
                    num <= 0 ? 0 : num
                  setMinSalaryBrowse(next)
                  setPage(0)
                }}
                style={{
                  ...pillInput,
                  textAlign: 'right',
                }}
              />
            </div>

            {/* remote */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                marginTop: 18,
              }}
            >
              <input
                id="browse-remote-only"
                type="checkbox"
                checked={remoteOnlyBrowse}
                onChange={(e) => {
                  setRemoteOnlyBrowse(
                    e.target.checked
                  )
                  setPage(0)
                }}
              />
              <label htmlFor="browse-remote-only">
                Remote friendly only
              </label>
            </div>
          </div>

          {/* third row: sort */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 14,
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 220,
              }}
            >
              <label style={sectionLabel}>
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as SortBy
                  )
                }
                style={pillInput}
              >
                <option value="recent">
                  Most recent
                </option>
                <option value="salary-high">
                  Salary, high to low
                </option>
                <option value="salary-low">
                  Salary, low to high
                </option>
                <option value="match">
                  Best match
                </option>
                <option value="company">
                  Company name
                </option>
              </select>
            </div>

            {/* actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                flex: 1,
              }}
            >
              <button
                type="button"
                style={subtleButton}
                onClick={() => {
                  setSearch('')
                  setLocationFilter('')
                  setSourceKey('')
                  setEmploymentType('')
                  setPostedSince('')
                  setMinSalaryBrowse(0)
                  setRemoteOnlyBrowse(false)
                  setSortBy('recent')
                  setPage(0)
                }}
              >
                Clear filters
              </button>
              <button
                type="button"
                style={primaryButton}
                onClick={() => fetchJobs()}
                disabled={jobsLoading}
              >
                {jobsLoading
                  ? 'Refreshing…'
                  : 'Refresh jobs'}
              </button>
            </div>
          </div>
        </div>

        {/* list */}
        <div
          style={{
            display: 'grid',
            gap: 12,
          }}
        >
          {jobsLoading && (
            <div
              style={{ fontSize: 13, color: '#666' }}
            >
              Loading jobs…
            </div>
          )}
          {!jobsLoading && jobsError && (
            <div
              style={{ fontSize: 13, color: '#b3261e' }}
            >
              {jobsError}
            </div>
          )}
          {!jobsLoading &&
            !jobsError &&
            sortedJobs.length === 0 && (
              <div
                style={{ fontSize: 13, color: '#666' }}
              >
                No jobs match your filters yet.
                Try broadening your search and
                refresh.
              </div>
            )}

          {sortedJobs.map((job) => {
            const salaryMin =
              job.salary_min || null
            const salaryMax =
              job.salary_max || null
            let salaryLabel = ''
            if (
              salaryMin &&
              salaryMax &&
              salaryMin !== salaryMax
            ) {
              salaryLabel = `$${salaryMin.toLocaleString()} – $${salaryMax.toLocaleString()}`
            } else if (salaryMin || salaryMax) {
              const n = salaryMin || salaryMax
              salaryLabel = `$${Number(
                n
              ).toLocaleString()}`
            }

            const isRemote =
              job.remote_type === 'remote' ||
              (job.location || '')
                .toLowerCase()
                .includes('remote')

            const isSaved = savedJobIds.includes(
              job.id
            )

            return (
              <article
                key={job.id}
                style={jobCard}
              >
                <div style={jobTitle}>
                  {job.title}
                </div>
                <div style={jobMetaRow}>
                  {job.company && (
                    <span>{job.company}</span>
                  )}
                  {job.location && (
                    <span>
                      • {job.location}
                    </span>
                  )}
                  {salaryLabel && (
                    <span>
                      • {salaryLabel}
                    </span>
                  )}
                </div>
                <div style={tagRow}>
                  {isRemote && (
                    <span style={tagPill}>
                      Remote friendly
                    </span>
                  )}
                  {job.employment_type && (
                    <span style={tagPill}>
                      Employment: {job.employment_type}
                    </span>
                  )}
                  {job.competitiveness_level && (
                    <span style={tagPill}>
                      Market:{' '}
                      {
                        job
                          .competitiveness_level
                      }
                    </span>
                  )}
                  {typeof job.match_score ===
                    'number' && (
                      <span
                        style={{
                          ...tagPill,
                          borderColor:
                            '#f0e1c4',
                        }}
                      >
                        Match{' '}
                        {Math.round(
                          job.match_score
                        )}
                      </span>
                    )}
                  {job.source_slug && (
                    <span style={tagPill}>
                      {job.source_slug}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      toggleSavedJob(job.id)
                    }
                    style={{
                      ...subtleButton,
                      backgroundColor: isSaved
                        ? '#f7ecda'
                        : 'var(--surface, #fff)',
                    }}
                  >
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                  {job.external_url && (
                    <a
                      href={job.external_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        ...primaryButton,
                        textDecoration:
                          'none',
                      }}
                    >
                      View job posting
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <div style={pageWrapper}>
      <div style={headerTitle}>Jobs</div>
      <p style={headerSub}>
        Let Relevnt bring matches to you, or browse the full
        stream and hunt manually when you are in that mood.
      </p>

      <div style={tabsRow}>
        <button
          type="button"
          style={{
            ...tabButtonBase,
            backgroundColor:
              activeTab === 'feed'
                ? '#f7ecda'
                : 'transparent',
            color:
              activeTab === 'feed'
                ? '#4b3a1d'
                : '#555',
          }}
          onClick={() => setActiveTab('feed')}
        >
          Relevnt Feed
        </button>
        <button
          type="button"
          style={{
            ...tabButtonBase,
            backgroundColor:
              activeTab === 'browse'
                ? '#f7ecda'
                : 'transparent',
            color:
              activeTab === 'browse'
                ? '#4b3a1d'
                : '#555',
          }}
          onClick={() => setActiveTab('browse')}
        >
          All jobs
        </button>
      </div>

      {activeTab === 'feed'
        ? renderFeedTab()
        : renderBrowseTab()}
    </div>
  )
}