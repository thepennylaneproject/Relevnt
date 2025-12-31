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
        isDemoData,
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
            </div>
            
            <p className="outcome-subtitle">
                {isDemoData 
                    ? "Target benchmarks for your industry (Showing Market Averages)" 
                    : "What really matters: are companies responding?"}
            </p>
            
            <div className="metrics-grid">
                {/* Response Rate - Most Important */}
                <div className="card card-stat">
                    <div className="flex items-center gap-2 mb-2 text-secondary">
                        <Target size={14} />
                        <span className="stat-label">Response Rate</span>
                    </div>
                    <div className="stat-value text-accent">{responseRate}%</div>
                    <div className="progress-bar-mini mt-2 mb-2">
                        <div className="progress-bar-fill" style={{ width: `${Math.min(responseRate * 5, 100)}%` }}></div>
                    </div>
                    <div className="stat-context">
                        {responseRate >= 15 ? (
                            <span className="text-success text-[10px]">Above average (market: 10-12%)</span>
                        ) : responseRate >= 8 ? (
                            <span className="text-accent text-[10px]">On par with market</span>
                        ) : (
                            <span className="text-secondary text-[10px]">Room to improve quality</span>
                        )}
                    </div>
                </div>
                
                {/* Interview Rate */}
                <div className="card card-stat">
                    <div className="flex items-center gap-2 mb-2 text-secondary">
                        <TrendingUp size={14} />
                        <span className="stat-label">Interview Rate</span>
                    </div>
                    <div className="stat-value text-accent">{interviewRate}%</div>
                    <div className="stat-context mt-2">
                        {interviewRate >= 8 ? (
                            <span className="text-success text-[10px]">Strong conversion</span>
                        ) : interviewRate >= 4 ? (
                            <span className="text-accent text-[10px]">Solid progress</span>
                        ) : (
                            <span className="text-secondary text-[10px]">Keep applying</span>
                        )}
                    </div>
                </div>
                
                {/* Active Pipeline */}
                <div className="card card-stat">
                    <div className="flex items-center gap-2 mb-2 text-secondary">
                        <Clock size={14} />
                        <span className="stat-label">Active Pipeline</span>
                    </div>
                    <div className="stat-value text-accent">{activePipeline}</div>
                    <div className="stat-context mt-2">
                        {activePipeline >= 3 ? (
                            <span className="text-success text-[10px]">Healthy momentum</span>
                        ) : activePipeline >= 1 ? (
                            <span className="text-accent text-[10px]">In progress</span>
                        ) : (
                            <span className="text-secondary text-[10px]">Apply to more roles</span>
                        )}
                    </div>
                </div>
                
                {/* Time to Response */}
                {avgDaysToResponse !== null && (
                    <div className="card card-stat">
                        <div className="flex items-center gap-2 mb-2 text-secondary">
                            <Clock size={14} />
                            <span className="stat-label">Avg. Days to Response</span>
                        </div>
                        <div className="stat-value text-accent">{avgDaysToResponse}</div>
                        <div className="stat-context mt-2">
                            <span className="text-secondary text-[10px]">Typical: 5-10 days</span>
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
                    margin-top: 2rem;
                }
                
                .outcome-metrics-loading {
                    color: var(--color-text-tertiary);
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
                    font-size: 1.5rem;
                    font-weight: 700;
                    font-family: var(--font-display);
                    color: var(--color-text-primary);
                    margin: 0;
                }
                
                .outcome-subtitle {
                    font-size: 0.875rem;
                    color: var(--color-text-secondary);
                    margin: 0 0 20px;
                }
                
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 16px;
                }
                
                .outcome-insights {
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid var(--color-border);
                }
                
                .insight-tip {
                    font-size: 12px;
                    color: var(--color-text-secondary);
                    background: var(--color-bg-secondary);
                    border-left: 3px solid var(--color-warning);
                    padding: 10px 12px;
                    border-radius: 6px;
                    margin-bottom: 8px;
                }
                
                .insight-success {
                    font-size: 12px;
                    color: var(--color-success);
                    background: var(--color-success-bg);
                    border-left: 3px solid var(--color-success);
                    padding: 10px 12px;
                    border-radius: 6px;
                }
                
                .progress-bar-mini {
                    height: 4px;
                    background: var(--color-bg-tertiary);
                    border-radius: 2px;
                    overflow: hidden;
                }
                
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-secondary));
                    border-radius: 2px;
                    transition: width 0.5s ease;
                }
            `}</style>
        </div>
    )
}

export default OutcomeMetricsCard
