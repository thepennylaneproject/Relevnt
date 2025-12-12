// src/hooks/useResumeAnalysis.ts
// Hook for analyzing resume with AI and getting ATS score

import { useState, useCallback } from 'react'
import { useAITask } from './useAITask'
import type { ATSAnalysis, ATSSuggestion } from '../components/ResumeBuilder/ATSScoreCard'
import type { ResumeDraft } from '../types/resume-builder.types'

// ============================================================================
// TYPES
// ============================================================================

interface UseResumeAnalysisReturn {
    analysis: ATSAnalysis | null
    analyze: (draft: ResumeDraft, jobDescription?: string) => Promise<ATSAnalysis | null>
    loading: boolean
    error: string | null
}

// ============================================================================
// HELPER: Convert draft to text for analysis
// ============================================================================

function draftToText(draft: ResumeDraft): string {
    const sections: string[] = []

    // Contact
    if (draft.contact.fullName) {
        sections.push(`Name: ${draft.contact.fullName}`)
    }
    if (draft.contact.headline) {
        sections.push(`Title: ${draft.contact.headline}`)
    }

    // Summary
    if (draft.summary.summary) {
        sections.push(`\nSUMMARY:\n${draft.summary.summary}`)
    }

    // Skills
    if (draft.skillGroups.length > 0) {
        const skillsText = draft.skillGroups
            .map(g => `${g.label}: ${g.skills.join(', ')}`)
            .join('\n')
        sections.push(`\nSKILLS:\n${skillsText}`)
    }

    // Experience
    if (draft.experience.length > 0) {
        const expText = draft.experience
            .map(e => `${e.title} at ${e.company} (${e.startDate} - ${e.endDate || 'Present'})\n${e.bullets}`)
            .join('\n\n')
        sections.push(`\nEXPERIENCE:\n${expText}`)
    }

    // Education
    if (draft.education.length > 0) {
        const eduText = draft.education
            .map(e => `${e.degree} in ${e.fieldOfStudy} - ${e.institution}`)
            .join('\n')
        sections.push(`\nEDUCATION:\n${eduText}`)
    }

    // Certifications
    if (draft.certifications.length > 0) {
        const certText = draft.certifications
            .map(c => `${c.name} - ${c.issuer}`)
            .join('\n')
        sections.push(`\nCERTIFICATIONS:\n${certText}`)
    }

    return sections.join('\n')
}

// ============================================================================
// HOOK
// ============================================================================

export function useResumeAnalysis(): UseResumeAnalysisReturn {
    const { execute, loading: aiLoading, error: aiError } = useAITask()
    const [analysis, setAnalysis] = useState<ATSAnalysis | null>(null)

    const analyze = useCallback(async (
        draft: ResumeDraft,
        jobDescription?: string
    ): Promise<ATSAnalysis | null> => {
        try {
            const resumeText = draftToText(draft)

            const result = await execute('analyze-resume', {
                resumeText,
                jobDescription,
            })

            if (result?.success) {
                // Map the AI response to our ATSAnalysis format
                const data = (result as any).analysis || result

                const mappedAnalysis: ATSAnalysis = {
                    overallScore: data.atsScore || data.overallScore || 0,
                    categories: {
                        formatting: data.categories?.formatting || Math.round((data.atsScore || 0) * 0.9),
                        keywords: data.categories?.keywords || Math.round((data.atsScore || 0) * 0.85),
                        contentQuality: data.categories?.contentQuality || Math.round((data.atsScore || 0) * 0.95),
                        readability: data.categories?.readability || Math.round((data.atsScore || 0) * 0.92),
                    },
                    assessment: data.overallAssessment || data.assessment || 'needs-improvement',
                    strengths: data.strengths || [],
                    weaknesses: data.weaknesses || [],
                    suggestions: (data.suggestions || []).map((s: any, idx: number): ATSSuggestion => ({
                        id: `suggestion-${idx}`,
                        category: s.category || 'content',
                        priority: s.priority || 'medium',
                        title: s.title || s.suggestion?.slice(0, 50) || 'Improvement suggestion',
                        description: s.description || s.suggestion || '',
                        impact: s.impact || 'Improves ATS compatibility',
                    })),
                }

                setAnalysis(mappedAnalysis)
                return mappedAnalysis
            }

            return null
        } catch (err) {
            console.error('Resume analysis failed:', err)
            return null
        }
    }, [execute])

    return {
        analysis,
        analyze,
        loading: aiLoading,
        error: aiError?.message || null,
    }
}
