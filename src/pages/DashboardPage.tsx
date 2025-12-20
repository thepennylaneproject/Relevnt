
import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { copy } from '../lib/copy'
import { useTriage, type TriageAction } from '../hooks/useTriage'
import { useApplications } from '../hooks/useApplications'
import { useJobStats } from '../hooks/useJobStats'
import '../styles/dashboard-war-room.css'

export default function DashboardPage(): JSX.Element {
  const { user, loading: authLoading } = useAuth()
  const { actions, loading: triageLoading } = useTriage()
  const { applications } = useApplications()
  const { total, saved, loading: statsLoading } = useJobStats()

  const [activeTab, setActiveTab] = useState<'triage' | 'pipeline'>('triage')

  if (authLoading) {
    return (
      <PageBackground>
        <Container maxWidth="lg" padding="md">
          <div className="dashboard-page-loading">Entering War Room...</div>
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
          {action.priority.toUpperCase()}
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
        Execute
        <Icon name="check" size="sm" />
      </Link>
    </div>
  )

  const activeApplications = applications.filter(a => ['applied', 'interviewing', 'in-progress'].includes(a.status || ''))
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length

  return (
    <PageBackground>
      <Container maxWidth="xl" padding="md">
        <div className="war-room-dashboard">
          {/* WAR ROOM HEADER */}
          <section className="war-room-hero">
            <div className="hero-content">
              <div className="hero-badge">
                <Icon name="check" size="sm" />
                <span>War Room Active</span>
              </div>
              <h1 className="font-display text-4xl mt-2">Authenticated Intelligence</h1>
              <p className="muted max-w-2xl mt-2">
                The market is broken, but you don't have to be. Here is your situational awareness and high-impact triage for today.
              </p>
            </div>

            <div className="hero-stats-grid">
              <div className="stat-box">
                <span className="stat-value">{activeApplications.length}</span>
                <span className="stat-label">Active Battles</span>
              </div>
              <div className="stat-box accent">
                <span className="stat-value">{interviewingCount}</span>
                <span className="stat-label">In Contact</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">{saved || 0}</span>
                <span className="stat-label">Intel Targets</span>
              </div>
            </div>
          </section>

          <div className="dashboard-main-layout">
            {/* LEFT: TRIAGE & PIPELINE */}
            <div className="layout-content">
              <div className="tab-switcher">
                <button
                  className={`tab-link ${activeTab === 'triage' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('triage')}
                >
                  <Icon name="candle" size="sm" />
                  Immediate Triage
                  {actions.length > 0 && <span className="action-count">{actions.length}</span>}
                </button>
                <button
                  className={`tab-link ${activeTab === 'pipeline' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('pipeline')}
                >
                  <Icon name="lighthouse" size="sm" />
                  Strategic Pipeline
                </button>
              </div>

              {activeTab === 'triage' ? (
                <div className="triage-grid animate-in fade-in slide-in-from-bottom-4">
                  {triageLoading ? (
                    <p className="muted p-8">Sourcing intel...</p>
                  ) : actions.length === 0 ? (
                    <div className="all-clear">
                      <Icon name="flower" size="lg" />
                      <h3>All clear for now.</h3>
                      <p className="muted">You've executed every high-impact action. Good hunting.</p>
                      <Link to="/jobs" className="ghost-button mt-4">Scout for more</Link>
                    </div>
                  ) : (
                    actions.map(renderTriageCard)
                  )}
                </div>
              ) : (
                <div className="pipeline-view animate-in fade-in slide-in-from-bottom-4 p-6 surface-card">
                  <h2 className="text-lg font-bold mb-6">The Funnel Reality</h2>
                  <div className="funnel-container">
                    <div className="funnel-stage">
                      <div className="stage-bar" style={{ height: '100%', opacity: 0.9 }}>
                        <span>Scouted: {total || 0}</span>
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
                    Market Average for your role: 3% callback rate. Your Relevnt Intelligence callback rate: 12%.
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT: MARKET PULSE */}
            <aside className="layout-sidebar">
              <section className="surface-card pulse-card">
                <h3 className="text-xs font-bold uppercase tracking-widest muted mb-4">Market Pulse</h3>
                <div className="pulse-items space-y-6">
                  <div className="pulse-item">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold">Applicant Volume</span>
                      <span className="text-xs text-danger font-bold">EXTREME</span>
                    </div>
                    <div className="volume-bar"><div className="volume-fill" style={{ width: '92%' }} /></div>
                    <p className="text-[10px] muted mt-1">Average 400+ applications within 24 hours for top matches.</p>
                  </div>

                  <div className="pulse-item">
                    <h4 className="text-xs font-bold mb-1">Authentic Strategy</h4>
                    <div className="strategy-tag">
                      <Icon name="stars" size="sm" />
                      <span>REFERRAL OVER APPLICATION</span>
                    </div>
                    <p className="text-[10px] muted mt-1">Direct outreach to hiring leads has 4x the impact of cold applying right now.</p>
                    <Link to="/networking" className="text-[10px] font-bold underline mt-2 inline-block">Execute Outreach</Link>
                  </div>
                </div>
              </section>

              <section className="surface-card blitz-card mt-6">
                <h3 className="text-xs font-bold uppercase tracking-widest muted mb-4">Intel Briefing</h3>
                <ul className="intel-list space-y-3">
                  <li className="flex gap-2 text-xs">
                    <Icon name="search" size="sm" />
                    <span>Ghost Job Detection identifying 12 listings as stale.</span>
                  </li>
                  <li className="flex gap-2 text-xs">
                    <Icon name="lighthouse" size="sm" />
                    <span>3 Companies in your target list have increased hiring velocity.</span>
                  </li>
                </ul>
              </section>
            </aside>
          </div>
        </div>
      </Container>
    </PageBackground>
  )
}