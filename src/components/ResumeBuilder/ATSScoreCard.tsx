// src/components/ResumeBuilder/ATSScoreCard.tsx
// Visual ATS score display with animated meter and category breakdown

import React, { useState, useEffect } from 'react'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'

// ============================================================================
// TYPES
// ============================================================================

export interface ATSAnalysis {
    overallScore: number // 0-100
    categories: {
        formatting: number
        keywords: number
        contentQuality: number
        readability: number
    }
    assessment: 'excellent' | 'good' | 'needs-improvement'
    strengths: string[]
    weaknesses: string[]
    suggestions: ATSSuggestion[]
}

export interface ATSSuggestion {
    id: string
    category: 'keywords' | 'formatting' | 'content' | 'structure'
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    impact: string
}

interface Props {
    analysis: ATSAnalysis | null
    loading?: boolean
    onAnalyze?: () => void
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getScoreColor(score: number): string {
    if (score >= 80) return 'var(--success, #6ac7a5)'
    if (score >= 60) return 'var(--warning, #c7a56a)'
    return 'var(--danger, #c44a4a)'
}

function getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Needs Work'
    return 'Poor'
}

function getScoreEmoji(score: number): string {
    if (score >= 80) return '🎯'
    if (score >= 60) return '💪'
    if (score >= 40) return '📝'
    return '⚠️'
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ATSScoreCard: React.FC<Props> = ({ analysis, loading, onAnalyze }) => {
    const [animatedScore, setAnimatedScore] = useState(0)

    // Animate score on mount or when analysis changes
    useEffect(() => {
        if (!analysis) {
            setAnimatedScore(0)
            return
        }

        const targetScore = analysis.overallScore
        const duration = 1000 // ms
        const steps = 30
        const increment = targetScore / steps
        let current = 0

        const timer = setInterval(() => {
            current += increment
            if (current >= targetScore) {
                setAnimatedScore(targetScore)
                clearInterval(timer)
            } else {
                setAnimatedScore(Math.round(current))
            }
        }, duration / steps)

        return () => clearInterval(timer)
    }, [analysis])

    if (loading) {
        return (
            <div className="ats-score-card ats-score-card--loading">
                <div className="ats-score-loading">
                    <div className="ats-score-spinner" />
                    <p className="text-sm muted">Analyzing your resume...</p>
                </div>
            </div>
        )
    }

    if (!analysis) {
        return (
            <div className="ats-score-card ats-score-card--empty">
                <div className="ats-score-empty">
                    <Icon name="stars" size="lg" />
                    <h3 className="text-sm font-semibold">ATS Score Analysis</h3>
                    <p className="text-xs muted" style={{ maxWidth: 280, textAlign: 'center' }}>
                        Check how your resume performs against Applicant Tracking Systems used by 75% of employers.
                    </p>
                    {onAnalyze && (
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={onAnalyze}
                            style={{ marginTop: 12 }}
                        >
                            <Icon name="stars" size="sm" />
                            Analyze Resume
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    const scoreColor = getScoreColor(animatedScore)
    const circumference = 2 * Math.PI * 45 // radius = 45
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference

    return (
        <div className="ats-score-card">
            {/* Score Circle */}
            <div className="ats-score-header">
                <div className="ats-score-circle-container">
                    <svg className="ats-score-circle" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="var(--border)"
                            strokeWidth="8"
                        />
                        {/* Score arc */}
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke={scoreColor}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            transform="rotate(-90 50 50)"
                            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                        />
                    </svg>
                    <div className="ats-score-value">
                        <span className="ats-score-number">{animatedScore}</span>
                        <span className="ats-score-label text-xs">{getScoreLabel(animatedScore)}</span>
                    </div>
                </div>

                <div className="ats-score-summary">
                    <h3 className="text-sm font-semibold">
                        {getScoreEmoji(animatedScore)} ATS Compatibility
                    </h3>
                    <p className="text-xs muted">
                        {animatedScore >= 80
                            ? "Your resume is well-optimized for ATS systems."
                            : animatedScore >= 60
                                ? "Good foundation, but some improvements recommended."
                                : "Your resume may struggle with automated screening."}
                    </p>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="ats-score-categories">
                <h4 className="text-xs font-semibold muted" style={{ marginBottom: 12 }}>
                    Category Scores
                </h4>

                <div className="ats-category">
                    <div className="ats-category-header">
                        <span className="text-xs">Keywords</span>
                        <span className="text-xs font-semibold">{analysis.categories.keywords}%</span>
                    </div>
                    <div className="ats-category-bar">
                        <div
                            className="ats-category-fill"
                            style={{
                                width: `${analysis.categories.keywords}%`,
                                background: getScoreColor(analysis.categories.keywords)
                            }}
                        />
                    </div>
                </div>

                <div className="ats-category">
                    <div className="ats-category-header">
                        <span className="text-xs">Formatting</span>
                        <span className="text-xs font-semibold">{analysis.categories.formatting}%</span>
                    </div>
                    <div className="ats-category-bar">
                        <div
                            className="ats-category-fill"
                            style={{
                                width: `${analysis.categories.formatting}%`,
                                background: getScoreColor(analysis.categories.formatting)
                            }}
                        />
                    </div>
                </div>

                <div className="ats-category">
                    <div className="ats-category-header">
                        <span className="text-xs">Content Quality</span>
                        <span className="text-xs font-semibold">{analysis.categories.contentQuality}%</span>
                    </div>
                    <div className="ats-category-bar">
                        <div
                            className="ats-category-fill"
                            style={{
                                width: `${analysis.categories.contentQuality}%`,
                                background: getScoreColor(analysis.categories.contentQuality)
                            }}
                        />
                    </div>
                </div>

                <div className="ats-category">
                    <div className="ats-category-header">
                        <span className="text-xs">Readability</span>
                        <span className="text-xs font-semibold">{analysis.categories.readability}%</span>
                    </div>
                    <div className="ats-category-bar">
                        <div
                            className="ats-category-fill"
                            style={{
                                width: `${analysis.categories.readability}%`,
                                background: getScoreColor(analysis.categories.readability)
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="ats-quick-stats">
                <div className="ats-stat">
                    <span className="ats-stat-value text-success">{analysis.strengths.length}</span>
                    <span className="text-xs muted">Strengths</span>
                </div>
                <div className="ats-stat">
                    <span className="ats-stat-value text-warning">{analysis.weaknesses.length}</span>
                    <span className="text-xs muted">To Improve</span>
                </div>
                <div className="ats-stat">
                    <span className="ats-stat-value">{analysis.suggestions.filter(s => s.priority === 'high').length}</span>
                    <span className="text-xs muted">High Priority</span>
                </div>
            </div>

            {/* Re-analyze button */}
            {onAnalyze && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={onAnalyze}
                    style={{ marginTop: 12 }}
                >
                    <Icon name="stars" size="sm" />
                    Re-analyze
                </Button>
            )}
        </div>
    )
}

export default ATSScoreCard
