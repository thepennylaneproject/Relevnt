import React, { useState, useMemo } from 'react'
import { useAutoApplyQueue, type QueueItem, type ArtifactType } from '../hooks/useAutoApplyQueue'
// TODO(buttons): Retired panel still uses legacy button classes; migrate if reintroduced.

type StatusFilter = 'all' | 'ready_to_submit' | 'requires_review' | 'pending' | 'processing'

export function AutoApplyQueuePanel() {
    const {
        queueItems,
        loading,
        error,
        fetchArtifacts,
        markSubmitted,
        markFailed,
        trackLinkOpened,
    } = useAutoApplyQueue()

    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
    const [artifacts, setArtifacts] = useState<Record<string, ArtifactType[]>>({})
    const [loadingArtifacts, setLoadingArtifacts] = useState<Record<string, boolean>>({})

    // Modal states
    const [submittedModal, setSubmittedModal] = useState<{ item: QueueItem | null; open: boolean }>({
        item: null,
        open: false,
    })
    const [failedModal, setFailedModal] = useState<{ item: QueueItem | null; open: boolean }>({
        item: null,
        open: false,
    })

    const [submittedNotes, setSubmittedNotes] = useState('')
    const [submittedScreenshot, setSubmittedScreenshot] = useState('')
    const [failedError, setFailedError] = useState('')
    const [shouldRetry, setShouldRetry] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    // Filter queue items
    const filteredItems = useMemo(() => {
        if (statusFilter === 'all') return queueItems

        return queueItems.filter((item) => item.status === statusFilter)
    }, [queueItems, statusFilter])

    // Count by status
    const statusCounts = useMemo(() => {
        return {
            all: queueItems.length,
            ready_to_submit: queueItems.filter((item) => item.status === 'ready_to_submit').length,
            requires_review: queueItems.filter((item) => item.status === 'requires_review').length,
            pending: queueItems.filter((item) => item.status === 'pending').length,
            processing: queueItems.filter((item) => item.status === 'processing').length,
        }
    }, [queueItems])

    // Load artifacts for an item
    const handleExpandItem = async (item: QueueItem) => {
        if (expandedItemId === item.id) {
            setExpandedItemId(null)
            return
        }

        setExpandedItemId(item.id)

        // Fetch artifacts if not already loaded
        if (!artifacts[item.job_id]) {
            setLoadingArtifacts({ ...loadingArtifacts, [item.job_id]: true })
            const fetchedArtifacts = await fetchArtifacts(item.job_id)
            setArtifacts({ ...artifacts, [item.job_id]: fetchedArtifacts })
            setLoadingArtifacts({ ...loadingArtifacts, [item.job_id]: false })
        }
    }

    // Handle open link
    const handleOpenLink = (item: QueueItem) => {
        if (item.job.external_url) {
            trackLinkOpened(item.id, item.job_id)
            window.open(item.job.external_url, '_blank', 'noopener,noreferrer')
        }
    }

    // Handle submit confirmation
    const handleSubmitConfirm = async () => {
        if (!submittedModal.item) return

        try {
            setActionLoading(true)
            await markSubmitted(submittedModal.item.id, submittedNotes, submittedScreenshot)
            setSubmittedModal({ item: null, open: false })
            setSubmittedNotes('')
            setSubmittedScreenshot('')
        } catch (err) {
            alert(`Error: ${(err as Error).message}`)
        } finally {
            setActionLoading(false)
        }
    }

    // Handle mark failed
    const handleFailedConfirm = async () => {
        if (!failedModal.item || !failedError.trim()) {
            alert('Please provide an error message')
            return
        }

        try {
            setActionLoading(true)
            await markFailed(failedModal.item.id, failedError, shouldRetry)
            setFailedModal({ item: null, open: false })
            setFailedError('')
            setShouldRetry(false)
        } catch (err) {
            alert(`Error: ${(err as Error).message}`)
        } finally {
            setActionLoading(false)
        }
    }

    // Status badge
    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; className: string }> = {
            pending: { label: 'Queued', className: 'feed-tag' },
            processing: { label: 'Processing', className: 'feed-tag' },
            ready_to_submit: { label: 'Ready', className: 'feed-match-pill' },
            requires_review: { label: 'Needs Review', className: 'feed-tag' },
        }

        const badge = badges[status] || { label: status, className: 'feed-tag' }
        return <span className={badge.className}>{badge.label}</span>
    }

    if (loading) {
        return (
            <div className="feed-stack">
                <div className="muted text-sm">Loading auto-apply queue...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="feed-stack">
                <div className="feed-error">Error loading queue: {error.message}</div>
            </div>
        )
    }

    return (
        <>
            <div className="feed-stack">
                {/* Header */}
                <div className="surface-card feed-controls">
                    <h2 className="section-label">Auto-Apply Queue</h2>
                    <div className="feed-explainer muted text-xs">
                        Review and submit applications from your auto-apply queue. Click on an item to
                        preview generated materials.
                    </div>
                </div>

                {/* Status Filters */}
                <div className="surface-card feed-filters">
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {(['all', 'ready_to_submit', 'requires_review', 'pending', 'processing'] as const).map(
                            (status) => (
                                <button
                                    key={status}
                                    type="button"
                                    className={`ghost-button button-sm ${statusFilter === status ? 'feed-accent-link' : ''}`}
                                    onClick={() => setStatusFilter(status)}
                                >
                                    {status === 'all' ? 'All' : status.replace(/_/g, ' ')}{' '}
                                    ({statusCounts[status]})
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Queue Items */}
                <div className="feed-job-list">
                    {filteredItems.length === 0 && (
                        <div className="muted text-sm">
                            {statusFilter === 'all'
                                ? 'No items in queue. Enable auto-apply rules to get started.'
                                : `No items with status: ${statusFilter.replace(/_/g, ' ')}`}
                        </div>
                    )}

                    {filteredItems.map((item) => {
                        const job = item.job
                        const isExpanded = expandedItemId === item.id
                        const itemArtifacts = artifacts[item.job_id] || []
                        const isLoadingArtifacts = loadingArtifacts[item.job_id]

                        const salaryLabel =
                            job.salary_min && job.salary_max
                                ? `$${job.salary_min.toLocaleString()} – $${job.salary_max.toLocaleString()}`
                                : job.salary_min
                                    ? `$${job.salary_min.toLocaleString()}`
                                    : null

                        return (
                            <article key={item.id} className="feed-job-card">
                                <div className="feed-job-title-row">
                                    <div className="feed-job-title">{job.title}</div>
                                    {getStatusBadge(item.status)}
                                </div>

                                <div className="feed-job-meta muted text-xs">
                                    {job.company && <span>{job.company}</span>}
                                    {job.location && <span>• {job.location}</span>}
                                    {salaryLabel && <span>• {salaryLabel}</span>}
                                </div>

                                <div className="feed-tag-row">
                                    {job.remote_type === 'remote' && (
                                        <span className="feed-tag">Remote friendly</span>
                                    )}
                                    {item.metadata?.match_score && (
                                        <span className="feed-tag">
                                            Match: {Math.round(item.metadata.match_score)}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="feed-job-actions">
                                    <button
                                        type="button"
                                        className="ghost-button button-sm"
                                        onClick={() => handleExpandItem(item)}
                                    >
                                        {isExpanded ? 'Hide' : 'Preview'} Materials
                                    </button>

                                    {job.external_url && (
                                        <button
                                            type="button"
                                            className="ghost-button button-sm feed-accent-link"
                                            onClick={() => handleOpenLink(item)}
                                        >
                                            Open Link
                                        </button>
                                    )}

                                    {(item.status === 'ready_to_submit' ||
                                        item.status === 'requires_review') && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="ghost-button button-sm feed-accent-link"
                                                    onClick={() =>
                                                        setSubmittedModal({ item, open: true })
                                                    }
                                                >
                                                    Confirm Submitted
                                                </button>
                                                <button
                                                    type="button"
                                                    className="ghost-button button-sm"
                                                    onClick={() => setFailedModal({ item, open: true })}
                                                >
                                                    Mark Failed
                                                </button>
                                            </>
                                        )}
                                </div>

                                {/* Expanded Artifacts Preview */}
                                {isExpanded && (
                                    <div
                                        style={{
                                            marginTop: '1rem',
                                            padding: '1rem',
                                            background: 'var(--surface-100)',
                                            borderRadius: '0.5rem',
                                        }}
                                    >
                                        {isLoadingArtifacts && (
                                            <div className="muted text-xs">Loading materials...</div>
                                        )}

                                        {!isLoadingArtifacts && itemArtifacts.length === 0 && (
                                            <div className="muted text-xs">
                                                No generated materials yet. They will be created during
                                                preparation.
                                            </div>
                                        )}

                                        {!isLoadingArtifacts &&
                                            itemArtifacts.map((artifact) => (
                                                <div key={artifact.id} style={{ marginBottom: '1rem' }}>
                                                    <div className="section-label">
                                                        {artifact.artifact_type === 'resume'
                                                            ? 'Resume Bullets'
                                                            : artifact.artifact_type === 'cover_letter'
                                                                ? 'Cover Letter'
                                                                : 'Questionnaire'}
                                                    </div>
                                                    <div
                                                        className="text-xs"
                                                        style={{
                                                            whiteSpace: 'pre-wrap',
                                                            maxHeight: '200px',
                                                            overflow: 'auto',
                                                        }}
                                                    >
                                                        {artifact.content}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </article>
                        )
                    })}
                </div>
            </div>

            {/* Submitted Modal */}
            {submittedModal.open && submittedModal.item && (
                <div className="feed-modal-overlay" onClick={() => setSubmittedModal({ item: null, open: false })}>
                    <div className="feed-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="feed-modal-header">
                            <div>
                                <div className="feed-job-title">{submittedModal.item.job.title}</div>
                                <div className="feed-job-meta muted text-xs">
                                    Mark as submitted
                                </div>
                            </div>
                            <button
                                type="button"
                                className="feed-modal-close"
                                onClick={() => setSubmittedModal({ item: null, open: false })}
                            >
                                ×
                            </button>
                        </div>

                        <div className="feed-modal-section">
                            <label className="section-label">
                                Proof notes (optional)
                            </label>
                            <textarea
                                className="input-pill"
                                rows={3}
                                placeholder="e.g., Submitted via LinkedIn, confirmation email received"
                                value={submittedNotes}
                                onChange={(e) => setSubmittedNotes(e.target.value)}
                            />
                        </div>

                        <div className="feed-modal-section">
                            <label className="section-label">
                                Screenshot URL (optional)
                            </label>
                            <input
                                type="url"
                                className="input-pill"
                                placeholder="https://..."
                                value={submittedScreenshot}
                                onChange={(e) => setSubmittedScreenshot(e.target.value)}
                            />
                        </div>

                        <div className="feed-modal-actions">
                            <button
                                type="button"
                                className="ghost-button button-sm"
                                onClick={() => setSubmittedModal({ item: null, open: false })}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="ghost-button button-sm feed-accent-link"
                                onClick={handleSubmitConfirm}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Submitting...' : 'Confirm Submitted'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Failed Modal */}
            {failedModal.open && failedModal.item && (
                <div className="feed-modal-overlay" onClick={() => setFailedModal({ item: null, open: false })}>
                    <div className="feed-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="feed-modal-header">
                            <div>
                                <div className="feed-job-title">{failedModal.item.job.title}</div>
                                <div className="feed-job-meta muted text-xs">
                                    Mark as failed
                                </div>
                            </div>
                            <button
                                type="button"
                                className="feed-modal-close"
                                onClick={() => setFailedModal({ item: null, open: false })}
                            >
                                ×
                            </button>
                        </div>

                        <div className="feed-modal-section">
                            <label className="section-label">
                                What went wrong? *
                            </label>
                            <textarea
                                className="input-pill"
                                rows={3}
                                placeholder="e.g., Job posting removed, site down, login required"
                                value={failedError}
                                onChange={(e) => setFailedError(e.target.value)}
                                required
                            />
                        </div>

                        <div className="feed-modal-section">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={shouldRetry}
                                    onChange={(e) => setShouldRetry(e.target.checked)}
                                />
                                <span className="text-sm">Retry automatically later</span>
                            </label>
                        </div>

                        <div className="feed-modal-actions">
                            <button
                                type="button"
                                className="ghost-button button-sm"
                                onClick={() => setFailedModal({ item: null, open: false })}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="ghost-button button-sm feed-accent-link"
                                onClick={handleFailedConfirm}
                                disabled={actionLoading || !failedError.trim()}
                            >
                                {actionLoading ? 'Saving...' : 'Mark Failed'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
