import React from 'react'
import { Navigate, Link } from 'react-router-dom'
import PageBackground from '../components/shared/PageBackground'
import { IconName, Icon } from '../components/ui/Icon'
import { Container } from '../components/shared/Container'
import { useAuth } from '../contexts/AuthContext'
import { useApplications } from '../hooks/useApplications'
import { useJobStats } from '../hooks/useJobStats'
import { useWellnessMode } from '../hooks/useWellnessMode'
import { VerseContainer } from '../components/dashboard/VerseContainer'
import { WellnessCheckin } from '../components/dashboard/WellnessCheckin'
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

  // Hero verse (shorter, more impactful)
  const getHeroVerse = () => {
    switch (userState) {
      case UserState.ZERO_APPLICATIONS:
        return 'Every journey begins with a single brave step.'
      case UserState.ACTIVE_APPLICATIONS:
        return "You've sent your signal. Now comes the listening."
      case UserState.IN_INTERVIEWS:
        return 'The conversation has begun. You belong at this table.'
      case UserState.ALL_CAUGHT_UP:
        return 'The pause is not weakness—it\'s the breath between chapters.'
      default:
        return 'Every step forward matters.'
    }
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
          ctaLink: '/interview-prep',
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
          secondaryLink: '/profile-analyzer',
        }
    }
  }

  // Today's Priority items
  const getTodaysPriorities = (): { icon: IconName; label: string; action: string; link: string; badge?: string }[] => {
    const priorities: { icon: IconName; label: string; action: string; link: string; badge?: string }[] = []

    if (userState === UserState.ZERO_APPLICATIONS) {
      priorities.push({
        icon: 'search',
        label: 'Discover roles',
        action: '5 AI-curated picks',
        link: '/jobs',
        badge: 'Suggested',
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
        link: '/interview-prep',
      })
    } else if (userState === UserState.IN_INTERVIEWS) {
      priorities.push({
        icon: 'microphone',
        label: 'Interview prep',
        action: 'Review company research',
        link: '/interview-prep',
        badge: 'Priority',
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
        link: '/profile-analyzer',
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
  const getQuickActions = (): { icon: IconName; label: string; link: string }[] => [
    { icon: 'search', label: 'Search saved filters', link: '/jobs' },
    { icon: 'scroll', label: 'Upload resume', link: '/resumes' },
    { icon: 'microphone', label: 'Mock interview', link: '/interview-prep' },
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
        <div className="dashboard-enhanced">
          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 1: CENTERED HERO + PRIMARY CTA
          ═══════════════════════════════════════════════════════════════════ */}
          <section className="hero-section">
            <div className="hero-content">
              <h1 className="hero-greeting">{getGreeting()}</h1>
              <VerseContainer compact>{getHeroVerse()}</VerseContainer>

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
                <Link to={primaryCTA.ctaLink} className="btn-primary-glow">
                  {primaryCTA.cta}
                  <Icon name="chevron-right" size="sm" />
                </Link>
                <Link to={primaryCTA.secondaryLink} className="btn-secondary-subtle">
                  {primaryCTA.secondaryCta}
                </Link>
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
                  <Link key={idx} to={item.link} className="priority-card">
                    <div className="priority-card-icon">
                      <Icon name={item.icon} size="md" />
                    </div>
                    <div className="priority-card-content">
                      <span className="priority-card-label">{item.label}</span>
                      <span className="priority-card-action">{item.action}</span>
                    </div>
                    {item.badge && (
                      <span className="priority-badge">{item.badge}</span>
                    )}
                    <Icon name="chevron-right" size="sm" className="priority-arrow" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 3: FOUNDATION CARDS (Two-column grid)
          ═══════════════════════════════════════════════════════════════════ */}
          <section className="foundation-section">
            <h3 className="section-header">
              <Icon name="seeds" size="sm" />
              Build your foundation
            </h3>
            <div className="foundation-grid">
              {foundationCards.map((card, idx) => (
                <div key={idx} className="foundation-card">
                  <div className="foundation-card-header">
                    <div className="foundation-card-icon">
                      <Icon name={card.icon} size="md" />
                    </div>
                    {card.sublabel && (
                      <span className="foundation-sublabel">{card.sublabel}</span>
                    )}
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
              SECTION 4: PIPELINE STATUS (Multi-column, guided empty states)
          ═══════════════════════════════════════════════════════════════════ */}
          <section className="pipeline-section">
            <h3 className="section-header">
              <Icon name="gauge" size="sm" />
              Where you are in your search
            </h3>
            <div className="pipeline-grid">
              <div className={`pipeline-stat ${discoveredCount === 0 ? 'is-empty' : ''}`}>
                <div className="pipeline-stat-icon">
                  <Icon name="seeds" size="sm" />
                </div>
                <div className="pipeline-stat-content">
                  <span className="pipeline-stat-label">Discovered</span>
                  {discoveredCount === 0 ? (
                    <Link to="/jobs" className="pipeline-empty-cta">
                      Start with 5 picks →
                    </Link>
                  ) : (
                    <>
                      <span className="pipeline-stat-value">{discoveredCount}</span>
                      <span className="pipeline-stat-subtext">roles explored</span>
                    </>
                  )}
                </div>
              </div>

              <div className={`pipeline-stat ${appliedCount === 0 ? 'is-empty' : ''}`}>
                <div className="pipeline-stat-icon">
                  <Icon name="paper-airplane" size="sm" />
                </div>
                <div className="pipeline-stat-content">
                  <span className="pipeline-stat-label">Applied</span>
                  {appliedCount === 0 ? (
                    <span className="pipeline-empty-hint">Ready when you are</span>
                  ) : (
                    <>
                      <span className="pipeline-stat-value">{appliedCount}</span>
                      <span className="pipeline-stat-subtext">applications sent</span>
                    </>
                  )}
                </div>
              </div>

              <div className={`pipeline-stat ${appliedCount - interviewingCount === 0 ? 'is-empty' : ''}`}>
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
                      <span className="pipeline-stat-subtext">avg 7 days</span>
                    </>
                  )}
                </div>
              </div>

              <div className={`pipeline-stat ${interviewingCount === 0 ? 'is-empty' : 'is-active'}`}>
                <div className="pipeline-stat-icon">
                  <Icon name="flower" size="sm" />
                </div>
                <div className="pipeline-stat-content">
                  <span className="pipeline-stat-label">Interviews</span>
                  {interviewingCount === 0 ? (
                    <span className="pipeline-empty-hint">Your next milestone</span>
                  ) : (
                    <>
                      <span className="pipeline-stat-value">{interviewingCount}</span>
                      <span className="pipeline-stat-subtext">conversations</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 5: QUICK ACTIONS ROW
          ═══════════════════════════════════════════════════════════════════ */}
          <section className="quick-actions-section">
            <h3 className="section-header">
              <Icon name="zap" size="sm" />
              Quick actions
            </h3>
            <div className="quick-actions-row">
              {quickActions.map((action, idx) => (
                <Link key={idx} to={action.link} className="quick-action-btn">
                  <Icon name={action.icon} size="sm" />
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECTION 6: PROGRESS TRACKER
          ═══════════════════════════════════════════════════════════════════ */}
          <section className="progress-section">
            <div className="progress-card">
              <div className="progress-header">
                <span className="progress-label">Profile completeness</span>
                <span className="progress-value">{profileCompletion}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <Link to="/profile-analyzer" className="progress-cta">
                Complete your profile →
              </Link>
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
