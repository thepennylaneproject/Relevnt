import React from 'react'
import { Navigate } from 'react-router-dom'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { useAuth } from '../contexts/AuthContext'
import { useApplications } from '../hooks/useApplications'
import { useJobStats } from '../hooks/useJobStats'
import { useWellnessMode } from '../hooks/useWellnessMode'
import { VerseContainer } from '../components/dashboard/VerseContainer'
import { HaikuContainer } from '../components/dashboard/HaikuContainer'
import { PrimaryActionCard } from '../components/dashboard/PrimaryActionCard'
import { ActionCard } from '../components/dashboard/ActionCard'
import { PipelineStatus } from '../components/dashboard/PipelineStatus'
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
 * DASHBOARD PAGE — Revolutionary Redesign
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A single narrative flow that guides users through their job search journey:
 * 1. Greeting + Hero Verse (emotional context)
 * 2. Primary Action (what matters now)
 * 3. Supporting Actions (optional depth)
 * 4. Pipeline Status (informational context)
 * 5. Wellness Check (optional reflection)
 *
 * Content adapts based on user state (applications, interviews, etc.)
 * and emotional/wellness state.
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
          <div className="dashboard-loading">Loading your dashboard...</div>
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

  // Determine user state for adaptive content
  let userState = UserState.ZERO_APPLICATIONS
  if (interviewingCount > 0) {
    userState = UserState.IN_INTERVIEWS
  } else if (activeApplications.length > 0) {
    userState = UserState.ACTIVE_APPLICATIONS
  } else if (applications.length > 0 && appliedCount === 0) {
    userState = UserState.ALL_CAUGHT_UP
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ADAPTIVE CONTENT BASED ON USER STATE
  // ───────────────────────────────────────────────────────────────────────────

  // Hero verse (changes based on state)
  const getHeroVerse = () => {
    switch (userState) {
      case UserState.ZERO_APPLICATIONS:
        return (
          <>
            Every journey begins <br />
            with a single brave step. <br />
            Today, let that be yours.
          </>
        )
      case UserState.ACTIVE_APPLICATIONS:
        return (
          <>
            You've sent your signal. <br />
            Now comes the listening— <br />
            rest is part of the rhythm.
          </>
        )
      case UserState.IN_INTERVIEWS:
        return (
          <>
            The conversation has begun. <br />
            You belong at this table. <br />
            Everything you've prepared for <br />
            is ready.
          </>
        )
      case UserState.ALL_CAUGHT_UP:
        return (
          <>
            You've done the hard thing. <br />
            The pause is not weakness— <br />
            it's the breath between chapters.
          </>
        )
      default:
        return <>Every step forward matters.</>
    }
  }

  // Time-adaptive greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Primary action (the focal point of the page)
  const getPrimaryAction = () => {
    switch (userState) {
      case UserState.ZERO_APPLICATIONS:
        return {
          icon: 'compass',
          heading: 'Your next move:',
          title: 'Start your search',
          description:
            'Find roles aligned with your skills and goals. The more applications you send, the more conversations will start.',
          cta: 'Search roles',
          ctaLink: '/jobs',
        }
      case UserState.ACTIVE_APPLICATIONS:
        return {
          icon: 'compass',
          heading: 'Your next move:',
          title: 'Keep the momentum',
          description: `You've applied to ${appliedCount} ${appliedCount === 1 ? 'role' : 'roles'}. Responses typically arrive in 5–10 days. Send 2–3 more applications this week.`,
          cta: 'Find more roles',
          ctaLink: '/jobs',
        }
      case UserState.IN_INTERVIEWS:
        return {
          icon: 'flower',
          heading: 'Your next move:',
          title: 'Prepare for interviews',
          description:
            'You have conversations in progress. Practice your responses, research each company, and prepare thoughtful questions.',
          cta: 'Practice interviews',
          ctaLink: '/interview-prep',
        }
      case UserState.ALL_CAUGHT_UP:
        return {
          icon: 'candle',
          heading: 'Your next move:',
          title: 'Rest and reflect',
          description:
            "You're caught up on immediate actions. This is the time to strengthen your profile, learn new skills, or explore the market.",
          cta: 'Explore your options',
          ctaLink: '/jobs',
        }
      default:
        return {
          icon: 'compass',
          heading: 'Your next move:',
          title: 'Take action',
          description: 'Find opportunities that match your skills and goals.',
          cta: 'Get started',
          ctaLink: '/jobs',
        }
    }
  }

  // Supporting actions (what to do while waiting or in between)
  const getSupportingActions = () => {
    switch (userState) {
      case UserState.ZERO_APPLICATIONS:
        return [
          {
            icon: 'book',
            title: 'Learn your market',
            description: 'Understand industry trends and company needs.',
            cta: 'Explore insights',
            ctaLink: '/jobs',
          },
          {
            icon: 'scroll',
            title: 'Polish your resume',
            description: 'Make sure your resume stands out to recruiters.',
            cta: 'Build resume',
            ctaLink: '/resumes',
          },
        ]
      case UserState.ACTIVE_APPLICATIONS:
        return [
          {
            icon: 'microphone',
            title: 'Practice interviews',
            description: 'Stay sharp. Practice with AI-generated questions.',
            cta: 'Practice',
            ctaLink: '/interview-prep',
          },
          {
            icon: 'stars',
            title: 'Strengthen your profile',
            description: 'Get AI-powered feedback on your LinkedIn and resume.',
            cta: 'Analyze',
            ctaLink: '/profile-analyzer',
          },
        ]
      case UserState.IN_INTERVIEWS:
        return [
          {
            icon: 'scroll',
            title: 'Update your resume',
            description: 'Tailor your resume to highlight relevant experience.',
            cta: 'Edit',
            ctaLink: '/resumes',
          },
          {
            icon: 'book',
            title: 'Research companies',
            description: "Understand each company's mission, culture, and challenges.",
            cta: 'Learn',
            ctaLink: '/jobs',
          },
        ]
      case UserState.ALL_CAUGHT_UP:
        return [
          {
            icon: 'stars',
            title: 'Strengthen your profile',
            description: 'Improve your online presence and professional brand.',
            cta: 'Analyze',
            ctaLink: '/profile-analyzer',
          },
          {
            icon: 'microphone',
            title: 'Practice speaking',
            description: 'Stay interview-ready even while you wait.',
            cta: 'Practice',
            ctaLink: '/interview-prep',
          },
        ]
      default:
        return []
    }
  }

  // Pipeline status items
  const getPipelineItems = () => [
    {
      icon: 'seeds',
      label: 'Discovered',
      value: total || 0,
      subtext: 'roles explored',
    },
    {
      icon: 'compass',
      label: 'Applied to',
      value: appliedCount,
      subtext: 'applications sent',
    },
    {
      icon: 'candle',
      label: 'Awaiting responses',
      value: appliedCount - interviewingCount,
      subtext: 'avg 7 days',
    },
    {
      icon: 'flower',
      label: 'In interviews',
      value: interviewingCount,
      subtext: 'conversations',
    },
  ]

  // Optional haiku based on user state and wellness mode
  const getSupportingHaiku = () => {
    if (userState === UserState.ZERO_APPLICATIONS) {
      return (
        <HaikuContainer>
          Three hundred roles posted <br />
          before your coffee cools— <br />
          you're still in the running
        </HaikuContainer>
      )
    }
    if (userState === UserState.ALL_CAUGHT_UP) {
      return (
        <HaikuContainer>
          Algorithm sorts <br />
          your worth in seconds flat— <br />
          you are still human
        </HaikuContainer>
      )
    }
    return null
  }

  const primaryAction = getPrimaryAction()
  const supportingActions = getSupportingActions()
  const pipelineItems = getPipelineItems()

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <PageBackground>
      <Container maxWidth="lg" padding="md">
        <div className="clarity-hub-dashboard">
          {/* SECTION 1: HERO & GREETING */}
          <section className="clarity-hero">
            <h1 className="clarity-hero__title">
              {getGreeting()}
            </h1>

            <VerseContainer>
              {getHeroVerse()}
            </VerseContainer>
          </section>

          {/* SECTION 2: PRIMARY ACTION — Focal Point */}
          <section className="dashboard-section">
            <PrimaryActionCard
              icon={primaryAction.icon}
              iconSize="lg"
              heading={primaryAction.heading}
              title={primaryAction.title}
              description={primaryAction.description}
              cta={primaryAction.cta}
              ctaLink={primaryAction.ctaLink}
            />
          </section>

          {/* SECTION 3: SUPPORTING ACTIONS */}
          {supportingActions.length > 0 && (
            <section className="dashboard-section">
              <div className="supporting-actions">
                <h2 className="supporting-actions__heading">
                  {userState === UserState.ZERO_APPLICATIONS
                    ? 'Build your foundation'
                    : userState === UserState.ACTIVE_APPLICATIONS
                      ? 'While you wait'
                      : userState === UserState.IN_INTERVIEWS
                        ? 'Prepare and strengthen'
                        : 'Keep building'}
                </h2>
                <div className="supporting-actions__grid">
                  {supportingActions.map((action) => (
                    <ActionCard
                      key={action.cta}
                      icon={action.icon}
                      title={action.title}
                      description={action.description}
                      cta={action.cta}
                      ctaLink={action.ctaLink}
                      ctaVariant="secondary"
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SECTION 4: HAIKU (optional, strategic) */}
          {getSupportingHaiku()}

          {/* SECTION 5: PIPELINE STATUS — Informational */}
          <section className="dashboard-section">
            <PipelineStatus
              title="Where you are in your search"
              items={pipelineItems}
              marketContext={
                appliedCount > 0
                  ? {
                      metric: 'Response Rate',
                      userValue: '12%',
                      benchmarkValue: '12%',
                      interpretation: 'On par with industry average',
                    }
                  : undefined
              }
            />
          </section>

          {/* SECTION 6: WELLNESS CHECK (if gentle mode) */}
          {wellnessMode === 'gentle' && (
            <section className="dashboard-section">
              <WellnessCheckin />
            </section>
          )}
        </div>
      </Container>
    </PageBackground>
  )
}
