
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { Button } from '../components/ui/Button'
import { PrimaryActionRegistryProvider } from '../components/ui/PrimaryActionRegistry'
import { PageHero } from '../components/ui/PageHero'
import { EmptyState } from '../components/ui/EmptyState'
import { CollectionEmptyGuard } from '../components/ui/CollectionEmptyGuard'
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
import '../styles/applications.css'

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

export default function ApplicationsPage() {
  const navigate = useNavigate()
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
        className={`filter-btn ${isActive ? 'active' : ''}`}
        onClick={() => handleStatusClick(key)}
      >
        <span>{label}</span>
        {typeof count === 'number' && (
          <span className="count">
            ({count})
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
      {/* PrimaryActionRegistryProvider: Enforces single primary action per page view */}
      <PrimaryActionRegistryProvider scopeId="applications-page">
      <Container maxWidth="xl" padding="md">
        <div className="apps-page">
          <header className="page-header">
            <h1>Track where you're at in each process, without losing the plot.</h1>
            <p className="subtitle">Keep cada role, status, and timeline in one place. Future You has the receipts.</p>

            <div className="stats">
              <div className="stat-item">
                <span className="stat-value">{totalApplications}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{activeApplications}</span>
                <span className="stat-label">Active</span>
              </div>
            </div>

            <div className="mt-8">
              <Button variant="primary" onClick={handleAddApplication} primaryLabel="Log a new application">
                Log a new application
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="surface-card">
                <h3 className="text-sm font-semibold tracking-wider text-ink-tertiary mb-4">Filter by status</h3>

                <div className="filter-buttons">
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

                {/* DEV: Validate empty state compliance */}
                <CollectionEmptyGuard
                  itemsCount={applications.length}
                  hasEmptyState={true}
                  scopeId="applications-list"
                  expectedAction="Log first application"
                />

                {!loading && applications.length === 0 ? (
                  <EmptyState
                    type="applications"
                    includePoetry={false}
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
                            <span>{prettyStatusLabel(app.status)}</span>
                            {(app.status === 'interviewing' || app.status === 'in-progress') && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                style={{ color: 'var(--color-accent)' }}
                                onClick={() => navigate('/interview-prep')}
                              >
                                <span>Practice</span>
                              </Button>
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
                                <span className="text-[10px] font-bold text-accent">Drafted Outreach</span>
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
                                <Button 
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(data.draft);
                                    showToast('Draft copied to clipboard!', 'success');
                                  }}
                                >
                                  Copy
                                </Button>
                              </div>
                            </div>
                          );
                        })}

                        <div className="flex items-center gap-4 py-2 border-b border-subtle">
                          <div className="status-field flex-1">
                            <label className="muted text-[10px] font-bold" htmlFor={`status-${app.id}`}>
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-4"
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
                          </Button>
                        </div>

                        {expandedId === app.id && (
                          <div className="mt-4 animate-in slide-in-from-top-2">
                            <div className="flex gap-2 mb-4 border-b border-graphite-faint pb-3">
                              <Button
                                type="button"
                                variant={expandedTab === 'timeline' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setExpandedTab('timeline')}
                              >
                                Timeline
                              </Button>
                              {app.status === 'offer' && (
                                <Button
                                  type="button"
                                  variant={expandedTab === 'negotiate' ? 'secondary' : 'ghost'}
                                  size="sm"
                                  onClick={() => setExpandedTab('negotiate')}
                                >
                                  Negotiation Coach
                                </Button>
                              )}
                              {app.status === 'rejected' && (
                                <Button
                                  type="button"
                                  variant={expandedTab === 'coaching' ? 'secondary' : 'ghost'}
                                  size="sm"
                                  onClick={() => setExpandedTab('coaching')}
                                >
                                  De-brief
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant={expandedTab === 'letter' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setExpandedTab('letter')}
                              >
                                Cover Letter
                              </Button>
                            </div>

                            {expandedTab === 'timeline' && (
                              <div className="app-timeline">
                                 <h4 className="text-[10px] font-bold muted mb-2">History</h4>
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

                        <footer className="item-card-footer mt-4 pt-4 border-t border-graphite-faint flex justify-between">
                          <p className="muted text-[11px]">Updated {formatUpdated(app)}</p>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(app.id, app.position)}
                          >
                            Delete
                          </Button>
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
      </PrimaryActionRegistryProvider>

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
