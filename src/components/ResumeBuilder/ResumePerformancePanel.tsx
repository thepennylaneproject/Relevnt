/**
 * =============================================================================
 * ResumePerformancePanel
 * =============================================================================
 * Shows outcome-based performance metrics for a specific resume.
 * Compares against user's best-performing resume to provide actionable insights.
 * Part of Priority 2: Resume → Outcome Feedback Loop
 * =============================================================================
 */

import React from 'react'
import { useApplicationPerformance, ResumePerformance } from '../../hooks/useApplicationPerformance'
import { Icon } from '../ui/Icon'

interface ResumePerformancePanelProps {
    resumeId: string
    resumeName?: string
}

export function ResumePerformancePanel({ resumeId, resumeName }: ResumePerformancePanelProps) {
    const { performance, loading, error } = useApplicationPerformance()

    if (loading) {
        return (
            <div className="resume-performance-panel loading">
                <div className="panel-header">
                    <Icon name="gauge" size="sm" />
                    <span>Loading performance data...</span>
                </div>
            </div>
        )
    }

    if (error || !performance) {
        return null
    }

    const { performanceByResume } = performance
    
    // Find this resume's performance
    const thisResume = performanceByResume.find(r => r.resumeId === resumeId)
    const topPerformer = performanceByResume[0] // Already sorted by interview rate
    
    // If no data for this resume yet, show encouraging message
    if (!thisResume) {
        return (
            <div className="resume-performance-panel empty">
                <div className="panel-header">
                    <Icon name="gauge" size="sm" />
                    <span>Performance Insights</span>
                </div>
                <div className="panel-content">
                    <p className="empty-message">
                        No applications yet with this resume. Apply to jobs to see how it performs!
                    </p>
                </div>
                <style>{panelStyles}</style>
            </div>
        )
    }

    const isTopPerformer = topPerformer?.resumeId === resumeId
    const hasComparison = performanceByResume.length > 1 && !isTopPerformer

    return (
        <div className="resume-performance-panel">
            <div className="panel-header">
                <Icon name="gauge" size="sm" />
                <span>Performance Insights</span>
            </div>
            
            <div className="panel-content">
                {/* This Resume's Stats */}
                <div className="performance-stat primary">
                    <div className="stat-header">
                        <span className="stat-label">This Resume</span>
                    </div>
                    <div className="stat-value">
                        <span className="rate">{thisResume.interviewRate}%</span>
                        <span className="label">Interview Rate</span>
                    </div>
                    <div className="stat-detail">
                        {thisResume.interviews} interviews from {thisResume.total} applications
                    </div>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${Math.min(thisResume.interviewRate, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Comparison with Top Performer */}
                {hasComparison && topPerformer && (
                    <div className="performance-stat comparison">
                        <div className="stat-header">
                            <span className="stat-label">Your Best Resume</span>
                        </div>
                        <div className="stat-value">
                            <span className="rate best">{topPerformer.interviewRate}%</span>
                            <span className="label">Interview Rate</span>
                        </div>
                        <div className="stat-detail">
                            "{topPerformer.resumeName}"
                        </div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill best" 
                                style={{ width: `${Math.min(topPerformer.interviewRate, 100)}%` }}
                            />
                        </div>
                        
                        {/* Gap Analysis */}
                        {topPerformer.interviewRate > thisResume.interviewRate && (
                            <div className="insight-card">
                                <Icon name="lighthouse" size="sm" />
                                <div className="insight-content">
                                    <span className="insight-title">
                                        {topPerformer.interviewRate - thisResume.interviewRate}% gap to close
                                    </span>
                                    <span className="insight-text">
                                        Consider reviewing what makes "{topPerformer.resumeName}" more effective.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* No comparison needed if this is the top performer */}
                {isTopPerformer && performanceByResume.length > 1 && (
                    <div className="insight-card success">
                        <Icon name="flower" size="sm" />
                        <div className="insight-content">
                            <span className="insight-title">Leading your portfolio</span>
                            <span className="insight-text">
                                This resume outperforms your {performanceByResume.length - 1} other version{performanceByResume.length > 2 ? 's' : ''}.
                            </span>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{panelStyles}</style>
        </div>
    )
}

const panelStyles = `
.resume-performance-panel {
    background: var(--color-surface-secondary, #1a1a2e);
    border: 1px solid var(--color-border, rgba(255,255,255,0.1));
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
}

.resume-performance-panel.loading,
.resume-performance-panel.empty {
    opacity: 0.7;
}

.panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text-primary, #fff);
    margin-bottom: 16px;
}

.panel-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.empty-message {
    font-size: 13px;
    color: var(--color-text-secondary, #888);
    line-height: 1.5;
    margin: 0;
}

.performance-stat {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.performance-stat.comparison {
    padding-top: 16px;
    border-top: 1px solid var(--color-border, rgba(255,255,255,0.1));
}

.stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.stat-label {
    font-size: 11px;
    font-weight: 600;

    letter-spacing: 0.5px;
    color: var(--color-text-muted, #666);
}

.stat-value {
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.stat-value .rate {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-primary, #fff);
}

.stat-value .rate.best {
    color: var(--color-accent-gold, #d4a574);
}

.stat-value .label {
    font-size: 12px;
    color: var(--color-text-secondary, #888);
}

.stat-detail {
    font-size: 12px;
    color: var(--color-text-secondary, #888);
}

.progress-bar {
    height: 4px;
    background: var(--color-border, rgba(255,255,255,0.1));
    border-radius: 2px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--color-accent, #6366f1);
    border-radius: 2px;
    transition: width 0.3s ease;
}

.progress-fill.best {
    background: var(--color-accent-gold, #d4a574);
}

.insight-card {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 8px;
    margin-top: 8px;
}

.insight-card.success {
    background: rgba(45, 90, 74, 0.1);
    border-color: rgba(45, 90, 74, 0.2);
}

.insight-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.insight-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary, #fff);
}

.insight-text {
    font-size: 12px;
    color: var(--color-text-secondary, #888);
    line-height: 1.4;
}
`

export default ResumePerformancePanel
