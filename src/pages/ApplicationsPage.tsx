
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/ui/Card'
import { Heading, Text } from '../components/ui/Typography'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/forms/Select'
import { Button } from '../components/ui/Button'
import { AddApplicationModal } from '../components/Applications/AddApplicationModal'
import { ApplicationStatus, useApplications } from '../hooks/useApplications'
import { CompanySentimentDashboard } from '../components/Applications/CompanySentimentDashboard'
import { ApplicationQuestionHelper } from '../components/Applications/ApplicationQuestionHelper'
import { CoverLetterGenerator } from '../components/Applications/CoverLetterGenerator'
import { getReadyUrl } from '../config/cross-product'
import { PrimaryActionRegistryProvider } from '../components/ui/PrimaryActionRegistry'
import { EmptyState } from '../components/ui/EmptyState'
import { CollectionEmptyGuard } from '../components/ui/CollectionEmptyGuard'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Icon } from '../components/ui/Icon'
import { useToast } from '../components/ui/Toast'
import { formatRelativeTime } from '../lib/utils/time'

const STATUS_TABS: (ApplicationStatus | 'all')[] = [
  'all',
  'staged',
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
    case 'staged':
      return 'Staged'
    case 'applied':
      return 'Applied'
    case 'interviewing':
      return 'Interviewing'
    case 'in-progress':
      return 'In Review'
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
  const [expandedTab, setExpandedTab] = useState<'timeline' | 'letter'>('timeline')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; position: string } | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const {
    applications,
    loading,
    error,
    updateStatus,
    updateApplication,
    deleteApplication,
    statusCounts,
    totalCount,
    refetch,
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

  // Bulk action handlers for staged applications
  const handleClearAllStaged = async () => {
    const staged = applications.filter(a => a.status === 'staged')
    if (staged.length === 0) return
    
    if (!window.confirm(`Remove ${staged.length} staged ${staged.length === 1 ? 'application' : 'applications'}?`)) {
      return
    }
    
    try {
      await Promise.all(staged.map((a: any) => deleteApplication(a.id)))
      showToast('Cleared staged applications', 'success')
      await refetch()
    } catch (error) {
      showToast('Failed to clear staged applications', 'error')
    }
  }

  const handleMarkAllApplied = async () => {
    const staged = applications.filter(a => a.status === 'staged')
    if (staged.length === 0) return
    
    try {
      await Promise.all(staged.map((a: any) => updateApplication(a.id, { status: 'applied' })))
      showToast(`Marked ${staged.length} as Applied`, 'success')
      await refetch()
    } catch (error) {
      showToast('Failed to update applications', 'error')
    }
  }

  return (
    <PrimaryActionRegistryProvider scopeId="applications-page">
      <PageLayout
        title="Track where you're at in each process, without losing the plot."
        subtitle="Keep cada role, status, and timeline in one place. Future You has the receipts."
        actions={
          <Button variant="primary" onClick={handleAddApplication} primaryLabel="Log a new application">
            Log a new application
          </Button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="flex gap-12">
              <div className="text-center">
                <Text muted className="uppercase tracking-widest text-xs font-bold">Total</Text>
                <Heading level={2}>{totalApplications}</Heading>
              </div>
              <div className="text-center">
                <Text muted className="uppercase tracking-widest text-xs font-bold">In Review</Text>
                <Heading level={2}>{activeApplications}</Heading>
              </div>
            </div>

            <section>
              <Heading level={4} className="uppercase tracking-wider text-text-muted mb-4">Filter by status</Heading>
              <div className="filter-buttons flex flex-wrap gap-2">
                {STATUS_TABS.map((statusKey) => {
                  const isActive = (statusKey === 'all' && !selectedStatus) || statusKey === selectedStatus
                  const label =
                    statusKey === 'all'
                      ? 'All'
                      : statusKey === 'staged'
                        ? 'Recently viewed'
                        : statusKey === 'in-progress'
                          ? 'In review'
                          : statusKey === 'interviewing'
                            ? 'Interview'
                            : statusKey.charAt(0).toUpperCase() + statusKey.slice(1)

                  const count =
                    statusKey === 'all'
                      ? totalApplications
                      : statusCounts[statusKey as ApplicationStatus] ?? 0

                  return (
                    <button
                      key={statusKey}
                      type="button"
                      className={`px-3 py-1 text-xs border border-border tracking-wide uppercase transition-colors ${isActive ? 'bg-text text-bg border-text' : 'hover:border-text-muted text-text-muted'}`}
                      onClick={() => handleStatusClick(statusKey)}
                    >
                      {label} ({count})
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Company Sentiment Dashboard */}
            <CompanySentimentDashboard />

            {/* Staged Applications Block */}
            {statusCounts.staged > 0 && !selectedStatus && (
              <Card className="border-accent/30 bg-accent-glow/5">
                <div className="flex justify-between items-center">
                  <Heading level={4} className="text-accent underline decoration-accent/30 underline-offset-4">Recently viewed ({statusCounts.staged})</Heading>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleMarkAllApplied}
                      className="text-xs uppercase tracking-widest font-bold text-accent hover:border-b border-accent"
                    >
                      Mark all applied
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllStaged}
                      className="text-xs uppercase tracking-widest font-bold text-error hover:border-b border-error"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
                <Text muted className="italic mt-4 text-xs">
                  You clicked these roles. Update to "Applied" if you submitted an application.
                </Text>
              </Card>
            )}

            <section className="space-y-8">
              {loading && <Text muted>Loading applications…</Text>}
              {error && <Text className="text-error italic">{error}</Text>}

              <CollectionEmptyGuard
                itemsCount={applications.length}
                hasEmptyState={true}
                scopeId="applications-list"
                expectedAction="Log first application"
              />

              {!loading && applications.length === 0 ? (
                <EmptyState type="applications" />
              ) : (
                <div className="space-y-8">
                  {applications.map((app: any) => (
                    <Card key={app.id} className="group">
                      <header className="flex justify-between items-start mb-6">
                        <div>
                          <Heading level={3}>{app.position}</Heading>
                          <Text muted>{app.company}{app.location ? ` • ${app.location}` : ''}</Text>
                        </div>
                        <Badge variant={app.status === 'rejected' ? 'error' : app.status === 'offer' ? 'success' : 'neutral'}>
                          {prettyStatusLabel(app.status)}
                        </Badge>
                      </header>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-border">
                        <Select
                          label="Workflow Status"
                          value={app.status || ''}
                          onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}
                        >
                          <option value="">Untracked</option>
                          <option value="staged">Staged</option>
                          <option value="applied">Applied</option>
                          <option value="interviewing">Interviewing</option>
                          <option value="in-progress">In Review</option>
                          <option value="offer">Offer</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                          <option value="withdrawn">Withdrawn</option>
                        </Select>

                        <div className="flex flex-col justify-end gap-3">
                          <div className="flex gap-4">
                            {app.status === 'staged' && (
                              <button
                                type="button"
                                className="text-xs font-bold uppercase tracking-widest text-accent border-b border-accent/20 hover:border-accent"
                                onClick={() => updateApplication(app.id, { status: 'applied' })}
                              >
                                Mark Applied
                              </button>
                            )}
                            {app.status === 'interviewing' && (
                              <a
                                href={getReadyUrl('/practice')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold uppercase tracking-widest text-accent border-b border-accent/20 hover:border-accent flex items-center gap-1"
                              >
                                Practice
                                <Icon name="external-link" size="xs" />
                              </a>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="uppercase tracking-widest px-0 hover:bg-transparent hover:underline"
                              onClick={() => {
                                if (expandedId === app.id) {
                                  setExpandedId(null)
                                } else {
                                  setExpandedId(app.id)
                                  setExpandedTab('timeline')
                                }
                              }}
                            >
                              {expandedId === app.id ? 'Close Details' : 'View Details'}
                            </Button>
                            <Text muted className="text-[10px] italic">Updated {formatUpdated(app)}</Text>
                          </div>
                        </div>
                      </div>

                      {expandedId === app.id && (
                        <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                          <div className="flex gap-8 mb-8 border-b border-border pb-4">
                            <button
                              type="button"
                              className={`text-xs uppercase tracking-widest font-bold ${expandedTab === 'timeline' ? 'text-text border-b-2 border-text' : 'text-text-muted'}`}
                              onClick={() => setExpandedTab('timeline')}
                            >
                              Timeline
                            </button>
                            <button
                              type="button"
                              className={`text-xs uppercase tracking-widest font-bold ${expandedTab === 'letter' ? 'text-text border-b-2 border-text' : 'text-text-muted'}`}
                              onClick={() => setExpandedTab('letter')}
                            >
                              Cover Letter
                            </button>
                          </div>

                          {expandedTab === 'timeline' ? (
                            <div className="space-y-6">
                              {(app.events || []).map((event: any) => (
                                <div key={event.id} className="flex gap-4 items-baseline">
                                  <div className="w-2 h-2 rounded-full bg-border" />
                                  <div className="flex-1 border-l border-border pl-4">
                                    <div className="flex justify-between">
                                      <Text className="font-semibold">{event.title}</Text>
                                      <Text muted className="text-xs italic">{formatRelativeTime(event.created_at)}</Text>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {(app.events || []).length === 0 && (
                                <Text muted className="italic py-8 text-center bg-surface-2">No timeline events recorded.</Text>
                              )}
                            </div>
                          ) : (
                            <CoverLetterGenerator application={app} />
                          )}
                        </div>
                      )}

                      <footer className="mt-6 flex justify-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="px-0 uppercase tracking-widest text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteClick(app.id, app.position)}
                        >
                          Delete Application
                        </Button>
                      </footer>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-12">
              <ApplicationQuestionHelper />
            </div>
          </div>
        </div>
      </PageLayout>
      {/* Modal Layers */}
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
    </PrimaryActionRegistryProvider>
  )
}
