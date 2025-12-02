import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { useAuth } from '../contexts/AuthContext'
import useMatchJobs, { MatchJobsResult } from '../hooks/useMatchJobs'
import { useJobStats } from '../hooks/useJobStats'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'
import heroImage from '../assets/hero/dashboard/relevnt-dashboard-hero-21x9.png'
import resumeOptimizerIcon from '../assets/icons/feature/icon-feature-resume-optimizer.png'
import jobAlertsIcon from '../assets/icons/feature/icon-feature-job-alerts.png'
import interviewPrepIcon from '../assets/icons/feature/icon-feature-interview-prep.png'
import portfolioBuilderIcon from '../assets/icons/feature/icon-feature-portfolio-builder.png'
import emptyJobsIllustration from '../assets/illustrations/empty/illustration-empty-jobs.png'

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
  const { matches, loading: matchesLoading, error: matchesError, runMatchJobs } =
    useMatchJobs()
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
        `
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
      if (typeof value === 'object') return Object.values(value).some((v) => !!String(v ?? '').trim())
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
        `
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

  const ink = 'var(--ink, var(--text))'
  const muted = 'var(--muted, var(--text-muted, rgba(0, 0, 0, 0.6)))'
  const surface = 'var(--surface, var(--bg))'
  const border = 'var(--border, rgba(0, 0, 0, 0.08))'

  if (authLoading) {
    return (
      <PageBackground>
        <Container maxWidth="lg" padding="md">
          <div
            style={{
              minHeight: '60vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: muted,
            }}
          >
            Loading your dashboard…
          </div>
        </Container>
      </PageBackground>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const cardStyle: React.CSSProperties = {
    background: surface,
    border: `1px solid ${border}`,
    boxShadow: 'var(--shadow-soft, 0 8px 24px rgba(0, 0, 0, 0.05))',
    borderRadius: 16,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 650,
    color: ink,
    margin: 0,
  }

  const bodyText: React.CSSProperties = {
    color: muted,
    fontSize: 14,
    margin: 0,
  }

  const pillStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 999,
    background: surface,
    border: `1px solid ${border}`,
    color: muted,
    fontSize: 12,
  }

  const primaryButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 18px',
    borderRadius: 999,
    background: 'var(--accent)',
    color: 'var(--bg)',
    fontWeight: 650,
    border: '1px solid var(--accent)',
    textDecoration: 'none',
    fontSize: 14,
  }

  const ghostButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '11px 16px',
    borderRadius: 999,
    background: 'transparent',
    color: 'var(--ink, var(--text))',
    border: '1px solid var(--border, rgba(0, 0, 0, 0.08))',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 14,
  }

  const statChip = (label: string, value: string | number) => (
    <div style={pillStyle} key={label}>
      <span style={{ width: 8, height: 8, borderRadius: '999px', background: 'var(--accent)' }} />
      <span style={{ fontWeight: 600, color: ink }}>{value}</span>
      <span>{label}</span>
    </div>
  )

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
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{ color: 'inherit', textDecoration: 'none' }}
      >
        {children}
      </a>
    ) : (
      <Link to={href} style={{ color: 'inherit', textDecoration: 'none' }}>
        {children}
      </Link>
    )
  }

  return (
    <PageBackground className="dashboard-page">
      <Container maxWidth="xl" padding="md">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            color: 'var(--ink, var(--text))',
            paddingTop: 12,
            paddingBottom: 24,
          }}
        >
          <section
            className="dashboard-hero"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
              gap: 20,
              alignItems: 'stretch',
            }}
          >
            <div
              style={{
                ...cardStyle,
                gap: 16,
                padding: 24,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ ...pillStyle, alignSelf: 'flex-start', background: 'var(--hero-overlay, var(--surface))' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink, var(--text))' }}>Welcome back</span>
                  <span>Everything you need in one place</span>
                </div>
                <h1
                  style={{
                    fontSize: 28,
                    margin: 0,
                    lineHeight: 1.25,
                    color: 'var(--ink, var(--text))',
                  }}
                >
                  Take control of your search with a clear home base.
                </h1>
                <p style={bodyText}>
                  Track roles, keep your resume moving, and jump into the right tools without
                  context switching.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                  <Link to="/jobs" style={primaryButtonStyle}>
                    Browse jobs
                  </Link>
                  <Link to="/resumes" style={ghostButtonStyle}>
                    Open resume builder
                  </Link>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {statChip('Jobs tracked', statsLoading ? '…' : total)}
                {statChip('Saved roles', statsLoading ? '…' : saved)}
                {statChip('New matches', matchesLoading ? '…' : matches.length)}
              </div>
            </div>

            <div
              style={{
                ...cardStyle,
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'stretch',
              }}
            >
              <div
                style={{
                  background: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 10,
                }}
              >
                <img
                  src={heroImage}
                  alt="Relevnt dashboard hero"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 14,
                  }}
                />
              </div>
            </div>
          </section>

          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.9fr)',
              gap: 18,
            }}
          >
            <div style={{ display: 'grid', gap: 18 }}>
              <div style={cardStyle}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={sectionTitle}>Recommended roles for you</h2>
                    <p style={{ ...bodyText, marginTop: 4 }}>Based on your profile and preferences.</p>
                  </div>
                  <Link to="/jobs" style={{ ...ghostButtonStyle, padding: '8px 12px', fontSize: 13 }}>
                    View all jobs
                  </Link>
                </header>

                {(matchesLoading || fallbackLoading) && (
                  <p style={bodyText}>Loading recommendations…</p>
                )}
                {!matchesLoading && matchesError && (
                  <p style={{ ...bodyText, color: 'var(--danger, var(--accent))' }}>
                    {matchesError.message || 'Unable to load recommendations.'}
                  </p>
                )}
                {!fallbackLoading && fallbackError && matches.length === 0 && (
                  <p style={{ ...bodyText, color: 'var(--danger, var(--accent))' }}>
                    {fallbackError}
                  </p>
                )}

                {!matchesLoading && !fallbackLoading && recommendedJobs.length === 0 && (
                  <div style={{ ...cardStyle, background: 'var(--surface)', alignItems: 'flex-start', gap: 10 }}>
                    <p style={{ ...bodyText, margin: 0 }}>
                      No recommendations yet. Set your preferences and start browsing roles.
                    </p>
                    <Link to="/jobs" style={{ ...ghostButtonStyle, padding: '10px 14px' }}>
                      Browse roles
                    </Link>
                  </div>
                )}

                {!matchesLoading && !fallbackLoading && recommendedJobs.length > 0 && (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {recommendedJobs.map((job) => (
                      <JobLink key={job.id} job={job}>
                        <div
                          style={{
                            border: '1px solid var(--border, rgba(0, 0, 0, 0.08))',
                            borderRadius: 12,
                            padding: 12,
                            display: 'grid',
                            gap: 4,
                            background: 'var(--surface)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                            <div style={{ fontWeight: 650, color: ink }}>
                              {job.title}
                            </div>
                            {job.scoreLabel && (
                              <span style={{ ...pillStyle, padding: '4px 10px', fontSize: 11 }}>
                                {job.scoreLabel}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', color: muted, fontSize: 13 }}>
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

              <div style={cardStyle}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={sectionTitle}>Saved jobs</h2>
                    <p style={{ ...bodyText, marginTop: 4 }}>Quick access to the roles you bookmarked.</p>
                  </div>
                  <Link to="/jobs" style={{ ...ghostButtonStyle, padding: '8px 12px', fontSize: 13 }}>
                    Go to jobs
                  </Link>
                </header>

                {savedJobsLoading && <p style={bodyText}>Loading saved jobs…</p>}
                {!savedJobsLoading && savedJobsError && (
                  <p style={{ ...bodyText, color: 'var(--danger, var(--accent))' }}>
                    {savedJobsError}
                  </p>
                )}

                {!savedJobsLoading && !savedJobsError && savedJobs.length === 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      textAlign: 'center',
                      padding: 12,
                    }}
                  >
                    <img
                      src={emptyJobsIllustration}
                      alt="No saved jobs"
                      style={{ width: 160, opacity: 0.9 }}
                    />
                    <p style={{ ...bodyText, margin: 0 }}>
                      Nothing saved yet. Keep roles you care about in one place.
                    </p>
                    <Link to="/jobs" style={{ ...primaryButtonStyle, padding: '10px 16px', fontSize: 13 }}>
                      Find roles to save
                    </Link>
                  </div>
                )}

                {!savedJobsLoading && !savedJobsError && savedJobs.length > 0 && (
                  <div style={{ display: 'grid', gap: 10 }}>
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
                          <div
                            style={{
                              border: '1px solid var(--border, rgba(0, 0, 0, 0.08))',
                              borderRadius: 12,
                              padding: 12,
                              display: 'grid',
                              gap: 6,
                              background: 'var(--surface)',
                            }}
                          >
                            <div style={{ fontWeight: 650, color: ink }}>
                              {item.title}
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', color: muted, fontSize: 13 }}>
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

            <div style={{ display: 'grid', gap: 18 }}>
              <div style={cardStyle}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={sectionTitle}>Resume progress</h2>
                    <p style={{ ...bodyText, marginTop: 4 }}>
                      Track the essentials before you send your next application.
                    </p>
                  </div>
                  <Link to="/resumes" style={{ ...ghostButtonStyle, padding: '8px 12px', fontSize: 13 }}>
                    Open resume builder
                  </Link>
                </header>

                {resumeLoading && <p style={bodyText}>Checking your resume…</p>}
                {!resumeLoading && resumeError && (
                  <p style={{ ...bodyText, color: 'var(--danger, var(--accent))' }}>
                    {resumeError}
                  </p>
                )}

                {!resumeLoading && !resumeError && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink, var(--text))', fontSize: 18 }}>
                        {resumeProgress.percent}% complete
                      </div>
                      {resumeProgress.title && (
                        <span style={{ ...pillStyle, padding: '4px 10px', fontSize: 12 }}>
                          {resumeProgress.title}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: 10,
                        borderRadius: 999,
                        background: 'var(--border, rgba(0, 0, 0, 0.08))',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${resumeProgress.percent}%`,
                          height: '100%',
                          background: 'var(--accent)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {resumeProgress.sections.map((section) => (
                        <div
                          key={section.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 10,
                            background: surface,
                            border: `1px solid ${border}`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: ink }}>
                            <span
                              aria-hidden
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: '999px',
                                background: section.complete
                                  ? 'var(--accent)'
                                  : border,
                                display: 'inline-block',
                              }}
                            />
                            <span style={{ fontWeight: 600 }}>{section.label}</span>
                          </div>
                          <span style={{ color: muted, fontSize: 13 }}>
                            {section.complete ? 'Complete' : 'In progress'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={cardStyle}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={sectionTitle}>Your toolbox</h2>
                    <p style={{ ...bodyText, marginTop: 4 }}>
                      Jump straight into the tools that save you time.
                    </p>
                  </div>
                </header>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 12,
                  }}
                >
                  {[
                    {
                      icon: resumeOptimizerIcon,
                      label: 'Resume optimizer',
                      description: 'Tune your resume for each role.',
                      to: '/resumes',
                    },
                    {
                      icon: jobAlertsIcon,
                      label: 'Job alerts',
                      description: 'Get notified when roles match.',
                      to: '/job-preferences',
                    },
                    {
                      icon: interviewPrepIcon,
                      label: 'Interview prep',
                      description: 'Practice with the right prompts.',
                      to: '/learn',
                    },
                    {
                      icon: portfolioBuilderIcon,
                      label: 'Portfolio builder',
                      description: 'Keep your wins in one place.',
                      to: '/profile/professional',
                    },
                  ].map((tool) => (
                    <Link
                      key={tool.label}
                      to={tool.to}
                      style={{
                        border: '1px solid var(--border, rgba(0, 0, 0, 0.08))',
                        borderRadius: 12,
                        padding: 12,
                        background: 'var(--surface)',
                        display: 'grid',
                        gap: 8,
                        color: 'var(--ink, var(--text))',
                        textDecoration: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={tool.icon}
                          alt={tool.label}
                          className="icon-handdrawn"
                          style={{ width: 32, height: 32, objectFit: 'contain' }}
                        />
                        <div style={{ fontWeight: 700 }}>{tool.label}</div>
                      </div>
                      <p style={{ ...bodyText, margin: 0 }}>{tool.description}</p>
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
