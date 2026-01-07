import React, { useState, useEffect, useMemo, useCallback } from 'react'
import useMatchJobs from '../hooks/useMatchJobs'
import { usePersonas } from '../hooks/usePersonas'
import { useJobInteractions } from '../hooks/useJobInteractions'
import { useNetworkingCompanies, checkCompanyMatch } from '../hooks/useNetworkLookup'
import { NetworkingOverlay } from './networking/NetworkingOverlay'
import { QuickApplyModal } from './jobs/QuickApplyModal'
import type { MatchJobsResult } from '../hooks/useMatchJobs'
import type { MatchFactors } from '../lib/matchJobs'
import { Card } from './ui/Card'
import { Heading, Text } from './ui/Typography'
import { Badge } from './ui/Badge'
import Icon from './ui/Icon'
import { Button } from './ui/Button'
import { useToast } from './ui/Toast'

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
  const { showToast } = useToast()

  const [dismissedJobIds, setDismissedJobIds] = useState<Set<string>>(new Set())
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set())
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  const [recentlySaved, setRecentlySaved] = useState<string | null>(null)
  const [recentlyDismissed, setRecentlyDismissed] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [selectedMatch, setSelectedMatch] = useState<MatchJobsResult | null>(null)
  const [showWhyModal, setShowWhyModal] = useState(false)
  const [quickApplyJob, setQuickApplyJob] = useState<{ id: string; title: string; company: string; external_url?: string | null } | null>(null)

  // Handle successful Quick Apply
  const handleQuickApplied = useCallback((jobId: string) => {
    setAppliedJobIds(prev => new Set(prev).add(jobId))
  }, [])

  // Handle dismissing a job with visual feedback
  const handleDismissJob = useCallback((jobId: string, matchScore: number, matchFactors?: MatchFactors) => {
    setRecentlyDismissed(jobId)
    trackInteraction(jobId, 'dismiss', matchScore, matchFactors || null, activePersona?.id || null)
    showToast("Thanks, we'll adjust your future matches.", 'info', 3000)
    // Delay removal to show animation
    setTimeout(() => {
      setDismissedJobIds(prev => new Set(prev).add(jobId))
      setRecentlyDismissed(null)
    }, 400)
  }, [trackInteraction, activePersona?.id, showToast])

  // Handle saving a job with visual feedback
  const handleSaveJob = useCallback((jobId: string, matchScore: number, matchFactors?: MatchFactors) => {
    const isAlreadySaved = savedJobIds.has(jobId)
    if (isAlreadySaved) {
      setSavedJobIds(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
      showToast('Removed from saved jobs', 'info', 2500)
    } else {
      setSavedJobIds(prev => new Set(prev).add(jobId))
      setRecentlySaved(jobId)
      setTimeout(() => setRecentlySaved(null), 1500)
      showToast('Saved to My Jobs → Discovered', 'success', 3000)
    }
    trackInteraction(jobId, isAlreadySaved ? 'unsave' : 'save', matchScore, matchFactors || null, activePersona?.id || null)
  }, [trackInteraction, activePersona?.id, savedJobIds, showToast])

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
        <div className="mb-12">
          <Text className="italic text-text-muted border-l-2 border-border pl-6 max-w-2xl py-2">
            {activePersona ? (
              <>
                Matches for <span className="font-bold text-text">{activePersona.name}</span>. Relevnt uses this
                persona's preferences, your resume, and market data to score roles.
              </>
            ) : (
              <>
                Select a persona above to see targeted matches. Currently showing general
                recommendations based on your profile.
              </>
            )}
          </Text>
        </div>


        {/* status bar */}
        <div className="flex justify-end mb-4">
          <Text muted className="text-[10px] uppercase tracking-widest font-bold">
            {feedLoading ? 'Scanning market…' : (
              <>
                {visibleMatches} / {totalMatches} matches found
              </>
            )}
          </Text>
        </div>

        {/* list of matches */}
        <div className="feed-job-list">
          {!feedLoading &&
            !feedError &&
            filteredMatches.length === 0 && (
              <div className="empty-state">
                <Icon name="search" size="xl" className="empty-icon" />
                <p className="empty-state__description">We couldn't load your matches right now...</p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => runMatchJobs(null, activePersona?.id || null)}
                >
                  Try again
                </Button>
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

            const isRemote = job.remote_type === 'remote' || (job.location || '').toLowerCase().includes('remote')
            const mainReasons = Array.isArray(m.reasons) ? m.reasons.slice(0, 3) : []
            const isSaved = savedJobIds.has(m.job_id)
            const isApplied = appliedJobIds.has(m.job_id)
            const isExpanded = expandedId === m.job_id

            return (
              <div 
                key={m.job_id} 
                className="group border-b border-border py-6 hover:bg-surface-2/30 transition-colors"
              >
                {/* Ledger Row */}
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Job info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <a
                        href={job.external_url || '#'}
                        target={job.external_url ? '_blank' : undefined}
                        rel={job.external_url ? 'noreferrer' : undefined}
                        className="font-semibold hover:text-accent transition-colors cursor-pointer"
                        onClick={(e) => {
                          if (!job.external_url) {
                            e.preventDefault()
                            setExpandedId(isExpanded ? null : m.job_id)
                          }
                        }}
                      >
                        {job.title}
                      </a>
                      <Text muted className="text-sm">
                        {job.company}
                        {job.location && ` • ${job.location}`}
                      </Text>
                      {salaryLabel && (
                        <Text muted className="text-xs">
                          {salaryLabel}
                        </Text>
                      )}
                      {isRemote && (
                        <span className="text-xs text-accent">Remote</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Match score + Primary action */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <Text muted className="text-xs">
                      {Math.round(m.score)}% match
                    </Text>
                    
                    {/* Primary action */}
                    {isApplied ? (
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-success">
                        <Icon name="check" size="xs" /> Applied
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setQuickApplyJob({
                          id: m.job_id,
                          title: job.title || 'Job',
                          company: job.company || 'Company',
                          external_url: job.external_url,
                        })}
                      >
                        Quick Apply
                      </Button>
                    )}

                    {/* Secondary actions - hover only */}
                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-accent transition-colors"
                        onClick={() => handleSaveJob(m.job_id, m.score)}
                        title={isSaved ? 'Unsave' : 'Save'}
                      >
                        {isSaved ? '★' : '☆'}
                      </button>
                      <button
                        className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-error transition-colors"
                        onClick={() => handleDismissJob(m.job_id, m.score)}
                        title="Dismiss"
                      >
                        ✕
                      </button>
                      <button
                        className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-text transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : m.job_id)}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? '−' : '+'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded area - match reasons */}
                {isExpanded && mainReasons.length > 0 && (
                  <div className="mt-6 pl-6 border-l-2 border-accent/20">
                    <Text muted className="text-xs uppercase tracking-widest font-bold mb-3">
                      Why this matches
                    </Text>
                    <ul className="space-y-2">
                      {mainReasons.map((reason, idx) => (
                        <li key={idx} className="text-sm text-text-muted italic flex items-start gap-2">
                          <span className="text-accent">→</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
              <span>{Math.round(selectedMatch.score)}% Match</span>
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="feed-accent-link"
                  onClick={() => window.open((selectedMatch.job as JobLike).external_url as string, '_blank', 'noreferrer')}
                >
                  Open full posting on employer site
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Apply Modal */}
      {quickApplyJob && (
        <QuickApplyModal
          job={quickApplyJob}
          persona={activePersona}
          isOpen={!!quickApplyJob}
          onClose={() => setQuickApplyJob(null)}
          onApplied={handleQuickApplied}
        />
      )}
    </>
  )
}
