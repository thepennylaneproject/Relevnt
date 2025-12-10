import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { useAuth } from '../contexts/AuthContext'
import useMatchJobs, { MatchJobsResult } from '../hooks/useMatchJobs'
import { useJobStats } from '../hooks/useJobStats'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import { Icon } from '../components/ui/Icon'
import { EmptyState } from '../components/ui/EmptyState'
import { copy } from '../lib/copy'

type ResumeRow = Database['public']['Tables']['resumes']['Row']

type SavedJobRow = {
  id: string
  saved_at: string | null
  jobs?: {
    id: string
    title: string | null
    company: string | null
    location: string | null
    external_url?: string | null
    posted_date?: string | null
  } | null
}

type JobListItem = {
  id: string
  title: string
  company?: string | null
  location?: string | null
  external_url?: string | null
  scoreLabel?: string
}

type ResumeSectionKey =
  | 'contact'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects'

type ResumeSection = {
  key: ResumeSectionKey
  label: string
  complete: boolean
}

const sectionOrder: ResumeSection[] = [
  { key: 'contact', label: 'Contact', complete: false },
  { key: 'summary', label: 'Summary', complete: false },
  { key: 'experience', label: 'Experience', complete: false },
  { key: 'education', label: 'Education', complete: false },
  { key: 'skills', label: 'Skills', complete: false },
  { key: 'certifications', label: 'Certifications', complete: false },
  { key: 'projects', label: 'Projects', complete: false },
]

export default function DashboardPage(): JSX.Element {
  const { user, loading: authLoading } = useAuth()
  const {
    matches,
    loading: matchesLoading,
    error: matchesError,
    runMatchJobs,
  } = useMatchJobs()
  const { total, saved, loading: statsLoading } = useJobStats()

  const [savedJobs, setSavedJobs] = useState<SavedJobRow[]>([])
  const [savedJobsLoading, setSavedJobsLoading] = useState(true)
  const [savedJobsError, setSavedJobsError] = useState<string | null>(null)

  const [resumeProgress, setResumeProgress] = useState<{
    sections: ResumeSection[]
    percent: number
    updatedAt?: string | null
    title?: string
  }>({
    sections: sectionOrder,
    percent: 0,
  })
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError] = useState<string | null>(null)

  const [fallbackJobs, setFallbackJobs] = useState<JobListItem[]>([])
  const [fallbackLoading, setFallbackLoading] = useState(false)
  const [fallbackError, setFallbackError] = useState<string | null>(null)

  const recommendedJobs = useMemo<JobListItem[]>(() => {
    if (matches.length > 0) {
      return matches.slice(0, 4).map((m: MatchJobsResult) => ({
        id: m.job_id || m.job.id,
        title: m.job.title || 'Untitled role',
        company: m.job.company,
        location: m.job.location,
        external_url: m.job.external_url || undefined,
        scoreLabel: `${Math.round(m.score)}% match`,
      }))
    }
    return fallbackJobs
  }, [matches, fallbackJobs])

  const loadSavedJobs = useCallback(async () => {
    if (!user) return
    setSavedJobsLoading(true)
    setSavedJobsError(null)
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select(
          `
          id,
          saved_at,
          jobs (
            id,
            title,
            company,
            location,
            external_url,
            posted_date
          )
        `,
        )
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false })
        .limit(5)

      if (error) throw error

      const normalized: SavedJobRow[] = (data || []).map((row: any) => ({
        ...row,
        jobs: Array.isArray(row.jobs) ? row.jobs[0] ?? null : row.jobs,
      }))

      setSavedJobs(normalized)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load your saved jobs.'
      setSavedJobsError(message)
    } finally {
      setSavedJobsLoading(false)
    }
  }, [user])

  const computeSectionCompletion = (resume: ResumeRow | null): ResumeSection[] => {
    if (!resume) return sectionOrder

    const hasValues = (value: unknown): boolean => {
      if (!value) return false
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object') {
        return Object.values(value).some((v) => !!String(v ?? '').trim())
      }
      return !!String(value).trim()
    }

    const sections: ResumeSection[] = sectionOrder.map((section) => {
      switch (section.key) {
        case 'contact':
          return { ...section, complete: hasValues(resume.personal_info) }
        case 'summary':
          return { ...section, complete: hasValues(resume.summary) }
        case 'experience':
          return { ...section, complete: hasValues(resume.work_experience) }
        case 'education':
          return { ...section, complete: hasValues(resume.education) }
        case 'skills':
          return { ...section, complete: hasValues(resume.skills) }
        case 'certifications':
          return { ...section, complete: hasValues(resume.certifications) }
        case 'projects':
          return { ...section, complete: hasValues(resume.projects) }
        default:
          return section
      }
    })

    return sections
  }

  const loadResumeProgress = useCallback(async () => {
    if (!user) return
    setResumeLoading(true)
    setResumeError(null)
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select(
          `
          id,
          title,
          summary,
          personal_info,
          work_experience,
          education,
          skills,
          certifications,
          projects,
          updated_at
        `,
        )
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      const sections = computeSectionCompletion(data as ResumeRow | null)
      const total = sections.length || 1
      const completed = sections.filter((s) => s.complete).length

      setResumeProgress({
        sections,
        percent: Math.round((completed / total) * 100),
        updatedAt: (data as ResumeRow | null)?.updated_at,
        title: (data as ResumeRow | null)?.title,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load resume progress.'
      setResumeError(message)
      setResumeProgress({
        sections: sectionOrder,
        percent: 0,
      })
    } finally {
      setResumeLoading(false)
    }
  }, [user])

  const loadFallbackJobs = useCallback(async () => {
    setFallbackLoading(true)
    setFallbackError(null)
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, company, location, external_url, posted_date, match_score')
        .eq('is_active', true)
        .order('match_score', { ascending: false, nullsFirst: false })
        .limit(4)

      if (error) throw error

      const items =
        (data || []).map((job) => ({
          id: job.id,
          title: job.title || 'Untitled role',
          company: job.company,
          location: job.location,
          external_url: (job as any)?.external_url || undefined,
          scoreLabel:
            typeof (job as any)?.match_score === 'number'
              ? `${Math.round((job as any).match_score)}% match`
              : undefined,
        })) ?? []

      setFallbackJobs(items)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load recommendations.'
      setFallbackError(message)
      setFallbackJobs([])
    } finally {
      setFallbackLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadSavedJobs()
      loadResumeProgress()
      runMatchJobs()
    }
  }, [user, loadSavedJobs, loadResumeProgress, runMatchJobs])

  useEffect(() => {
    if (!matchesLoading && matches.length === 0) {
      loadFallbackJobs()
    }
  }, [matchesLoading, matches.length, loadFallbackJobs])

  if (authLoading) {
    return (
      <PageBackground>
        <Container maxWidth="lg" padding="md">
          <div className="dashboard-page-loading">Loading your dashboard…</div>
        </Container>
      </PageBackground>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const JobLink = ({
    job,
    children,
  }: {
    job: JobListItem
    children: React.ReactNode
  }) => {
    const href = job.external_url || `/jobs/${job.id}`
    const isExternal = /^https?:\/\//i.test(href)
    return isExternal ? (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    ) : (
      <Link to={href}>{children}</Link>
    )
  }

  const resumeSectionIcons: Record<ResumeSectionKey, JSX.Element> = {
    contact: <Icon name="compass" size="sm" hideAccent />,
    summary: <Icon name="scroll" size="sm" hideAccent />,
    experience: <Icon name="briefcase" size="sm" hideAccent />,
    education: <Icon name="book" size="sm" hideAccent />,
    skills: <Icon name="stars" size="sm" hideAccent />,
    certifications: <Icon name="key" size="sm" hideAccent />,
    projects: <Icon name="lighthouse" size="sm" hideAccent />,
  }

  const trackedJobsLabel =
    statsLoading || total == null ? '–' : total.toString()
  const savedJobsLabel =
    statsLoading || saved == null ? '–' : saved.toString()
  const matchesCount =
    matches.length || fallbackJobs.length || 0
  const matchesLabel =
    matchesLoading && matchesCount === 0 ? '–' : matchesCount.toString()

  return (
    <PageBackground>
      <Container maxWidth="xl" padding="md">
        <div className="dashboard-page">
          {/* HERO */}
          <section className="hero-shell">
            <div className="hero-header">
              <div className="dashboard-hero-icon">
                <Icon name="compass" size="md" />
              </div>
              <div className="hero-header-main">
                <p className="text-xs muted">{copy.nav.dashboard}</p>
                <h1 className="font-display">{copy.dashboard.greeting}</h1>
                <p className="muted">
                  Track roles, keep your resume moving, and jump into the right tools
                  without context switching.
                </p>
              </div>
            </div>

            <div className="hero-actions-accent">
              <div className="hero-actions-primary">
                <Link to="/jobs" className="primary-button">
                  Browse jobs
                </Link>
                <Link to="/resumes" className="ghost-button">
                  Open resume builder
                </Link>
              </div>

              <div className="hero-actions-metrics">
                <span className="hero-metric-pill">
                  <span className="font-semibold">{trackedJobsLabel}</span> Jobs tracked
                </span>
                <span className="hero-metric-pill">
                  <span className="font-semibold">{savedJobsLabel}</span> Saved roles
                </span>
                <span className="hero-metric-pill">
                  <span className="font-semibold">{matchesLabel}</span> New matches
                </span>
              </div>
            </div>
          </section>

          {/* MAIN GRID */}
          <section className="dashboard-main-grid">
            {/* LEFT COLUMN */}
            <div className="dashboard-column">
              {/* Recommended roles */}
              <div className="surface-card dashboard-card">
                <header className="dashboard-card-header">
                  <div className="dashboard-card-header-text">
                    <h2 className="dashboard-section-title">
                      Recommended roles for you
                    </h2>
                    <p className="muted text-sm">
                      Based on your profile and preferences.
                    </p>
                  </div>
                  <Link to="/jobs" className="ghost-button button-sm">
                    View all jobs
                  </Link>
                </header>

                {(matchesLoading || fallbackLoading) && (
                  <p className="muted text-sm">Loading recommendations…</p>
                )}

                {!matchesLoading && matchesError && (
                  <p className="muted text-sm text-danger">
                    {matchesError.message || 'Unable to load recommendations.'}
                  </p>
                )}

                {!fallbackLoading && fallbackError && matches.length === 0 && (
                  <p className="muted text-sm text-danger">{fallbackError}</p>
                )}

                {!matchesLoading &&
                  !fallbackLoading &&
                  recommendedJobs.length === 0 && (
                    <div className="dashboard-empty-state">
                      <p className="muted text-sm">
                        No recommendations yet. Set your preferences and start
                        browsing roles.
                      </p>
                      <Link to="/jobs" className="ghost-button button-xs">
                        Browse roles
                      </Link>
                    </div>
                  )}

                {!matchesLoading &&
                  !fallbackLoading &&
                  recommendedJobs.length > 0 && (
                    <div className="dashboard-job-list">
                      {recommendedJobs.map((job) => (
                        <JobLink key={job.id} job={job}>
                          <div className="dashboard-job-item">
                            <div className="dashboard-job-title-row">
                              <div className="dashboard-job-title">{job.title}</div>
                              {job.scoreLabel && (
                                <span className="hero-metric-pill hero-metric-pill--compact">
                                  {job.scoreLabel}
                                </span>
                              )}
                            </div>
                            <div className="dashboard-job-meta">
                              {job.company && <span>{job.company}</span>}
                              {job.company && job.location && <span>•</span>}
                              {job.location && <span>{job.location}</span>}
                            </div>
                          </div>
                        </JobLink>
                      ))}
                    </div>
                  )}
              </div>

              {/* Saved jobs */}
              <div className="surface-card dashboard-card">
                <header className="dashboard-card-header">
                  <div className="dashboard-card-header-text">
                    <h2 className="dashboard-section-title">Saved jobs</h2>
                    <p className="muted text-sm">
                      Quick access to the roles you bookmarked.
                    </p>
                  </div>
                  <Link to="/jobs" className="ghost-button button-sm">
                    Go to jobs
                  </Link>
                </header>

                {savedJobsLoading && (
                  <p className="muted text-sm">Loading saved jobs…</p>
                )}

                {!savedJobsLoading && savedJobsError && (
                  <p className="muted text-sm text-danger">{savedJobsError}</p>
                )}

                {!savedJobsLoading &&
                  !savedJobsError &&
                  savedJobs.length === 0 && (
                    <EmptyState
                      type="saved"
                      action={{
                        label: "Find roles to save",
                        onClick: () => { },
                      }}
                    />
                  )}

                {!savedJobsLoading &&
                  !savedJobsError &&
                  savedJobs.length > 0 && (
                    <div className="dashboard-saved-list">
                      {savedJobs.map((savedJob) => {
                        const job = savedJob.jobs
                        if (!job) return null
                        const item: JobListItem = {
                          id: job.id,
                          title: job.title || 'Untitled role',
                          company: job.company,
                          location: job.location,
                          external_url: job.external_url || undefined,
                        }
                        return (
                          <JobLink key={savedJob.id} job={item}>
                            <div className="dashboard-job-item">
                              <div className="dashboard-job-title">
                                {item.title}
                              </div>
                              <div className="dashboard-job-meta">
                                {item.company && <span>{item.company}</span>}
                                {item.company && item.location && <span>•</span>}
                                {item.location && <span>{item.location}</span>}
                              </div>
                            </div>
                          </JobLink>
                        )
                      })}
                    </div>
                  )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="dashboard-column">
              {/* Resume progress */}
              <div className="surface-card dashboard-card">
                <header className="dashboard-card-header">
                  <div className="dashboard-card-header-text">
                    <h2 className="dashboard-section-title">Resume progress</h2>
                    <p className="muted text-sm">
                      Track the essentials before you send your next application.
                    </p>
                  </div>
                  <Link to="/resumes" className="ghost-button button-sm">
                    Open resume builder
                  </Link>
                </header>

                {resumeLoading && (
                  <p className="muted text-sm">Checking your resume…</p>
                )}

                {!resumeLoading && resumeError && (
                  <p className="muted text-sm text-danger">{resumeError}</p>
                )}

                {!resumeLoading && !resumeError && (
                  <>
                    <div className="dashboard-progress-header">
                      <div className="dashboard-progress-percent">
                        {resumeProgress.percent}% complete
                      </div>
                      {resumeProgress.title && (
                        <span className="hero-metric-pill hero-metric-pill--compact">
                          {resumeProgress.title}
                        </span>
                      )}
                    </div>
                    <div className="dashboard-progress-bar-container">
                      <div
                        className="dashboard-progress-bar-fill"
                        style={{ width: `${resumeProgress.percent}%` }}
                      />
                    </div>
                    <ul className="dashboard-section-list">
                      {resumeProgress.sections.map((section) => (
                        <li key={section.key} className="resume-progress-row">
                          <div className="resume-progress-left">
                            {resumeSectionIcons[section.key]}
                            <span className="font-semibold">{section.label}</span>
                          </div>
                          <span className="resume-progress-status muted text-sm">
                            {section.complete ? 'Complete' : 'In progress'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Toolbox */}
              <div className="surface-card dashboard-card">
                <header className="dashboard-card-header">
                  <div className="dashboard-card-header-text">
                    <h2 className="dashboard-section-title">Your toolbox</h2>
                    <p className="muted text-sm">
                      Jump straight into the tools that save you time.
                    </p>
                  </div>
                </header>

                <div className="dashboard-toolbox-grid">
                  {[
                    {
                      icon: <Icon name="scroll" size="md" />,
                      label: 'Resume optimizer',
                      description: 'Tune your resume for each role.',
                      to: '/resumes',
                    },
                    {
                      icon: <Icon name="stars" size="md" />,
                      label: 'Job alerts',
                      description: 'Get notified when roles match.',
                      to: '/job-preferences',
                    },
                    {
                      icon: <Icon name="book" size="md" />,
                      label: 'Interview prep',
                      description: 'Practice with the right prompts.',
                      to: '/learn',
                    },
                    {
                      icon: <Icon name="lighthouse" size="md" />,
                      label: 'Portfolio builder',
                      description: 'Keep your wins in one place.',
                      to: '/profile/professional',
                    },
                  ].map((tool) => (
                    <Link
                      key={tool.label}
                      to={tool.to}
                      className="tool-card surface-card"
                    >
                      <div className="tool-card-main">
                        {tool.icon}
                        <div>
                          <h3>{tool.label}</h3>
                          <p className="muted text-sm">{tool.description}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </Container>
    </PageBackground>
  )
}