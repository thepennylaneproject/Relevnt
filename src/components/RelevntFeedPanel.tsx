// src/components/RelevntFeedPanel.tsx
import React, { useEffect, useMemo, useState } from 'react'
import useMatchJobs from '../hooks/useMatchJobs'
import useCareerTracks from '../hooks/useCareerTracks'
import type { MatchJobsResult } from '../hooks/useMatchJobs'

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
}

export function RelevntFeedPanel() {
  const { tracks, loading: tracksLoading } = useCareerTracks()
  const { matches, loading: feedLoading, error: feedError, runMatchJobs } =
    useMatchJobs()

  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)

  const [minScore, setMinScore] = useState(50)
  const [minSalary, setMinSalary] = useState(0)
  const [remoteOnly, setRemoteOnly] = useState(false)

  const [selectedMatch, setSelectedMatch] = useState<MatchJobsResult | null>(null)
  const [showWhyModal, setShowWhyModal] = useState(false)

  // pick a default track when tracks load
  useEffect(() => {
    if (!activeTrackId && tracks.length > 0) {
      const defaultTrack =
        tracks.find((t) => t.is_default) || tracks[0]
      setActiveTrackId(defaultTrack.id)
    }
  }, [tracks, activeTrackId])

  // run matching whenever active track changes
  useEffect(() => {
    if (!activeTrackId && tracks.length === 0) {
      // no tracks, still want a generic feed
      runMatchJobs(null)
      return
    }

    if (activeTrackId) {
      runMatchJobs(activeTrackId)
    }
  }, [activeTrackId, tracks.length, runMatchJobs])

  const filteredMatches = useMemo(() => {
    return matches.filter((m: MatchJobsResult) => {
      if (m.score < minScore) return false

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
  }, [matches, minScore, minSalary, remoteOnly])

  const totalMatches = matches.length
  const visibleMatches = filteredMatches.length

  return (
    <>
      <div className="feed-stack">
        {/* top controls: track selector + explainer */}
        <div className="surface-card feed-controls">
          <div className="feed-track-selector">
            <label className="section-label">Career focus</label>
            {tracksLoading ? (
              <div className="muted text-sm">
                Loading tracks…
              </div>
            ) : tracks.length === 0 ? (
              <div className="muted text-sm">
                You have not created tracks yet. This feed is using your general
                profile and resume.
              </div>
            ) : (
              <select
                value={activeTrackId ?? ''}
                onChange={(e) =>
                  setActiveTrackId(e.target.value || null)
                }
                className="input-pill"
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="feed-explainer muted text-xs">
            Relevnt uses this focus area, your resume, and current market data to
            score and explain which roles are worth your energy first.
          </div>
        </div>

        {/* feed filters */}
        <div className="surface-card feed-filters">
          <div className="field">
            <label className="section-label">
              Minimum match score
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => {
                const val = Number(e.target.value || 0)
                setMinScore(val < 0 ? 0 : val > 100 ? 100 : val)
              }}
              className="input-pill text-right"
            />
          </div>

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
                  <div className="feed-match-pill">
                    Match {Math.round(m.score)}
                  </div>
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
