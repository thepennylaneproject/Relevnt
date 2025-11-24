import React, { useState } from 'react'
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

  const handleStatusClick = (tab: ApplicationStatus | 'all') => {
    if (tab === 'all') {
      setSelectedStatus(undefined)
    } else {
      setSelectedStatus(tab)
    }
  }

  const formatUpdated = (app: any) => {
    const raw =
      app.updated_at || app.applied_date || app.created_at || new Date().toISOString()
    const date = new Date(raw)
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString()
  }

  return (
    <div className="page applications-page">
      <header className="page-header">
        <div>
          <h1>Applications</h1>
          <p>Track where you&apos;re at in each process, without losing the plot.</p>
        </div>
        <div className="applications-summary">
          <span>Total: {totalCount}</span>
          <span>Active: {statusCounts['in-progress'] + statusCounts.applied + statusCounts.offer}</span>
        </div>
      </header>

      <nav className="status-tabs">
        {STATUS_TABS.map((tab) => {
          const label =
            tab === 'all'
              ? 'All'
              : tab === 'in-progress'
                ? 'In progress'
                : tab.charAt(0).toUpperCase() + tab.slice(1)

          const count =
            tab === 'all'
              ? totalCount
              : statusCounts[tab as ApplicationStatus] ?? 0

          const isActive =
            (tab === 'all' && !selectedStatus) || tab === selectedStatus

          return (
            <button
              key={tab}
              className={`status-tab ${isActive ? 'active' : ''}`}
              onClick={() => handleStatusClick(tab)}
            >
              <span>{label}</span>
              <span className="status-count">{count}</span>
            </button>
          )
        })}
      </nav>

      {loading && <p>Loading applications…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && applications.length === 0 && (
        <p>No applications yet. When you apply to a job, log it here so Future You has receipts.</p>
      )}

      <div className="applications-list">
        {applications.map((app) => (
          <article key={app.id} className="application-card">
            <header className="application-header">
              <div>
                <h2>{app.position}</h2>
                <p>
                  {app.company}
                  {app.location ? ` · ${app.location}` : ''}
                </p>
              </div>
              <div className="application-meta">
                <span className={`status-pill status-${app.status || 'none'}`}>
                  {app.status || 'untracked'}
                </span>
                <span className="application-updated">
                  Updated: {formatUpdated(app)}
                </span>
              </div>
            </header>

            {app.job && (
              <p className="application-job">
                From job: {app.job.title} at {app.job.company}
              </p>
            )}

            {app.notes && <p className="application-notes">{app.notes}</p>}

            <footer className="application-actions">
              <div className="status-actions">
                <label>Set status:</label>
                <select
                  value={app.status || ''}
                  onChange={(e) =>
                    updateStatus(app.id, e.target.value as ApplicationStatus)
                  }
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
                className="danger-link"
                onClick={() => deleteApplication(app.id)}
              >
                Delete
              </button>
            </footer>
          </article>
        ))}
      </div>
    </div>
  )
}