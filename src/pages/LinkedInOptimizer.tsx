
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import type { LinkedInProfileRow, LinkedInAnalysis } from '../shared/types'
import '../styles/linkedin-optimizer.css'

export default function LinkedInOptimizer() {
    const { user } = useAuth()
    const [linkedinUrl, setLinkedinUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [profile, setProfile] = useState<LinkedInProfileRow | null>(null)
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
                .from('linkedin_profiles')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                setProfile(data as any as LinkedInProfileRow)
                setLinkedinUrl(data.linkedin_url)
            }
        } catch (err) {
            console.warn('No existing LinkedIn profile found')
        } finally {
            setLoading(false)
        }
    }

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!linkedinUrl) return

        setAnalyzing(true)
        setError(null)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const response = await fetch('/.netlify/functions/linkedin_profile_analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ linkedinUrl })
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.error || 'Failed to analyze profile')
            }

            const result = await response.json()
            setProfile(result.data.profile)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setAnalyzing(false)
        }
    }

    if (loading) {
        return <div className="linkedin-optimizer__loading">Loading your profile…</div>
    }

    const analysis = profile?.analysis_results

    return (
        <div className="linkedin-optimizer">
            <header className="linkedin-optimizer__header">
                <div className="linkedin-optimizer__title-row">
                    <Icon name="stars" size="lg" />
                    <h1>LinkedIn Optimizer</h1>
                </div>
                <p className="linkedin-optimizer__subtitle">
                    Optimize your profile for the modern job market using AI-driven insights from your LinkedIn presence.
                </p>
            </header>

            <div className="linkedin-optimizer__content">
                <section className="linkedin-optimizer__input-section">
                    <form className="linkedin-optimizer__form" onSubmit={handleAnalyze}>
                        <div className="linkedin-optimizer__input-group">
                            <label htmlFor="linkedin-url">LinkedIn Profile URL</label>
                            <input
                                id="linkedin-url"
                                type="url"
                                placeholder="https://www.linkedin.com/in/your-profile"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                className="linkedin-optimizer__button"
                                disabled={analyzing}
                            >
                                {analyzing ? 'Analyzing…' : profile ? 'Refresh Analysis' : 'Start Analysis'}
                            </button>
                        </div>
                        {error && <p className="linkedin-optimizer__error">{error}</p>}
                    </form>
                </section>

                {analyzing && (
                    <div className="linkedin-optimizer__analysis-loading">
                        <div className="pulse-loader"></div>
                        <p>Our AI is reviewing your profile experience, headline, and summary...</p>
                    </div>
                )}

                {analysis && !analyzing && (
                    <div className="linkedin-optimizer__results animate-fade-in">
                        <div className="linkedin-optimizer__scores">
                            <ScoreCard label="Overall" score={analysis.overall_score} />
                            <ScoreCard label="Headline" score={analysis.headline_score} />
                            <ScoreCard label="Summary" score={analysis.summary_score} />
                            <ScoreCard label="Experience" score={analysis.experience_score} />
                        </div>

                        <div className="linkedin-optimizer__suggestions-grid">
                            <div className="linkedin-optimizer__main-suggestions">
                                <h2>Key Improvements</h2>
                                <div className="suggestions-list">
                                    {analysis.suggestions.map((s, i) => (
                                        <div key={i} className="suggestion-item">
                                            <div className="suggestion-item__header">
                                                <span className="suggestion-item__section">{s.section}</span>
                                            </div>
                                            <p className="suggestion-item__improvement">{s.improvement}</p>
                                            <p className="suggestion-item__reason">{s.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="linkedin-optimizer__optimized-content">
                                {analysis.optimized_headline && (
                                    <div className="optimized-block">
                                        <h2>AI-Optimized Headline</h2>
                                        <div className="optimized-box">
                                            {analysis.optimized_headline}
                                            <button
                                                className="copy-button"
                                                onClick={() => navigator.clipboard.writeText(analysis.optimized_headline!)}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {analysis.optimized_summary && (
                                    <div className="optimized-block">
                                        <h2>AI-Optimized Summary</h2>
                                        <div className="optimized-box optimized-box--multiline">
                                            {analysis.optimized_summary}
                                            <button
                                                className="copy-button"
                                                onClick={() => navigator.clipboard.writeText(analysis.optimized_summary!)}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function ScoreCard({ label, score }: { label: string, score: number }) {
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'score--high'
        if (s >= 60) return 'score--mid'
        return 'score--low'
    }

    return (
        <div className={`score-card ${getScoreColor(score)}`}>
            <span className="score-card__number">{score}</span>
            <span className="score-card__label">{label}</span>
            <div className="score-card__bar">
                <div className="score-card__fill" style={{ width: `${score}%` }}></div>
            </div>
        </div>
    )
}
