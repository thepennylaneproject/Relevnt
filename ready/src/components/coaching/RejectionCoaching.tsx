/**
 * RejectionCoaching - Ready App
 * 
 * Standalone rejection analysis without application dependency.
 * Paste rejection text, get actionable coaching.
 */

import React, { useState, useCallback } from 'react'
import { Icon } from '../ui/Icon'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/Toast'
import { Button } from '../ui/Button'

// =============================================================================
// ACTION TYPE DETECTION
// =============================================================================

type SuggestionAction = {
    type: 'skill' | 'learning' | 'networking' | 'none'
    label: string
    data?: string
}

function parseActionType(suggestion: string): SuggestionAction {
    const lowerSuggestion = suggestion.toLowerCase()
    
    // Skill/learning patterns
    const skillPatterns = [
        /(?:learn|build|develop|improve|strengthen|emphasiz[e|ing])\s+(?:your\s+)?([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
        /(?:more\s+)?([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(?:experience|skills?|projects?)/i,
    ]
    
    for (const pattern of skillPatterns) {
        const match = suggestion.match(pattern)
        if (match && match[1]) {
            const skill = match[1].trim()
            // Filter out common non-skill words
            if (!['your', 'the', 'more', 'some', 'any'].includes(skill.toLowerCase())) {
                return { type: 'learning', label: `Find ${skill} courses`, data: skill }
            }
        }
    }
    
    // Networking patterns
    if (lowerSuggestion.includes('network') || lowerSuggestion.includes('connect') || lowerSuggestion.includes('reach out')) {
        return { type: 'networking', label: 'Draft outreach message' }
    }
    
    return { type: 'none', label: '' }
}

interface RejectionCoachingProps {
    onComplete?: (coaching: any) => void
}

export function RejectionCoaching({ onComplete }: RejectionCoachingProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    
    const [coaching, setCoaching] = useState<any>(null)
    const [rejectionText, setRejectionText] = useState('')
    const [roleContext, setRoleContext] = useState('')
    const [loading, setLoading] = useState(false)
    const [appliedActions, setAppliedActions] = useState<Set<number>>(new Set())
    
    // Action handlers
    const handleAction = useCallback(async (action: SuggestionAction, index: number) => {
        try {
            switch (action.type) {
                case 'learning':
                    // Open Coursera search for the skill
                    const searchQuery = encodeURIComponent(action.data || 'professional skills')
                    window.open(`https://www.coursera.org/search?query=${searchQuery}`, '_blank')
                    showToast(`Opened courses for ${action.data}`, 'info')
                    break
                    
                case 'networking':
                    showToast('Networking feature coming soon!', 'info')
                    break
            }
            
            setAppliedActions(prev => new Set(prev).add(index))
        } catch (err) {
            showToast('Failed to apply action', 'error')
        }
    }, [showToast])

    const handleStartCoaching = async () => {
        if (!rejectionText.trim()) return

        setLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const response = await fetch('/.netlify/functions/analyze_rejection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    rejectionText: rejectionText,
                    roleContext: roleContext
                })
            })

            if (!response.ok) {
                throw new Error('Analysis failed')
            }

            const data = await response.json()
            setCoaching(data)
            
            // Save to database if user is logged in
            if (user?.id) {
                await supabase.from('rejection_analyses').insert({
                    user_id: user.id,
                    rejection_text: rejectionText,
                    role_context: roleContext,
                    analysis: data
                })
            }
            
            onComplete?.(data)
        } catch (err) {
            console.error('Failed to start coaching:', err)
            showToast('Analysis failed. Please try again.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setCoaching(null)
        setRejectionText('')
        setRoleContext('')
        setAppliedActions(new Set())
    }

    return (
        <div className="rejection-coaching surface-card p-6 rounded-xl">
            {!coaching && !loading && (
                <div className="coaching-form">
                    <div className="form-header">
                        <Icon name="alert-triangle" size="md" />
                        <div>
                            <h3 className="text-lg font-bold">Rejection Debrief</h3>
                            <p className="text-sm text-muted">
                                Paste the rejection email. We'll extract the signal and help you pivot.
                            </p>
                        </div>
                    </div>

                    <div className="input-group mt-4">
                        <label>Role Context (Optional)</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Senior Product Manager at Stripe"
                            value={roleContext}
                            onChange={(e) => setRoleContext(e.target.value)}
                        />
                    </div>

                    <div className="input-group mt-4">
                        <label>Rejection Email</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Paste the rejection email here..."
                            value={rejectionText}
                            onChange={(e) => setRejectionText(e.target.value)}
                            rows={6}
                        />
                    </div>

                    <Button
                        type="button"
                        variant="primary"
                        className="mt-4 w-full"
                        onClick={handleStartCoaching}
                        disabled={!rejectionText.trim()}
                    >
                        Analyze & Debrief
                    </Button>
                </div>
            )}

            {loading && (
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <p className="text-sm text-muted">Analyzing the gap...</p>
                </div>
            )}

            {coaching && (
                <div className="coaching-results">
                    <div className="results-header">
                        <Icon name="stars" size="md" className="text-accent" />
                        <div className="flex-1">
                            <h3 className="font-bold">Operational Debrief</h3>
                            {coaching.reason && <p className="text-sm text-muted">Reason: {coaching.reason}</p>}
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                            New Analysis
                        </Button>
                    </div>

                    {coaching.silver_lining && (
                        <div className="silver-lining">
                            <p className="text-sm font-semibold">"{coaching.silver_lining}"</p>
                        </div>
                    )}

                    <div className="suggestions-section">
                        <label className="section-label">Strategic Adjustments</label>
                        <ul className="suggestions-list">
                            {(coaching.suggestions || []).map((step: string, i: number) => {
                                const action = parseActionType(step)
                                const isApplied = appliedActions.has(i)
                                
                                return (
                                    <li key={i} className="suggestion-item">
                                        <div className="suggestion-content">
                                            <Icon name="check" size="sm" className="text-accent" />
                                            <span>{step}</span>
                                        </div>
                                        {action.type !== 'none' && (
                                            <button
                                                onClick={() => handleAction(action, i)}
                                                disabled={isApplied}
                                                className={`action-button ${isApplied ? 'applied' : ''}`}
                                            >
                                                {isApplied ? (
                                                    <>
                                                        <Icon name="check" size="sm" />
                                                        Applied
                                                    </>
                                                ) : (
                                                    <>
                                                        {action.label}
                                                        <Icon name="chevron-right" size="sm" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            )}

            <style>{rejectionCoachingStyles}</style>
        </div>
    )
}

const rejectionCoachingStyles = `
.rejection-coaching {
  border: 1px solid var(--border-subtle);
}

.form-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.input-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text);
  font-size: 0.875rem;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  gap: 1rem;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.coaching-results {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.results-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.silver-lining {
  padding: 1rem;
  background: rgba(168, 213, 186, 0.1);
  border: 1px solid rgba(168, 213, 186, 0.2);
  border-radius: var(--radius-md);
  color: #A8D5BA;
}

.section-label {
  display: block;
  font-size: 0.625rem;
  font-weight: 700;
  color: var(--color-accent);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.suggestion-item {
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.suggestion-content {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-top: 0.75rem;
  width: 100%;
  padding: 0.5rem 1rem;
  font-size: 0.6875rem;
  font-weight: 600;
  background: rgba(212, 165, 116, 0.1);
  color: var(--color-accent);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s;
}

.action-button:hover:not(.applied) {
  background: rgba(212, 165, 116, 0.2);
}

.action-button.applied {
  background: rgba(168, 213, 186, 0.1);
  color: #A8D5BA;
  cursor: default;
}
`;
