import React from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import PageBackground from '../components/shared/PageBackground'
import { IconName, Icon } from '../components/ui/Icon'
import { Container } from '../components/shared/Container'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { useApplications } from '../hooks/useApplications'
import { useJobStats } from '../hooks/useJobStats'
import { useWellnessMode } from '../hooks/useWellnessMode'
import { WellnessCheckin } from '../components/dashboard/WellnessCheckin'
import { getReadyUrl } from '../config/cross-product'
import '../styles/dashboard-clarity.css'

// User state enum for adaptive UI
enum UserState {
  ZERO_APPLICATIONS = 'zero_applications',
  ACTIVE_APPLICATIONS = 'active_applications',
  IN_INTERVIEWS = 'in_interviews',
  ALL_CAUGHT_UP = 'all_caught_up',
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DASHBOARD PAGE — Enhanced UX Redesign
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Key improvements:
 * 1. Centered hero with prominent CTA
 * 2. Today's Priority micro-module for immediate engagement
 * 3. Two-column foundation cards with actionable sublabels
 * 4. Multi-column pipeline stats (no more sprawling zeros)
 * 5. Quick actions row for momentum
 * 6. Progress tracker for engagement loops
 * 7. Celebratory microcopy and momentum cues
 */

export default function DashboardPage(): JSX.Element {
  const { user, loading: authLoading } = useAuth()
  const { applications } = useApplications()
  const { total } = useJobStats()
  const { mode: wellnessMode } = useWellnessMode()
  const navigate = useNavigate()

  if (authLoading) {
    return (
      <PageBackground>
        <Container maxWidth="lg" padding="md">
          <div className="dashboard-loading">
            <div className="loading-spinner" />
            <span>Loading your dashboard...</span>
          </div>
        </Container>
      </PageBackground>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DETECT USER STATE
  // ───────────────────────────────────────────────────────────────────────────

  const activeApplications = applications.filter((a) =>
    ['applied', 'interviewing', 'in-progress'].includes(a.status || '')
  )
  const interviewingCount = applications.filter(
    (a) => a.status === 'interviewing'
  ).length
  const appliedCount = applications.filter((a) => a.status === 'applied').length
  const discoveredCount = total || 0

  // Determine user state for adaptive content
  let userState = UserState.ZERO_APPLICATIONS
  if (interviewingCount > 0) {
    userState = UserState.IN_INTERVIEWS
  } else if (activeApplications.length > 0) {
    userState = UserState.ACTIVE_APPLICATIONS
  } else if (applications.length > 0 && appliedCount === 0) {
    userState = UserState.ALL_CAUGHT_UP
  }

  // Calculate profile completion (mock - would be from profile data)
  const profileCompletion = 60 // Would come from actual profile data

  // ───────────────────────────────────────────────────────────────────────────
  // ADAPTIVE CONTENT BASED ON USER STATE
  // ───────────────────────────────────────────────────────────────────────────

  // Time-adaptive greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Primary CTA content
  const getPrimaryCTA = () => {
    switch (userState) {
      case UserState.ZERO_APPLICATIONS:
        return {
          heading: 'Your next move',
          title: 'Start your search',
          description: 'Find roles aligned with your skills and goals.',
          cta: 'Search roles',
          ctaLink: '/jobs',
          secondaryCta: 'Import resume',
          secondaryLink: '/resumes',
        }
      case UserState.ACTIVE_APPLICATIONS:
        return {
          heading: 'Keep momentum',
          title: `${appliedCount} application${appliedCount !== 1 ? 's' : ''} in progress`,
          description: 'Responses typically arrive in 5–10 days. Send 2–3 more this week.',
          cta: 'Find more roles',
          ctaLink: '/jobs',
          secondaryCta: 'Track applications',
          secondaryLink: '/applications',
        }
      case UserState.IN_INTERVIEWS:
        return {
          heading: 'Prepare to shine',
          title: `${interviewingCount} interview${interviewingCount !== 1 ? 's' : ''} scheduled`,
          description: 'Practice your responses and research each company.',
          cta: 'Practice interviews',
          ctaLink: getReadyUrl('/practice'),
          ctaIsExternal: true,
          secondaryCta: 'View schedule',
          secondaryLink: '/applications',
        }
      default:
        return {
          heading: 'Rest and reflect',
          title: "You're caught up",
          description: 'Strengthen your profile or explore new opportunities.',
          cta: 'Explore roles',
          ctaLink: '/jobs',
          secondaryCta: 'Improve profile',
          secondaryLink: '/settings#profile',
        }
    }
  }

  // Today's Priority items
  const getTodaysPriorities = (): { icon: IconName; label: string; action: string; link: string; isExternal?: boolean }[] => {
    const priorities: { icon: IconName; label: string; action: string; link: string; isExternal?: boolean }[] = []

    if (userState === UserState.ZERO_APPLICATIONS) {
      priorities.push({
        icon: 'search',
        label: 'Discover roles',
        action: '5 AI-curated picks',
        link: '/jobs',
      })
      priorities.push({
        icon: 'scroll',
        label: 'Resume check',
        action: 'Quick optimization tips',
        link: '/resumes',
      })
    } else if (userState === UserState.ACTIVE_APPLICATIONS) {
      priorities.push({
        icon: 'briefcase',
        label: 'Follow up',
        action: `${appliedCount} pending responses`,
        link: '/applications',
      })
      priorities.push({
        icon: 'microphone',
        label: 'Stay sharp',
        action: 'Practice top questions',
        link: getReadyUrl('/practice'),
        isExternal: true,
      })
    } else if (userState === UserState.IN_INTERVIEWS) {
      priorities.push({
        icon: 'microphone',
        label: 'Interview prep',
        action: 'Review company research',
        link: getReadyUrl('/practice'),
        isExternal: true,
      })
      priorities.push({
        icon: 'book',
        label: 'Company intel',
        action: 'Key talking points',
        link: '/jobs',
      })
    }

    // Always suggest profile improvement if not complete
    if (profileCompletion < 100) {
      priorities.push({
        icon: 'stars',
        label: 'Profile strength',
        action: `${profileCompletion}% → Improve`,
        link: '/settings#profile',
      })
    }

    return priorities.slice(0, 3)
  }

  // Foundation cards
  const getFoundationCards = (): { icon: IconName; title: string; description: string; cta: string; ctaLink: string; sublabel?: string }[] => [
    {
      icon: 'book',
      title: 'Learn your market',
      description: 'Understand industry trends and company needs.',
      cta: 'Explore insights',
      ctaLink: '/jobs',
      sublabel: 'Suggested for you',
    },
    {
      icon: 'scroll',
      title: 'Polish your resume',
      description: 'Make sure your resume stands out to recruiters.',
      cta: 'Build resume',
      ctaLink: '/resumes',
      sublabel: profileCompletion < 80 ? `Resume strength: ${profileCompletion}/100` : 'Looking good',
    },
  ]

  // Quick actions
  const getQuickActions = (): { icon: IconName; label: string; link: string; isExternal?: boolean }[] => [
    { icon: 'search', label: 'Search saved filters', link: '/jobs' },
    { icon: 'scroll', label: 'Upload resume', link: '/resumes' },
    { icon: 'microphone', label: 'Mock interview', link: '/interview-prep' },
    { icon: 'stars', label: 'Not ready? Get prepared', link: getReadyUrl('/'), isExternal: true },
  ]

  // Momentum message
  const getMomentumMessage = () => {
    if (discoveredCount > 0 && appliedCount === 0) {
      return `You explored ${discoveredCount} role${discoveredCount !== 1 ? 's' : ''} yesterday—ready to apply?`
    }
    if (appliedCount > 0) {
      return `${appliedCount} application${appliedCount !== 1 ? 's' : ''} sent—keep the momentum going!`
    }
    return null
  }

  const primaryCTA = getPrimaryCTA()
  const todaysPriorities = getTodaysPriorities()
  const foundationCards = getFoundationCards()
  const quickActions = getQuickActions()
  const momentumMessage = getMomentumMessage()

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────


  return (
    <PageBackground>
      <Container maxWidth="lg" padding="md">
        <div className="dashboard-enhanced selection-gold">
          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 1: CENTERED HERO + PRIMARY CTA
          ═══════════════════════════════════════════════════════════════════ */}
          <section className="hero-section gold-dust">
            <div className="hero-content">
              <h1 className="hero-greeting">{getGreeting()}</h1>

              {/* Momentum message */}
              {momentumMessage && (
                <p className="momentum-message">
                  <Icon name="zap" size="sm" />
                  {momentumMessage}
                </p>
              )}
            </div>

            {/* Primary CTA Card - Elevated, centered */}
            <div className="primary-cta-card">
              <div className="primary-cta-header">
                <span className="primary-cta-label">{primaryCTA.heading}</span>
                <h2 className="primary-cta-title">{primaryCTA.title}</h2>
                <p className="primary-cta-description">{primaryCTA.description}</p>
              </div>
              <div className="primary-cta-actions">
                {primaryCTA.ctaIsExternal ? (
                  <a
                    href={primaryCTA.ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    {primaryCTA.cta}
                    <Icon name="external-link" size="sm" />
                  </a>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => navigate(primaryCTA.ctaLink)}
                  >
                    {primaryCTA.cta}
                    <Icon name="chevron-right" size="sm" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(primaryCTA.secondaryLink)}
                >
                  {primaryCTA.secondaryCta}
                </Button>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 2: TODAY'S PRIORITY MICRO-MODULE
          ═══════════════════════════════════════════════════════════════════ */}
          {todaysPriorities.length > 0 && (
            <section className="todays-priority-section">
              <h3 className="section-header">
                <Icon name="compass" size="sm" />
                Today's priorities
              </h3>
              <div className="priority-cards">
                {todaysPriorities.map((item, idx) => (
                  item.isExternal ? (
                    <a key={idx} href={item.link} className="priority-card" target="_blank" rel="noopener noreferrer">
                      <div className="priority-card-icon">
                        <Icon name={item.icon} size="md" />
                      </div>
                      <div className="priority-card-content">
                        <span className="priority-card-label">{item.label}</span>
                        <span className="priority-card-action">{item.action}</span>
                      </div>
                      <Icon name="external-link" size="sm" className="priority-arrow" />
                    </a>
                  ) : (
                    <Link key={idx} to={item.link} className="priority-card">
                      <div className="priority-card-icon">
                        <Icon name={item.icon} size="md" />
                      </div>
                      <div className="priority-card-content">
                        <span className="priority-card-label">{item.label}</span>
                        <span className="priority-card-action">{item.action}</span>
                      </div>
                      <Icon name="chevron-right" size="sm" className="priority-arrow" />
                    </Link>
                  )
                ))}
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 3: QUICK ACTIONS ROW
          ═══════════════════════════════════════════════════════════════════ */}
          <section className="quick-actions-section quick-actions-section--prominent">
            <h3 className="section-header">
              <Icon name="zap" size="sm" />
              Quick actions
            </h3>
            <div className="quick-actions-row">
              {quickActions.map((action, idx) => (
                action.isExternal ? (
                  <a key={idx} href={action.link} className="quick-action-btn" target="_blank" rel="noopener noreferrer">
                    <Icon name={action.icon} size="sm" />
                    <span>{action.label}</span>
                    <Icon name="external-link" size="xs" className="ml-1 opacity-60" />
                  </a>
                ) : (
                  <Link key={idx} to={action.link} className="quick-action-btn">
                    <Icon name={action.icon} size="sm" />
                    <span>{action.label}</span>
                  </Link>
                )
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 4: FOUNDATION CARDS (Two-column grid)
          ═══════════════════════════════════════════════════════════════════ */}
          <section className="foundation-section">
            <h3 className="section-header">
              <Icon name="seeds" size="sm" />
              Build your foundation
            </h3>
            <div className="foundation-grid">
              {foundationCards.map((card, idx) => (
                <div key={idx} className="foundation-card">
                  <div className="foundation-card-icon">
                    <Icon name={card.icon} size="lg" />
                  </div>
                  <h4 className="foundation-card-title">{card.title}</h4>
                  <p className="foundation-card-description">{card.description}</p>
                  <Link to={card.ctaLink} className="foundation-card-cta">
                    {card.cta}
                    <Icon name="chevron-right" size="sm" />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 5: PIPELINE STATUS
          ═══════════════════════════════════════════════════════════════════ */}
          <section className="pipeline-section">
            <h3 className="section-header">
              <Icon name="gauge" size="sm" />
              Where you are in your search
            </h3>
            <div className="pipeline-grid">
              {/* Pipeline stats would be refactored here to use HandDrawnIcon as well */}
              <Link
                to="/jobs"
                className={`pipeline-stat pipeline-stat--clickable ${discoveredCount === 0 ? 'is-empty' : ''}`}
              >
                <div className="pipeline-stat-icon">
                  <Icon name="seeds" size="sm" />
                </div>
                <div className="pipeline-stat-content">
                  <span className="pipeline-stat-label">Discovered</span>
                  {discoveredCount === 0 ? (
                    <span className="pipeline-empty-cta">
                      Start with 5 picks →
                    </span>
                  ) : (
                    <>
                      <span className="pipeline-stat-value">{discoveredCount}</span>
                      <span className="pipeline-stat-subtext">roles explored</span>
                    </>
                  )}
                </div>
              </Link>

              <Link
                to="/applications"
                className={`pipeline-stat pipeline-stat--clickable ${appliedCount === 0 ? 'is-empty' : ''}`}
              >
                <div className="pipeline-stat-icon">
                  <Icon name="paper-airplane" size="sm" />
                </div>
                <div className="pipeline-stat-content">
                  <span className="pipeline-stat-label">Applied</span>
                  {appliedCount === 0 ? (
                    <span className="pipeline-empty-hint">Waiting for your signal.</span>
                  ) : (
                    <>
                      <span className="pipeline-stat-value">{appliedCount}</span>
                      <span className="pipeline-stat-subtext">applications sent</span>
                    </>
                  )}
                </div>
              </Link>

              <Link
                to="/applications?status=awaiting"
                className={`pipeline-stat pipeline-stat--clickable ${appliedCount - interviewingCount === 0 ? 'is-empty' : ''}`}
              >
                <div className="pipeline-stat-icon">
                  <Icon name="candle" size="sm" />
                </div>
                <div className="pipeline-stat-content">
                  <span className="pipeline-stat-label">Awaiting</span>
                  {appliedCount - interviewingCount === 0 ? (
                    <span className="pipeline-empty-hint">—</span>
                  ) : (
                    <>
                      <span className="pipeline-stat-value">{appliedCount - interviewingCount}</span>
                      <span className="pipeline-stat-subtext">responses pending</span>
                    </>
                  )}
                </div>
              </Link>

              <Link
                to="/applications?status=interviewing"
                className={`pipeline-stat pipeline-stat--clickable ${interviewingCount === 0 ? 'is-empty' : 'is-active'}`}
              >
                <div className="pipeline-stat-icon">
                  <Icon name="flower" size="sm" />
                </div>
                <div className="pipeline-stat-content">
                  <span className="pipeline-stat-label">Interviews</span>
                  {interviewingCount === 0 ? (
                    <span className="pipeline-empty-hint">Milestones await.</span>
                  ) : (
                    <>
                      <span className="pipeline-stat-value">{interviewingCount}</span>
                      <span className="pipeline-stat-subtext">active conversations</span>
                    </>
                  )}
                </div>
              </Link>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 6: PROGRESS TRACKER
          ═══════════════════════════════════════════════════════════════════ */}
          <section className="progress-section">
            <div className="progress-card">
              <div className="progress-header">
                <span className="progress-label">
                  Profile completeness
                </span>
                <span className={`progress-value ${profileCompletion < 80 ? 'progress-value--warning' : 'progress-value--good'}`}>
                  {profileCompletion}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${profileCompletion < 50 ? 'progress-fill--low' : profileCompletion < 80 ? 'progress-fill--medium' : 'progress-fill--high'}`}
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <div className="progress-footer">
                <span className="progress-hint">
                  {profileCompletion < 50
                    ? 'Add more details to stand out'
                    : profileCompletion < 80
                      ? 'Almost there!'
                      : 'Looking great!'}
                </span>
                <Link to="/settings#profile" className="progress-cta">
                  {profileCompletion < 80 ? 'Improve profile' : 'View profile'} →
                </Link>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 7: WELLNESS CHECK (if gentle mode)
          ═══════════════════════════════════════════════════════════════════ */}
          {wellnessMode === 'gentle' && (
            <section className="wellness-section">
              <WellnessCheckin />
            </section>
          )}
        </div>
      </Container>
    </PageBackground>
  )
}
