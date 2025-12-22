import React, { useState, useEffect } from 'react'
import { Icon } from '../ui/Icon'
import { supabase } from '../../lib/supabase'
import { type Application } from '../../hooks/useApplications'
import { useAuth } from '../../hooks/useAuth'

interface RejectionCoachingProps {
    application: Application
}

export function RejectionCoaching({ application }: RejectionCoachingProps) {
    // Local state for the analysis result
    // We try to use what's in the application record first
    const [coaching, setCoaching] = useState<any>(application.rejection_analysis || null)
    const [rejectionText, setRejectionText] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (application.rejection_analysis) {
            setCoaching(application.rejection_analysis)
        }
    }, [application.rejection_analysis])

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
                    <div className="dashboard-hero-icon mx-auto mb-4 bg-danger/10 text-danger">
                        <Icon name="compass-cracked" size="md" />
                    </div>
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

                    <button
                        onClick={handleStartCoaching}
                        disabled={!rejectionText.trim()}
                        className="primary-button button-sm mt-2 bg-danger text-white border-none w-full justify-center"
                    >
                        Analyze & Debrief
                    </button>
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
                        {coaching.tone && (
                            <span className="text-[10px] uppercase font-bold px-2 py-1 bg-surface-accent rounded text-muted">
                                {coaching.tone} Logic
                            </span>
                        )}
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
                            <label className="text-[10px] uppercase font-bold text-accent">Strategic Adjustments</label>
                            <ul className="space-y-2">
                                {(coaching.suggestions || []).map((step: string, i: number) => (
                                    <li key={i} className="text-xs flex items-start gap-2 bg-surface p-2 rounded border border-subtle">
                                        <Icon name="check" size="sm" className="text-accent mt-0.5 shrink-0" />
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
