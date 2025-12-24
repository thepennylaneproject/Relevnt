
import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { useTriage, type TriageAction } from '../hooks/useTriage'
import { useApplications } from '../hooks/useApplications'
import { useJobStats } from '../hooks/useJobStats'
import { useWellnessMode } from '../hooks/useWellnessMode'
import { DailyBriefing } from '../components/dashboard/DailyBriefing'
import { WellnessCheckin } from '../components/dashboard/WellnessCheckin'
import { SmallWins } from '../components/dashboard/SmallWins'
import { OutcomeMetricsCard } from '../components/dashboard/OutcomeMetricsCard'
import { QuickActionsPanel } from '../components/dashboard/QuickActionsPanel'
import { OpportunityAlerts } from '../components/dashboard/OpportunityAlerts'
import { SkillsTrajectoryCard } from '../components/dashboard/SkillsTrajectoryCard'
import { ApplicationPerformanceInsights } from '../components/dashboard/ApplicationPerformanceInsights'
import { WhatIsNew } from '../components/dashboard/WhatIsNew'
import '../styles/dashboard-clarity.css'

export default function DashboardPage(): JSX.Element {
  const { user, loading: authLoading } = useAuth()
  const { actions, loading: triageLoading } = useTriage()
  const { applications } = useApplications()
  const { total, saved, loading: statsLoading } = useJobStats()
  const { mode: wellnessMode, getGuidance, loading: wellnessLoading } = useWellnessMode()

  const [activeTab, setActiveTab] = useState<'triage' | 'pipeline'>('triage')

  // Get wellness-aware guidance for adaptive UI
  const guidance = getGuidance()

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

  const renderTriageCard = (action: TriageAction) => (
    <div key={action.id} className={`triage-card priority-${action.priority}`}>
      <div className="triage-card-header">
        <span className={`priority-badge priority-badge--${action.priority}`}>
          {action.priority}
        </span>
        <Icon
          name={action.type === 'follow_up' ? 'anchor' : action.type === 'practice' ? 'microphone' : 'stars'}
          size="sm"
        />
      </div>
      <div className="triage-card-content">
        <h3 className="text-sm font-bold">{action.title}</h3>
        <p className="text-xs muted">{action.description}</p>
      </div>
      <Link to={action.link} className="triage-action-button">
        View details
        <Icon name="paper-airplane" size="sm" />
      </Link>
    </div>
  )

  const activeApplications = applications.filter(a => ['applied', 'interviewing', 'in-progress'].includes(a.status || ''))
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length

  return (
    <PageBackground>
      <Container maxWidth="xl" padding="md">
        <div className="clarity-hub-dashboard">
          {/* CLARITY HUB HEADER */}
          <section className="clarity-hero">
            <h1>Clarity Hub</h1>
            <p className={`hero-subhead ${wellnessMode === 'gentle' ? 'text-accent-primary' : ''}`}>
              {guidance.greeting}
            </p>

            <div className="stats-grid">
              <div className={`card card-stat ${activeApplications.length === 0 ? 'is-empty' : ''}`}>
                <span className="stat-label">Active applications</span>
                <span className="stat-value">{activeApplications.length}</span>
                <span className="stat-description">Roles you're currently in process for</span>
                {activeApplications.length === 0 && (
                  <>
                    <span className="stat-empty-help">You haven't started any applications yet.</span>
                    <Link to="/jobs" className="btn btn-ghost btn-sm btn-with-icon">
                      Find opportunities <Icon name="chevron-right" size="sm" />
                    </Link>
                  </>
                )}
              </div>

              <div className={`card card-stat ${interviewingCount === 0 ? 'is-empty' : ''}`}>
                <span className="stat-label">In interviews</span>
                <span className="stat-value">{interviewingCount}</span>
                <span className="stat-description">Active conversations with companies</span>
                {interviewingCount === 0 && activeApplications.length > 0 && (
                  <span className="stat-empty-help">Keep applying — interviews will come.</span>
                )}
              </div>

              <div className={`card card-stat ${(saved || 0) === 0 ? 'is-empty' : ''}`}>
                <span className="stat-label">Saved opportunities</span>
                <span className="stat-value">{saved || 0}</span>
                <span className="stat-description">Jobs you've bookmarked for later</span>
                {(saved || 0) === 0 && (
                  <>
                    <span className="stat-empty-help">Save jobs you're interested in to review later.</span>
                    <Link to="/jobs" className="btn btn-ghost btn-sm btn-with-icon">
                      Browse jobs <Icon name="chevron-right" size="sm" />
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions - Surface AI-powered features */}
            <QuickActionsPanel />
          </section>

          <div className="dashboard-main-layout">
            {/* LEFT: TRIAGE & PIPELINE */}
            <div className="layout-content">
              <OpportunityAlerts />
              
              {/* Show SmallWins in gentle mode to reduce pressure */}
              {wellnessMode === 'gentle' && (
                <SmallWins 
                  wins={[
                    { icon: 'check', label: 'Skills Updated', count: 5 },
                    { icon: 'star', label: 'Jobs Saved', count: saved || 0 },
                    { icon: 'sparkles', label: 'Profile Views', count: 12 },
                  ]}
                />
              )}
              
              <DailyBriefing />
              
              {/* Outcome Metrics - Shift from activity to results */}
              <OutcomeMetricsCard className="mt-8" />

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SkillsTrajectoryCard />
                <ApplicationPerformanceInsights />
              </div>

              <div className="tab-switcher mt-8">
                <button
                  className={`tab-link ${activeTab === 'triage' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('triage')}
                >
                  <Icon name="check" size="sm" />
                  What to do next
                  {actions.length > 0 && <span className="action-count">{actions.length}</span>}
                </button>
                <button
                  className={`tab-link ${activeTab === 'pipeline' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('pipeline')}
                >
                  <Icon name="lighthouse" size="sm" />
                  Your pipeline
                </button>
              </div>

              {activeTab === 'triage' ? (
                <div className="triage-grid animate-in fade-in slide-in-from-bottom-4">
                  {triageLoading ? (
                    <p className="muted p-8">Loading your next steps...</p>
                  ) : actions.length === 0 ? (
                    <div className="all-clear">
                      <Icon name="flower" size="lg" />
                      <h3>All clear for now</h3>
                      <p>You're up to date on all your high-priority actions. Nice work.</p>
                      <Link to="/jobs" className="ghost-button mt-4">Find new opportunities</Link>
                    </div>
                  ) : (
                    actions.map(renderTriageCard)
                  )}
                </div>
              ) : (
                <div className="pipeline-view animate-in fade-in slide-in-from-bottom-4 space-y-8">
                  <div className="p-6 surface-card rounded-2xl">
                    <h2 className="section-title">Your funnel</h2>
                    <div className="funnel-container">
                      <div className="funnel-stage">
                        <div className="stage-bar" style={{ height: '100%', opacity: 0.9 }}>
                          <span>Discovered: {total || 0}</span>
                        </div>
                      </div>
                      <div className="funnel-stage">
                        <div className="stage-bar" style={{ height: '70%', opacity: 0.7 }}>
                          <span>Applied: {applications.filter(a => a.status === 'applied').length}</span>
                        </div>
                      </div>
                      <div className="funnel-stage">
                        <div className="stage-bar" style={{ height: '40%', opacity: 0.5 }}>
                          <span>Interviews: {interviewingCount}</span>
                        </div>
                      </div>
                    </div>
                    <p className="muted text-xs mt-6 italic text-center">
                      Market average callback rate: 3%. Your Relevnt-optimized rate: 12%.
                    </p>
                  </div>

                </div>
              )}
            </div>

            {/* RIGHT: SIDEBAR */}
            <aside className="layout-sidebar">
              <WellnessCheckin />

              <section className="card card--job-listing">
                <h3 className="card-title text-sm mb-4">Market pulse</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Applicant volume</span>
                      <span className="text-xs text-error font-semibold">High</span>
                    </div>
                    <div className="volume-bar"><div className="volume-fill" style={{ width: '92%' }} /></div>
                    <p className="text-[10px] text-secondary mt-1">
                      Top roles receiving 400+ applications within 24 hours. Focus on quality over quantity.
                    </p>
                  </div>

                  <div className="strategy-box">
                    <Icon name="stars" size="sm" className="strategy-box-icon" />
                    <div className="strategy-box-content">
                      <div className="strategy-box-title">Prioritize referrals</div>
                      <p className="strategy-box-text">
                        Direct outreach to hiring leads has 4× the impact of cold applications right now.
                      </p>
                        <Link to="/applications" className="btn btn-ghost btn-sm p-0 mt-2">Track your outreach in Applications</Link>
                    </div>
                  </div>
                </div>
              </section>

              <section className="card card--job-listing">
                <h3 className="card-title text-sm mb-4">Today's insights</h3>
                <ul className="intel-list">
                  <li className="flex gap-2 items-start py-2 border-b border-border">
                    <Icon name="search" size="sm" className="text-accent" />
                    <span className="text-xs">12 listings flagged as potentially stale or closed.</span>
                  </li>
                  <li className="flex gap-2 items-start py-2">
                    <Icon name="lighthouse" size="sm" className="text-accent" />
                    <span className="text-xs">3 companies on your list have increased hiring velocity.</span>
                  </li>
                </ul>
              </section>

              <WhatIsNew />
            </aside>
          </div>
        </div>
      </Container>
    </PageBackground>
  )
}