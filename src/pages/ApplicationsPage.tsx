import React, { useState } from 'react'
import { PageLayout } from '../components/layout/PageLayout'
import { Button } from '../components/ui/Button'
import { AddApplicationModal } from '../components/Applications/AddApplicationModal'
import { StatusUpdatePopover } from '../components/Applications/StatusUpdatePopover'
import { ApplicationStatus, useApplications } from '../hooks/useApplications'
import { PrimaryActionRegistryProvider } from '../components/ui/PrimaryActionRegistry'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/Toast'
import { formatRelativeTime } from '../lib/utils/time'

type FilterStatus = ApplicationStatus | 'all'

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'applied', label: 'applied' },
  { value: 'interviewing', label: 'interviewing' },
  { value: 'in-progress', label: 'in review' },
  { value: 'offer', label: 'offers' },
  { value: 'rejected', label: 'rejected' },
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

/**
 * StatusFilterPhrase — Minimal inline filter with popover.
 * Format: "Showing [all/status] applications"
 * Clicking the status text opens a dropdown to change filter.
 */
function StatusFilterPhrase({
  selectedStatus,
  onStatusChange,
}: {
  selectedStatus: ApplicationStatus | undefined
  onStatusChange: (status: ApplicationStatus | undefined) => void
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLSpanElement>(null)

  const currentLabel = selectedStatus
    ? FILTER_OPTIONS.find((o) => o.value === selectedStatus)?.label || 'all'
    : 'all'

  // Close on outside click
  React.useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleSelect = (value: ApplicationStatus | 'all') => {
    onStatusChange(value === 'all' ? undefined : value)
    setIsOpen(false)
  }

  return (
    <p className="status-filter-phrase">
      <span>Showing </span>
      <span ref={containerRef} className="status-filter-phrase__trigger-wrap">
        <button
          type="button"
          className="status-filter-phrase__trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          {currentLabel}
        </button>
        {isOpen && (
          <span className="status-filter-phrase__menu" role="listbox">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={
                  (opt.value === 'all' && !selectedStatus) || opt.value === selectedStatus
                }
                className={`status-filter-phrase__option ${
                  (opt.value === 'all' && !selectedStatus) || opt.value === selectedStatus
                    ? 'status-filter-phrase__option--active'
                    : ''
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </span>
        )}
      </span>
      <span> applications</span>
    </p>
  )
}

export default function ApplicationsPage() {
  const { showToast } = useToast()
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | undefined>(undefined)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; position: string } | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const {
    applications,
    loading,
    error,
    updateStatus,
    deleteApplication,
  } = useApplications({
    status: selectedStatus,
  })

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

  const handleStatusUpdate = (id: string, status: ApplicationStatus) => {
    updateStatus(id, status)
    showToast(`Status updated to ${prettyStatusLabel(status)}`, 'success')
  }

  return (
    <PrimaryActionRegistryProvider scopeId="applications-page">
      <PageLayout
        title="Track where you're at in each process."
        actions={
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)} primaryLabel="Log a new application">
            Log a new application
          </Button>
        }
      >
        {/* Single inline filter phrase with popover — calm ledger energy */}
        <StatusFilterPhrase
          selectedStatus={selectedStatus}
          onStatusChange={(status) => setSelectedStatus(status)}
        />

        {/* Ledger list */}
        <section>
          {loading && (
            <p className="ledger-row__secondary-text" style={{ padding: '2rem 0' }}>
              Loading applications…
            </p>
          )}

          {error && (
            <p style={{ color: 'var(--error)', fontStyle: 'italic', padding: '2rem 0' }}>
              {error}
            </p>
          )}

          {!loading && applications.length === 0 ? (
            <EmptyState type="applications" />
          ) : (
            <div>
              {applications.map((app: any) => (
                <div key={app.id} className="ledger-row">
                  {/* Left: Application info */}
                  <div className="ledger-row__left">
                    <span className="ledger-row__title">{app.position}</span>
                    <span className="ledger-row__secondary-text">at {app.company}</span>
                    {app.location && (
                      <span className="ledger-row__tertiary-text">• {app.location}</span>
                    )}
                  </div>

                  {/* Right: Status + Primary action + Secondary actions */}
                  <div className="ledger-row__right">
                    <span className="ledger-row__status">{prettyStatusLabel(app.status)}</span>

                    <StatusUpdatePopover
                      currentStatus={app.status}
                      onSelect={(status) => handleStatusUpdate(app.id, status)}
                    />

                    {/* Secondary actions - hover only */}
                    <div className="ledger-row__secondary-actions">
                      <button
                        type="button"
                        className="ledger-row__secondary-action ledger-row__secondary-action--danger"
                        onClick={() => handleDeleteClick(app.id, app.position)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </PageLayout>

      {/* Modals */}
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
