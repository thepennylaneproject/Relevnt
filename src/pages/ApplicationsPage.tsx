
import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { Icon } from '../components/ui/Icon'
import { EmptyState } from '../components/ui/EmptyState'
import { copy } from '../lib/copy'
import {
  useApplications,
  type ApplicationStatus,
} from '../hooks/useApplications'
import { ApplicationQuestionHelper } from '../components/Applications/ApplicationQuestionHelper'
import { formatRelativeTime } from '../lib/utils/time'

const STATUS_TABS: (ApplicationStatus | 'all')[] = [
  'all',
  'applied',
  'interviewing',
  'in-progress',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
]

const prettyStatusLabel = (status: ApplicationStatus | null | undefined): string => {
  switch (status) {
    case 'applied':
      return 'Applied'
    case 'interviewing':
      return 'Interviewing'
    case 'in-progress':
      return 'Active'
    case 'offer':
      return 'Offer'
    case 'accepted':
      return 'Accepted'
    case 'rejected':
      return 'Rejected'
    case 'withdrawn':
      return 'Withdrawn'
    default:
      return 'Untracked'
  }
}

const renderStatusIcon = (status: ApplicationStatus | null | undefined) => {
  switch (status) {
    case 'interviewing':
      return <Icon name="microphone" size="sm" hideAccent />
    case 'in-progress':
      return <Icon name="candle" size="sm" hideAccent />
    case 'offer':
    case 'accepted':
      return <Icon name="flower" size="sm" hideAccent />
    case 'rejected':
      return <Icon name="compass-cracked" size="sm" hideAccent />
    case 'withdrawn':
      return <Icon name="anchor" size="sm" hideAccent />
    default:
      return null
  }
}

export default function ApplicationsPage() {
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | undefined>(
    undefined,
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const {
    applications,
    loading,
    error,
    updateStatus,
    deleteApplication,
    statusCounts,
    totalCount,
  } = useApplications({
    status: selectedStatus,
  })

  const totalApplications = totalCount
  const activeApplications =
    statusCounts['in-progress'] + statusCounts.applied + statusCounts.offer + statusCounts.interviewing

  const handleStatusClick = (tab: ApplicationStatus | 'all') => {
    if (tab === 'all') {
      setSelectedStatus(undefined)
    } else {
      setSelectedStatus(tab)
    }
  }

  const renderStatusChip = (key: ApplicationStatus | 'all', label: string, count?: number) => {
    const isActive = (key === 'all' && !selectedStatus) || key === selectedStatus

    return (
      <button
        key={key}
        type="button"
        className={`ghost-button button-sm ${isActive ? 'is-active' : ''}`}
        onClick={() => handleStatusClick(key)}
      >
        <span>{label}</span>
        {typeof count === 'number' && (
          <span className="count-badge">
            {count}
          </span>
        )}
      </button>
    )
  }

  const handleAddApplication = () => {
    // Hook up to creation flow
  }

  const formatUpdated = (app: any) => {
    const raw = app.updated_at || app.created_at || new Date().toISOString()
    return formatRelativeTime(raw)
  }

  return (
    <PageBackground>
      <Container maxWidth="xl" padding="md">
        <div className="apps-page">
          <section className="hero-shell">
            <div className="hero-header">
              <div className="dashboard-hero-icon">
                <Icon name="paper-airplane" size="md" />
              </div>
              <div className="hero-header-main">
                <p className="text-xs muted">{copy.applications.pageTitle}</p>
                <h1 className="font-display">{copy.applications.pageSubtitle}</h1>
                <p className="muted">
                  Keep cada role, status, and timeline in one place. Future You has the receipts.
                </p>
              </div>
            </div>

            <div className="hero-actions-accent">
              <div className="hero-actions-primary">
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleAddApplication}
                >
                  <Plus size={16} aria-hidden="true" />
                  Log a new application
                </button>
              </div>

              {typeof totalApplications === 'number' && typeof activeApplications === 'number' && (
                <div className="hero-actions-metrics">
                  <span className="hero-metric-pill">
                    <span className="font-semibold">{totalApplications}</span> Total
                  </span>
                  <span className="hero-metric-pill">
                    <span className="font-semibold">{activeApplications}</span> Active
                  </span>
                </div>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="surface-card">
                <h2 className="text-sm font-semibold">Filter by status</h2>

                <div className="filter-button-row">
                  {STATUS_TABS.map((statusKey) => {
                    const label =
                      statusKey === 'all'
                        ? 'All'
                        : statusKey === 'in-progress'
                          ? 'Active'
                          : statusKey === 'interviewing'
                            ? 'Interview'
                            : statusKey.charAt(0).toUpperCase() + statusKey.slice(1)

                    const count =
                      statusKey === 'all'
                        ? totalApplications
                        : statusCounts[statusKey as ApplicationStatus] ?? 0

                    return renderStatusChip(statusKey, label, count)
                  })}
                </div>
              </section>

              <section className="surface-card">
                {loading && <p className="muted text-sm">Loading applications…</p>}
                {error && <p className="muted text-sm text-danger">{error}</p>}

                {!loading && applications.length === 0 ? (
                  <EmptyState
                    type="applications"
                    action={{
                      label: "Log your first application",
                      onClick: handleAddApplication,
                    }}
                  />
                ) : (
                  <div className="item-grid">
                    {applications.map((app) => (
                      <article key={app.id} className="item-card enhanced-app-card">
                        <header className="item-card-header">
                          <div>
                            <h2 className="text-sm font-semibold">{app.position}</h2>
                            <p className="muted text-xs">
                              {app.company}
                              {app.location ? ` • ${app.location}` : ''}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className={`pill app-status-pill--${app.status || 'none'}`}>
                              {renderStatusIcon(app.status)}
                              <span>{prettyStatusLabel(app.status)}</span>
                            </span>
                            {(app.status === 'interviewing' || app.status === 'in-progress') && (
                              <Link
                                to={`/interview-prep`}
                                className="ghost-button button-xs color-accent"
                                style={{ textDecoration: 'none' }}
                              >
                                <Icon name="microphone" size="sm" />
                                <span>Practice</span>
                              </Link>
                            )}
                          </div>
                        </header>

                        <div className="flex items-center gap-4 py-2 border-b border-subtle">
                          <div className="status-field flex-1">
                            <label className="muted text-[10px] uppercase font-bold" htmlFor={`status-${app.id}`}>
                              Change Status
                            </label>
                            <select
                              id={`status-${app.id}`}
                              value={app.status || ''}
                              onChange={(e) =>
                                updateStatus(app.id, e.target.value as ApplicationStatus)
                              }
                              className="app-status-select w-full"
                            >
                              <option value="">Untracked</option>
                              <option value="applied">Applied</option>
                              <option value="interviewing">Interviewing</option>
                              <option value="in-progress">Active</option>
                              <option value="offer">Offer</option>
                              <option value="accepted">Accepted</option>
                              <option value="rejected">Rejected</option>
                              <option value="withdrawn">Withdrawn</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            className="ghost-button button-sm mt-4"
                            onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                          >
                            {expandedId === app.id ? 'Hide Timeline' : 'View Timeline'}
                            <Icon name={'compass'} size="sm" />
                          </button>
                        </div>

                        {expandedId === app.id && (
                          <div className="app-timeline mt-4 animate-in slide-in-from-top-2">
                            <h4 className="text-[10px] uppercase font-bold muted mb-2">History</h4>
                            <div className="space-y-3">
                              {(app.events || []).map(event => (
                                <div key={event.id} className="timeline-event flex gap-3 text-xs">
                                  <div className="timeline-dot" />
                                  <div className="flex-1">
                                    <div className="flex justify-between">
                                      <span className="font-semibold">{event.title}</span>
                                      <span className="muted">{formatRelativeTime(event.created_at)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {(app.events || []).length === 0 && (
                                <p className="muted text-center py-4 italic">No timeline events yet.</p>
                              )}
                            </div>
                          </div>
                        )}

                        <footer className="item-card-footer mt-4 pt-4 border-t border-subtle flex justify-between">
                          <p className="muted text-[11px]">Updated {formatUpdated(app)}</p>
                          <button
                            type="button"
                            className="ghost-button button-xs text-danger"
                            onClick={() => deleteApplication(app.id)}
                          >
                            Delete
                          </button>
                        </footer>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <ApplicationQuestionHelper />
              </div>
            </div>
          </div>
        </div>
      </Container>
      <style>{`
          .enhanced-app-card {
              transition: all 0.2s ease;
          }
          .app-status-select {
              border: none;
              background: var(--surface-accent);
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 13px;
              color: var(--text);
              cursor: pointer;
          }
          .app-timeline {
              padding: 12px;
              background: var(--surface-accent);
              border-radius: 8px;
          }
          .timeline-event {
              position: relative;
              padding-left: 12px;
          }
          .timeline-dot {
              position: absolute;
              left: 0;
              top: 4px;
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: var(--color-accent);
          }
      `}</style>
    </PageBackground>
  )
}
