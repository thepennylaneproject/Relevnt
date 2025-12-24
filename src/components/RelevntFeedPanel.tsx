import React, { useState, useEffect, useMemo, useCallback } from 'react'
import useMatchJobs from '../hooks/useMatchJobs'
import { usePersonas } from '../hooks/usePersonas'
import { useJobInteractions } from '../hooks/useJobInteractions'
import { useNetworkingCompanies, checkCompanyMatch } from '../hooks/useNetworkLookup'
import { NetworkingOverlay } from './networking/NetworkingOverlay'
import type { MatchJobsResult } from '../hooks/useMatchJobs'
import type { MatchFactors } from '../lib/matchJobs'
import Icon from './ui/Icon'
import { copy } from '../lib/copy'

type JobLike = {
  id?: string
  title?: string | null
  company?: string | null
  location?: string | null
  external_url?: string | null
  salary_min?: number | null
  salary_max?: number | null
  remote_type?: string | null
  competitiveness_level?: string | null
  probability_estimate?: number | null
  growth_score?: number | null
  hiring_momentum?: number | null
  source_slug?: string | null
  employment_type?: string | null
}

export interface RelevntFeedPanelProps {
  minSalary?: number
  remoteOnly?: boolean
  source?: string
  employmentType?: string
  refreshKey?: number
}

export function RelevntFeedPanel({
  minSalary = 0,
  remoteOnly = false,
  source = '',
  employmentType = '',
  refreshKey = 0
}: RelevntFeedPanelProps) {
  const { activePersona, loading: personasLoading } = usePersonas()
  const { matches, loading: feedLoading, error: feedError, runMatchJobs } =
    useMatchJobs()
  const { trackInteraction } = useJobInteractions()
  const { companies: networkingCompanies, companyCounts } = useNetworkingCompanies()

  const [dismissedJobIds, setDismissedJobIds] = useState<Set<string>>(new Set())

  const [selectedMatch, setSelectedMatch] = useState<MatchJobsResult | null>(null)
  const [showWhyModal, setShowWhyModal] = useState(false)

  // Handle dismissing a job
  const handleDismissJob = useCallback((jobId: string, matchScore: number, matchFactors?: MatchFactors) => {
    setDismissedJobIds(prev => new Set(prev).add(jobId))
    trackInteraction(jobId, 'dismiss', matchScore, matchFactors || null, activePersona?.id || null)
  }, [trackInteraction, activePersona?.id])

  // Handle saving a job (track the interaction)
  const handleSaveJob = useCallback((jobId: string, matchScore: number, matchFactors?: MatchFactors) => {
    trackInteraction(jobId, 'save', matchScore, matchFactors || null, activePersona?.id || null)
  }, [trackInteraction, activePersona?.id])

  // run matching whenever active persona changes
  useEffect(() => {
    if (activePersona) {
      runMatchJobs(null, activePersona.id)
    } else {
      runMatchJobs(null, null)
    }
  }, [activePersona, runMatchJobs, refreshKey])

  // Filter matches - but NO score cutoff. We show all jobs and flag weak matches.
  const filteredMatches = useMemo(() => {
    return matches.filter((m: MatchJobsResult) => {
      // Filter out dismissed jobs
      if (dismissedJobIds.has(m.job_id)) return false

      const job: JobLike = (m.job as JobLike) || {}

      if (remoteOnly) {
        const isRemote =
          job.remote_type === 'remote' ||
          (typeof job.location === 'string' &&
            job.location.toLowerCase().includes('remote'))
        if (!isRemote) return false
      }

      if (minSalary > 0) {
        const salaryMin = Number(job.salary_min ?? 0)
        const salaryMax = Number(job.salary_max ?? salaryMin)
        const effective = salaryMax || salaryMin
        if (!effective || effective < minSalary) return false
      }

      if (source && job.source_slug !== source) {
        return false
      }

      if (employmentType) {
        // Simple partial match for employment type
        const type = (job.employment_type || '').toLowerCase()
        if (!type.includes(employmentType.toLowerCase())) {
          return false
        }
      }

      return true
    })
  }, [matches, minSalary, remoteOnly, source, employmentType, dismissedJobIds])

  const totalMatches = matches.length
  const visibleMatches = filteredMatches.length

  return (
    <>
      <div className="feed-stack">
        {/* top controls: explainer (formerly feed-controls) */}
        <div className="feed-header-explainer">
          <p className="subtitle">
            {activePersona ? (
              <>
                Showing matches for <strong>{activePersona.name}</strong>. Relevnt uses this
                persona's preferences, your resume, and market data to score roles.
              </>
            ) : (
              <>
                Select a persona above to see targeted matches. Currently showing general
                recommendations based on your profile.
              </>
            )}
          </p>
        </div>


        {/* status bar */}
        <div className="feed-status-bar text-xs muted">
          {feedLoading && 'Scanning the market for matches…'}
          {!feedLoading && feedError && (
            <span className="feed-error">
              {feedError.message}
            </span>
          )}
          {!feedLoading && !feedError && (
            <>
              {visibleMatches} of {totalMatches}{' '}
              matches visible with your filters.
            </>
          )}
        </div>

        {/* list of matches */}
        <div className="feed-job-list">
          {!feedLoading &&
            !feedError &&
            filteredMatches.length === 0 && (
              <div className="empty-state">
                <Icon name="search" size="xl" className="empty-icon" />
                <p className="empty-state__description">We couldn't load your matches right now...</p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => runMatchJobs(null, activePersona?.id || null)}
                >
                  Try again
                </button>
              </div>
            )}

          {filteredMatches.map((m) => {
            const job = (m.job as JobLike) || {}

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
              (job.location || '')
                .toLowerCase()
                .includes('remote')

            const mainReasons = Array.isArray(m.reasons)
              ? m.reasons.slice(0, 3)
              : []

            return (
              <div key={m.job_id} className="card card-job-feed">
                <div className="card-header">
                  <h3>{job.title}</h3>
                  <span className={`badge badge-match ${m.score < 50 ? 'weak' : ''}`}>
                    {m.score < 50 ? 'Weak Match' : 'Match'} {Math.round(m.score)}
                  </span>
                </div>

                <div className="card-meta">
                  {job.company && (
                    <span className="meta-item">
                      <Icon name="briefcase" size="sm" /> {job.company}
                    </span>
                  )}
                  {job.location && (
                    <span className="meta-item">
                      <Icon name="map-pin" size="sm" /> {job.location}
                    </span>
                  )}
                  {salaryLabel && (
                    <span className="meta-item">
                      <Icon name="dollar" size="sm" /> {salaryLabel}
                    </span>
                  )}
                  {isRemote && (
                    <span className="meta-item">
                      <Icon name="zap" size="sm" /> Remote
                    </span>
                  )}
                </div>

                {mainReasons.length > 0 && (
                  <ul className="card-reasons">
                    {mainReasons.map((reason, idx) => (
                      <li key={idx} className="positive">{reason}</li>
                    ))}
                    {/* Placeholder for missing requirements to match template style if needed, 
                        but we stick to what the data provides */}
                  </ul>
                )}

                <div className="card-footer">
                  {job.external_url && (
                    <a
                      href={job.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-with-icon"
                    >
                      View posting <Icon name="chevron-right" size="sm" />
                    </a>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-with-icon"
                    onClick={() => handleSaveJob(m.job_id, m.score)}
                  >
                    <Icon name="bookmark" size="sm" /> Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-with-icon"
                    onClick={() => handleDismissJob(m.job_id, m.score)}
                  >
                    <Icon name="x" size="sm" /> Dismiss
                  </button>
                  {/* Keep "Why this match" as a ghost button? The prompt didn't include it in the template, 
                      but it's good functionality. I'll omit it to strictly follow the template unless it's critical. 
                      Actually, "Why this match" is usually helpful. I'll leave it out to match the prompt template exactly. */}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showWhyModal && selectedMatch && (
        <div className="feed-modal-overlay" onClick={() => setShowWhyModal(false)}>
          <div
            className="feed-modal"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div className="feed-modal-header">
              <div>
                <div className="feed-job-title">
                  {(selectedMatch.job as JobLike)?.title}
                </div>
                <div className="feed-job-meta muted text-xs">
                  {(selectedMatch.job as JobLike)?.company && (
                    <span>{(selectedMatch.job as JobLike)?.company}</span>
                  )}
                  {(selectedMatch.job as JobLike)?.location && (
                    <span>• {(selectedMatch.job as JobLike)?.location}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="feed-modal-close"
                onClick={() => setShowWhyModal(false)}
              >
                ×
              </button>
            </div>

            <div className="feed-modal-score">
              <span className="feed-match-pill">
                Match {Math.round(selectedMatch.score)}
              </span>
            </div>

            <div className="feed-modal-section">
              <div className="section-label">Why this is in your feed</div>
              {Array.isArray(selectedMatch.reasons) && selectedMatch.reasons.length > 0 ? (
                <ul className="feed-reason-list muted text-xs">
                  {selectedMatch.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <div className="muted text-xs">
                  This match passed your filters based on your profile, resume, and current settings.
                </div>
              )}
            </div>

            {(() => {
              const job = (selectedMatch?.job as JobLike) || {}
              return job.company ? (
                <div className="feed-modal-section">
                  <NetworkingOverlay company={job.company} />
                </div>
              ) : null
            })()}

            <div className="feed-modal-section">
              <div className="section-label">Job snapshot</div>
              <div className="text-xs">
                {(() => {
                  const job = (selectedMatch?.job as JobLike) || {}
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

                  return (
                    <ul className="feed-modal-snapshot-list">
                      {salaryLabel && <li>Salary signal: {salaryLabel}</li>}
                      {isRemote && <li>Remote-friendly or flexible location</li>}
                      {job.competitiveness_level && (
                        <li>Market: {job.competitiveness_level}</li>
                      )}
                    </ul>
                  )
                })()}
              </div>
            </div>

            {(selectedMatch.job as JobLike)?.external_url && (
              <div className="feed-modal-actions">
                <a
                  href={(selectedMatch.job as JobLike).external_url as string}
                  target="_blank"
                  rel="noreferrer"
                  className="ghost-button button-sm feed-accent-link"
                >
                  Open full posting on employer site
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
