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

// shared styles local to the feed

const card: React.CSSProperties = {
  borderRadius: 16,
  padding: 16,
  border: '1px solid var(--border, #e2e2e2)',
  backgroundColor: 'var(--surface, #ffffff)',
}

const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  marginBottom: 4,
  color: '#555',
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 16,
}

const modal: React.CSSProperties = {
  borderRadius: 16,
  padding: 20,
  border: '1px solid var(--border, #ddd)',
  backgroundColor: 'var(--surface, #ffffff)',
  maxWidth: 520,
  width: '100%',
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: '0 18px 45px rgba(15, 18, 20, 0.35)',
}

const modalHeaderRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 8,
}

const modalCloseButton: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 18,
  lineHeight: 1,
  cursor: 'pointer',
  padding: 4,
}

const modalSectionLabel: React.CSSProperties = {
  ...sectionLabel,
  marginBottom: 2,
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

const reasonList: React.CSSProperties = {
  fontSize: 11,
  color: '#666',
  marginTop: 6,
  paddingLeft: 16,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* top controls: track selector + explainer */}
        <div
          style={{
            ...card,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 220 }}>
            <label style={sectionLabel}>Career focus</label>
            {tracksLoading ? (
              <div style={{ fontSize: 13, color: '#666' }}>
                Loading tracks…
              </div>
            ) : tracks.length === 0 ? (
              <div style={{ fontSize: 13, color: '#666' }}>
                You have not created tracks yet. This feed is using your general
                profile and resume.
              </div>
            ) : (
              <select
                value={activeTrackId ?? ''}
                onChange={(e) =>
                  setActiveTrackId(e.target.value || null)
                }
                style={pillInput}
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ fontSize: 12, color: '#666', maxWidth: 420 }}>
            Relevnt uses this focus area, your resume, and current market data to
            score and explain which roles are worth your energy first.
          </div>
        </div>

        {/* feed filters */}
        <div
          style={{
            ...card,
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)',
            gap: 12,
          }}
        >
          <div>
            <label style={sectionLabel}>
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
              style={{
                ...pillInput,
                textAlign: 'right',
              }}
            />
          </div>

          <div>
            <label style={sectionLabel}>
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
              style={{
                ...pillInput,
                textAlign: 'right',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 22,
            }}
          >
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
              style={{ fontSize: 13 }}
            >
              Remote friendly only
            </label>
          </div>
        </div>

        {/* status bar */}
        <div style={{ fontSize: 12, color: '#666' }}>
          {feedLoading && 'Scanning the market for matches…'}
          {!feedLoading && feedError && (
            <span style={{ color: '#b3261e' }}>
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
        <div
          style={{
            display: 'grid',
            gap: 12,
          }}
        >
          {!feedLoading &&
            !feedError &&
            filteredMatches.length === 0 && (
              <div style={{ fontSize: 13, color: '#666' }}>
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
                style={jobCard}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={jobTitle}>
                    {job.title}
                  </div>
                  <div
                    style={{
                      ...tagPill,
                      borderColor: '#f0e1c4',
                      backgroundColor: '#f7ecda',
                    }}
                  >
                    Match {Math.round(m.score)}
                  </div>
                </div>

                <div style={jobMetaRow}>
                  {job.company && <span>{job.company}</span>}
                  {job.location && (
                    <span>• {job.location}</span>
                  )}
                  {salaryLabel && (
                    <span>• {salaryLabel}</span>
                  )}
                </div>

                <div style={tagRow}>
                  {isRemote && (
                    <span style={tagPill}>
                      Remote friendly
                    </span>
                  )}
                  {job.competitiveness_level && (
                    <span style={tagPill}>
                      Market: {job.competitiveness_level}
                    </span>
                  )}
                </div>

                {mainReasons.length > 0 && (
                  <ul style={reasonList}>
                    {mainReasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                )}

                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  {job.external_url && (
                    <a
                      href={job.external_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        ...subtleButton,
                        textDecoration: 'none',
                        borderColor: '#d6a65c',
                        backgroundColor: '#f7ecda',
                        color: '#4b3a1d',
                      }}
                    >
                      View posting
                    </a>
                  )}
                  <button
                    type="button"
                    style={subtleButton}
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
        <div style={overlay} onClick={() => setShowWhyModal(false)}>
          <div
            style={modal}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div style={modalHeaderRow}>
              <div>
                <div style={jobTitle}>
                  {(selectedMatch.job as JobLike)?.title}
                </div>
                <div style={jobMetaRow}>
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
                style={modalCloseButton}
                onClick={() => setShowWhyModal(false)}
              >
                ×
              </button>
            </div>

            <div style={{ marginTop: 8, marginBottom: 12 }}>
              <span
                style={{
                  ...tagPill,
                  borderColor: '#f0e1c4',
                  backgroundColor: '#f7ecda',
                }}
              >
                Match {Math.round(selectedMatch.score)}
              </span>
            </div>

            <div style={{ marginTop: 8 }}>
              <div style={modalSectionLabel}>Why this is in your feed</div>
              {Array.isArray(selectedMatch.reasons) && selectedMatch.reasons.length > 0 ? (
                <ul style={reasonList}>
                  {selectedMatch.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: 12, color: '#666' }}>
                  This match passed your filters based on your profile, resume, and current settings.
                </div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={modalSectionLabel}>Job snapshot</div>
              <div style={{ fontSize: 12, color: '#555' }}>
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
                    <ul style={{ paddingLeft: 16, marginTop: 4 }}>
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
              <div style={{ marginTop: 16 }}>
                <a
                  href={(selectedMatch.job as JobLike).external_url as string}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    ...subtleButton,
                    textDecoration: 'none',
                    borderColor: '#d6a65c',
                    backgroundColor: '#f7ecda',
                    color: '#4b3a1d',
                  }}
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