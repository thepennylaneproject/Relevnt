import React, { useState, useEffect, useMemo, useCallback } from 'react'
import useMatchJobs from '../hooks/useMatchJobs'
import { usePersonas } from '../hooks/usePersonas'
import { useJobInteractions } from '../hooks/useJobInteractions'
import { useNetworkingCompanies, checkCompanyMatch } from '../hooks/useNetworkLookup'
import { NetworkingOverlay } from './networking/NetworkingOverlay'
import type { MatchJobsResult } from '../hooks/useMatchJobs'
import type { MatchFactors } from '../lib/matchJobs'

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
}

export function RelevntFeedPanel() {
  const { activePersona, loading: personasLoading } = usePersonas()
  const { matches, loading: feedLoading, error: feedError, runMatchJobs } =
    useMatchJobs()
  const { trackInteraction } = useJobInteractions()
  const { companies: networkingCompanies, companyCounts } = useNetworkingCompanies()

  const [minSalary, setMinSalary] = useState(0)
  const [remoteOnly, setRemoteOnly] = useState(false)
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
      // no active persona, maybe fallback or clear
      // runMatchJobs(null, null) 
      // Actually, if we want a "default" feed even without persona?
      // For now, let's try to match with generic profile if permitted, 
      // but requirement says "Ensure active persona ID flows into hook".
      // If no persona, maybe we don't match or match generally?
      // Let's match generally if no persona.
      runMatchJobs(null, null)
    }
  }, [activePersona, runMatchJobs])

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

      return true
    })
  }, [matches, minSalary, remoteOnly, dismissedJobIds])

  const totalMatches = matches.length
  const visibleMatches = filteredMatches.length

  return (
    <>
      <div className="feed-stack">
        {/* top controls: track selector + explainer */}
        <div className="surface-card feed-controls">
          <div className="feed-explainer muted text-xs">
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
          </div>
        </div>

        {/* feed filters - removed minScore filter, showing all jobs */}
        <div className="surface-card feed-filters">
          <div className="field">
            <label className="section-label">
              Minimum salary (USD)
            </label>
            <input
              type="number"
              min={0}
              step={5000}
              value={minSalary}
              onChange={(e) => {
                const raw = e.target.value
                const numeric = raw.replace(/[^\d]/g, '')
                const num = numeric === '' ? 0 : Number(numeric)
                const next = num <= 0 ? 0 : num
                setMinSalary(next)
              }}
              className="input-pill text-right"
            />
          </div>



          <div className="feed-remote-filter">
            <input
              id="feed-remote-only"
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) =>
                setRemoteOnly(e.target.checked)
              }
            />
            <label
              htmlFor="feed-remote-only"
              className="text-sm"
            >
              Remote friendly only
            </label>
          </div>
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
              <div className="muted text-sm">
                No matches cleared your current filters yet. Try lowering the
                minimum score or salary to see more of the landscape.
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
              <article
                key={m.job_id}
                className="feed-job-card"
              >
                <div className="feed-job-title-row">
                  <div className="feed-job-title">
                    {job.title}
                  </div>
                  {/* Flag weak matches (below 50) with different style */}
                  {m.score < 50 ? (
                    <div className="feed-match-pill feed-match-pill--weak">
                      Weak Match {Math.round(m.score)}
                    </div>
                  ) : (
                    <div className="feed-match-pill">
                      Match {Math.round(m.score)}
                    </div>
                  )}
                </div>

                <div className="feed-job-meta muted text-xs">
                  {job.company && <span>{job.company}</span>}
                  {job.location && (
                    <span>• {job.location}</span>
                  )}
                  {salaryLabel && (
                    <span>• {salaryLabel}</span>
                  )}
                </div>

                <div className="feed-tag-row">
                  {/* Networking connection badge */}
                  {job.company && (
                    (() => {
                      const count = checkCompanyMatch(job.company, networkingCompanies, companyCounts);
                      return count > 0 ? (
                        <span className="feed-tag feed-tag--networking" title={`You have ${count} connection${count > 1 ? 's' : ''} at this company`}>
                          🔗 {count} {count === 1 ? 'Connection' : 'Connections'}
                        </span>
                      ) : null;
                    })()
                  )}
                  {isRemote && (
                    <span className="feed-tag">
                      Remote friendly
                    </span>
                  )}
                  {job.competitiveness_level && (
                    <span className="feed-tag">
                      Market: {job.competitiveness_level}
                    </span>
                  )}
                  {job.probability_estimate !== undefined && job.probability_estimate !== null && (
                    <span className="feed-tag feed-tag--special">
                      Success: {Math.round(job.probability_estimate * 100)}%
                    </span>
                  )}
                  {job.growth_score !== undefined && job.growth_score !== null && job.growth_score > 70 && (
                    <span className="feed-tag feed-tag--growth">
                      🚀 High Growth
                    </span>
                  )}
                </div>

                {mainReasons.length > 0 && (
                  <ul className="feed-reason-list muted text-xs">
                    {mainReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                )}

                <div className="feed-job-actions">
                  {job.external_url && (
                    <a
                      href={job.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="ghost-button button-sm feed-accent-link"
                    >
                      View posting
                    </a>
                  )}
                  <button
                    type="button"
                    className="ghost-button button-sm"
                    onClick={() => {
                      setSelectedMatch(m)
                      setShowWhyModal(true)
                    }}
                  >
                    Why this match
                  </button>
                  <button
                    type="button"
                    className="ghost-button button-sm feed-dismiss-btn"
                    onClick={() => handleDismissJob(m.job_id, m.score)}
                    title="Not interested"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              </article>
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
              const job = (selectedMatch.job as JobLike) || {}
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
                  const job = (selectedMatch.job as JobLike) || {}
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
