import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Icon } from '../components/ui/Icon'
import { Container } from '../components/shared/Container'
import PageBackground from '../components/shared/PageBackground'
import type { LinkedInAnalysis, PortfolioAnalysis } from '../shared/types'
import '../styles/linkedin-optimizer.css'
import '../styles/portfolio-optimizer.css'

export default function SharedAuditPage() {
    const { type, token } = useParams<{ type?: string, token?: string }>()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [auditData, setAuditData] = useState<any>(null)

    useEffect(() => {
        if (type && token) {
            fetchSharedAudit()
        }
    }, [type, token])

    const fetchSharedAudit = async () => {
        setLoading(true)
        setError(null)
        try {
            const table = type === 'linkedin' ? 'linkedin_profiles' : 'portfolio_analyses'
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('share_token', token!)
                .eq('is_public', true)
                .maybeSingle()

            if (error) throw error
            if (!data) {
                setError('This audit is not public or does not exist.')
                return
            }

            setAuditData(data)
        } catch (err: any) {
            console.error('Error fetching shared audit:', err)
            setError('Failed to load audit results.')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <PageBackground>
                <Container maxWidth="md" padding="lg">
                    <div className="flex flex-col items-center justify-center min-h-[50vh]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                        <p className="mt-4 muted">Loading career audit...</p>
                    </div>
                </Container>
            </PageBackground>
        )
    }

    if (error || !auditData) {
        return (
            <PageBackground>
                <Container maxWidth="md" padding="lg">
                    <div className="surface-card p-12 text-center">
                        <Icon name="alert-triangle" size="lg" className="mx-auto text-amber-500 mb-4" />
                        <h1 className="text-2xl font-display mb-2">Audit Not Available</h1>
                        <p className="muted mb-8">{error || 'This audit could not be found.'}</p>
                        <Link to="/" className="btn btn--primary">
                            Create Your Own Career Audit
                        </Link>
                    </div>
                </Container>
            </PageBackground>
        )
    }

    const results = auditData.analysis_results

    return (
        <PageBackground>
            <Container maxWidth="xl" padding="md">
                <div className="profile-analyzer shared-view">
                    <header className="hero-shell mb-8 text-center pt-12 pb-8">
                        <div className="hero-icon mx-auto mb-4">
                            <Icon name="stars" size="lg" />
                        </div>
                        <h1 className="font-display text-5xl mb-3">Career AI Audit</h1>
                        <p className="muted max-w-2xl mx-auto text-lg">
                            Shared career intelligence analysis for {type === 'linkedin' ? 'LinkedIn Profile' : 'Professional Portfolio'}.
                        </p>
                    </header>

                    <div className="max-w-5xl mx-auto">
                        {type === 'linkedin' ? (
                            <LinkedInResults results={results} />
                        ) : (
                            <PortfolioResults results={results} />
                        )}

                        {/* Conversion Hook */}
                        <div className="mt-16 p-12 surface-card text-center border-accent-soft border-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Icon name="stars" size="lg" className="w-32 h-32" />
                            </div>
                            <h2 className="text-3xl font-display mb-4">Ready to optimize your career?</h2>
                            <p className="muted text-lg mb-8 max-w-xl mx-auto">
                                Join Relevnt to get your own AI-powered profile analysis, 
                                interview practice, and smart job matching.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link to="/signup" className="btn btn--primary btn--lg">
                                    Get Started for Free
                                </Link>
                                <Link to="/" className="btn btn--outline btn--lg">
                                    Learn More
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </PageBackground>
    )
}

function LinkedInResults({ results }: { results: LinkedInAnalysis }) {
    return (
        <div className="linkedin-optimizer__results">
            <div className="linkedin-optimizer__scores mb-8">
                <ScoreCard label="Overall" score={results.overall_score} />
                <ScoreCard label="Headline" score={results.headline_score} />
                <ScoreCard label="Summary" score={results.summary_score} />
                <ScoreCard label="Experience" score={results.experience_score} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="surface-card p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Icon name="zap" size="sm" className="text-amber-500" />
                        Key Improvements
                    </h2>
                    <div className="space-y-6">
                        {results.suggestions.map((s, i) => (
                            <div key={i} className="border-l-4 border-amber-500/30 pl-4 py-1">
                                <div className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
                                    {s.section}
                                </div>
                                <p className="font-bold text-lg mb-1">{s.improvement}</p>
                                <p className="text-sm muted">{s.reason}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    {results.optimized_headline && (
                        <div className="surface-card p-6 bg-accent-soft/5 border-accent-soft">
                            <h2 className="text-xl font-bold mb-4">Strategic Headline</h2>
                            <div className="text-lg italic font-display">
                                "{results.optimized_headline}"
                            </div>
                        </div>
                    )}
                    {results.optimized_summary && (
                        <div className="surface-card p-6">
                            <h2 className="text-xl font-bold mb-4">Narrative Strategy</h2>
                            <div className="text-sm leading-relaxed muted whitespace-pre-wrap">
                                {results.optimized_summary}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function PortfolioResults({ results }: { results: PortfolioAnalysis }) {
    return (
        <div className="portfolio-optimizer__results">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="flex-1 surface-card p-8 text-center bg-accent-soft/10">
                    <span className="text-sm muted uppercase tracking-widest font-bold">Overall Impact</span>
                    <div className="text-6xl font-display text-accent mt-2">{results.overall_score}</div>
                </div>
                <div className="flex-1 surface-card p-8 text-center">
                    <span className="text-sm muted uppercase tracking-widest font-bold">Perceived Seniority</span>
                    <div className="text-4xl font-display mt-4">{results.perceived_seniority}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <MetricBox label="Visual" score={results.visual_score} icon="stars" />
                <MetricBox label="Usability" score={results.usability_score} icon="compass" />
                <MetricBox label="Content" score={results.content_score} icon="book" />
            </div>

            <div className="surface-card p-8">
                <h2 className="text-xl font-bold mb-6">Strategic Improvements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.suggestions.map((s, i) => (
                        <div key={i} className={`p-4 rounded-xl border-l-4 ${
                            s.impact === 'high' ? 'border-red-500 bg-red-500/5' : 
                            s.impact === 'medium' ? 'border-amber-500 bg-amber-500/5' : 
                            'border-slate-500 bg-slate-500/5'
                        }`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider">{s.category}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 font-bold uppercase">
                                    {s.impact} Impact
                                </span>
                            </div>
                            <p className="font-medium">{s.improvement}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Reused UI Components
function ScoreCard({ label, score }: { label: string, score: number }) {
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-emerald-500'
        if (s >= 60) return 'text-amber-500'
        return 'text-rose-500'
    }

    return (
        <div className="surface-card p-4 text-center">
            <div className={`text-3xl font-display ${getScoreColor(score)}`}>{score}</div>
            <div className="text-xs muted font-bold uppercase mt-1">{label}</div>
            <div className="h-1.5 bg-border-subtle rounded-full mt-3 overflow-hidden">
                <div 
                    className={`h-full opacity-50 ${
                        score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`} 
                    style={{ width: `${score}%` }}
                ></div>
            </div>
        </div>
    )
}

function MetricBox({ label, score, icon }: { label: string, score: number, icon: any }) {
    return (
        <div className="surface-card p-4 flex items-center gap-4">
            <Icon name={icon} size="sm" className="text-accent" />
            <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                    <span className="text-sm font-bold">{score}</span>
                </div>
                <div className="h-1 bg-border-subtle rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${score}%` }}></div>
                </div>
            </div>
        </div>
    )
}
