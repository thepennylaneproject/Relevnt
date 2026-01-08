/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JOBS PAGE — Running Logbook Blueprint
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Physical metaphor: A running logbook of opportunities — each row a single
 * pencil entry on a ruled page, read top to bottom.
 *
 * Three Zones:
 * 1. Masthead (sticky) — page title + inline text filters
 * 2. Ledger (scrollable) — continuous list of job rows
 * 3. Footnote (bottom) — end-of-results marker
 *
 * Constraints:
 * - No cards, no panels, no tiles, no shadows
 * - Jobs as ledger rows, not cards
 * - One primary action (View →) always visible
 * - Secondary actions hidden, revealed on hover/focus
 * - No salary, match score, badges, tags in default row view
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import { useSessionContext } from '../hooks/useSessionContext'
import { useHelperSettingsSummary } from '../hooks/useHelperSettingsSummary'
import { IntentSummary, buildMatchReason } from '../components/ui/IntentSummary'
import type { JobRow } from '../shared/types'
import './JobsPage.css'

type JobSourceRow = {
  id: string
  name: string
  source_key: string
  enabled: boolean
}

// Structural guard to ensure we have valid job data
function isJobRowArray(data: unknown): data is JobRow[] {
  if (!Array.isArray(data)) return false
  return data.every((item) => {
    if (!item || typeof item !== 'object') return false
    const obj = item as Record<string, unknown>
    return typeof obj.id === 'string' && typeof obj.title === 'string'
  })
}

const PAGE_SIZE = 50

export default function JobsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const { loaded: sessionLoaded, getJobsFilters, setJobsFilters, setLastRoute } = useSessionContext()
  const { summary: settingsSummary } = useHelperSettingsSummary()
  const filtersInitialized = useRef(false)

  // Job data state
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobsError, setJobsError] = useState<string | null>(null)

  // Filter state - initialized from URL params, then session context, then defaults
  const [sourceKey, setSourceKey] = useState<string | ''>(searchParams.get('source') || '')
  const [employmentType, setEmploymentType] = useState<string | ''>(searchParams.get('type') || '')
  const [postedSince, setPostedSince] = useState<'7d' | '30d' | '90d' | ''>((searchParams.get('posted') as any) || '')
  const [remoteOnly, setRemoteOnly] = useState(searchParams.get('remote') === 'true')
  const [minSalary, setMinSalary] = useState(parseInt(searchParams.get('minSalary') || '0', 10))
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '0', 10))

  // Initialize filters from session context if URL has no params
  useEffect(() => {
    if (!sessionLoaded || filtersInitialized.current) return
    filtersInitialized.current = true

    // If URL has params, use them. Otherwise, restore from session context.
    const hasUrlParams = searchParams.has('source') || searchParams.has('type') ||
      searchParams.has('posted') || searchParams.has('remote') || searchParams.has('minSalary')

    if (!hasUrlParams) {
      const savedFilters = getJobsFilters()
      if (savedFilters) {
        if (savedFilters.source) setSourceKey(savedFilters.source)
        if (savedFilters.type) setEmploymentType(savedFilters.type)
        if (savedFilters.posted) setPostedSince(savedFilters.posted as any)
        if (savedFilters.remote) setRemoteOnly(savedFilters.remote)
        if (savedFilters.minSalary > 0) setMinSalary(savedFilters.minSalary)
      }
    }
  }, [sessionLoaded, searchParams, getJobsFilters])

  // Record this route as last visited
  useEffect(() => {
    setLastRoute('/jobs')
  }, [setLastRoute])

  // Update URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {}
    if (sourceKey) params.source = sourceKey
    if (employmentType) params.type = employmentType
    if (postedSince) params.posted = postedSince
    if (remoteOnly) params.remote = 'true'
    if (minSalary > 0) params.minSalary = minSalary.toString()
    if (page > 0) params.page = page.toString()

    setSearchParams(params, { replace: true })

    // Also persist filters to session context for return visits
    if (filtersInitialized.current) {
      setJobsFilters({
        source: sourceKey,
        posted: postedSince,
        type: employmentType,
        minSalary,
        remote: remoteOnly,
      })
    }
  }, [sourceKey, employmentType, postedSince, remoteOnly, minSalary, page, setSearchParams, setJobsFilters])

  // Popover state for filter menus
  const [activePopover, setActivePopover] = useState<'source' | 'posted' | 'type' | 'salary' | null>(null)

  // Sources for filter options
  const [sources, setSources] = useState<JobSourceRow[]>([])
  const [savedJobIds, setSavedJobIds] = useState<string[]>([])

  // Expansion state for inline details
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null)

  // ─────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────────────────

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
            'is_direct',
          ].join(', ')
        )
        .eq('is_active', true)
        .order('posted_date', { ascending: false, nullsFirst: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      if (sourceKey) {
        query = query.eq('source_slug', sourceKey)
      }

      if (employmentType) {
        switch (employmentType) {
          case 'full-time':
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
        }
      }

      if (postedSince) {
        const now = new Date()
        const days = postedSince === '7d' ? 7 : postedSince === '30d' ? 30 : 90
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
        const isoDate = cutoff.toISOString().slice(0, 10)
        query = query.gte('posted_date', isoDate)
      }

      if (remoteOnly) {
        query = query.or('remote_type.eq.remote,location.ilike.%Remote%')
      }

      if (minSalary > 0) {
        query = query.gte('salary_max', minSalary)
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

      setJobs(data as JobRow[])
    } catch (err) {
      console.error('Unexpected error loading jobs', err)
      setJobsError('Something went wrong while loading jobs.')
      setJobs([])
    } finally {
      setJobsLoading(false)
    }
  }, [sourceKey, employmentType, postedSince, remoteOnly, minSalary, page])

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

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────────────────

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
            showToast('Failed to remove job', 'error', 3000)
            return
          }

          setSavedJobIds((prev) => prev.filter((id) => id !== jobId))
          showToast('Removed from saved', 'info', 2500)
        } else {
          const { error } = await supabase.from('saved_jobs').insert({
            user_id: user.id,
            job_id: jobId,
          })

          if (error) {
            showToast('Failed to save job', 'error', 3000)
            return
          }

          setSavedJobIds((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]))
          showToast('Saved', 'success', 2500)
        }
      } catch (err) {
        showToast('Something went wrong', 'error', 3000)
      }
    },
    [user, savedJobIds, showToast]
  )

  const copyJobLink = useCallback(
    (url: string) => {
      navigator.clipboard.writeText(url)
      showToast('Link copied', 'info', 2000)
    },
    [showToast]
  )

  const toggleExpansion = useCallback((jobId: string) => {
    setExpandedJobId((prev) => (prev === jobId ? null : jobId))
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  useEffect(() => {
    loadSavedJobs()
  }, [loadSavedJobs])

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  const formatRelativeDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1d ago'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  /**
   * Check if a job is considered stale (older than maxAgeDays)
   */
  const isJobStale = (dateStr: string | null | undefined, maxAgeDays: number = 45): boolean => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return false
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    return diffDays > maxAgeDays
  }

  /**
   * Format source slug to a readable name
   */
  const formatSourceName = (sourceSlug: string): string => {
    const sourceNames: Record<string, string> = {
      greenhouse: 'Greenhouse',
      lever: 'Lever',
      remoteok: 'RemoteOK',
      remotive: 'Remotive',
      himalayas: 'Himalayas',
      adzuna_us: 'Adzuna',
      usajobs: 'USAJobs',
      jobicy: 'Jobicy',
      arbeitnow: 'Arbeitnow',
      jooble: 'Jooble',
      themuse: 'The Muse',
      theirstack: 'TheirStack',
      careeronestop: 'CareerOneStop',
      rss: 'RSS Feed',
      reed_uk: 'Reed',
      careerjet: 'Careerjet',
      whatjobs: 'WhatJobs',
      fantastic: 'FantasticJobs',
      jobdatafeeds: 'JobDataFeeds',
    }
    return sourceNames[sourceSlug] || sourceSlug
  }

  const formatSalary = (min: number | null | undefined, max: number | null | undefined): string => {
    if (!min && !max) return ''
    if (min && max && min !== max) {
      return `$${min.toLocaleString()} – $${max.toLocaleString()}`
    }
    const val = min || max
    return val ? `$${val.toLocaleString()}` : ''
  }

  const handleRowKeyDown = (e: React.KeyboardEvent, jobId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleExpansion(jobId)
    }
  }

  // Filter labels
  const sourceLabel = sourceKey
    ? sources.find((s) => s.source_key === sourceKey)?.name || 'All sources'
    : 'All sources'
  const postedLabel =
    postedSince === '7d'
      ? 'Last 7 days'
      : postedSince === '30d'
      ? 'Last 30 days'
      : postedSince === '90d'
      ? 'Last 90 days'
      : 'Anytime'
  const typeLabel =
    employmentType === 'full-time'
      ? 'Full-time'
      : employmentType === 'part-time'
      ? 'Part-time'
      : employmentType === 'contract'
      ? 'Contract'
      : employmentType === 'temporary'
      ? 'Temporary'
      : 'Any type'
  const salaryLabel = minSalary > 0 ? `$${minSalary.toLocaleString()}+` : '$0+'

  // Close popover when clicking outside
  const closePopover = useCallback(() => setActivePopover(null), [])
  const togglePopover = useCallback((name: 'source' | 'posted' | 'type' | 'salary') => {
    setActivePopover((prev) => (prev === name ? null : name))
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="jobs-page">
      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 1: MASTHEAD
          ═══════════════════════════════════════════════════════════════════ */}
      <header className="jobs-masthead">
        <h1 className="jobs-masthead__title">Opportunities</h1>

        {/* Intent Summary - shows current search preferences */}
        <IntentSummary variant="compact" showSettingsLink={true} className="jobs-masthead__intent" />

        <nav className="jobs-masthead__filters">
          {/* Source Filter */}
          <div className="jobs-filter-wrapper">
            <button
              type="button"
              className={`jobs-filter-link ${sourceKey ? 'jobs-filter-link--active' : ''}`}
              onClick={() => togglePopover('source')}
              aria-expanded={activePopover === 'source'}
            >
              {sourceLabel}
            </button>
            {activePopover === 'source' && (
              <div className="jobs-filter-popover">
                <button
                  type="button"
                  className={`jobs-filter-option ${!sourceKey ? 'jobs-filter-option--active' : ''}`}
                  onClick={() => { setSourceKey(''); setPage(0); closePopover() }}
                >
                  All sources
                </button>
                {sources.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`jobs-filter-option ${sourceKey === s.source_key ? 'jobs-filter-option--active' : ''}`}
                    onClick={() => { setSourceKey(s.source_key); setPage(0); closePopover() }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="jobs-filter-sep">·</span>

          {/* Posted Filter */}
          <div className="jobs-filter-wrapper">
            <button
              type="button"
              className={`jobs-filter-link ${postedSince ? 'jobs-filter-link--active' : ''}`}
              onClick={() => togglePopover('posted')}
              aria-expanded={activePopover === 'posted'}
            >
              {postedLabel}
            </button>
            {activePopover === 'posted' && (
              <div className="jobs-filter-popover">
                {(['', '7d', '30d', '90d'] as const).map((val) => (
                  <button
                    key={val || 'any'}
                    type="button"
                    className={`jobs-filter-option ${postedSince === val ? 'jobs-filter-option--active' : ''}`}
                    onClick={() => { setPostedSince(val); setPage(0); closePopover() }}
                  >
                    {val === '' ? 'Anytime' : val === '7d' ? 'Last 7 days' : val === '30d' ? 'Last 30 days' : 'Last 90 days'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="jobs-filter-sep">·</span>

          {/* Type Filter */}
          <div className="jobs-filter-wrapper">
            <button
              type="button"
              className={`jobs-filter-link ${employmentType ? 'jobs-filter-link--active' : ''}`}
              onClick={() => togglePopover('type')}
              aria-expanded={activePopover === 'type'}
            >
              {typeLabel}
            </button>
            {activePopover === 'type' && (
              <div className="jobs-filter-popover">
                {([['', 'Any type'], ['full-time', 'Full-time'], ['part-time', 'Part-time'], ['contract', 'Contract'], ['temporary', 'Temporary']] as const).map(([val, label]) => (
                  <button
                    key={val || 'any'}
                    type="button"
                    className={`jobs-filter-option ${employmentType === val ? 'jobs-filter-option--active' : ''}`}
                    onClick={() => { setEmploymentType(val); setPage(0); closePopover() }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="jobs-filter-sep">·</span>

          {/* Salary Filter */}
          <div className="jobs-filter-wrapper">
            <button
              type="button"
              className={`jobs-filter-link ${minSalary > 0 ? 'jobs-filter-link--active' : ''}`}
              onClick={() => togglePopover('salary')}
              aria-expanded={activePopover === 'salary'}
            >
              {salaryLabel}
            </button>
            {activePopover === 'salary' && (
              <div className="jobs-filter-popover">
                {[0, 50000, 75000, 100000, 150000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`jobs-filter-option ${minSalary === val ? 'jobs-filter-option--active' : ''}`}
                    onClick={() => { setMinSalary(val); setPage(0); closePopover() }}
                  >
                    {val === 0 ? '$0+' : `$${val.toLocaleString()}+`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="jobs-filter-sep">·</span>

          {/* Remote Checkbox */}
          <label className="jobs-filter-checkbox">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => { setRemoteOnly(e.target.checked); setPage(0) }}
            />
            <span>Remote</span>
          </label>
        </nav>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 2: LEDGER
          ═══════════════════════════════════════════════════════════════════ */}
      {jobsLoading && <div className="jobs-loading">Loading opportunities…</div>}

      {!jobsLoading && jobsError && <div className="jobs-error">{jobsError}</div>}

      {!jobsLoading && !jobsError && jobs.length === 0 && (
        <div className="jobs-empty">
          <p className="jobs-empty__title">No opportunities found</p>
          <p className="jobs-empty__desc">
            Try adjusting your filters, or check back later.
          </p>
        </div>
      )}

      {!jobsLoading && !jobsError && jobs.length > 0 && (
        <ul className="jobs-ledger" role="list">
          {jobs.map((job) => {
            const isSaved = savedJobIds.includes(job.id)
            const isExpanded = expandedJobId === job.id
            const location = job.location || ''
            const isRemote =
              job.remote_type === 'remote' || location.toLowerCase().includes('remote')
            const displayLocation = isRemote ? 'Remote' : location

            // Expansion details
            const salaryStr = formatSalary(job.salary_min, job.salary_max)
            const matchScore = typeof job.match_score === 'number' ? Math.round(job.match_score) : null
            const empType = job.employment_type?.replace('_', ' ') || ''

            // Build match reason text based on user settings
            const matchReason = settingsSummary?.settings_configured
              ? buildMatchReason(job, settingsSummary.hard_constraints)
              : null

            // Check if job is stale (older than 45 days)
            const stale = isJobStale(job.posted_date, 45)

            return (
              <li
                key={job.id}
                className={`jobs-ledger__row ${isExpanded ? 'jobs-ledger__row--expanded' : ''}`}
                role="listitem"
              >
                {/* Row header (collapsed view) */}
                <div
                  className="jobs-ledger__header"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={`job-details-${job.id}`}
                  onClick={() => toggleExpansion(job.id)}
                  onKeyDown={(e) => handleRowKeyDown(e, job.id)}
                >
                  <div className="jobs-ledger__info">
                    <span className="jobs-ledger__title">{job.title}</span>
                    <span className="jobs-ledger__meta">
                      {job.company || 'Unknown'}
                      {displayLocation && ` · ${displayLocation}`}
                    </span>
                    {matchReason && (
                      <span className="jobs-ledger__match-reason" title="Why this job matches your preferences">
                        {matchReason}
                      </span>
                    )}
                    <span className="jobs-ledger__date">
                      {formatRelativeDate(job.posted_date)}
                      {job.source_slug && (
                        <span className="jobs-ledger__source" title={`Source: ${job.source_slug}`}>
                          {' via '}{formatSourceName(job.source_slug)}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="jobs-ledger__actions">
                    {/* Secondary actions — hidden until hover/focus */}
                    <div className="jobs-ledger__secondary-actions">
                      <button
                        type="button"
                        className="jobs-ledger__secondary-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSavedJob(job.id)
                        }}
                        title={isSaved ? 'Unsave' : 'Save'}
                      >
                        {isSaved ? '★ Saved' : '☆ Save'}
                      </button>
                      {job.external_url && (
                        <button
                          type="button"
                          className="jobs-ledger__secondary-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyJobLink(job.external_url!)
                          }}
                          title="Copy link"
                        >
                          Copy
                        </button>
                      )}
                      <a
                        href={`/insights?job=${job.id}`}
                        className="jobs-ledger__secondary-btn"
                        onClick={(e) => e.stopPropagation()}
                        title="Check resume fit for this job"
                      >
                        Check Fit
                      </a>
                    </div>

                    {/* Primary action — always visible */}
                    {job.external_url ? (
                      <a
                        href={job.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="jobs-ledger__primary-action"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View →
                      </a>
                    ) : (
                      <span className="jobs-ledger__primary-action" style={{ opacity: 0.4 }}>
                        View →
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline expansion — details only */}
                <div
                  id={`job-details-${job.id}`}
                  className="jobs-ledger__expansion"
                  role="region"
                  aria-hidden={!isExpanded}
                >
                  <dl className="jobs-ledger__details">
                    {job.is_direct && (
                      <>
                        <dt>Apply</dt>
                        <dd>Direct to company</dd>
                      </>
                    )}
                    {salaryStr && (
                      <>
                        <dt>Salary</dt>
                        <dd>{salaryStr}</dd>
                      </>
                    )}
                    {matchScore !== null && (
                      <>
                        <dt>Match</dt>
                        <dd>{matchScore}%</dd>
                      </>
                    )}
                    {empType && (
                      <>
                        <dt>Type</dt>
                        <dd>{empType}</dd>
                      </>
                    )}
                    {isRemote && (
                      <>
                        <dt>Work</dt>
                        <dd>Remote</dd>
                      </>
                    )}
                    {job.source_slug && (
                      <>
                        <dt>Source</dt>
                        <dd>{formatSourceName(job.source_slug)}</dd>
                      </>
                    )}
                    {stale && (
                      <>
                        <dt>Notice</dt>
                        <dd className="jobs-ledger__stale-notice">
                          Older listing - verify on company site
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          ZONE 3: FOOTNOTE
          ═══════════════════════════════════════════════════════════════════ */}
      {!jobsLoading && !jobsError && jobs.length > 0 && (
        <footer className="jobs-footnote">
          {jobs.length < PAGE_SIZE
            ? 'End of results'
            : `Showing ${jobs.length} opportunities`}
        </footer>
      )}
    </div>
  )
}
