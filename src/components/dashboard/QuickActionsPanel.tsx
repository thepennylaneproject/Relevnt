/**
 * Quick Actions Panel
 * 
 * Surfaces powerful but buried features on the Dashboard.
 * Helps users discover AI-powered capabilities they might miss.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, IconName } from '../ui/Icon'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface QuickAction {
    id: string
    title: string
    description: string
    icon: IconName
    route: string
    badge?: 'new' | 'ai'
}

const QUICK_ACTIONS: QuickAction[] = [
    {
        id: 'interview-prep',
        title: 'Practice interviews',
        description: 'Practice with AI-generated questions tailored to your target role',
        icon: 'microphone',
        route: '/interview-prep',
        badge: 'ai',
    },
    {
        id: 'profile-analyzer',
        title: 'Profile Analyzer',
        description: "Get AI-powered feedback on your LinkedIn profile and portfolio's impact",
        icon: 'stars',
        route: '/profile-analyzer',
        badge: 'ai',
    },
    {
        id: 'resume-builder',
        title: 'Build a resume',
        description: 'ATS-optimized builder with real-time scoring and AI suggestions',
        icon: 'scroll',
        route: '/resumes',
    },
    {
        id: 'auto-apply',
        title: 'Auto-Apply',
        description: 'Let AI submit applications for you — save 2–3 hours per week',
        icon: 'paper-airplane',
        route: '/settings#auto-apply',
        badge: 'ai',
    },
]

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function QuickActionsPanel(): JSX.Element {
    const navigate = useNavigate()

    return (
        <section className="quick-actions-panel">
            <h2 className="section-title mb-6">
                <Icon name="stars" size="sm" className="text-accent" />
                Strategic Actions
            </h2>

            <div className="quick-actions-grid">
                {QUICK_ACTIONS.map(action => (
                    <div
                        key={action.id}
                        className="card quick-action-card flex flex-col h-full"
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 flex items-center justify-center bg-bg-tertiary rounded-lg shrink-0">
                                <Icon name={action.icon} size="md" className="text-accent" />
                            </div>
                            <div className="flex-1 min-width-0">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                    {action.title}
                                    {action.badge === 'new' && (
                                        <span className="text-[9px] font-bold tracking-widest bg-accent/20 text-accent px-1.5 py-0.5 rounded">New</span>
                                    )}
                                    {action.badge === 'ai' && (
                                        <span className="text-[9px] font-bold tracking-widest bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">AI</span>
                                    )}
                                </h4>
                                <p className="text-xs text-secondary mt-1 leading-relaxed">{action.description}</p>
                            </div>
                        </div>
                        <div className="mt-auto pt-4 border-t border-border">
                            <button 
                                onClick={() => navigate(action.route)}
                                className="btn btn-secondary w-full text-xs py-2 btn-with-icon"
                            >
                                Launch Action
                                <Icon name="chevron-right" size="sm" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <style>{quickActionsStyles}</style>
        </section>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════

const quickActionsStyles = `
.quick-actions-panel {
  margin-top: 3rem;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.quick-action-card {
  transition: all 0.2s ease;
  border-left: 4px solid var(--color-accent);
}

.quick-action-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
`

export default QuickActionsPanel
