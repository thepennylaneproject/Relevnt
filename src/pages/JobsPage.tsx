import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RelevntFeedPanel } from '../components/RelevntFeedPanel'
import { useAuth } from '../contexts/AuthContext'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { copy } from '../lib/copy'
import type { JobRow } from '../shared/types'
import { usePersonas } from '../hooks/usePersonas'
import { RelevanceTuner } from '../components/personas/RelevanceTuner'
import { AutoTuneSuggestions } from '../components/intelligence/AutoTuneSuggestions'
import { useNetworkingCompanies, checkCompanyMatch } from '../hooks/useNetworkLookup'

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

export default function JobsPage() {
  const { user } = useAuth()
  const { activePersona, personas, setActivePersona } = usePersonas()
  const { showToast } = useToast()

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

  // feed filters (lifted from RelevntFeedPanel)
  const [minSalaryFeed, setMinSalaryFeed] = useState(0)
  const [remoteOnlyFeed, setRemoteOnlyFeed] = useState(false)
  const [sourceFeed, setSourceFeed] = useState('')
  const [employmentTypeFeed, setEmploymentTypeFeed] = useState('')

  const [sources, setSources] = useState<JobSourceRow[]>([])
  const [savedJobIds, setSavedJobIds] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

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
            'probability_estimate',
          ].join(', ')
        )
        .eq('is_active', true)
        .order('posted_date', { ascending: false, nullsFirst: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      // Persona-based filtering: augment search with persona keywords if search is empty
      let effectiveSearch = search.trim()
      if (!effectiveSearch && activePersona?.preferences?.job_title_keywords?.length) {
        // Use first keyword from persona as default search
        effectiveSearch = activePersona.preferences.job_title_keywords[0]
      }

      if (effectiveSearch) {
        const term = `%${effectiveSearch}%`
        query = query.or(
          `title.ilike.${term},company.ilike.${term},location.ilike.${term}`
        )
      }

      // Persona-based location filtering
      let effectiveLocation = locationFilter.trim()
      if (!effectiveLocation && activePersona?.preferences?.locations?.length) {
        effectiveLocation = activePersona.preferences.locations[0]
      }

      if (effectiveLocation) {
        const loc = `%${effectiveLocation}%`
        query = query.ilike('location', loc)
      }

      // Persona-based remote filtering
      const shouldFilterRemote = remoteOnlyBrowse ||
        (!remoteOnlyBrowse && activePersona?.preferences?.remote_preference === 'remote')

      if (shouldFilterRemote) {
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
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        const isoDate = cutoff.toISOString().slice(0, 10)
        query = query.gte('posted_date', isoDate)
      }

      // Persona-based minimum salary filtering
      const effectiveMinSalary = minSalaryBrowse > 0
        ? minSalaryBrowse
        : (activePersona?.preferences?.min_salary || 0)

      if (effectiveMinSalary > 0) {
        query = query.gte('salary_max', effectiveMinSalary)
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

      const jobsList = data as JobRow[]

      // Enrich with company metrics
      const companyNames = Array.from(new Set(jobsList.map(j => j.company).filter(Boolean))) as string[]
      const { data: companiesData } = await (supabase as any)
        .from('companies')
        .select('name, growth_score, job_creation_velocity')
        .in('name', companyNames)

      const companyMap = new Map((companiesData || []).map((c: any) => [c.name, c]))
      const enrichedJobs = jobsList.map(j => {
        if (j.company) {
          const c = companyMap.get(j.company) as { growth_score?: number; job_creation_velocity?: number } | undefined
          if (c) {
            return {
              ...j,
              growth_score: c.growth_score,
              hiring_momentum: c.job_creation_velocity
            }
          }
        }
        return j
      })

      setJobs(enrichedJobs)
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
    activePersona,
  ])

  // Networking connections
  const { companies: networkingCompanies, companyCounts } = useNetworkingCompanies()

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

      const ids = (data || []).map((row: { job_id: string }) => row.job_id)
      setSavedJobIds(ids)
    } catch (err) {
      console.warn('Unexpected error loading saved jobs', err)
    }
  }, [user])

  const toggleSavedJob = useCallback(
    async (jobId: string) => {
      if (!user) {
        showToast('Sign in to save jobs', 'warning', 3000)
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
            showToast('Failed to remove job', 'error', 3000)
            return
          }

          setSavedJobIds((prev) => prev.filter((id) => id !== jobId))
          showToast('Removed from saved jobs', 'info', 2500)
        } else {
          const { error } = await supabase.from('saved_jobs').insert({
            user_id: user.id,
            job_id: jobId,
          })

          if (error) {
            console.warn('Failed to save job', error)
            showToast('Failed to save job', 'error', 3000)
            return
          }

          setSavedJobIds((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]))
          showToast('Saved to My Jobs → Discovered', 'success', 3000)
        }
      } catch (err) {
        console.warn('Unexpected error toggling saved job', err)
        showToast('Something went wrong', 'error', 3000)
      }
    },
    [user, savedJobIds, showToast]
  )

  const handleClearFilters = useCallback(() => {
    setSearch('')
    setLocationFilter('')
    setSourceKey('')
    setEmploymentType('')
    setPostedSince('')
    setMinSalaryBrowse(0)
    setRemoteOnlyBrowse(false)
    setSortBy('recent')
    setPage(0)
  }, [])

  // sorted view of jobs for rendering
  const sortedJobs = useMemo(() => {
    if (jobs.length === 0) return jobs

    if (sortBy === 'recent') {
      // already ordered by posted_date desc from DB
      return jobs
    }

    const copy = [...jobs]

    if (sortBy === 'company') {
      copy.sort((a, b) => (a.company || '').localeCompare(b.company || ''))
      return copy
    }

    if (sortBy === 'match') {
      copy.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
      return copy
    }

    if (sortBy === 'salary-high' || sortBy === 'salary-low') {
      const sign = sortBy === 'salary-high' ? -1 : 1
      copy.sort((a, b) => {
        const aVal = (a.salary_max ?? a.salary_min ?? 0) as number
        const bVal = (b.salary_max ?? b.salary_min ?? 0) as number
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
    loadSavedJobs()
  }, [loadSavedJobs])

  const renderFeed = () => {
    return (
      <div className="feed-stack">
        {activePersona && (
          <div className="feed-header-explainer">
            <p className="subtitle">
              Jobs ranked by AI using your <strong>{activePersona.name}</strong> job target.
              {!personas.length && ' Create a job target to personalize your results.'}
            </p>
          </div>
        )}
        {!activePersona && (
          <div className="feed-header-explainer">
            <p className="subtitle">
              Showing all available jobs. <a href="/settings?section=targeting" className="text-accent hover:underline">Set up a job target</a> to get AI-powered personalized rankings.
            </p>
          </div>
        )}

        {/* Relevance Tuner with Feed Filters */}
        <RelevanceTuner 
          onWeightsChange={() => {
            // Weights are saved to DB. Trigger feed refresh.
            setRefreshKey(prev => prev + 1)
          }}
          minSalary={minSalaryFeed}
          setMinSalary={setMinSalaryFeed}
          remoteOnly={remoteOnlyFeed}
          setRemoteOnly={setRemoteOnlyFeed}
          source={sourceFeed}
          setSource={setSourceFeed}
          employmentType={employmentTypeFeed}
          setEmploymentType={setEmploymentTypeFeed}
          availableSources={sources}
        />

        {/* Auto-Tune Suggestions - Concierge mode */}
        <AutoTuneSuggestions />

        {/* Job Feed */}
        <div className="jobs-feed-container">
          <RelevntFeedPanel 
            minSalary={minSalaryFeed}
            remoteOnly={remoteOnlyFeed}
            source={sourceFeed}
            employmentType={employmentTypeFeed}
            refreshKey={refreshKey}
          />
        </div>
      </div>
    )
  }

  const renderBrowseTab = () => {
    return (
      <div className="jobs-browse-layout">
        <aside className="jobs-sidebar">
          <div>
            <h3 className="filter-section-title">Search & Source</h3>
            <div className="form-group">
              <label className="form-label">Job Title or Keyword</label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                placeholder="Product designer, marketing…"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value)
                  setPage(0)
                }}
                placeholder="Remote, New York, Europe…"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Source</label>
              <select
                value={sourceKey}
                onChange={(e) => {
                  setSourceKey(e.target.value)
                  setPage(0)
                }}
                className="form-select"
              >
                <option value="">All sources</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.source_key}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h3 className="filter-section-title">Refine</h3>
            <div className="form-group">
              <label className="form-label">Employment type</label>
              <select
                value={employmentType}
                onChange={(e) => {
                  setEmploymentType(e.target.value)
                  setPage(0)
                }}
                className="form-select"
              >
                <option value="">Any</option>
                <option value="full-time">Full time</option>
                <option value="part-time">Part time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Posted within</label>
              <select
                value={postedSince}
                onChange={(e) => {
                  setPostedSince(e.target.value as '7d' | '30d' | '90d' | '')
                  setPage(0)
                }}
                className="form-select"
              >
                <option value="">Anytime</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Min salary (USD)</label>
              <input
                type="number"
                min={0}
                step={5000}
                value={minSalaryBrowse}
                onChange={(e) => {
                  const raw = e.target.value
                  const numeric = raw.replace(/[^\d]/g, '')
                  const num = numeric === '' ? 0 : Number(numeric)
                  const next = num <= 0 ? 0 : num
                  setMinSalaryBrowse(next)
                  setPage(0)
                }}
                className="form-input text-right"
              />
            </div>

            <div className="form-group">
              <div className="feed-remote-filter">
                <input
                  id="browse-remote-only"
                  type="checkbox"
                  className="form-checkbox"
                  checked={remoteOnlyBrowse}
                  onChange={(e) => {
                    setRemoteOnlyBrowse(e.target.checked)
                    setPage(0)
                  }}
                />
                <label htmlFor="browse-remote-only" className="text-sm">Remote friendly roles</label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="form-select"
              >
                <option value="recent">Most recent</option>
                <option value="salary-high">Salary, high to low</option>
                <option value="salary-low">Salary, low to high</option>
                <option value="match">Best match</option>
                <option value="company">Company name</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <Button type="button" variant="primary" onClick={() => fetchJobs()}>
              Refresh jobs
            </Button>
            <Button type="button" variant="secondary" onClick={handleClearFilters}>
              Clear filters
            </Button>
          </div>
        </aside>

        <main className="jobs-list">
          {jobsLoading && <div className="muted">Loading jobs…</div>}
          {!jobsLoading && jobsError && <div className="error-text">{jobsError}</div>}
          {!jobsLoading && !jobsError && sortedJobs.length === 0 && (
            <EmptyState
              type="jobs"
              title="No opportunities found yet"
              description={
                search || locationFilter || sourceKey || employmentType || postedSince || minSalaryBrowse > 0 || remoteOnlyBrowse
                  ? "Try adjusting your filters to see more opportunities."
                  : "Your perfect role may be on its way. We're continuously searching."
              }
              
            />
          )}

          {!jobsLoading && !jobsError && sortedJobs.length > 0 && (
            <div className="card-grid-3col">
              {sortedJobs.map((job) => {
                const salaryMin = job.salary_min || null
                const salaryMax = job.salary_max || null
                let salaryLabel = ''
                if (salaryMin && salaryMax && salaryMin !== salaryMax) {
                  salaryLabel = `$${salaryMin.toLocaleString()} – $${salaryMax.toLocaleString()}`
                } else if (salaryMin || salaryMax) {
                  const n = salaryMin || salaryMax
                  salaryLabel = `$${Number(n).toLocaleString()}`
                }

                const isRemote =
                  job.remote_type === 'remote' ||
                  (job.location || '').toLowerCase().includes('remote')

                const isSaved = savedJobIds.includes(job.id)
                const matchScore =
                  typeof job.match_score === 'number' ? Math.round(job.match_score) : null

                let postedLabel = ''
                if (job.posted_date) {
                  const parsed = new Date(job.posted_date)
                  if (!Number.isNaN(parsed.getTime())) {
                    postedLabel = parsed.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  }
                }

                return (
                  <div key={job.id} className="card card-job-grid">
                    <div className="card-header">
                      <h3>{job.title}</h3>
                    </div>

                    <div className="card-company">
                      {job.company || 'Unknown Company'} {job.location ? `• ${job.location}` : ''}
                    </div>

                    <div className="card-meta">
                      {salaryLabel && (
                        <span className="meta-item">
                          {salaryLabel}
                        </span>
                      )}
                      {job.employment_type && (
                        <span className="meta-item">
                          {job.employment_type.replace('_', ' ')}
                        </span>
                      )}
                      {postedLabel && (
                        <span className="meta-item">
                          {postedLabel}
                        </span>
                      )}
                    </div>

                    <div className="card-tags">
                      {isRemote && <span className="tag tag-remote">Remote</span>}
                      {job.source_slug && <span className="tag">{job.source_slug}</span>}
                    </div>

                    <div className="card-footer">
                      {job.external_url && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => job.external_url && window.open(job.external_url, '_blank', 'noreferrer')}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => toggleSavedJob(job.id)}
                        variant={isSaved ? 'secondary' : 'ghost'}
                        size="sm"
                        aria-label={isSaved ? 'Remove from saved' : 'Save job'}
                      >
                        {isSaved ? 'Saved' : 'Save'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <PageBackground>
      <Container maxWidth="xl" padding="md">
        <div className="jobs-page">
          {/* Page Header */}
          <div className="page-header">
            <div className="header-top">
              <h1>Relevnt Feed</h1>
              <a 
                href="/settings?section=targeting"
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '14px',
                  color: 'var(--color-ink-tertiary)',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-ink-tertiary)' }}
              >
                <Icon name="pocket-watch" size="sm" hideAccent />
                Edit targeting
              </a>
            </div>
            <p>Jobs matched to you, ranked by what matters most.</p>
          </div>

          {/* Job Target Selector (optional) */}
          {personas.length > 0 && (
            <div className="feed-controls">
              <div className="job-target-selector">
                <label className="text-xs font-medium muted mr-2">Job Target:</label>
                <select
                  className="form-select"
                  value={activePersona?.id || ''}
                  onChange={(e) => setActivePersona(e.target.value)}
                >
                  <option value="">All Jobs</option>
                  {personas.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Unified Feed */}
          {renderFeed()}
        </div>
      </Container>
    </PageBackground>
  )
}
