/**
 * =============================================================================
 * SmallWins Component
 * =============================================================================
 * Celebrates non-application progress to reduce pressure and build momentum
 * when users are in low-energy or gentle wellness modes.
 * Part of Phase 1: Friction Removal & Emotional UI Tuning
 * =============================================================================
 */

import React from 'react'
import { CheckCircle2, Star, Target, Sparkles } from 'lucide-react'

interface SmallWin {
    icon: 'check' | 'star' | 'target' | 'sparkles'
    label: string
    count: number
}

interface SmallWinsProps {
    wins: SmallWin[]
    className?: string
}

export function SmallWins({ wins, className = '' }: SmallWinsProps) {
    if (wins.length === 0) return null

    const getIcon = (iconType: string, size = 16) => {
        switch (iconType) {
            case 'check': return <CheckCircle2 size={size} />
            case 'star': return <Star size={size} />
            case 'target': return <Target size={size} />
            case 'sparkles': return <Sparkles size={size} />
            default: return <CheckCircle2 size={size} />
        }
    }

    return (
        <div className={`small-wins-container ${className}`}>
            <div className="small-wins-header">
                <h3 className="small-wins-title">Small wins this week</h3>
                <p className="small-wins-subtitle">Progress comes in all forms</p>
            </div>

            <div className="small-wins-grid">
                {wins.map((win, idx) => (
                    <div key={idx} className="small-win-card">
                        <div className="small-win-icon">
                            {getIcon(win.icon, 18)}
                        </div>
                        <div className="small-win-content">
                            <div className="small-win-count">{win.count}</div>
                            <div className="small-win-label">{win.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .small-wins-container {
                    background: var(--surface-elevated, #1a1a2e);
                    border: 1px solid var(--border-subtle, #2a2a4a);
                    border-radius: 16px;
                    padding: 20px;
                    margin-bottom: 16px;
                }

                .small-wins-header {
                    margin-bottom: 16px;
                }

                .small-wins-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--text-primary, #fff);
                    margin: 0 0 4px;
                }

                .small-wins-subtitle {
                    font-size: 13px;
                    color: var(--text-muted, #888);
                    margin: 0;
                }

                .small-wins-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 12px;
                }

                .small-win-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: var(--surface-sunken, rgba(0,0,0,0.2));
                    border-radius: 10px;
                    border: 1px solid transparent;
                    transition: all 0.2s ease;
                }

                .small-win-card:hover {
                    border-color: var(--accent-primary, #6366f1);
                    background: var(--surface-hover, rgba(99, 102, 241, 0.05));
                }

                .small-win-icon {
                    color: var(--accent-success, #22c55e);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .small-win-content {
                    flex: 1;
                }

                .small-win-count {
                    font-size: 20px;
                    font-weight: 800;
                    color: var(--text-primary, #fff);
                    line-height: 1;
                    margin-bottom: 2px;
                }

                .small-win-label {
                    font-size: 11px;
                    color: var(--text-secondary, #aaa);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 600;
                }
            `}</style>
        </div>
    )
}

export default SmallWins
