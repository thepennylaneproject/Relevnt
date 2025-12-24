import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  SlidersHorizontal,
  Filter,
  ArrowRight,
  FolderOpen,
  Clock,
  DollarSign,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { RelevntFeedPanel } from '../components/RelevntFeedPanel'
import { useAuth } from '../contexts/AuthContext'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { EmptyState } from '../components/ui/EmptyState'
import { copy } from '../lib/copy'
import type { JobRow } from '../shared/types'
import { PersonaSwitcher } from '../components/personas/PersonaSwitcher'
import { usePersonas } from '../hooks/usePersonas'
import { RelevanceTuner } from '../components/personas/RelevanceTuner'
import { PatternInsightsPanel } from '../components/intelligence/PatternInsightsPanel'
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
  const [activeTab, setActiveTab] = useState<'feed' | 'browse'>('feed')
  const { user } = useAuth()
  const { activePersona } = usePersonas()

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

          setSavedJobIds((prev) => prev.filter((id) => id !== jobId))
        } else {
          const { error } = await supabase.from('saved_jobs').insert({
            user_id: user.id,
            job_id: jobId,
          })

          if (error) {
            console.warn('Failed to save job', error)
            return
          }

          setSavedJobIds((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]))
        }
      } catch (err) {
        console.warn('Unexpected error toggling saved job', err)
      }
    },
    [user, savedJobIds]
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
    if (activeTab === 'browse') {
      fetchJobs()
    }
  }, [activeTab, fetchJobs])

  useEffect(() => {
    loadSavedJobs()
  }, [loadSavedJobs])

  const renderFeedTab = () => {
    if (!activePersona) {
      return (
        <div className="jobs-section-stack">
          <section className="surface-card jobs-context">
            <div className="jobs-context-main">
              <Icon name="compass" size="md" />
              <div>
                <h2 className="text-sm font-medium">No Active Persona</h2>
                <p className="muted text-xs">
                  Please select or create a persona using the switcher above to see your personalized feed.
                </p>
              </div>
            </div>
          </section>
        </div>
      )
    }

    return (
      <div className="jobs-section-stack">
        <section className="surface-card jobs-context">
          <div className="jobs-context-main">
            <Icon name="compass" size="md" />
            <div>
              <h2 className="text-sm font-medium">{copy.jobs.tabs.feed}</h2>
              <p className="muted text-xs">
                Jobs ranked by AI using your {activePersona.name} persona preferences.
                Adjust the weights below to fine-tune your results.
              </p>
            </div>
          </div>
        </section>

        {/* Relevance Tuner */}
        <RelevanceTuner onWeightsChange={() => {
          // Weight changes are saved to DB by the hook
          // The feed uses these weights, so refresh the page to apply
          // Future: trigger refetch via context or state management
        }} />

        {/* Auto-Tune Suggestions - Concierge mode */}
        <AutoTuneSuggestions />

        {/* Pattern Insights - surface behavioral patterns */}
        <PatternInsightsPanel collapsed={true} />

        {/* Job Feed */}
        <div className="jobs-feed-container">
          <RelevntFeedPanel />
        </div>
      </div>
    )
  }

  const renderBrowseTab = () => {
    const hasPersonaFilters = activePersona?.preferences && (
      activePersona.preferences.job_title_keywords?.length > 0 ||
      activePersona.preferences.locations?.length > 0 ||
      activePersona.preferences.remote_preference === 'remote' ||
      activePersona.preferences.min_salary
    )

    return (
      <div className="jobs-section-stack">
        <section className="surface-card jobs-context jobs-context-browse">
          <div className="jobs-context-main">
            <Filter className="w-5 h-5 text-graphite" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-medium">
                {hasPersonaFilters && activePersona ? `Browsing as ${activePersona.name}` : 'Browsing all roles'}
              </h2>
              <p className="muted text-xs">
                {hasPersonaFilters
                  ? 'Jobs are filtered based on your persona preferences. Manual filters will override these defaults.'
                  : 'The full stream from every source. Keep filters tight to stay focused.'}
              </p>
            </div>
          </div>
        </section>

        <section className="surface-card jobs-filters">
          <div className="jobs-filters-header">
            <div className="jobs-filters-title">
              <SlidersHorizontal className="w-4 h-4 text-graphite" aria-hidden="true" />
              <span className="text-sm font-medium">Filter the stream</span>
            </div>
            <div className="jobs-filters-actions">
              <button type="button" className="ghost-button" onClick={handleClearFilters}>
                Clear filters
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => fetchJobs()}
                disabled={jobsLoading}
              >
                {jobsLoading ? 'Refreshing…' : 'Refresh jobs'}
              </button>
            </div>
          </div>

          <div className="jobs-filter-grid">
            <div className="field">
              <label className="section-label">Search title or company</label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                placeholder="Product designer, marketing, security…"
                className="input-pill"
              />
            </div>

            <div className="field">
              <label className="section-label">Location</label>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value)
                  setPage(0)
                }}
                placeholder="Remote, New York, Europe…"
                className="input-pill"
              />
            </div>

            <div className="field">
              <label className="section-label">Source</label>
              <select
                value={sourceKey}
                onChange={(e) => {
                  setSourceKey(e.target.value)
                  setPage(0)
                }}
                className="input-pill"
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

          <div className="jobs-filter-grid">
            <div className="field">
              <label className="section-label">Employment type</label>
              <select
                value={employmentType}
                onChange={(e) => {
                  setEmploymentType(e.target.value)
                  setPage(0)
                }}
                className="input-pill"
              >
                <option value="">Any</option>
                <option value="full-time">Full time</option>
                <option value="part-time">Part time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>

            <div className="field">
              <label className="section-label">Posted within</label>
              <select
                value={postedSince}
                onChange={(e) => {
                  setPostedSince(e.target.value as '7d' | '30d' | '90d' | '')
                  setPage(0)
                }}
                className="input-pill"
              >
                <option value="">Anytime</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>

            <div className="field">
              <label className="section-label">Min salary (USD)</label>
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
                className="input-pill text-right"
              />
            </div>

            <div className="field checkbox-field">
              <label className="section-label">Remote friendly</label>
              <div className="checkbox-inline">
                <input
                  id="browse-remote-only"
                  type="checkbox"
                  checked={remoteOnlyBrowse}
                  onChange={(e) => {
                    setRemoteOnlyBrowse(e.target.checked)
                    setPage(0)
                  }}
                />
                <label htmlFor="browse-remote-only">Only show remote-friendly roles</label>
              </div>
            </div>
          </div>

          <div className="jobs-filters-footer">
            <div className="field inline-field">
              <label className="section-label">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="input-pill"
              >
                <option value="recent">Most recent</option>
                <option value="salary-high">Salary, high to low</option>
                <option value="salary-low">Salary, low to high</option>
                <option value="match">Best match</option>
                <option value="company">Company name</option>
              </select>
            </div>
          </div>
        </section>

        <div className="jobs-list">
          {jobsLoading && <div className="muted">Loading jobs…</div>}
          {!jobsLoading && jobsError && <div className="error-text">{jobsError}</div>}
          {!jobsLoading && !jobsError && sortedJobs.length === 0 && (
            <EmptyState
              type="jobs"
              includeVerse={true}
              action={{
                label: copy.jobs.filters.clearFilters,
                onClick: handleClearFilters,
              }}
            />
          )}

          {!jobsLoading && !jobsError && sortedJobs.length > 0 && (
            <div className="item-grid">
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
                  <article key={job.id} className="item-card">
                    <header className="item-card-header">
                      <div>
                        <h3 className="text-sm font-semibold">{job.title}</h3>
                        <p className="muted text-xs">
                          {job.company && <span>{job.company}</span>}
                          {job.company && job.location && <span> • </span>}
                          {job.location && <span>{job.location}</span>}
                        </p>
                      </div>
                      {matchScore !== null && (
                        <span className="pill pill--accent">Match {matchScore}%</span>
                      )}
                      {job.probability_estimate !== undefined && job.probability_estimate !== null && (
                        <span className="pill pill--indigo">
                          Success: {Math.round(job.probability_estimate * 100)}%
                        </span>
                      )}
                      {job.growth_score !== undefined && job.growth_score !== null && job.growth_score > 70 && (
                        <span className="pill pill--success">🚀 High Growth</span>
                      )}
                    </header>

                    <div className="tag-row">
                      {job.company && (
                        (() => {
                          const count = checkCompanyMatch(job.company, networkingCompanies, companyCounts);
                          return count > 0 ? (
                            <span className="pill pill--networking" title={`You have ${count} connection${count > 1 ? 's' : ''} at this company`}>
                              🔗 {count} {count === 1 ? 'Connection' : 'Connections'}
                            </span>
                          ) : null;
                        })()
                      )}
                      {isRemote && <span className="tag">Remote friendly</span>}
                      {job.employment_type && (
                        <span className="tag">
                          <Icon name="briefcase" size="sm" hideAccent />
                          {job.employment_type}
                        </span>
                      )}
                      {salaryLabel && (
                        <span className="tag">
                          <DollarSign className="w-3 h-3 text-graphite" aria-hidden="true" />
                          {salaryLabel}
                        </span>
                      )}
                      {postedLabel && (
                        <span className="tag">
                          <Clock className="w-3 h-3 text-graphite" aria-hidden="true" />
                          Posted {postedLabel}
                        </span>
                      )}
                      {job.competitiveness_level && (
                        <span className="tag">Market: {job.competitiveness_level}</span>
                      )}
                      {job.source_slug && <span className="tag">{job.source_slug}</span>}
                    </div>

                    <footer className="item-card-footer">
                      {job.external_url && (
                        <a
                          href={job.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className="ghost-button"
                        >
                          View posting
                          <ArrowRight className="w-4 h-4 text-graphite" aria-hidden="true" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleSavedJob(job.id)}
                        className={`ghost-button ${isSaved ? 'is-active' : ''}`}
                      >
                        <FolderOpen className="w-4 h-4 text-graphite" aria-hidden="true" />
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                    </footer>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <PageBackground>
      <Container maxWidth="xl" padding="md">
        <div className="jobs-page">
          {/* Hero Section */}
          <PageHero
            category="track"
            headline={copy.jobs.pageHeadline}
            subtitle={copy.jobs.pageSubtitle}
          />

          {/* Context Band: Persona + Tabs in one row */}
          <section className="jobs-context-band">
            <div className="jobs-context-band__persona">
              <PersonaSwitcher />
              {activePersona && (
                <div className="jobs-persona-stats">
                  {activePersona.preferences?.remote_preference === 'remote' && (
                    <span className="persona-stat">Prefers remote</span>
                  )}
                  {activePersona.preferences?.min_salary && (
                    <span className="persona-stat">
                      Target: ${Math.round(activePersona.preferences.min_salary / 1000)}k+
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="jobs-tabs">
              <button
                type="button"
                className={`jobs-tab ${activeTab === 'feed' ? 'active' : ''}`}
                onClick={() => setActiveTab('feed')}
              >
                {copy.jobs.tabs.feed}
              </button>
              <button
                type="button"
                className={`jobs-tab ${activeTab === 'browse' ? 'active' : ''}`}
                onClick={() => setActiveTab('browse')}
              >
                {copy.jobs.tabs.all}
              </button>
            </div>
          </section>

          {/* Transparency line for feed tab */}
          {activeTab === 'feed' && activePersona && (
            <p className="jobs-transparency-line">
              {copy.jobs.transparencyLine}
            </p>
          )}

          {activeTab === 'feed' ? renderFeedTab() : renderBrowseTab()}
        </div>
      </Container>
    </PageBackground>
  )
}

