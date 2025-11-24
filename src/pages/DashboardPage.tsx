import React from 'react'
import { useJobs } from '../hooks/useJobs'
import { useApplications } from '../hooks/useApplications'

export default function DashboardPage() {
  const { jobs, loading: jobsLoading, error: jobsError } = useJobs({ limit: 50 })
  const {
    applications,
    loading: appsLoading,
    error: appsError,
    statusCounts,
  } = useApplications()

  const recentApplications = applications.slice(0, 5)

  const formatDate = (raw: string | null | undefined) => {
    if (!raw) return 'N/A'
    const d = new Date(raw)
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString()
  }

  return (
    <div className="page dashboard-page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Your job search, without the chaos.</p>
        </div>
      </header>

      <section className="dashboard-grid">
        <div className="card metric-card">
          <h2>Jobs tracked</h2>
          {jobsLoading ? <p>Loading…</p> : <p className="metric">{jobs.length}</p>}
          {jobsError && <p className="error">{jobsError}</p>}
        </div>

        <div className="card metric-card">
          <h2>Applications</h2>
          {appsLoading ? (
            <p>Loading…</p>
          ) : (
            <p className="metric">{applications.length}</p>
          )}
          {appsError && <p className="error">{appsError}</p>}
        </div>

        <div className="card metric-card">
          <h2>Active pipelines</h2>
          <p className="metric">
            {statusCounts['in-progress'] + statusCounts.offer + statusCounts.applied}
          </p>
          <p className="subtext">Applied, in progress, or offer stage.</p>
        </div>
      </section>

      <section className="card">
        <h2>Recent applications</h2>
        {appsLoading && <p>Loading…</p>}
        {!appsLoading && recentApplications.length === 0 && (
          <p>No applications yet. Once you start logging them, they&apos;ll show up here.</p>
        )}

        {!appsLoading && recentApplications.length > 0 && (
          <ul className="timeline">
            {recentApplications.map((app) => (
              <li key={app.id} className="timeline-item">
                <div className="timeline-main">
                  <strong>{app.position}</strong>
                  <span>
                    {app.company}
                    {app.location ? ` · ${app.location}` : ''}
                  </span>
                </div>
                <div className="timeline-meta">
                  <span className={`status-pill status-${app.status || 'none'}`}>
                    {app.status || 'untracked'}
                  </span>
                  <span>{formatDate(app.updated_at || app.applied_date || app.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}