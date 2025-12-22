import React from 'react'
import { Link } from 'react-router-dom'
import { useApplicationPerformance } from '../../hooks/useApplicationPerformance'
import { Icon } from '../ui/Icon'

export function ApplicationPerformanceInsights() {
    const { performance, loading, error } = useApplicationPerformance()

    if (loading) {
        return (
            <div className="surface-card p-6 rounded-2xl animate-pulse">
                <div className="h-6 w-48 bg-surface-accent rounded mb-4" />
                <div className="h-20 w-full bg-surface-accent rounded" />
            </div>
        )
    }

    if (error || !performance || performance.performanceByResume.length <= 1) {
        return null // Hide if no data, error, or only one resume (nothing to compare)
    }

    const { performanceByResume } = performance
    const topPerformer = performanceByResume[0]
    const others = performanceByResume.slice(1)

    return (
        <section className="surface-card p-6 rounded-2xl border border-border/50 hover:border-border transition-colors">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Icon name="stars" size="sm" className="text-accent" />
                        Operational Reality
                    </h2>
                    <p className="text-xs muted pr-4">
                        Analyzing interview conversion rates across your {performanceByResume.length} resume versions.
                    </p>
                </div>
                <Link to="/applications" className="text-xs font-bold text-accent hover:underline shrink-0">
                    View Pipeline
                </Link>
            </div>

            <div className="space-y-6">
                {/* TOP PERFORMER */}
                <div className="p-4 bg-accent/5 rounded-xl border border-accent/20">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Top Performing Version</span>
                        <span className="text-xs font-bold text-accent">
                            {topPerformer.interviewRate}% Interview Rate
                        </span>
                    </div>
                    <h3 className="text-md font-bold truncate mb-1">“{topPerformer.resumeName}”</h3>
                    <div className="flex gap-4 text-xs muted">
                        <span>{topPerformer.total} Applied</span>
                        <span>{topPerformer.interviews} Interviews</span>
                    </div>
                </div>

                {/* COMPARISON */}
                {others.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider muted">Other Versions</h3>
                        {others.slice(0, 2).map((item) => {
                            const diff = topPerformer.interviewRate - item.interviewRate
                            return (
                                <div key={item.resumeId} className="flex items-center justify-between py-1">
                                    <div className="min-w-0 flex-1 pr-4">
                                        <div className="text-sm font-medium truncate">{item.resumeName}</div>
                                        <div className="text-[10px] muted">
                                            {item.interviewRate}% interview rate • {item.total} apps
                                        </div>
                                    </div>
                                    {diff > 0 && (
                                        <div className="text-[10px] bg-danger/10 text-danger px-1.5 py-0.5 rounded font-bold">
                                            -{diff}% vs top
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                <div className="pt-4 border-t border-border/30">
                    <p className="text-[11px] leading-relaxed italic muted">
                        <Icon name="lighthouse" size="sm" className="inline mr-1" />
                        Winning Strategy: Your <strong>{topPerformer.resumeName}</strong> version has a significantly higher conversion rate. Consider migrating your and archived applications to its format.
                    </p>
                </div>
            </div>
        </section>
    )
}
