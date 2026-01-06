/**
 * =============================================================================
 * JobFeed Component
 * =============================================================================
 * 
 * Reusable job feed component for displaying matched jobs with scores.
 * 
 * Features:
 * - Job cards with match scores
 * - Match explanations
 * - Collapsible match factors breakdown
 * - Loading skeleton
 * - Empty state
 * - Error handling
 * 
 * =============================================================================
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useExternalJobLink } from '../../hooks/useExternalJobLink'
import { useCompanySentiment } from '../../hooks/useCompanySentiment'
import { CompanySentimentBadge } from '../Applications/CompanySentimentBadge'
import { FeedbackButtons } from '../jobs/FeedbackButtons'
import type { MatchedJob } from '../../lib/matchJobs'

// =============================================================================
// TYPES
// =============================================================================

export interface JobFeedProps {
    /** Matched jobs to display */
    matches: MatchedJob[]

    /** Loading state */
    loading: boolean

    /** Error message if any */
    error: string | null

    /** Custom className */
    className?: string

    /** Optional callback when job is clicked */
    onJobClick?: (job: MatchedJob) => void
}

// =============================================================================
// COMPONENT
// =============================================================================

export function JobFeed({
    matches,
    loading,
    error,
    className = '',
    onJobClick,
}: JobFeedProps) {
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
    const { handleExternalClick } = useExternalJobLink()
    const navigate = useNavigate()
    const { companySentiments } = useCompanySentiment()

    // Create a map of company names to sentiment tags for quick lookup
    const companySentimentMap = new Map(
        companySentiments.map(s => [s.companyName.toLowerCase(), s.tag])
    )

    const toggleExpanded = (jobId: string) => {
        setExpandedJobId(prev => prev === jobId ? null : jobId)
    }

    // ---------------------------------------------------------------------------
    // LOADING STATE
    // ---------------------------------------------------------------------------

    if (loading) {
        return (
            <div className={`job-feed job-feed--loading ${className}`} style={styles.container}>
                {[1, 2, 3].map(i => (
                    <div key={i} style={styles.skeletonCard}>
                        <div style={styles.skeletonHeader} />
                        <div style={styles.skeletonText} />
                        <div style={styles.skeletonText} />
                    </div>
                ))}
            </div>
        )
    }

    // ---------------------------------------------------------------------------
    // ERROR STATE
    // ---------------------------------------------------------------------------

    if (error) {
        return (
            <div className={`job-feed job-feed--error ${className}`} style={styles.container}>
                <div style={styles.errorBox}>
                    <div style={styles.errorIcon}>
                        <Icon name="alert-triangle" size="md" hideAccent />
                    </div>
                    <div>
                        <div style={styles.errorTitle}>Failed to load jobs</div>
                        <div style={styles.errorMessage}>{error}</div>
                    </div>
                </div>
            </div>
        )
    }

    // ---------------------------------------------------------------------------
    // EMPTY STATE
    // ---------------------------------------------------------------------------

    if (matches.length === 0) {
        return (
            <div className={`job-feed job-feed--empty ${className}`} style={styles.container}>
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>
                        <Icon name="mailbox" size="lg" />
                    </div>
                    <div style={styles.emptyTitle}>No matches found</div>
                    <div style={styles.emptyMessage}>
                        Try adjusting your persona preferences or relevance weights to see more jobs.
                    </div>
                </div>
            </div>
        )
    }

    // ---------------------------------------------------------------------------
    // RENDER JOBS
    // ---------------------------------------------------------------------------

    return (
        <div className={`job-feed ${className}`} style={styles.container}>
            <div style={styles.header}>
                <div style={styles.resultsCount}>
                    {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
                </div>
            </div>

            <div style={styles.jobsList}>
                {matches.map(match => (
                    <div
                        key={match.job_id}
                        className="group"
                        style={styles.jobCard}
                        onClick={() => onJobClick?.(match)}
                    >
                        {/* Header with Score and Feedback Buttons */}
                        <div style={styles.jobHeader}>
                            <div style={styles.jobTitleArea}>
                                <h3 style={styles.jobTitle}>{match.job.title}</h3>
                                <div style={styles.jobCompany}>
                                    {match.job.company || 'Company not listed'}
                                    {match.job.location && (
                                        <> · {match.job.location}</>
                                    )}
                                    {/* Show sentiment badge if user has applied to this company */}
                                    {match.job.company && companySentimentMap.has(match.job.company.toLowerCase()) && (
                                        <span style={{ marginLeft: '8px' }}>
                                            <CompanySentimentBadge 
                                                tag={companySentimentMap.get(match.job.company.toLowerCase())!} 
                                                size="sm" 
                                            />
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Feedback Buttons */}
                            <FeedbackButtons 
                                job={{
                                    id: match.job_id,
                                    title: match.job.title,
                                    company: match.job.company,
                                    industry: match.job.industry,
                                    company_size: match.job.company_size,
                                    remote_type: match.job.remote_type,
                                    location: match.job.location,
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                        </div>

                        {/* Job Details */}
                        <div style={styles.jobDetails}>
                            {match.job.remote_type && (
                                <span>{match.job.remote_type}</span>
                            )}
                            {match.job.employment_type && (
                                <span>{match.job.employment_type}</span>
                            )}
                            {(match.job.salary_min || match.job.salary_max) && (
                                <span>{formatSalary(match.job.salary_min, match.job.salary_max)}</span>
                            )}
                        </div>

                        {/* Explanation */}
                        <div style={styles.explanation}>
                            <strong>Why this matches:</strong> {match.explanation}
                        </div>

                        {/* Expandable Match Factors */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleExpanded(match.job_id)
                            }}
                            style={styles.expandButton}
                        >
                            <div style={styles.expandChevron}>
                                <Icon name={expandedJobId === match.job_id ? 'chevron-down' : 'chevron-right'} size="sm" hideAccent />
                            </div>
                            View score breakdown
                        </button>

                        {expandedJobId === match.job_id && (
                            <div style={styles.factorsBreakdown}>
                                <div style={styles.factorRow}>
                                    <span style={styles.factorLabel}>Skills:</span>
                                    <div style={styles.factorBar}>
                                        <div
                                            style={{
                                                ...styles.factorBarFill,
                                                width: `${(match.match_factors.skill_score / 35) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span style={styles.factorValue}>{match.match_factors.skill_score.toFixed(1)}/35</span>
                                </div>
                                <div style={styles.factorRow}>
                                    <span style={styles.factorLabel}>Salary:</span>
                                    <div style={styles.factorBar}>
                                        <div
                                            style={{
                                                ...styles.factorBarFill,
                                                width: `${(match.match_factors.salary_score / 20) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span style={styles.factorValue}>{match.match_factors.salary_score.toFixed(1)}/20</span>
                                </div>
                                <div style={styles.factorRow}>
                                    <span style={styles.factorLabel}>Remote:</span>
                                    <div style={styles.factorBar}>
                                        <div
                                            style={{
                                                ...styles.factorBarFill,
                                                width: `${(match.match_factors.remote_score / 15) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span style={styles.factorValue}>{match.match_factors.remote_score.toFixed(1)}/15</span>
                                </div>
                                <div style={styles.factorRow}>
                                    <span style={styles.factorLabel}>Location:</span>
                                    <div style={styles.factorBar}>
                                        <div
                                            style={{
                                                ...styles.factorBarFill,
                                                width: `${(match.match_factors.location_score / 15) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span style={styles.factorValue}>{match.match_factors.location_score.toFixed(1)}/15</span>
                                </div>
                                <div style={styles.factorRow}>
                                    <span style={styles.factorLabel}>Industry:</span>
                                    <div style={styles.factorBar}>
                                        <div
                                            style={{
                                                ...styles.factorBarFill,
                                                width: `${(match.match_factors.industry_score / 10) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span style={styles.factorValue}>{match.match_factors.industry_score.toFixed(1)}/10</span>
                                </div>
                                <div style={styles.factorRow}>
                                    <span style={styles.factorLabel}>Title:</span>
                                    <div style={styles.factorBar}>
                                        <div
                                            style={{
                                                ...styles.factorBarFill,
                                                width: `${(match.match_factors.title_score / 15) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span style={styles.factorValue}>{match.match_factors.title_score.toFixed(1)}/15</span>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={styles.jobActions}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/resumes?jobId=${match.job_id}`)
                                }}
                                style={styles.tailorButton}
                            >
                                <Icon name="scroll" size="sm" hideAccent />
                                Tailor Resume
                            </button>
                            
                            {match.job.external_url && (
                                <a
                                    href={match.job.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.externalLink}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        // Fire and forget - stage application asynchronously
                                        handleExternalClick({
                                            jobId: match.job_id,
                                            jobTitle: match.job.title,
                                            company: match.job.company || 'Unknown',
                                            externalUrl: match.job.external_url!,
                                        })
                                    }}
                                >
                                    View Job →
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// =============================================================================
// HELPERS
// =============================================================================

function getScoreBadgeStyle(score: number): React.CSSProperties {
    if (score >= 80) {
        return { backgroundColor: 'var(--color-success)', color: 'var(--color-ink)' }
    }
    if (score >= 60) {
        return { backgroundColor: 'var(--color-accent)', color: 'var(--color-ink)' }
    }
    if (score >= 40) {
        return { backgroundColor: 'var(--color-warning)', color: 'var(--color-ink)' }
    }
    return { backgroundColor: 'var(--color-error)', color: 'var(--color-ink-inverse)' }
}

function formatSalary(min: number | null, max: number | null): string {
    if (min && max) {
        return `${(min / 1000).toFixed(0)}k - ${(max / 1000).toFixed(0)}k`
    }
    if (max) {
        return `Up to ${(max / 1000).toFixed(0)}k`
    }
    if (min) {
        return `${(min / 1000).toFixed(0)}k+`
    }
    return 'Not specified'
}

// =============================================================================
// STYLES
// =============================================================================

const styles: Record<string, React.CSSProperties> = {
    container: {
        width: '100%',
    },

    header: {
        marginBottom: '16px',
    },

    resultsCount: {
        fontSize: '14px',
        color: 'var(--color-ink-secondary)',
        fontWeight: 500,
    },

    jobsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },

    jobCard: {
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-graphite-faint)',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
    },

    jobHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        marginBottom: '12px',
    },

    jobTitleArea: {
        flex: 1,
    },

    jobTitle: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--color-ink)',
        marginBottom: '4px',
    },

    jobCompany: {
        fontSize: '14px',
        color: 'var(--color-ink-secondary)',
    },

    matchBadge: {
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: 700,
        flexShrink: 0,
    },

    jobDetails: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '12px',
    },

    badge: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        backgroundColor: 'var(--color-bg-alt)',
        borderRadius: '4px',
        fontSize: '12px',
        color: 'var(--color-ink-secondary)',
    },

    explanation: {
        fontSize: '14px',
        color: 'var(--color-ink)',
        lineHeight: 1.5,
        marginBottom: '12px',
    },

    expandButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'transparent',
        border: 'none',
        color: 'var(--color-accent)',
        fontSize: '13px',
        cursor: 'pointer',
        padding: '4px 0',
        marginBottom: '8px',
        fontWeight: 500,
    },

    expandChevron: {
        display: 'flex',
        alignItems: 'center',
        width: '12px',
    },

    factorsBreakdown: {
        marginTop: '12px',
        padding: '16px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },

    factorRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },

    factorLabel: {
        fontSize: '13px',
        color: 'var(--color-ink-secondary)',
        width: '80px',
        flexShrink: 0,
    },

    factorBar: {
        flex: 1,
        height: '8px',
        backgroundColor: 'var(--color-bg-alt)',
        borderRadius: '4px',
        overflow: 'hidden',
    },

    factorBarFill: {
        height: '100%',
        backgroundColor: 'var(--color-accent)',
        transition: 'width 0.3s ease',
    },

    factorValue: {
        fontSize: '13px',
        color: 'var(--color-ink)',
        fontWeight: 500,
        width: '50px',
        textAlign: 'right',
        flexShrink: 0,
    },

    externalLink: {
        display: 'inline-block',
        marginTop: '12px',
        padding: '8px 16px',
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-ink)',
        borderRadius: '6px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 500,
        transition: 'opacity 0.2s',
    },

    jobActions: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        marginTop: '12px',
    },

    tailorButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 16px',
        backgroundColor: 'transparent',
        border: '1px solid var(--color-accent)',
        color: 'var(--color-accent)',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },

    // Loading skeleton
    skeletonCard: {
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-graphite-faint)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
    },

    skeletonHeader: {
        height: '24px',
        width: '70%',
        backgroundColor: 'var(--color-bg-alt)',
        borderRadius: '4px',
        marginBottom: '12px',
    },

    skeletonText: {
        height: '16px',
        width: '90%',
        backgroundColor: 'var(--color-bg-alt)',
        borderRadius: '4px',
        marginBottom: '8px',
    },

    // Error state
    errorBox: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '20px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
    },

    errorIcon: {
        display: 'flex',
        alignItems: 'center',
        color: 'var(--color-error)',
    },

    errorTitle: {
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--color-error)',
        marginBottom: '4px',
    },

    errorMessage: {
        fontSize: '14px',
        color: 'var(--color-ink-secondary)',
    },

    // Empty state
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px',
    },

    emptyIcon: {
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'center',
        color: 'var(--text-muted)',
    },

    emptyTitle: {
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--color-ink)',
        marginBottom: '8px',
    },

    emptyMessage: {
        fontSize: '14px',
        color: 'var(--color-ink-secondary)',
        maxWidth: '400px',
        margin: '0 auto',
    },
}

export default JobFeed
