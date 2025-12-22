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
        description: 'AI-generated questions tailored to your target role',
        icon: 'microphone',
        route: '/interview-prep',
        badge: 'ai',
    },
    {
        id: 'linkedin',
        title: 'Optimize LinkedIn',
        description: 'Get AI feedback on your profile\'s impact',
        icon: 'lighthouse',
        route: '/linkedin-optimizer',
        badge: 'ai',
    },
    {
        id: 'resume-builder',
        title: 'Build a resume',
        description: 'ATS-optimized builder with real-time scoring',
        icon: 'scroll',
        route: '/resumes/builder',
    },
    {
        id: 'auto-apply',
        title: 'Auto-Apply (Pro)',
        description: 'Save 2–3 hours/week by automating applications',
        icon: 'paper-airplane',
        route: '/settings#auto-apply',
        badge: 'new',
    },
    {
        id: 'offer-compare',
        title: 'Compare offers',
        description: 'Side-by-side analysis of compensation packages',
        icon: 'dollar',
        route: '/offers/compare',
    },
]

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function QuickActionsPanel(): JSX.Element {
    const navigate = useNavigate()

    return (
        <section className="quick-actions-panel">
            <h3 className="quick-actions-title">
                <Icon name="stars" size="sm" />
                Quick actions
            </h3>

            <div className="quick-actions-grid">
                {QUICK_ACTIONS.map(action => (
                    <button
                        key={action.id}
                        type="button"
                        className="quick-action-card"
                        onClick={() => navigate(action.route)}
                    >
                        <div className="quick-action-icon">
                            <Icon name={action.icon} size="md" />
                        </div>
                        <div className="quick-action-content">
                            <span className="quick-action-label">
                                {action.title}
                                {action.badge && (
                                    <span className={`quick-action-badge quick-action-badge--${action.badge}`}>
                                        {action.badge === 'ai' ? 'AI' : 'New'}
                                    </span>
                                )}
                            </span>
                            <span className="quick-action-desc">{action.description}</span>
                        </div>
                        <Icon name="paper-airplane" size="sm" className="quick-action-arrow" />
                    </button>
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
  margin-top: 24px;
}

.quick-actions-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink, #1a1a1a);
  margin: 0 0 16px;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.quick-action-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e5e5);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.quick-action-card:hover {
  border-color: var(--color-accent, #6366f1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.quick-action-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg, #f9fafb);
  border-radius: 10px;
  flex-shrink: 0;
}

.quick-action-content {
  flex: 1;
  min-width: 0;
}

.quick-action-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-ink, #1a1a1a);
}

.quick-action-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
}

.quick-action-badge--ai {
  background: linear-gradient(135deg, #818cf8, #6366f1);
  color: white;
}

.quick-action-badge--new {
  background: var(--color-success, #22c55e);
  color: white;
}

.quick-action-desc {
  display: block;
  font-size: 12px;
  color: var(--color-ink-tertiary, #888);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-action-arrow {
  opacity: 0.4;
  transition: opacity 0.15s, transform 0.15s;
}

.quick-action-card:hover .quick-action-arrow {
  opacity: 1;
  transform: translateX(2px);
}
`

export default QuickActionsPanel
