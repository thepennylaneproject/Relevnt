import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import { useToast } from '../components/ui/Toast'
import { Container } from '../components/shared/Container'
import PageBackground from '../components/shared/PageBackground'
import type { LinkedInProfileRow, LinkedInAnalysis, PortfolioAnalysisRow, PortfolioAnalysis } from '../shared/types'
import '../styles/linkedin-optimizer.css'
import '../styles/portfolio-optimizer.css'

type AnalyzerTab = 'linkedin' | 'portfolio'

export default function ProfileAnalyzer() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [activeTab, setActiveTab] = useState<AnalyzerTab>('linkedin')
    
    // LinkedIn state
    const [linkedinUrl, setLinkedinUrl] = useState('')
    const [linkedinLoading, setLinkedinLoading] = useState(false)
    const [linkedinAnalyzing, setLinkedinAnalyzing] = useState(false)
    const [linkedinProfile, setLinkedinProfile] = useState<LinkedInProfileRow | null>(null)
    const [linkedinError, setLinkedinError] = useState<string | null>(null)
    
    // Portfolio state
    const [portfolioUrl, setPortfolioUrl] = useState('')
    const [portfolioLoading, setPortfolioLoading] = useState(false)
    const [portfolioAnalyzing, setPortfolioAnalyzing] = useState(false)
    const [portfolioAnalysis, setPortfolioAnalysis] = useState<PortfolioAnalysisRow | null>(null)
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
            const { data, error } = await supabase
                .from('linkedin_profiles')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                setLinkedinProfile(data as any as LinkedInProfileRow)
                setLinkedinUrl(data.linkedin_url)
            }
        } catch (err) {
            console.warn('No existing LinkedIn profile found')
        } finally {
            setLinkedinLoading(false)
        }
    }

    const fetchPortfolioAnalysis = async () => {
        if (!user?.id) return
        setPortfolioLoading(true)
        try {
            const { data, error } = await supabase
                .from('portfolio_analyses')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                setPortfolioAnalysis(data as any as PortfolioAnalysisRow)
                setPortfolioUrl(data.portfolio_url)
            }
        } catch (err) {
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

    const handleToggleShare = async (type: AnalyzerTab, id: string, makePublic: boolean) => {
        const table = type === 'linkedin' ? 'linkedin_profiles' : 'portfolio_analyses'
        const { error } = await supabase
            .from(table)
            .update({ is_public: makePublic })
            .eq('id', id)

        if (error) {
            showToast('Failed to update sharing settings', 'error')
            return
        }

        if (type === 'linkedin' && linkedinProfile) {
            setLinkedinProfile({ ...linkedinProfile, is_public: makePublic } as any)
        } else if (type === 'portfolio' && portfolioAnalysis) {
            setPortfolioAnalysis({ ...portfolioAnalysis, is_public: makePublic } as any)
        }

        showToast(makePublic ? 'Audit is now public' : 'Audit is now private', 'success')
    }

    const linkedinAnalysis = linkedinProfile?.analysis_results
    const portfolioResults = portfolioAnalysis?.analysis_results

    return (
        <PageBackground>
            <Container maxWidth="xl" padding="md">
                <div className="profile-analyzer">
                    <div className="page-header">
                        <div className="icon-header">
                            <Icon name="stars" className="header-icon" />
                            <span className="label">OPTIMIZE YOUR PRESENCE</span>
                        </div>
                        <h1>Profile Analyzer</h1>
                        <p>Get AI-powered feedback on your LinkedIn profile and portfolio. Optimize for recruiters, improve your narrative, and stand out.</p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="tabs mb-6">
                        <button
                            className={`tab ${activeTab === 'linkedin' ? 'active' : ''}`}
                            onClick={() => setActiveTab('linkedin')}
                        >
                            <Icon name="stars" size="sm" hideAccent className="tab-icon" />
                            <span>LinkedIn</span>
                        </button>
                        <button
                            className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
                            onClick={() => setActiveTab('portfolio')}
                        >
                            <Icon name="briefcase" size="sm" hideAccent className="tab-icon" />
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
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-lg"
                                            disabled={linkedinAnalyzing}
                                        >
                                            {linkedinAnalyzing ? 'Analyzing…' : linkedinProfile ? 'Refresh Analysis' : 'Start Analysis'}
                                        </button>
                                        {linkedinError && <p className="form-error-text mt-4">{linkedinError}</p>}
                                    </form>
                                </div>
                            </div>

                            {linkedinAnalyzing && (
                                <div className="linkedin-optimizer__analysis-loading">
                                    <div className="pulse-loader"></div>
                                    <p>Our AI is reviewing your profile experience, headline, and summary...</p>
                                </div>
                            )}

                            {linkedinAnalysis && !linkedinAnalyzing && (
                                <div className="linkedin-optimizer__results animate-fade-in">
                                    <ShareSection 
                                        type="linkedin" 
                                        id={linkedinProfile!.id} 
                                        shareToken={linkedinProfile!.share_token || linkedinProfile!.id}
                                        isPublic={!!linkedinProfile!.is_public}
                                        onTogglePublic={(pub) => handleToggleShare('linkedin', linkedinProfile!.id, pub)}
                                    />
                                    <div className="linkedin-optimizer__scores">
                                        <ScoreCard label="Overall" score={linkedinAnalysis.overall_score} />
                                        <ScoreCard label="Headline" score={linkedinAnalysis.headline_score} />
                                        <ScoreCard label="Summary" score={linkedinAnalysis.summary_score} />
                                        <ScoreCard label="Experience" score={linkedinAnalysis.experience_score} />
                                    </div>

                                    <div className="linkedin-optimizer__suggestions-grid">
                                        <div className="linkedin-optimizer__main-suggestions">
                                            <h2>Key Improvements</h2>
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

                                        <div className="linkedin-optimizer__optimized-content">
                                            {linkedinAnalysis.optimized_headline && (
                                                <div className="optimized-block">
                                                    <h2>AI-Optimized Headline</h2>
                                                    <div className="optimized-box">
                                                        {linkedinAnalysis.optimized_headline}
                                                        <button
                                                            className="copy-button"
                                                            onClick={() => navigator.clipboard.writeText(linkedinAnalysis.optimized_headline!)}
                                                        >
                                                            Copy
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {linkedinAnalysis.optimized_summary && (
                                                <div className="optimized-block">
                                                    <h2>AI-Optimized Summary</h2>
                                                    <div className="optimized-box optimized-box--multiline">
                                                        {linkedinAnalysis.optimized_summary}
                                                        <button
                                                            className="copy-button"
                                                            onClick={() => navigator.clipboard.writeText(linkedinAnalysis.optimized_summary!)}
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
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-lg"
                                            disabled={portfolioAnalyzing}
                                        >
                                            {portfolioAnalyzing ? 'Evaluating…' : portfolioResults ? 'Re-evaluate Portfolio' : 'Evaluate Portfolio'}
                                        </button>
                                        {portfolioError && <p className="form-error-text mt-4">{portfolioError}</p>}
                                    </form>
                                </div>
                            </div>

                            {portfolioAnalyzing && (
                                <div className="portfolio-optimizer__analysis-loading">
                                    <div className="wave-loader">
                                        <span></span><span></span><span></span>
                                    </div>
                                    <p>Scanning your portfolio and assessing visual narratives...</p>
                                </div>
                            )}

                            {portfolioResults && !portfolioAnalyzing && (
                                <div className="portfolio-optimizer__results animate-fade-in">
                                    <ShareSection 
                                        type="portfolio" 
                                        id={portfolioAnalysis!.id} 
                                        shareToken={portfolioAnalysis!.share_token || portfolioAnalysis!.id}
                                        isPublic={!!portfolioAnalysis!.is_public}
                                        onTogglePublic={(pub) => handleToggleShare('portfolio', portfolioAnalysis!.id, pub)}
                                    />
                                    <div className="portfolio-optimizer__main-stats">
                                        <div className="overall-score-large">
                                            <span className="label">Overall Impact</span>
                                            <span className="value">{portfolioResults.overall_score}</span>
                                        </div>
                                        <div className="seniority-badge">
                                            <span className="label">Perceived Seniority</span>
                                            <span className="value">{portfolioResults.perceived_seniority}</span>
                                        </div>
                                    </div>

                                    <div className="portfolio-optimizer__scores">
                                        <MetricBox label="Visual" score={portfolioResults.visual_score} icon="stars" />
                                        <MetricBox label="Usability" score={portfolioResults.usability_score} icon="compass" />
                                        <MetricBox label="Content" score={portfolioResults.content_score} icon="book" />
                                    </div>

                                    <div className="portfolio-optimizer__suggestions">
                                        <h2>Strategic Improvements</h2>
                                        <div className="portfolio-suggestions-list">
                                            {portfolioResults.suggestions.map((s, i) => (
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

                                    {portfolioResults.suggested_tagline && (
                                        <div className="portfolio-optimizer__tagline">
                                            <h2>Suggested Narrative Tagline</h2>
                                            <div className="tagline-box">
                                                "{portfolioResults.suggested_tagline}"
                                            </div>
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

function ShareSection({ type, id, shareToken, isPublic, onTogglePublic }: { 
    type: 'linkedin' | 'portfolio', 
    id: string, 
    shareToken: string, 
    isPublic: boolean,
    onTogglePublic: (isPublic: boolean) => void
}) {
    const [copied, setCopied] = useState(false)
    const shareUrl = `${window.location.origin}/shared/audit/${type}/${shareToken}`

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="surface-card p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-accent-soft border">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPublic ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                    <Icon name={isPublic ? 'lighthouse' : 'candle'} size="sm" />
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-sm">{isPublic ? 'Publicly Shared' : 'Private Analysis'}</h3>
                    <p className="text-xs muted">{isPublic ? 'Anyone with the link can view your audit.' : 'Only you can see these results.'}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
                {!isPublic ? (
                    <button 
                        onClick={() => onTogglePublic(true)}
                        className="btn btn--primary btn--sm flex-1 sm:flex-none"
                    >
                        <Icon name="paper-airplane" size="sm" className="mr-2" />
                        Enable Sharing
                    </button>
                ) : (
                    <>
                        <button 
                            onClick={handleCopy}
                            className={`btn btn--sm flex-1 sm:flex-none justify-center ${copied ? 'btn--success' : 'btn--outline'}`}
                        >
                            <Icon name={copied ? 'check' : 'book'} size="sm" className="mr-2" />
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                        <button 
                            onClick={() => onTogglePublic(false)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                            title="Make Private"
                        >
                            <Icon name="candle" size="sm" />
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
