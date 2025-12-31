/**
 * =============================================================================
 * WhatIsNew Component
 * =============================================================================
 * Surfaces platform momentum to users and investors.
 * Part of Phase 4: Retention & Transparency.
 * =============================================================================
 */

import React from 'react'
import { Sparkles } from 'lucide-react'

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

            <div className="updates-list">
                {UPDATES.map((u) => (
                    <div key={u.id} className="update-item group">
                        <div className="update-header">
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
