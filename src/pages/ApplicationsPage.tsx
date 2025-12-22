
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { Icon } from '../components/ui/Icon'
import { PageHero } from '../components/ui/PageHero'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/Toast'
import { copy } from '../lib/copy'
import {
  useApplications,
  type ApplicationStatus,
} from '../hooks/useApplications'
import { ApplicationQuestionHelper } from '../components/Applications/ApplicationQuestionHelper'
import { NegotiationCoach } from '../components/Applications/NegotiationCoach'
import { RejectionCoaching } from '../components/Applications/RejectionCoaching'
import { CoverLetterGenerator } from '../components/Applications/CoverLetterGenerator'
import { AddApplicationModal } from '../components/Applications/AddApplicationModal'
import { NetworkingConnectionPrompt } from '../components/intelligence/NetworkingConnectionPrompt'
import { useNetworkingDraft } from '../hooks/useNetworkingDraft'
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
  const { showToast } = useToast()
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | undefined>(
    undefined,
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedTab, setExpandedTab] = useState<'timeline' | 'negotiate' | 'coaching' | 'letter'>('timeline')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; position: string } | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [networkingDrafts, setNetworkingDrafts] = useState<Record<string, { draft: string; strategy: string }>>({})
  const { generateDraft, loading: generatingDraft } = useNetworkingDraft()

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
    setIsAddModalOpen(true)
  }

  const handleDeleteClick = (id: string, position: string) => {
    setDeleteConfirm({ id, position })
  }

  const confirmDeleteApplication = () => {
    if (deleteConfirm) {
      deleteApplication(deleteConfirm.id)
      showToast('Application deleted', 'success')
      setDeleteConfirm(null)
    }
  }

  const formatUpdated = (app: any) => {
    const raw = app.updated_at || app.created_at || new Date().toISOString()
    return formatRelativeTime(raw)
  }

  return (
    <PageBackground>
      <Container maxWidth="xl" padding="md">
        <div className="apps-page">
          <PageHero
            category="track"
            headline={copy.applications.pageSubtitle}
            subtitle="Keep cada role, status, and timeline in one place. Future You has the receipts."
            actions={[{
              label: 'Log a new application',
              onClick: handleAddApplication,
              variant: 'primary',
              icon: <Plus size={16} aria-hidden="true" />,
            }]}
          >
            {typeof totalApplications === 'number' && typeof activeApplications === 'number' && (
              <div className="hero-actions-metrics" style={{ marginTop: 12 }}>
                <span className="hero-metric-pill">
                  <span className="font-semibold">{totalApplications}</span> Total
                </span>
                <span className="hero-metric-pill">
                  <span className="font-semibold">{activeApplications}</span> Active
                </span>
              </div>
            )}
          </PageHero>

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

                        <NetworkingConnectionPrompt 
                          company={app.company} 
                          variant="inline"
                          className="mt-2"
                          onGenerateMessage={async (contact) => {
                            const result = await generateDraft(
                              contact.name,
                              contact.role || '',
                              app.company || '',
                              app.position || ''
                            );
                            if (result?.success && result.data) {
                              setNetworkingDrafts(prev => ({
                                ...prev,
                                [contact.id]: result.data!
                              }));
                            }
                          }}
                        />

                        {Object.entries(networkingDrafts).map(([contactId, data]: [string, { draft: string; strategy: string }]) => {
                          // Only show if it matches a contact for this company
                          // This is simplified but works for now
                          return (
                            <div key={contactId} className="mt-3 p-3 bg-accent/5 border border-accent/20 rounded-lg animate-in fade-in slide-in-from-top-1">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold uppercase text-accent">Drafted Outreach</span>
                                <button 
                                  onClick={() => setNetworkingDrafts(prev => {
                                    const next = { ...prev };
                                    delete next[contactId];
                                    return next;
                                  })}
                                  className="text-[10px] muted hover:text-foreground"
                                >
                                  Clear
                                </button>
                              </div>
                              <p className="text-xs whitespace-pre-wrap italic">"{data.draft}"</p>
                              <div className="mt-2 flex gap-2">
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(data.draft);
                                    showToast('Draft copied to clipboard!', 'success');
                                  }}
                                  className="ghost-button button-xs"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                          );
                        })}

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
                            onClick={() => {
                              if (expandedId === app.id) {
                                setExpandedId(null)
                              } else {
                                setExpandedId(app.id)
                                setExpandedTab('timeline')
                              }
                            }}
                          >
                            {expandedId === app.id ? 'Collapse' : 'Details'}
                            <Icon name={expandedId === app.id ? 'anchor' : 'scroll'} size="sm" hideAccent />
                          </button>
                        </div>

                        {expandedId === app.id && (
                          <div className="mt-4 animate-in slide-in-from-top-2">
                            <div className="flex gap-2 mb-4 border-b border-subtle pb-2">
                              <button
                                className={`ghost-button button-xs ${expandedTab === 'timeline' ? 'is-active' : ''}`}
                                onClick={() => setExpandedTab('timeline')}
                              >
                                Timeline
                              </button>
                              {app.status === 'offer' && (
                                <button
                                  className={`ghost-button button-xs ${expandedTab === 'negotiate' ? 'is-active' : ''}`}
                                  onClick={() => setExpandedTab('negotiate')}
                                >
                                  Negotiation Coach
                                </button>
                              )}
                              {app.status === 'rejected' && (
                                <button
                                  className={`ghost-button button-xs ${expandedTab === 'coaching' ? 'is-active' : ''}`}
                                  onClick={() => setExpandedTab('coaching')}
                                >
                                  De-brief
                                </button>
                              )}
                              <button
                                className={`ghost-button button-xs ${expandedTab === 'letter' ? 'is-active' : ''}`}
                                onClick={() => setExpandedTab('letter')}
                              >
                                Cover Letter
                              </button>
                            </div>

                            {expandedTab === 'timeline' && (
                              <div className="app-timeline">
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
                            {expandedTab === 'negotiate' && <NegotiationCoach application={app} />}
                            {expandedTab === 'coaching' && <RejectionCoaching application={app} />}
                            {expandedTab === 'letter' && <CoverLetterGenerator application={app} />}
                          </div>
                        )}

                        <footer className="item-card-footer mt-4 pt-4 border-t border-subtle flex justify-between">
                          <p className="muted text-[11px]">Updated {formatUpdated(app)}</p>
                          <button
                            type="button"
                            className="ghost-button button-xs text-danger"
                            onClick={() => handleDeleteClick(app.id, app.position)}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Application"
        message={`Are you sure you want to delete your application for "${deleteConfirm?.position || 'this role'}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={confirmDeleteApplication}
        onCancel={() => setDeleteConfirm(null)}
      />

      <AddApplicationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </PageBackground>
  )
}
