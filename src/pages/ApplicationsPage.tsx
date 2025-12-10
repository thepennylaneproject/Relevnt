import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { Icon } from '../components/ui/Icon'
import { EmptyState } from '../components/ui/EmptyState'
import { copy } from '../lib/copy'
import {
  useApplications,
  type ApplicationStatus,
} from '../hooks/useApplications'

const STATUS_TABS: (ApplicationStatus | 'all')[] = [
  'all',
  'applied',
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
    case 'in-progress':
      return 'In progress'
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

  const {
    applications,
    loading,
    error,
    updateStatus,
    addNote,
    deleteApplication,
    statusCounts,
    totalCount,
  } = useApplications({
    status: selectedStatus,
  })

  const totalApplications = totalCount
  const activeApplications =
    statusCounts['in-progress'] + statusCounts.applied + statusCounts.offer

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
    // Hook up to the existing application creation flow when available
  }

  const formatUpdated = (app: any) => {
    const raw =
      app.updated_at || app.applied_date || app.created_at || new Date().toISOString()
    const date = new Date(raw)
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString()
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
                  Keep each role, status, and next step in one place so Future You has receipts when
                  good news lands.
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

          <section className="surface-card">
            <h2 className="text-sm font-semibold">Filter by status</h2>

            <div className="filter-button-row">
              {STATUS_TABS.map((statusKey) => {
                const label =
                  statusKey === 'all'
                    ? 'All'
                    : statusKey === 'in-progress'
                      ? 'In progress'
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
                  <article key={app.id} className="item-card">
                    <header className="item-card-header">
                      <div>
                        <h2 className="text-sm font-semibold">{app.position}</h2>
                        <p className="muted text-xs">
                          {app.company}
                          {app.location ? ` • ${app.location}` : ''}
                        </p>
                      </div>

                      <span className={`pill app-status-pill--${app.status || 'none'}`}>
                        {renderStatusIcon(app.status)}
                        <span>{prettyStatusLabel(app.status)}</span>
                      </span>
                    </header>

                    <p className="muted text-xs">Updated {formatUpdated(app)}</p>

                    {app.job && (
                      <p className="muted text-xs">
                        From job: {app.job.title} at {app.job.company}
                      </p>
                    )}

                    {app.notes && (
                      <p className="text-sm app-notes">
                        {app.notes}
                      </p>
                    )}

                    <footer className="item-card-footer">
                      <div className="status-field">
                        <label className="muted text-xs" htmlFor={`status-${app.id}`}>
                          Set status
                        </label>
                        <select
                          id={`status-${app.id}`}
                          value={app.status || ''}
                          onChange={(e) =>
                            updateStatus(app.id, e.target.value as ApplicationStatus)
                          }
                          className="app-status-select"
                        >
                          <option value="">Untracked</option>
                          <option value="applied">Applied</option>
                          <option value="in-progress">In progress</option>
                          <option value="offer">Offer</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                          <option value="withdrawn">Withdrawn</option>
                        </select>
                      </div>

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
      </Container>
    </PageBackground>
  )
}
