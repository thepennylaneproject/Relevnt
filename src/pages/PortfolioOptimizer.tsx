
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import type { PortfolioAnalysisRow, PortfolioAnalysis } from '../shared/types'
import '../styles/portfolio-optimizer.css'

export default function PortfolioOptimizer() {
    const { user } = useAuth()
    const [portfolioUrl, setPortfolioUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [analysis, setAnalysis] = useState<PortfolioAnalysisRow | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (user) {
            fetchLatestAnalysis()
        }
    }, [user])

    const fetchLatestAnalysis = async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('portfolio_analyses')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                setAnalysis(data as any as PortfolioAnalysisRow)
                setPortfolioUrl(data.portfolio_url)
            }
        } catch (err) {
            console.warn('No existing portfolio analysis found')
        } finally {
            setLoading(false)
        }
    }

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!portfolioUrl) return

        setAnalyzing(true)
        setError(null)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const response = await fetch('/.netlify/functions/portfolio_analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ portfolioUrl })
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.error || 'Failed to analyze portfolio')
            }

            const result = await response.json()
            setAnalysis(result.data.analysis)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setAnalyzing(false)
        }
    }

    if (loading) {
        return <div className="portfolio-optimizer__loading">Loading your analysis…</div>
    }

    const results = analysis?.analysis_results

    return (
        <div className="portfolio-optimizer">
            <header className="portfolio-optimizer__header">
                <div className="portfolio-optimizer__title-row">
                    <Icon name="lighthouse" size="lg" />
                    <h1>Portfolio Optimizer</h1>
                </div>
                <p className="portfolio-optimizer__subtitle">
                    Get an AI-powered critique of your personal portfolio, focusing on visual impact, usability, and content strategy.
                </p>
            </header>

            <div className="portfolio-optimizer__content">
                <section className="portfolio-optimizer__input-section">
                    <form className="portfolio-optimizer__form" onSubmit={handleAnalyze}>
                        <div className="portfolio-optimizer__input-group">
                            <label htmlFor="portfolio-url">Portfolio URL</label>
                            <input
                                id="portfolio-url"
                                type="url"
                                placeholder="https://yourname.com or https://behance.net/you"
                                value={portfolioUrl}
                                onChange={(e) => setPortfolioUrl(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                className="portfolio-optimizer__button"
                                disabled={analyzing}
                            >
                                {analyzing ? 'Evaluating…' : results ? 'Re-evaluate Portfolio' : 'Evaluate Portfolio'}
                            </button>
                        </div>
                        {error && <p className="portfolio-optimizer__error">{error}</p>}
                    </form>
                </section>

                {analyzing && (
                    <div className="portfolio-optimizer__analysis-loading">
                        <div className="wave-loader">
                            <span></span><span></span><span></span>
                        </div>
                        <p>Scanning your portfolio and assessing visual narratives...</p>
                    </div>
                )}

                {results && !analyzing && (
                    <div className="portfolio-optimizer__results animate-fade-in">
                        <div className="portfolio-optimizer__main-stats">
                            <div className="overall-score-large">
                                <span className="label">Overall Impact</span>
                                <span className="value">{results.overall_score}</span>
                            </div>
                            <div className="seniority-badge">
                                <span className="label">Perceived Seniority</span>
                                <span className="value">{results.perceived_seniority}</span>
                            </div>
                        </div>

                        <div className="portfolio-optimizer__scores">
                            <MetricBox label="Visual" score={results.visual_score} icon="stars" />
                            <MetricBox label="Usability" score={results.usability_score} icon="compass" />
                            <MetricBox label="Content" score={results.content_score} icon="book" />
                        </div>

                        <div className="portfolio-optimizer__suggestions">
                            <h2>Strategic Improvements</h2>
                            <div className="portfolio-suggestions-list">
                                {results.suggestions.map((s, i) => (
                                    <div key={i} className={`portfolio-suggestion-card impact--${s.impact}`}>
                                        <div className="card-header">
                                            <span className="category">{s.category}</span>
                                            <span className="impact-tag">{s.impact} impact</span>
                                        </div>
                                        <p className="improvement">{s.improvement}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {results.suggested_tagline && (
                            <div className="portfolio-optimizer__tagline">
                                <h2>Suggested Narrative Tagline</h2>
                                <div className="tagline-box">
                                    "{results.suggested_tagline}"
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function MetricBox({ label, score, icon }: { label: string, score: number, icon: any }) {
    return (
        <div className="metric-box">
            <Icon name={icon} size="sm" hideAccent />
            <div className="metric-box__data">
                <span className="metric-label">{label}</span>
                <div className="metric-progress-container">
                    <div className="metric-progress-bar" style={{ width: `${score}%` }}></div>
                    <span className="metric-value">{score}</span>
                </div>
            </div>
        </div>
    )
}
