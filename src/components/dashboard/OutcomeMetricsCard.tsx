/**
 * =============================================================================
 * OutcomeMetricsCard Component
 * =============================================================================
 * Displays outcome-based success metrics instead of activity counts.
 * Shows users what matters: Are they getting responses and interviews?
 * Part of Phase 2: Outcomes over Activity
 * =============================================================================
 */

import React from 'react'
import { TrendingUp, TrendingDown, Clock, Target } from 'lucide-react'
import { useOutcomeMetrics } from '../../hooks/useOutcomeMetrics'

interface OutcomeMetricsCardProps {
    className?: string
}

export function OutcomeMetricsCard({ className = '' }: OutcomeMetricsCardProps) {
    const { 
        responseRate, 
        interviewRate, 
        offerRate,
        avgDaysToResponse,
        avgDaysToInterview,
        activePipeline,
        isImproving,
        loading 
    } = useOutcomeMetrics()
    
    if (loading) {
        return (
            <div className={`outcome-metrics-card ${className}`}>
                <div className="outcome-metrics-loading">
                    Loading your success metrics...
                </div>
            </div>
        )
    }
    
    return (
        <div className={`outcome-metrics-card ${className}`}>
            <div className="outcome-header">
                <h3 className="outcome-title">Your Success Rates</h3>
                {isImproving && (
                    <span className="improvement-badge">
                        <TrendingUp size={12} />
                        Improving
                    </span>
                )}
            </div>
            
            <p className="outcome-subtitle">
                What really matters: are companies responding?
            </p>
            
            <div className="metrics-grid">
                {/* Response Rate - Most Important */}
                <div className="metric-card metric-primary">
                    <div className="metric-header">
                        <Target size={16} />
                        <span className="metric-label">Response Rate</span>
                    </div>
                    <div className="metric-value">{responseRate}%</div>
                    <div className="metric-context">
                        {responseRate >= 15 ? (
                            <span className="text-success">Above average (market: 10-12%)</span>
                        ) : responseRate >= 8 ? (
                            <span className="text-primary">On par with market</span>
                        ) : (
                            <span className="text-muted">Room to improve quality</span>
                        )}
                    </div>
                </div>
                
                {/* Interview Rate */}
                <div className="metric-card">
                    <div className="metric-header">
                        <TrendingUp size={16} />
                        <span className="metric-label">Interview Rate</span>
                    </div>
                    <div className="metric-value">{interviewRate}%</div>
                    <div className="metric-context">
                        {interviewRate >= 8 ? (
                            <span className="text-success">Strong conversion</span>
                        ) : interviewRate >= 4 ? (
                            <span className="text-primary">Solid progress</span>
                        ) : (
                            <span className="text-muted">Keep applying</span>
                        )}
                    </div>
                </div>
                
                {/* Active Pipeline */}
                <div className="metric-card">
                    <div className="metric-header">
                        <Clock size={16} />
                        <span className="metric-label">Active Pipeline</span>
                    </div>
                    <div className="metric-value">{activePipeline}</div>
                    <div className="metric-context">
                        {activePipeline >= 3 ? (
                            <span className="text-success">Healthy momentum</span>
                        ) : activePipeline >= 1 ? (
                            <span className="text-primary">In progress</span>
                        ) : (
                            <span className="text-muted">Apply to more roles</span>
                        )}
                    </div>
                </div>
                
                {/* Time to Response */}
                {avgDaysToResponse !== null && (
                    <div className="metric-card">
                        <div className="metric-header">
                            <Clock size={16} />
                            <span className="metric-label">Avg. Days to Response</span>
                        </div>
                        <div className="metric-value">{avgDaysToResponse}</div>
                        <div className="metric-context">
                            <span className="text-muted">Typical: 5-10 days</span>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="outcome-insights">
                {responseRate < 8 && (
                    <div className="insight-tip">
                        💡 <strong>Tip:</strong> Low response rates often mean applications need more personalization. 
                        Try tailoring your resume and cover letter to each role.
                    </div>
                )}
                {isImproving && (
                    <div className="insight-success">
                        ✨ Your recent applications are performing better than average. Keep it up!
                    </div>
                )}
            </div>
            
            <style>{`
                .outcome-metrics-card {
                    background: var(--surface-elevated, #1a1a2e);
                    border: 1px solid var(--border-subtle, #2a2a4a);
                    border-radius: 16px;
                    padding: 24px;
                }
                
                .outcome-metrics-loading {
                    color: var(--text-muted, #888);
                    text-align: center;
                    padding: 40px 20px;
                }
                
                .outcome-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                
                .outcome-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary, #fff);
                    margin: 0;
                }
                
                .improvement-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--accent-success, #22c55e);
                    background: var(--surface-success, rgba(34, 197, 94, 0.1));
                    padding: 4px 10px;
                    border-radius: 12px;
                }
                
                .outcome-subtitle {
                    font-size: 13px;
                    color: var(--text-secondary, #aaa);
                    margin: 0 0 20px;
                }
                
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 12px;
                    margin-bottom: 16px;
                }
                
                .metric-card {
                    background: var(--surface-sunken, rgba(0,0,0,0.2));
                    border: 1px solid var(--border-subtle, rgba(255,255,255,0.05));
                    border-radius: 12px;
                    padding: 16px;
                }
                
                .metric-primary {
                    border-color: var(--accent-primary, #6366f1);
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(0,0,0,0.2) 100%);
                }
                
                .metric-header {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 8px;
                    color: var(--text-muted, #888);
                }
                
                .metric-label {
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .metric-value {
                    font-size: 28px;
                    font-weight: 800;
                    color: var(--text-primary, #fff);
                    line-height: 1;
                    margin-bottom: 6px;
                }
                
                .metric-context {
                    font-size: 11px;
                    font-weight: 500;
                }
                
                .text-success {
                    color: var(--accent-success, #22c55e);
                }
                
                .text-primary {
                    color: var(--accent-primary, #6366f1);
                }
                
                .text-muted {
                    color: var(--text-muted, #888);
                }
                
                .outcome-insights {
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.05));
                }
                
                .insight-tip {
                    font-size: 12px;
                    color: var(--text-secondary, #aaa);
                    background: var(--surface-sunken, rgba(0,0,0,0.2));
                    border-left: 3px solid var(--accent-warning, #f59e0b);
                    padding: 10px 12px;
                    border-radius: 6px;
                }
                
                .insight-success {
                    font-size: 12px;
                    color: var(--accent-success, #22c55e);
                    background: var(--surface-success, rgba(34, 197, 94, 0.1));
                    border-left: 3px solid var(--accent-success, #22c55e);
                    padding: 10px 12px;
                    border-radius: 6px;
                }
            `}</style>
        </div>
    )
}

export default OutcomeMetricsCard
