/**
 * Mirror - Ready App
 * 
 * Self-reflection and readiness assessment of professional presence.
 * Analyzes LinkedIn and Portfolio to show how the market sees you.
 * Route: /mirror
 */

import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Container } from '../components/shared/Container'
import PageBackground from '../components/shared/PageBackground'
import '../styles/mirror-linkedin.css'
import '../styles/mirror-portfolio.css'

// Types for Mirror analysis
interface LinkedInAnalysis {
    headline_score: number
    summary_score: number
    experience_score: number
    overall_score: number
    readiness_level: 'not_ready' | 'getting_there' | 'ready' | 'strong'
    suggestions: {
        section: string
        improvement: string
        reason: string
    }[]
    optimized_headline?: string
    optimized_summary?: string
}

interface PortfolioAnalysis {
    visual_score: number
    usability_score: number
    content_score: number
    overall_score: number
    readiness_level: 'not_ready' | 'getting_there' | 'ready' | 'strong'
    perceived_seniority: string
    suggestions: {
        category: string
        improvement: string
        impact: 'high' | 'medium' | 'low'
    }[]
    suggested_tagline?: string
}

interface ProfileRow {
    id: string
    user_id: string
    linkedin_url?: string
    portfolio_url?: string
    analysis_results: LinkedInAnalysis | PortfolioAnalysis | null
    created_at: string
    updated_at: string
    is_public?: boolean
    share_token?: string
}

type MirrorTab = 'linkedin' | 'portfolio'

export default function Mirror() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [activeTab, setActiveTab] = useState<MirrorTab>('linkedin')
    
    // LinkedIn state
    const [linkedinUrl, setLinkedinUrl] = useState('')
    const [linkedinLoading, setLinkedinLoading] = useState(false)
    const [linkedinAnalyzing, setLinkedinAnalyzing] = useState(false)
    const [linkedinProfile, setLinkedinProfile] = useState<ProfileRow | null>(null)
    const [linkedinError, setLinkedinError] = useState<string | null>(null)
    
    // Portfolio state
    const [portfolioUrl, setPortfolioUrl] = useState('')
    const [portfolioLoading, setPortfolioLoading] = useState(false)
    const [portfolioAnalyzing, setPortfolioAnalyzing] = useState(false)
    const [portfolioAnalysis, setPortfolioAnalysis] = useState<ProfileRow | null>(null)
    const [portfolioError, setPortfolioError] = useState<string | null>('')

    useEffect(() => {
        if (user) {
            fetchLinkedInAnalysis()
            fetchPortfolioAnalysis()
        }
    }, [user])

    const fetchLinkedInAnalysis = async () => {
        if (!user?.id) return
        setLinkedinLoading(true)
        try {
            const { data } = await supabase
                .from('linkedin_profiles')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                setLinkedinProfile(data as any)
                setLinkedinUrl(data.linkedin_url)
            }
        } catch {
            console.warn('No existing LinkedIn profile found')
        } finally {
            setLinkedinLoading(false)
        }
    }

    const fetchPortfolioAnalysis = async () => {
        if (!user?.id) return
        setPortfolioLoading(true)
        try {
            const { data } = await supabase
                .from('portfolio_analyses')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                setPortfolioAnalysis(data as any)
                setPortfolioUrl(data.portfolio_url)
            }
        } catch {
            console.warn('No existing portfolio analysis found')
        } finally {
            setPortfolioLoading(false)
        }
    }

    const handleLinkedInAnalyze = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!linkedinUrl) return

        setLinkedinAnalyzing(true)
        setLinkedinError(null)

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
            setLinkedinProfile(result.data.profile)
        } catch (err: any) {
            setLinkedinError(err.message)
        } finally {
            setLinkedinAnalyzing(false)
        }
    }

    const handlePortfolioAnalyze = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!portfolioUrl) return

        setPortfolioAnalyzing(true)
        setPortfolioError(null)

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
            setPortfolioAnalysis(result.data.analysis)
        } catch (err: any) {
            setPortfolioError(err.message)
        } finally {
            setPortfolioAnalyzing(false)
        }
    }

    const handleToggleShare = async (type: MirrorTab, id: string, makePublic: boolean) => {
        const table = type === 'linkedin' ? 'linkedin_profiles' : 'portfolio_analyses'
        const { error } = await supabase
            .from(table)
            .update({ is_public: makePublic } as any)
            .eq('id', id)

        if (error) {
            showToast('Failed to update sharing settings', 'error')
            return
        }

        if (type === 'linkedin' && linkedinProfile) {
            setLinkedinProfile({ ...linkedinProfile, is_public: makePublic })
        } else if (type === 'portfolio' && portfolioAnalysis) {
            setPortfolioAnalysis({ ...portfolioAnalysis, is_public: makePublic })
        }

        showToast(makePublic ? 'Mirror is now public' : 'Mirror is now private', 'success')
    }

    const linkedinAnalysis = linkedinProfile?.analysis_results as LinkedInAnalysis | null
    const portfolioResults = portfolioAnalysis?.analysis_results as PortfolioAnalysis | null

    return (
        <PageBackground>
            <Container maxWidth="xl" padding="md">
                <div className="mirror-page">
                    <div className="page-header">
                        <h1>Candidate Mirror</h1>
                        <p>See yourself as the market sees you. Get honest AI feedback on your professional presence and readiness indicators.</p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="tabs mb-6">
                        <button
                            className={`tab ${activeTab === 'linkedin' ? 'active' : ''}`}
                            onClick={() => setActiveTab('linkedin')}
                        >
                            <span>LinkedIn</span>
                        </button>
                        <button
                            className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
                            onClick={() => setActiveTab('portfolio')}
                        >
                            <span>Portfolio</span>
                        </button>
                    </div>

                    {/* LinkedIn Tab Content */}
                    {activeTab === 'linkedin' && (
                        <>
                            <div className="tab-pane active">
                                <div className="card">
                                    <form onSubmit={handleLinkedInAnalyze}>
                                        <div className="form-group">
                                            <label htmlFor="linkedin-url" className="form-label">LinkedIn Profile URL</label>
                                            <input
                                                id="linkedin-url"
                                                type="url"
                                                className="form-input"
                                                placeholder="https://www.linkedin.com/in/your-profile"
                                                value={linkedinUrl}
                                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            disabled={linkedinAnalyzing}
                                        >
                                            {linkedinAnalyzing ? 'Analyzing…' : linkedinProfile ? 'Refresh Analysis' : 'Start Analysis'}
                                        </Button>
                                        {linkedinError && <p className="form-error-text mt-4">{linkedinError}</p>}
                                    </form>
                                </div>
                            </div>

                            {linkedinAnalyzing && (
                                <div className="mirror__analysis-loading">
                                    <p>Examining your profile through the lens of recruiters and hiring managers...</p>
                                </div>
                            )}

                            {linkedinAnalysis && !linkedinAnalyzing && (
                                <div className="mirror__results animate-fade-in">
                                    <ShareSection 
                                        type="linkedin" 
                                        shareToken={linkedinProfile!.share_token || linkedinProfile!.id}
                                        isPublic={!!linkedinProfile!.is_public}
                                        onTogglePublic={(pub) => handleToggleShare('linkedin', linkedinProfile!.id, pub)}
                                    />
                                    
                                    {/* Readiness Indicator */}
                                    <ReadinessIndicator 
                                        level={linkedinAnalysis.readiness_level || getReadinessLevel(linkedinAnalysis.overall_score)}
                                        score={linkedinAnalysis.overall_score}
                                    />
                                    
                                    <div className="mirror__scores">
                                        <ScoreCard label="Overall" score={linkedinAnalysis.overall_score} />
                                        <ScoreCard label="Headline" score={linkedinAnalysis.headline_score} />
                                        <ScoreCard label="Summary" score={linkedinAnalysis.summary_score} />
                                        <ScoreCard label="Experience" score={linkedinAnalysis.experience_score} />
                                    </div>

                                    <div className="mirror__suggestions-grid">
                                        <div className="mirror__main-suggestions">
                                            <h2>What Stands Out</h2>
                                            <div className="suggestions-list">
                                                {linkedinAnalysis.suggestions.map((s, i) => (
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

                                        <div className="mirror__optimized-content">
                                            {linkedinAnalysis.optimized_headline && (
                                                <div className="optimized-block">
                                                    <h2>Suggested Headline</h2>
                                                    <div className="optimized-box">
                                                        {linkedinAnalysis.optimized_headline}
                                                    </div>
                                                </div>
                                            )}

                                            {linkedinAnalysis.optimized_summary && (
                                                <div className="optimized-block">
                                                    <h2>Suggested Summary</h2>
                                                    <div className="optimized-box optimized-box--multiline">
                                                        {linkedinAnalysis.optimized_summary}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Portfolio Tab Content */}
                    {activeTab === 'portfolio' && (
                        <>
                            <div className="tab-pane active">
                                <div className="card">
                                    <form onSubmit={handlePortfolioAnalyze}>
                                        <div className="form-group">
                                            <label htmlFor="portfolio-url" className="form-label">Portfolio URL</label>
                                            <input
                                                id="portfolio-url"
                                                type="url"
                                                className="form-input"
                                                placeholder="https://yourname.com or https://behance.net/you"
                                                value={portfolioUrl}
                                                onChange={(e) => setPortfolioUrl(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            disabled={portfolioAnalyzing}
                                        >
                                            {portfolioAnalyzing ? 'Evaluating…' : portfolioResults ? 'Re-evaluate Portfolio' : 'Evaluate Portfolio'}
                                        </Button>
                                        {portfolioError && <p className="form-error-text mt-4">{portfolioError}</p>}
                                    </form>
                                </div>
                            </div>

                            {portfolioAnalyzing && (
                                <div className="mirror__analysis-loading">
                                    <p>Scanning your portfolio through the eyes of potential employers...</p>
                                </div>
                            )}

                            {portfolioResults && !portfolioAnalyzing && (
                                <div className="mirror__results animate-fade-in">
                                    <ShareSection 
                                        type="portfolio" 
                                        shareToken={portfolioAnalysis!.share_token || portfolioAnalysis!.id}
                                        isPublic={!!portfolioAnalysis!.is_public}
                                        onTogglePublic={(pub) => handleToggleShare('portfolio', portfolioAnalysis!.id, pub)}
                                    />
                                    
                                    {/* Readiness Indicator */}
                                    <ReadinessIndicator 
                                        level={portfolioResults.readiness_level || getReadinessLevel(portfolioResults.overall_score)}
                                        score={portfolioResults.overall_score}
                                    />
                                    
                                    <div className="mirror__main-stats">
                                        <div className="overall-score-large">
                                            <span className="label">Overall Impact</span>
                                            <span className="value">{portfolioResults.overall_score}</span>
                                        </div>
                                        <div>
                                            <span className="label">Perceived Seniority</span>
                                            <span className="value">{portfolioResults.perceived_seniority}</span>
                                        </div>
                                    </div>

                                    <div className="mirror__scores">
                                        <MetricBox label="Visual" score={portfolioResults.visual_score} />
                                        <MetricBox label="Usability" score={portfolioResults.usability_score} />
                                        <MetricBox label="Content" score={portfolioResults.content_score} />
                                    </div>

                                    <div className="mirror__suggestions">
                                        <h2>Growth Opportunities</h2>
                                        <div className="portfolio-suggestions-list">
                                            {portfolioResults.suggestions.map((s, i) => (
                                                <div key={i} className={`portfolio-suggestion-card impact--${s.impact}`}>
                                                    <div className="card-header">
                                                        <span className="category">{s.category}</span>
                                                    </div>
                                                    <p className="improvement">{s.improvement}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {portfolioResults.suggested_tagline && (
                                        <div className="mirror__tagline">
                                            <h2>Your Narrative</h2>
                                            <div>{portfolioResults.suggested_tagline}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Container>
        </PageBackground>
    )
}

// Helper to derive readiness level from score
function getReadinessLevel(score: number): 'not_ready' | 'getting_there' | 'ready' | 'strong' {
    if (score >= 85) return 'strong'
    if (score >= 70) return 'ready'
    if (score >= 50) return 'getting_there'
    return 'not_ready'
}

// Readiness Indicator Component
function ReadinessIndicator({ level, score }: { level: string, score: number }) {
    const config = {
        'not_ready': { label: 'Needs Work', color: '#E8A8A8', message: 'Your profile needs significant improvements before you\'re interview-ready.' },
        'getting_there': { label: 'Getting There', color: 'var(--color-accent-primary)', message: 'You\'re making progress. A few key improvements will boost your readiness.' },
        'ready': { label: 'Interview Ready', color: '#A8D5BA', message: 'Your presence is solid. You\'re ready to start conversations with confidence.' },
        'strong': { label: 'Strong Candidate', color: '#7AC8A3', message: 'Excellent! Your profile positions you as a top candidate.' }
    }
    
    const { label, color, message } = config[level as keyof typeof config] || config['getting_there']
    
    return (
        <div className="readiness-indicator" style={{ borderColor: color }}>
            <div className="readiness-indicator__badge" style={{ background: color }}>
                <span className="readiness-indicator__score">{score}</span>
                <span className="readiness-indicator__label">{label}</span>
            </div>
            <p className="readiness-indicator__message">{message}</p>
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

function MetricBox({ label, score }: { label: string, score: number }) {
    return (
        <div className="metric-box">
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

function ShareSection({ type, shareToken, isPublic, onTogglePublic }: { 
    type: 'linkedin' | 'portfolio', 
    shareToken: string, 
    isPublic: boolean,
    onTogglePublic: (isPublic: boolean) => void
}) {
    const [copied, setCopied] = useState(false)
    const shareUrl = `${window.location.origin}/shared/mirror/${type}/${shareToken}`

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="surface-card p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-accent-soft border">
            <div className="text-left">
                <h3 className="font-bold text-sm">{isPublic ? 'Publicly Shared' : 'Private Mirror'}</h3>
                <p className="text-xs muted">{isPublic ? 'Anyone with the link can view your mirror.' : 'Only you can see these insights.'}</p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
                {!isPublic ? (
                    <Button 
                        type="button"
                        variant="primary"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => onTogglePublic(true)}
                    >
                        Enable Sharing
                    </Button>
                ) : (
                    <>
                        <Button 
                            type="button"
                            variant={copied ? 'secondary' : 'ghost'}
                            size="sm"
                            className="flex-1 sm:flex-none justify-center"
                            onClick={handleCopy}
                        >
                            {copied ? 'Copied!' : 'Copy Link'}
                        </Button>
                        <button 
                            onClick={() => onTogglePublic(false)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                            title="Make Private"
                        >
                            Make Private
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
