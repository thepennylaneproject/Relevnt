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

            return (
              <Card 
                key={m.job_id} 
                className="group relative overflow-hidden"
              >
                <header className="flex justify-between items-start mb-6">
                  <div>
                    <Heading level={3} className="group-hover:text-accent transition-colors">{job.title}</Heading>
                    <div className="flex items-center gap-2 mt-1">
                      <Text muted className="font-bold">{job.company}</Text>
                      <Text muted>•</Text>
                      <Text muted>{job.location}</Text>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="neutral">{Math.round(m.score)}% Match</Badge>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                      {salaryLabel && (
                        <div className="flex items-center gap-2 text-xs">
                          <Icon name="dollar" size="xs" className="text-text-muted" />
                          <span className="font-medium">{salaryLabel}</span>
                        </div>
                      )}
                      {isRemote && (
                        <div className="flex items-center gap-2 text-xs">
                          <Icon name="zap" size="xs" className="text-accent" />
                          <span className="font-medium">Remote</span>
                        </div>
                      )}
                    </div>
                    {mainReasons.length > 0 && (
                      <ul className="space-y-2 border-l border-border pl-4 py-1">
                        {mainReasons.map((reason, idx) => (
                          <li key={idx} className="text-xs text-text-muted italic flex items-start gap-2">
                            <span className="text-accent">→</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex flex-col justify-end gap-3">
                    <div className="flex gap-4 items-center justify-end">
                      {isApplied ? (
                        <Text className="text-xs font-bold uppercase tracking-widest text-success flex items-center gap-2">
                          <Icon name="check" size="xs" /> Applied
                        </Text>
                      ) : (
                        <button
                          className="text-xs font-bold uppercase tracking-widest text-accent border-b border-accent/20 hover:border-accent transition-colors"
                          onClick={() => setQuickApplyJob({
                            id: m.job_id,
                            title: job.title || 'Job',
                            company: job.company || 'Company',
                            external_url: job.external_url,
                          })}
                        >
                          Quick Apply
                        </button>
                      )}
                      {job.external_url && (
                        <button
                          className="text-xs font-bold uppercase tracking-widest text-text-muted border-b border-border/20 hover:border-text transition-colors"
                          onClick={() => job.external_url && window.open(job.external_url, '_blank', 'noreferrer')}
                        >
                          View Source
                        </button>
                      )}
                    </div>
                    <div className="flex justify-end gap-6 items-center pt-2 border-t border-border/50">
                      <button
                        className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${isSaved ? 'text-accent' : 'text-text-muted hover:text-text'}`}
                        onClick={() => handleSaveJob(m.job_id, m.score)}
                      >
                        {isSaved ? 'Job Saved' : 'Save Record'}
                      </button>
                      <button
                        className="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-error transition-colors"
                        onClick={() => handleDismissJob(m.job_id, m.score)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
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
