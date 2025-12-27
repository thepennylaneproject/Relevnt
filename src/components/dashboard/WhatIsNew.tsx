/**
 * =============================================================================
 * WhatIsNew Component
 * =============================================================================
 * Surfaces platform momentum to users and investors.
 * Part of Phase 4: Retention & Transparency.
 * =============================================================================
 */

import React from 'react'
import { Sparkles, CheckCircle2, Zap } from 'lucide-react'
import { PoeticVerseMinimal } from '../ui/PoeticVerse'
import { getPoeticVerse } from '../../lib/poeticMoments'

const UPDATES = [
    {
        id: '1',
        title: 'Lyra Intelligence Layer',
        description: 'New proactive insights on job alignment and application patterns.',
        type: 'feature',
        date: '2025-12-21'
    },
    {
        id: '2',
        title: 'Wellness Mode',
        description: 'Dashboard now adapts its tone and signal density based on your check-in.',
        type: 'improvement',
        date: '2025-12-20'
    },
    {
        id: '3',
        title: 'Profile Analyzer',
        description: 'Added LinkedIn and Portfolio audit tools for narrative sync.',
        type: 'feature',
        date: '2025-12-19'
    },
    {
        id: '4',
        title: 'Negotiation Suite',
        description: 'Real-time coaching for salary discussions and offer handling.',
        type: 'feature',
        date: '2025-12-18'
    }
]

export function WhatIsNew() {
    return (
        <div className="sidebar-card">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-accent" />
                <h3 className="sidebar-card-title m-0">What's New</h3>
            </div>

            {/* Poetic moment: Feature discovery */}
            <div className="mb-4 p-3 rounded-lg bg-ivory/30 dark:bg-ink/30 border border-emerald/10">
                <PoeticVerseMinimal verse={getPoeticVerse('feature-discovery')} />
            </div>

            <div className="updates-list">
                {UPDATES.map((u) => (
                    <div key={u.id} className="update-item group">
                        <div className="update-header">
                            <span className={`update-badge update-badge--${u.type}`}>
                                {u.type === 'feature' ? <Zap size={8} /> : <CheckCircle2 size={8} />}
                                {u.type}
                            </span>
                            <span className="update-date">{u.date}</span>
                        </div>
                        <h4 className="update-title">{u.title}</h4>
                        <p className="update-description">{u.description}</p>
                    </div>
                ))}
            </div>

            <style>{`
                .updates-list {
                    display: grid;
                    gap: 16px;
                }
                .update-item {
                    border-bottom: 1px solid var(--border-subtle);
                    padding-bottom: 12px;
                }
                .update-item:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }
                .update-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }
                .update-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 8px;

                    font-weight: 700;
                    letter-spacing: 0.5px;
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                .update-badge--feature {
                    background: var(--surface-primary, rgba(99, 102, 241, 0.1));
                    color: var(--accent-primary, #6366f1);
                }
                .update-badge--improvement {
                    background: var(--surface-success, rgba(34, 197, 94, 0.1));
                    color: var(--accent-success, #22c55e);
                }
                .update-date {
                    font-size: 10px;
                    color: var(--text-muted);
                }
                .update-title {
                    font-size: 13px;
                    font-weight: 600;
                    margin: 0 0 4px;
                    color: var(--text-primary);
                }
                .update-description {
                    font-size: 12px;
                    color: var(--text-secondary);
                    margin: 0;
                    line-height: 1.4;
                }
            `}</style>
        </div>
    )
}

export default WhatIsNew
