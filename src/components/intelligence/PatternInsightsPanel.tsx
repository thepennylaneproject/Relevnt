/**
 * =============================================================================
 * PatternInsightsPanel Component
 * =============================================================================
 * Displays behavioral insights from job interaction patterns.
 * Part of Lyra Intelligence Layer - Phase 1.1
 * =============================================================================
 */

import React, { useEffect, useState } from 'react'
import { X, TrendingDown, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { useJobInteractions, type PatternInsight, type DismissalPattern } from '../../hooks/useJobInteractions'
import { useWellnessMode } from '../../hooks/useWellnessMode'

interface PatternInsightsPanelProps {
    className?: string
    collapsed?: boolean
}

export function PatternInsightsPanel({ className = '', collapsed: initialCollapsed = true }: PatternInsightsPanelProps) {
    const { insights, dismissInsight, getDismissalPatterns, getInteractionStats, loading } = useJobInteractions()
    const { getGuidance } = useWellnessMode()
    const wellnessGuidance = getGuidance()
    const [dismissalPatterns, setDismissalPatterns] = useState<DismissalPattern[]>([])
    const [stats, setStats] = useState<{
        totalViews: number
        totalSaves: number
        totalDismissals: number
        totalApplications: number
        saveRate: number
        dismissRate: number
    } | null>(null)
    const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)
    const [loadingPatterns, setLoadingPatterns] = useState(false)

    // Load patterns and stats on mount
    useEffect(() => {
        const loadData = async () => {
            setLoadingPatterns(true)
            try {
                const [patterns, interactionStats] = await Promise.all([
                    getDismissalPatterns(),
                    getInteractionStats()
                ])
                setDismissalPatterns(patterns)
                setStats(interactionStats)
            } finally {
                setLoadingPatterns(false)
            }
        }
        loadData()
    }, [getDismissalPatterns, getInteractionStats])

    // Don't render if no insights and no patterns
    const hasContent = insights.length > 0 || dismissalPatterns.length > 0
    if (!hasContent && !loading && !loadingPatterns) {
        return null
    }

    const handleDismissInsight = async (e: React.MouseEvent, insightId: string) => {
        e.stopPropagation()
        await dismissInsight(insightId)
    }

    return (
        <div className={`pattern-insights-panel ${className}`}>
            {/* Header */}
            <button
                className="pattern-insights-header"
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-expanded={!isCollapsed}
            >
                <div className="pattern-insights-header-left">
                    <Lightbulb size={16} className="pattern-insights-icon" />
                    <span className="pattern-insights-title">Pattern Insights</span>
                    {hasContent && (
                        <span className="pattern-insights-badge">
                            {insights.length + dismissalPatterns.length}
                        </span>
                    )}
                </div>
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>

            {/* Content */}
            {!isCollapsed && (
                <div className="pattern-insights-content">
                    {(loading || loadingPatterns) ? (
                        <div className="pattern-insights-loading">
                            Analyzing your patterns...
                        </div>
                    ) : (
                        <>
                            {/* Stats summary - Hidden in gentle mode to reduce anxiety */}
                            {!wellnessGuidance.hidePerformanceMetrics && stats && stats.totalDismissals > 5 && (
                                <div className="pattern-insights-stats">
                                    <div className="pattern-stat">
                                        <span className="pattern-stat-value">{stats.totalDismissals}</span>
                                        <span className="pattern-stat-label">refined</span>
                                    </div>
                                    <div className="pattern-stat">
                                        <span className="pattern-stat-value">{stats.totalSaves}</span>
                                        <span className="pattern-stat-label">saved</span>
                                    </div>
                                    <div className="pattern-stat">
                                        <span className="pattern-stat-value">{stats.saveRate}%</span>
                                        <span className="pattern-stat-label">save rate</span>
                                    </div>
                                </div>
                            )}

                            {/* Dismissal patterns */}
                            {dismissalPatterns.length > 0 && (
                                <div className="pattern-insights-section">
                                    <h4 className="pattern-section-title">
                                        <Lightbulb size={14} />
                                        {wellnessGuidance.hidePerformanceMetrics 
                                            ? "What you're looking for" 
                                            : "Compatibility patterns"}
                                    </h4>
                                    <ul className="pattern-list">
                                        {dismissalPatterns.slice(0, 3).map((pattern, idx) => (
                                            <li key={idx} className="pattern-item pattern-item-dismissal">
                                                {!wellnessGuidance.hidePerformanceMetrics && (
                                                    <span className="pattern-percentage">{pattern.percentage}%</span>
                                                )}
                                                <span className="pattern-description">
                                                    <strong>{pattern.factor}</strong> is important to you
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    {dismissalPatterns.length > 0 && (
                                        <p className="pattern-suggestion">
                                            💡 We're learning your preferences to show you better matches
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* AI-generated insights */}
                            {insights.length > 0 && (
                                <div className="pattern-insights-section">
                                    <h4 className="pattern-section-title">Insights</h4>
                                    <ul className="insight-list">
                                        {insights.map((insight) => (
                                            <li key={insight.id} className={`insight-item insight-priority-${insight.priority}`}>
                                                <div className="insight-content">
                                                    <strong>{insight.insight_title}</strong>
                                                    <p>{insight.insight_message}</p>
                                                </div>
                                                <button
                                                    className="insight-dismiss"
                                                    onClick={(e) => handleDismissInsight(e, insight.id)}
                                                    aria-label="Dismiss insight"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Empty state */}
                            {!hasContent && (
                                <div className="pattern-insights-empty">
                                    Keep browsing jobs to see patterns emerge.
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <style>{`
                .pattern-insights-panel {
                    background: var(--surface-elevated, #1a1a2e);
                    border: 1px solid var(--border-subtle, #2a2a4a);
                    border-radius: 12px;
                    overflow: hidden;
                    margin-bottom: 16px;
                }

                .pattern-insights-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 12px 16px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: var(--text-primary, #fff);
                    transition: background 0.15s ease;
                }

                .pattern-insights-header:hover {
                    background: var(--surface-hover, rgba(255,255,255,0.05));
                }

                .pattern-insights-header-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .pattern-insights-icon {
                    color: var(--accent-warning, #f59e0b);
                }

                .pattern-insights-title {
                    font-weight: 600;
                    font-size: 14px;
                }

                .pattern-insights-badge {
                    background: var(--accent-primary, #6366f1);
                    color: white;
                    font-size: 11px;
                    font-weight: 600;
                    padding: 2px 6px;
                    border-radius: 10px;
                }

                .pattern-insights-content {
                    padding: 0 16px 16px;
                }

                .pattern-insights-loading,
                .pattern-insights-empty {
                    color: var(--text-muted, #888);
                    font-size: 13px;
                    text-align: center;
                    padding: 16px 0;
                }

                .pattern-insights-stats {
                    display: flex;
                    gap: 16px;
                    padding: 12px;
                    background: var(--surface-sunken, rgba(0,0,0,0.2));
                    border-radius: 8px;
                    margin-bottom: 16px;
                }

                .pattern-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                }

                .pattern-stat-value {
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--text-primary, #fff);
                }

                .pattern-stat-label {
                    font-size: 11px;
                    color: var(--text-muted, #888);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .pattern-insights-section {
                    margin-bottom: 16px;
                }

                .pattern-insights-section:last-child {
                    margin-bottom: 0;
                }

                .pattern-section-title {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-secondary, #aaa);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                }

                .pattern-list,
                .insight-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .pattern-item {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    padding: 8px 0;
                    border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.05));
                    font-size: 13px;
                    color: var(--text-secondary, #ccc);
                }

                .pattern-item:last-child {
                    border-bottom: none;
                }

                .pattern-percentage {
                    font-weight: 700;
                    color: var(--accent-warning, #f59e0b);
                    min-width: 36px;
                }

                .pattern-suggestion {
                    font-size: 12px;
                    color: var(--text-muted, #888);
                    margin-top: 8px;
                    padding: 8px 12px;
                    background: var(--surface-sunken, rgba(0,0,0,0.2));
                    border-radius: 6px;
                    border-left: 3px solid var(--accent-primary, #6366f1);
                }

                .insight-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px;
                    background: var(--surface-sunken, rgba(0,0,0,0.2));
                    border-radius: 8px;
                    margin-bottom: 8px;
                }

                .insight-item:last-child {
                    margin-bottom: 0;
                }

                .insight-priority-3 {
                    border-left: 3px solid var(--accent-error, #ef4444);
                }

                .insight-priority-2 {
                    border-left: 3px solid var(--accent-warning, #f59e0b);
                }

                .insight-priority-1 {
                    border-left: 3px solid var(--accent-primary, #6366f1);
                }

                .insight-content {
                    flex: 1;
                }

                .insight-content strong {
                    font-size: 13px;
                    color: var(--text-primary, #fff);
                }

                .insight-content p {
                    font-size: 12px;
                    color: var(--text-secondary, #aaa);
                    margin: 4px 0 0;
                }

                .insight-dismiss {
                    background: transparent;
                    border: none;
                    color: var(--text-muted, #666);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.15s ease;
                }

                .insight-dismiss:hover {
                    background: var(--surface-hover, rgba(255,255,255,0.1));
                    color: var(--text-primary, #fff);
                }
            `}</style>
        </div>
    )
}

export default PatternInsightsPanel
