import React, { useState, useEffect, useCallback } from 'react'
import { Icon } from '../ui/Icon'
import { supabase } from '../../lib/supabase'
import { type Application } from '../../hooks/useApplications'
import { useAuth } from '../../hooks/useAuth'
import { useJobPreferences } from '../../hooks/useJobPreferences'
import { useToast } from '../ui/Toast'
import { Button } from '../ui/Button'

// =============================================================================
// ACTION TYPE DETECTION
// =============================================================================

type SuggestionAction = {
    type: 'remote' | 'skill' | 'learning' | 'networking' | 'none'
    label: string
    data?: string
}

function parseActionType(suggestion: string): SuggestionAction {
    const lowerSuggestion = suggestion.toLowerCase()
    
    // Remote work patterns
    if (lowerSuggestion.includes('remote') || lowerSuggestion.includes('work from home')) {
        return { type: 'remote', label: 'Prioritize Remote Jobs' }
    }
    
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
    application: Application
}

export function RejectionCoaching({ application }: RejectionCoachingProps) {
    // Local state for the analysis result
    // We try to use what's in the application record first
    const [coaching, setCoaching] = useState<any>(application.rejection_analysis || null)
    const [rejectionText, setRejectionText] = useState('')
    const [loading, setLoading] = useState(false)
    const [appliedActions, setAppliedActions] = useState<Set<number>>(new Set())
    
    // Hooks for taking action
    const { setField, save } = useJobPreferences()
    const { showToast } = useToast()

    useEffect(() => {
        if (application.rejection_analysis) {
            setCoaching(application.rejection_analysis)
        }
    }, [application.rejection_analysis])
    
    // Action handlers
    const handleAction = useCallback(async (action: SuggestionAction, index: number) => {
        try {
            switch (action.type) {
                case 'remote':
                    setField('remote_preference', 'remote')
                    await save()
                    showToast('Now prioritizing remote opportunities', 'success')
                    break
                    
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
    }, [setField, save, showToast])

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
                    applicationId: application.id,
                    rejectionText: rejectionText
                })
            })

            if (!response.ok) {
                throw new Error('Analysis failed')
            }

            const data = await response.json()
            setCoaching(data)
        } catch (err) {
            console.error('Failed to start coaching:', err)
        } finally {
            setLoading(false)
        }
    }

    // Existing "mock" data had { analysis, missingSkills, nextSteps }
    // Our new structure is { reason, tone, suggestions, silver_lining }
    // We map the UI to the new structure

    return (
        <div className="rejection-coaching p-4 surface-accent rounded-xl border border-danger/10">
            {!coaching && !loading && (
                <div className="text-center py-6">
                    <h3 className="text-sm font-bold">The "All Clear" Briefing</h3>
                    <p className="muted text-xs max-w-sm mx-auto mt-2">
                        Paste the rejection email below. We'll extract the signal from the noise and help you pivot.
                    </p>

                    <textarea
                        className="w-full mt-4 p-3 text-xs bg-surface border border-border rounded-md min-h-[100px] mb-2"
                        placeholder="Paste email content here..."
                        value={rejectionText}
                        onChange={(e) => setRejectionText(e.target.value)}
                    />

                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="mt-2 w-full justify-center"
                        onClick={handleStartCoaching}
                        disabled={!rejectionText.trim()}
                    >
                        Analyze & Debrief
                    </Button>
                </div>
            )}

            {loading && (
                <div className="text-center py-8">
                    <div className="loading-spinner mx-auto mb-4 border-danger/30 border-t-danger" />
                    <p className="text-xs muted animate-pulse">Analyzing the gap...</p>
                </div>
            )}

            {coaching && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-2 mb-2 p-3 bg-surface rounded-lg border border-border">
                        <Icon name="stars" size="sm" className="text-accent" />
                        <div className="flex-1">
                            <h3 className="text-sm font-bold">Operational De-brief</h3>
                            {coaching.reason && <p className="text-xs muted">Reason: {coaching.reason}</p>}
                        </div>
                    </div>

                    {coaching.silver_lining && (
                        <div className="p-3 bg-success/5 border border-success/10 rounded-lg">
                            <p className="text-xs font-semibold text-success-text">
                                "{coaching.silver_lining}"
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-accent">Strategic Adjustments</label>
                            <ul className="space-y-2">
                                {(coaching.suggestions || []).map((step: string, i: number) => {
                                    const action = parseActionType(step)
                                    const isApplied = appliedActions.has(i)
                                    
                                    return (
                                        <li key={i} className="text-xs bg-surface p-3 rounded border border-subtle">
                                            <div className="flex items-start gap-2">
                                                <Icon name="check" size="sm" className="text-accent mt-0.5 shrink-0" />
                                                <span className="flex-1">{step}</span>
                                            </div>
                                            {action.type !== 'none' && (
                                                <button
                                                    onClick={() => handleAction(action, i)}
                                                    disabled={isApplied}
                                                    className={`mt-2 w-full text-[11px] py-1.5 px-3 rounded flex items-center justify-center gap-1 transition-colors ${
                                                        isApplied 
                                                            ? 'bg-success/10 text-success-text cursor-default'
                                                            : 'bg-accent/10 text-accent hover:bg-accent/20'
                                                    }`}
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
                </div>
            )}
        </div>
    )
}
