import React from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { useNotifications } from '../../hooks/useNotifications'

export function OpportunityAlerts() {
    const { notifications, markAsRead } = useNotifications()

    // Filter for unread job alerts with metadata
    const alerts = notifications.filter(n =>
        !n.is_read &&
        n.type === 'job_alert' &&
        n.metadata
    ).slice(0, 3) // Show max 3

    if (alerts.length === 0) return null

    return (
        <div className="space-y-4 mb-8 animate-in fade-in slide-in-from-top-4">
            {alerts.map(alert => {
                const meta = alert.metadata || {}
                const isHighest = meta.isHighestEver
                const isFresh = meta.isFresh

                return (
                    <div
                        key={alert.id}
                        className={`
                            relative p-4 rounded-xl border flex items-center gap-4 shadow-sm transition-all hover:shadow-md
                            ${isHighest ? 'bg-gradient-to-r from-accent/5 to-transparent border-accent/30' : 'bg-surface border-border'}
                        `}
                    >
                        <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center shrink-0
                            ${isHighest ? 'bg-accent/10 text-accent' : 'bg-success/10 text-success'}
                        `}>
                            <Icon name={isHighest ? 'stars' : 'pocket-watch'} size="md" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {isHighest && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded">
                                        Best Match
                                    </span>
                                )}
                                {isFresh && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-success bg-success/10 px-2 py-0.5 rounded">
                                        Just Posted
                                    </span>
                                )}
                                <span className="text-xs muted ml-auto">{new Date(alert.created_at).toLocaleDateString()}</span>
                            </div>

                            <h3 className="font-bold text-sm truncate pr-8">{alert.title}</h3>
                            <p className="text-xs muted truncate">{alert.message}</p>

                            {meta.matchReasons && meta.matchReasons.length > 0 && (
                                <div className="mt-2 flex gap-2">
                                    {meta.matchReasons.map((reason: string, i: number) => (
                                        <span key={i} className="text-[10px] bg-surface-accent px-1.5 py-0.5 rounded text-muted">
                                            {reason}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                            <Link
                                to={alert.link || '/jobs'}
                                onClick={() => markAsRead(alert.id)}
                                className="primary-button button-sm whitespace-nowrap"
                            >
                                View Job
                            </Link>
                            <button
                                onClick={() => markAsRead(alert.id)}
                                className="text-[10px] text-muted hover:text-foreground text-center"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
