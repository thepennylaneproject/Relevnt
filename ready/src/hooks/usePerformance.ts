/**
 * usePerformance - Hook for tracking Ready performance metrics
 * 
 * Tracks: practice sessions, skill gaps, assessments, readiness scores
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export interface PracticePerformance {
    totalSessions: number
    completedSessions: number
    averageScore: number
    scoresTrend: number[] // Last 5 scores
    improvementPercent: number
}

export interface SkillGapPerformance {
    totalGaps: number
    addressedGaps: number
    progressPercent: number
}

export interface AssessmentPerformance {
    linkedinScore: number | null
    portfolioScore: number | null
    resumeScore: number | null
    assessmentsCompleted: number
}

export interface ReadinessData {
    currentScore: number
    previousScore: number
    trend: 'improving' | 'stable' | 'declining'
    isReady: boolean
    readinessHistory: { date: string; score: number }[]
}

export interface PerformanceData {
    practice: PracticePerformance
    skillGaps: SkillGapPerformance
    assessments: AssessmentPerformance
    readiness: ReadinessData
    insights: string[]
    whatsWorking: string[]
}

const READINESS_THRESHOLD = 75

export function usePerformance() {
    const { user } = useAuth()
    const [performance, setPerformance] = useState<PerformanceData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const calculateReadinessScore = useCallback((
        practice: PracticePerformance,
        skillGaps: SkillGapPerformance,
        assessments: AssessmentPerformance
    ): number => {
        let score = 0
        let weights = 0

        // Practice sessions contribution (40%)
        if (practice.totalSessions > 0) {
            const practiceScore = Math.min(100, practice.averageScore * 10)
            score += practiceScore * 0.4
            weights += 0.4
        }

        // Skill gaps contribution (30%)
        if (skillGaps.totalGaps > 0) {
            score += skillGaps.progressPercent * 0.3
            weights += 0.3
        }

        // Assessments contribution (30%)
        const assessmentScores = [
            assessments.linkedinScore,
            assessments.portfolioScore,
            assessments.resumeScore
        ].filter(s => s !== null) as number[]
        
        if (assessmentScores.length > 0) {
            const avgAssessment = assessmentScores.reduce((a, b) => a + b, 0) / assessmentScores.length
            score += avgAssessment * 0.3
            weights += 0.3
        }

        return weights > 0 ? Math.round(score / weights) : 0
    }, [])

    const generateInsights = useCallback((data: Omit<PerformanceData, 'insights' | 'whatsWorking'>): string[] => {
        const insights: string[] = []

        if (data.practice.totalSessions > 0 && data.practice.improvementPercent > 10) {
            insights.push(`Your practice scores have improved ${data.practice.improvementPercent}% recently.`)
        }

        if (data.skillGaps.progressPercent > 50) {
            insights.push(`You've addressed over half of your identified skill gaps.`)
        }

        if (data.readiness.isReady) {
            insights.push(`You've reached interview-ready status!`)
        }

        if (data.assessments.assessmentsCompleted === 0) {
            insights.push(`Complete your LinkedIn or Portfolio assessment to get personalized feedback.`)
        }

        return insights
    }, [])

    const generateWhatsWorking = useCallback((data: Omit<PerformanceData, 'insights' | 'whatsWorking'>): string[] => {
        const working: string[] = []

        if (data.practice.averageScore >= 7) {
            working.push('Strong interview responses')
        }

        if (data.skillGaps.progressPercent > 30) {
            working.push('Actively closing skill gaps')
        }

        if (data.assessments.linkedinScore && data.assessments.linkedinScore >= 70) {
            working.push('Professional LinkedIn presence')
        }

        if (data.assessments.portfolioScore && data.assessments.portfolioScore >= 70) {
            working.push('Strong portfolio impact')
        }

        if (data.readiness.trend === 'improving') {
            working.push('Consistent improvement trajectory')
        }

        return working
    }, [])

    const fetchPerformance = useCallback(async () => {
        if (!user?.id) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)

            // Fetch practice sessions
            const { data: practiceSessions } = await supabase
                .from('practice_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            const sessions = practiceSessions || []
            const completedSessions = sessions.filter((s: any) => s.status === 'completed')
            const scores = completedSessions.flatMap((s: any) => 
                (s.practice_data || []).map((d: any) => d.score)
            ).filter((s: number) => s > 0)

            const avgScore = scores.length > 0 
                ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length 
                : 0

            const recentScores = scores.slice(0, 5)
            const olderScores = scores.slice(5, 10)
            const recentAvg = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0
            const olderAvg = olderScores.length > 0 ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length : avgScore
            const improvement = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0

            const practice: PracticePerformance = {
                totalSessions: sessions.length,
                completedSessions: completedSessions.length,
                averageScore: Math.round(avgScore * 10) / 10,
                scoresTrend: recentScores.reverse(),
                improvementPercent: improvement
            }

            // Fetch skill gaps
            const { data: skillAnalyses } = await supabase
                .from('skill_gap_analyses')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            const gaps = (skillAnalyses as any)?.skill_gaps || []
            const totalGaps = gaps.length
            const addressedGaps = gaps.filter((g: any) => g.addressed).length

            const skillGaps: SkillGapPerformance = {
                totalGaps,
                addressedGaps,
                progressPercent: totalGaps > 0 ? Math.round((addressedGaps / totalGaps) * 100) : 0
            }

            // Fetch assessments
            const { data: linkedin } = await supabase
                .from('linkedin_profiles')
                .select('analysis_results')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

            const { data: portfolio } = await supabase
                .from('portfolio_analyses')
                .select('analysis_results')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

            const linkedinScore = (linkedin as any)?.analysis_results?.overall_score || null
            const portfolioScore = (portfolio as any)?.analysis_results?.overall_score || null

            const assessments: AssessmentPerformance = {
                linkedinScore,
                portfolioScore,
                resumeScore: null, // Can be added later
                assessmentsCompleted: [linkedinScore, portfolioScore].filter(s => s !== null).length
            }

            // Calculate readiness
            const currentScore = calculateReadinessScore(practice, skillGaps, assessments)
            
            const readiness: ReadinessData = {
                currentScore,
                previousScore: currentScore, // Would need historical data
                trend: improvement > 0 ? 'improving' : improvement < 0 ? 'declining' : 'stable',
                isReady: currentScore >= READINESS_THRESHOLD,
                readinessHistory: [{ date: new Date().toISOString(), score: currentScore }]
            }

            const baseData = { practice, skillGaps, assessments, readiness }
            const insights = generateInsights(baseData)
            const whatsWorking = generateWhatsWorking(baseData)

            setPerformance({
                ...baseData,
                insights,
                whatsWorking
            })
        } catch (err: any) {
            console.error('usePerformance error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [user, calculateReadinessScore, generateInsights, generateWhatsWorking])

    useEffect(() => {
        fetchPerformance()
    }, [fetchPerformance])

    return { performance, loading, error, refetch: fetchPerformance }
}
