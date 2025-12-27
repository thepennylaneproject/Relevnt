import React from 'react'
import { Link } from 'react-router-dom'
import { useMarketTrends } from '../../hooks/useMarketTrends'
import { Icon } from '../ui/Icon'

export function SkillsTrajectoryCard() {
    const { trends, loading, error } = useMarketTrends()

    if (loading) {
        return (
            <div className="surface-card p-6 rounded-2xl animate-pulse">
                <div className="h-6 w-48 bg-surface-accent rounded mb-4" />
                <div className="space-y-3">
                    <div className="h-4 w-full bg-surface-accent rounded" />
                    <div className="h-4 w-3/4 bg-surface-accent rounded" />
                </div>
            </div>
        )
    }

    if (error || !trends || (trends.topSkills.length === 0 && trends.skillGaps.length === 0)) {
        return null // Hide if no data or error
    }

    const { topSkills, skillGaps, targetTitles } = trends

    return (
        <section className="surface-card p-6 rounded-2xl border border-border/50 hover:border-border transition-colors">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Icon name="lighthouse" size="sm" className="text-accent" />
                        Skills Trajectory
                    </h2>
                    <p className="text-xs muted pr-4">
                        Based on {trends.totalJobsAnalyzed} recent openings for {targetTitles[0] || 'your roles'}.
                    </p>
                </div>
                <Link to="/learn" className="text-xs font-bold text-accent hover:underline shrink-0">
                    View Market Pulse
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* IN-DEMAND SKILLS */}
                <div>
                    <h3 className="text-xs font-bold tracking-wider muted mb-4">Top Skills in Demand</h3>
                    <div className="space-y-4">
                        {topSkills.slice(0, 5).map((item) => (
                            <div key={item.skill} className="group">
                                <div className="flex justify-between items-center mb-1 text-sm font-medium">
                                    <span className="capitalize">{item.skill}</span>
                                    <span className="text-xs muted">{item.demandScore}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-surface-accent rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent transition-all duration-1000"
                                        style={{ width: `${item.demandScore}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SKILL GAPS */}
                <div>
                    <h3 className="text-xs font-bold tracking-wider muted mb-4">Trending Gaps</h3>
                    <div className="space-y-3">
                        {skillGaps.length > 0 ? (
                            skillGaps.map((item) => (
                                <div
                                    key={item.skill}
                                    className="p-3 bg-surface-accent/50 border border-border/30 rounded-xl flex items-center justify-between group hover:border-accent/30 transition-colors"
                                >
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold capitalize truncate">
                                            {item.skill}
                                        </div>
                                        <div className="text-[10px] muted">
                                            Found in {item.demandScore}% of relevant jobs
                                        </div>
                                    </div>
                                    <Link
                                        to={`/learn?skill=${item.skill}`}
                                        className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-muted group-hover:text-accent group-hover:bg-accent/10 transition-all"
                                    >
                                        <Icon name="plus" size="sm" />
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                                <Icon name="check" size="md" className="text-success mb-2" />
                                <p className="text-xs muted">You have all the top-trending skills for these roles!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {skillGaps.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border/30 flex items-center gap-4 bg-accent/5 -mx-6 -mb-6 p-4 rounded-b-2xl">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                        <Icon name="stars" size="sm" className="text-accent" />
                    </div>
                    <div>
                        <p className="text-xs font-bold">Proactive Insight</p>
                        <p className="text-[11px] muted leading-relaxed">
                            Adding <strong>{skillGaps[0].skill}</strong> to your profile could increase your match rate by up to {Math.round(skillGaps[0].demandScore / 2)}%.
                        </p>
                    </div>
                </div>
            )}
        </section>
    )
}
