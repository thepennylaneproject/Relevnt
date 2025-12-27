
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDailyBriefing } from '../../hooks/useDailyBriefing'
import { Icon } from '../ui/Icon'

export function DailyBriefing() {
    const { topOpportunities, personaName, loading, error, refetch } = useDailyBriefing()
    const [retrying, setRetrying] = useState(false)

    const handleRetry = async () => {
        setRetrying(true)
        try {
            await refetch?.()
        } finally {
            setRetrying(false)
        }
    }

    if (loading) return (
        <div className="daily-briefing-loading p-4 surface-card rounded-xl">
            <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-border-subtle rounded w-3/4"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-border-subtle rounded"></div>
                        <div className="h-4 bg-border-subtle rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        </div>
    )

    if (error) return (
        <div className="briefing-error p-6 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/30 text-center">
            <Icon name="heart" size="lg" className="text-amber-500/60 mb-3" />
            <p className="text-sm text-amber-800 dark:text-amber-300">We couldn't load your matches right now. This is on us, not you.</p>
            <button 
                onClick={handleRetry} 
                disabled={retrying}
                className="mt-4 ghost-button text-xs"
            >
                {retrying ? 'Trying again...' : 'Try again'}
            </button>
        </div>
    )

    if (topOpportunities.length === 0) {
        return (
            <div className="daily-briefing-empty p-6 rounded-xl">
                <h2 className="section-title">Today's matches</h2>
                <p className="text-sm muted">
                    No matches found for <span className="text-foreground font-medium">{personaName || 'your profile'}</span> yet.
                    Make sure your preferences are complete so we can find the right opportunities.
                </p>
                <Link to="/job-preferences" className="ghost-button text-xs mt-4 inline-block">
                    Update your preferences
                </Link>
            </div>
        )
    }

    return (
        <div className="surface-card p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="section-title">Today's matches</h2>
                    <p className="text-xs muted">
                        Top opportunities for <span className="font-semibold text-foreground">{personaName}</span>
                    </p>
                </div>
                <span className="badge badge-success text-[8px] px-2 py-0.5">Verified</span>
            </div>

            <div className="space-y-4">
                {topOpportunities.map((match) => {
                    // Calculate likelihood of response based on match score
                    // Higher match = higher likelihood of response
                    const responseLikelihood = match.match_score >= 85 ? 'High' 
                        : match.match_score >= 70 ? 'Good' 
                        : 'Fair'
                    const likelihoodColor = match.match_score >= 85 ? 'text-success'
                        : match.match_score >= 70 ? 'text-primary'
                        : 'text-warning'
                    
                    return (
                        <div key={match.job.id} className="briefing-item flex justify-between items-start gap-4 p-3 border border-border-subtle rounded-lg hover:border-accent transition-colors">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold truncate">{match.job.title}</h3>
                                    <span className={`text-[10px] font-bold ${likelihoodColor}`}>
                                        {responseLikelihood} response likelihood
                                    </span>
                                </div>
                                <p className="text-xs muted truncate">{match.job.company} • {match.job.location || 'Remote'}</p>
                                <div className="flex gap-2 mt-2">
                                    {match.job.salary_min && (
                                        <span className="text-[9px] muted">
                                            ${(match.job.salary_min / 1000).toFixed(0)}k - ${(match.job.salary_max ? match.job.salary_max / 1000 : 0).toFixed(0)}k
                                        </span>
                                    )}
                                    <span className="text-[9px] muted">• {match.match_score.toFixed(0)}% match</span>
                                </div>
                            </div>
                            <Link to={`/jobs?id=${match.job.id}`} className="primary-button text-[10px] py-1 px-3">
                                View details
                            </Link>
                        </div>
                    )
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle flex justify-between items-center">
                <p className="text-[10px] muted">Last updated 15 minutes ago</p>
                <Link to="/jobs" className="text-[10px] font-bold underline">View all matches</Link>
            </div>
        </div>
    )
}
