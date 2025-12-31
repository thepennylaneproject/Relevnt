// src/components/ResumeBuilder/JobTargetingPanel.tsx
// Panel for pasting job descriptions and analyzing keyword matches

import React, { useState, useMemo } from 'react'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'

// ============================================================================
// TYPES
// ============================================================================

interface KeywordMatch {
    keyword: string
    found: boolean
    importance: 'critical' | 'important' | 'nice-to-have'
}

interface MatchAnalysis {
    matchPercentage: number
    foundKeywords: string[]
    missingKeywords: string[]
    suggestions: string[]
}

interface Props {
    resumeText: string
    onOptimize?: (suggestions: string[]) => void
}

// ============================================================================
// KEYWORD EXTRACTION (client-side heuristics)
// ============================================================================

function extractKeywords(jobDescription: string): KeywordMatch[] {
    const text = jobDescription.toLowerCase()

    // Common skill/requirement patterns
    const keywordPatterns = [
        // Technical skills
        /\b(javascript|typescript|python|java|react|node\.?js|sql|aws|azure|docker|kubernetes)\b/gi,
        // Soft skills
        /\b(communication|leadership|teamwork|problem[- ]solving|analytical|collaborative)\b/gi,
        // Experience requirements
        /\b(\d+\+?\s+years?)\b/gi,
        // Tools and platforms
        /\b(git|jira|confluence|figma|sketch|tableau|excel|salesforce)\b/gi,
        // Qualifications
        /\b(bachelor'?s?|master'?s?|ph\.?d|degree|certified|certification)\b/gi,
    ]

    const foundKeywords = new Set<string>()

    keywordPatterns.forEach(pattern => {
        const matches = text.match(pattern)
        if (matches) {
            matches.forEach(m => foundKeywords.add(m.toLowerCase()))
        }
    })

    // Also extract capitalized terms (often proper nouns/tools)
    const capitalizedTerms = jobDescription.match(/\b[A-Z][a-zA-Z]+\b/g)
    capitalizedTerms?.forEach(term => {
        if (term.length > 2) foundKeywords.add(term.toLowerCase())
    })

    // Convert to KeywordMatch array
    return Array.from(foundKeywords).map(keyword => ({
        keyword,
        found: false,
        importance: keyword.match(/\d+\s*years?|required|must/i) ? 'critical' : 'important'
    }))
}

function analyzeMatch(resumeText: string, keywords: KeywordMatch[]): MatchAnalysis {
    const resumeLower = resumeText.toLowerCase()

    const found: string[] = []
    const missing: string[] = []

    keywords.forEach(kw => {
        if (resumeLower.includes(kw.keyword.toLowerCase())) {
            found.push(kw.keyword)
        } else {
            missing.push(kw.keyword)
        }
    })

    const matchPercentage = keywords.length > 0
        ? Math.round((found.length / keywords.length) * 100)
        : 0

    // Generate suggestions
    const suggestions: string[] = []
    const criticalMissing = missing.filter(k =>
        keywords.find(kw => kw.keyword === k && kw.importance === 'critical')
    )

    if (criticalMissing.length > 0) {
        suggestions.push(`Add these critical keywords: ${criticalMissing.slice(0, 3).join(', ')}`)
    }
    if (missing.length > 3) {
        suggestions.push(`Consider incorporating more technical terms from the job description`)
    }
    if (matchPercentage >= 70) {
        suggestions.push(`Great keyword match! Focus on quantifying your achievements`)
    }

    return {
        matchPercentage,
        foundKeywords: found,
        missingKeywords: missing,
        suggestions
    }
}

// ============================================================================
// COMPONENT
// ============================================================================

export const JobTargetingPanel: React.FC<Props> = ({ resumeText, onOptimize }) => {
    const [jobDescription, setJobDescription] = useState('')
    const [isExpanded, setIsExpanded] = useState(false)

    const analysis = useMemo(() => {
        if (!jobDescription.trim() || !resumeText.trim()) return null

        const keywords = extractKeywords(jobDescription)
        return analyzeMatch(resumeText, keywords)
    }, [jobDescription, resumeText])

    const getMatchColor = (percentage: number) => {
        if (percentage >= 70) return 'var(--success, #6ac7a5)'
        if (percentage >= 40) return 'var(--warning, #c7a56a)'
        return 'var(--danger, #c44a4a)'
    }

    return (
        <div className="job-targeting-panel">
            <div
                className="job-targeting-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="job-targeting-header-main">
                    <Icon name="briefcase" size="sm" />
                    <h3 className="text-sm font-semibold">Target a Job</h3>
                </div>
                <span className={`job-targeting-chevron ${isExpanded ? 'rotated' : ''}`}>
                    ▼
                </span>
            </div>

            {isExpanded && (
                <div className="job-targeting-body">
                    <p className="text-xs muted" style={{ marginBottom: 12 }}>
                        Paste a job description to see how well your resume matches and get tailoring suggestions.
                    </p>

                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste job description here..."
                        rows={4}
                        className="w-full"
                        style={{ fontSize: '0.825rem' }}
                    />

                    {analysis && (
                        <div className="job-match-results">
                            {/* Match percentage bar */}
                            <div className="job-match-bar-container">
                                <div className="job-match-bar">
                                    <div
                                        className="job-match-bar-fill"
                                        style={{
                                            width: `${analysis.matchPercentage}%`,
                                            background: getMatchColor(analysis.matchPercentage)
                                        }}
                                    />
                                </div>
                                <span className="text-xs font-semibold">
                                    {analysis.matchPercentage}% keyword match
                                </span>
                            </div>

                            {/* Keywords found/missing */}
                            <div className="job-keywords-grid">
                                <div className="job-keywords-section">
                                    <h4 className="text-xs font-semibold text-success">
                                        ✓ Found ({analysis.foundKeywords.length})
                                    </h4>
                                    <div className="job-keyword-tags">
                                        {analysis.foundKeywords.slice(0, 8).map(kw => (
                                            <span key={kw} className="job-keyword-tag job-keyword-tag--found">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="job-keywords-section">
                                    <h4 className="text-xs font-semibold text-warning">
                                        ✗ Missing ({analysis.missingKeywords.length})
                                    </h4>
                                    <div className="job-keyword-tags">
                                        {analysis.missingKeywords.slice(0, 8).map(kw => (
                                            <span key={kw} className="job-keyword-tag job-keyword-tag--missing">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Suggestions */}
                            {analysis.suggestions.length > 0 && (
                                <div className="job-suggestions">
                                    <h4 className="text-xs font-semibold" style={{ marginBottom: 8 }}>
                                        💡 Suggestions
                                    </h4>
                                    <ul className="job-suggestions-list">
                                        {analysis.suggestions.map((s, i) => (
                                            <li key={i} className="text-xs">{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Optimize button */}
                            {onOptimize && analysis.missingKeywords.length > 0 && (
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => onOptimize(analysis.suggestions)}
                                    style={{ marginTop: 12 }}
                                >
                                    <Icon name="stars" size="sm" />
                                    Tailor Resume
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default JobTargetingPanel
