/**
 * =============================================================================
 * useJobInteractions Hook
 * =============================================================================
 * Track job interactions (view, save, dismiss, apply) and surface pattern insights.
 * Part of Lyra Intelligence Layer - Phase 1.1
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { MatchFactors } from '../lib/matchJobs'

// =============================================================================
// Types
// =============================================================================

export type InteractionType = 'view' | 'save' | 'dismiss' | 'apply' | 'unsave'

export interface JobInteraction {
    id: string
    user_id: string
    job_id: string
    interaction_type: InteractionType
    match_score: number | null
    match_factors: MatchFactors | null
    persona_id: string | null
    created_at: string
}

export interface PatternInsight {
    id: string
    user_id: string
    insight_type: string
    insight_title: string
    insight_message: string
    insight_data: Record<string, unknown>
    priority: number
    is_dismissed: boolean
    created_at: string
    expires_at: string
}

export interface DismissalPattern {
    factor: string
    count: number
    percentage: number
    avgScore: number
}

export interface UseJobInteractionsReturn {
    // State
    insights: PatternInsight[]
    loading: boolean
    error: string | null

    // Actions
    trackInteraction: (
        jobId: string,
        type: InteractionType,
        matchScore?: number | null,
        matchFactors?: MatchFactors | null,
        personaId?: string | null
    ) => Promise<void>
    dismissInsight: (insightId: string) => Promise<void>
    refreshInsights: () => Promise<void>

    // Computed patterns
    getDismissalPatterns: () => Promise<DismissalPattern[]>
    getInteractionStats: () => Promise<{
        totalViews: number
        totalSaves: number
        totalDismissals: number
        totalApplications: number
        saveRate: number
        dismissRate: number
    }>
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useJobInteractions(): UseJobInteractionsReturn {
    const { user } = useAuth()
    const userId = user?.id

    const [insights, setInsights] = useState<PatternInsight[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // =========================================================================
    // Fetch active insights
    // =========================================================================
    const fetchInsights = useCallback(async () => {
        if (!userId) return

        setLoading(true)
        setError(null)

        try {
            const now = new Date().toISOString()
            const { data, error: fetchError } = await (supabase as any)
                .from('user_pattern_insights')
                .select('*')
                .eq('user_id', userId)
                .eq('is_dismissed', false)
                .gt('expires_at', now)
                .order('priority', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(10)

            if (fetchError) throw fetchError

            setInsights(data || [])
        } catch (err: any) {
            console.error('Error fetching pattern insights:', err)
            setError(err.message || 'Failed to fetch insights')
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        fetchInsights()
    }, [fetchInsights])

    // =========================================================================
    // Track a job interaction
    // =========================================================================
    const trackInteraction = useCallback(async (
        jobId: string,
        type: InteractionType,
        matchScore?: number | null,
        matchFactors?: MatchFactors | null,
        personaId?: string | null
    ) => {
        if (!userId) return

        try {
            const { error: insertError } = await (supabase as any)
                .from('job_interaction_patterns')
                .insert({
                    user_id: userId,
                    job_id: jobId,
                    interaction_type: type,
                    match_score: matchScore ?? null,
                    match_factors: matchFactors ?? null,
                    persona_id: personaId ?? null
                })

            if (insertError) {
                console.error('Error tracking interaction:', insertError)
            }
        } catch (err) {
            console.error('Error tracking job interaction:', err)
        }
    }, [userId])

    // =========================================================================
    // Dismiss an insight
    // =========================================================================
    const dismissInsight = useCallback(async (insightId: string) => {
        if (!userId) return

        try {
            const { error: updateError } = await (supabase as any)
                .from('user_pattern_insights')
                .update({ is_dismissed: true })
                .eq('id', insightId)
                .eq('user_id', userId)

            if (updateError) throw updateError

            setInsights(prev => prev.filter(i => i.id !== insightId))
        } catch (err: any) {
            console.error('Error dismissing insight:', err)
        }
    }, [userId])

    // =========================================================================
    // Get dismissal patterns (aggregated from recent interactions)
    // =========================================================================
    const getDismissalPatterns = useCallback(async (): Promise<DismissalPattern[]> => {
        if (!userId) return []

        try {
            // Get dismissals from last 30 days
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { data: dismissals, error: fetchError } = await (supabase as any)
                .from('job_interaction_patterns')
                .select('match_factors, match_score')
                .eq('user_id', userId)
                .eq('interaction_type', 'dismiss')
                .gte('created_at', thirtyDaysAgo.toISOString())
                .not('match_factors', 'is', null)

            if (fetchError) throw fetchError

            if (!dismissals || dismissals.length === 0) {
                return []
            }

            // Analyze which factors have consistently low scores in dismissed jobs
            const factorStats: Record<string, { total: number; lowCount: number; scores: number[] }> = {
                skill_score: { total: 0, lowCount: 0, scores: [] },
                salary_score: { total: 0, lowCount: 0, scores: [] },
                location_score: { total: 0, lowCount: 0, scores: [] },
                remote_score: { total: 0, lowCount: 0, scores: [] },
                industry_score: { total: 0, lowCount: 0, scores: [] },
                title_score: { total: 0, lowCount: 0, scores: [] }
            }

            // Thresholds for "low" score by factor (based on max possible scores)
            const lowThresholds: Record<string, number> = {
                skill_score: 15,      // max 35
                salary_score: 8,      // max 20
                location_score: 6,    // max 15
                remote_score: 6,      // max 15
                industry_score: 4,    // max 10
                title_score: 6        // max 15
            }

            for (const d of dismissals) {
                const factors = d.match_factors as MatchFactors | null
                if (!factors) continue

                for (const [key, threshold] of Object.entries(lowThresholds)) {
                    const score = factors[key as keyof MatchFactors]
                    if (typeof score === 'number') {
                        factorStats[key].total++
                        factorStats[key].scores.push(score)
                        if (score < threshold) {
                            factorStats[key].lowCount++
                        }
                    }
                }
            }

            // Build patterns for factors where >40% of dismissals had low scores
            const patterns: DismissalPattern[] = []
            const factorLabels: Record<string, string> = {
                skill_score: 'skills',
                salary_score: 'salary',
                location_score: 'location',
                remote_score: 'remote preference',
                industry_score: 'industry',
                title_score: 'job title'
            }

            for (const [key, stats] of Object.entries(factorStats)) {
                if (stats.total > 0) {
                    const percentage = (stats.lowCount / stats.total) * 100
                    if (percentage >= 40) {
                        const avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length
                        patterns.push({
                            factor: factorLabels[key] || key,
                            count: stats.lowCount,
                            percentage: Math.round(percentage),
                            avgScore: Math.round(avgScore * 10) / 10
                        })
                    }
                }
            }

            // Sort by percentage descending
            return patterns.sort((a, b) => b.percentage - a.percentage)
        } catch (err) {
            console.error('Error getting dismissal patterns:', err)
            return []
        }
    }, [userId])

    // =========================================================================
    // Get overall interaction stats
    // =========================================================================
    const getInteractionStats = useCallback(async () => {
        if (!userId) {
            return {
                totalViews: 0,
                totalSaves: 0,
                totalDismissals: 0,
                totalApplications: 0,
                saveRate: 0,
                dismissRate: 0
            }
        }

        try {
            // Get counts from last 30 days
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const { data, error: fetchError } = await (supabase as any)
                .from('job_interaction_patterns')
                .select('interaction_type')
                .eq('user_id', userId)
                .gte('created_at', thirtyDaysAgo.toISOString())

            if (fetchError) throw fetchError

            const interactions = data || []
            const counts = {
                view: 0,
                save: 0,
                dismiss: 0,
                apply: 0,
                unsave: 0
            }

            for (const i of interactions) {
                const type = i.interaction_type as InteractionType
                if (type in counts) {
                    counts[type]++
                }
            }

            const totalActioned = counts.save + counts.dismiss
            return {
                totalViews: counts.view,
                totalSaves: counts.save,
                totalDismissals: counts.dismiss,
                totalApplications: counts.apply,
                saveRate: totalActioned > 0 ? Math.round((counts.save / totalActioned) * 100) : 0,
                dismissRate: totalActioned > 0 ? Math.round((counts.dismiss / totalActioned) * 100) : 0
            }
        } catch (err) {
            console.error('Error getting interaction stats:', err)
            return {
                totalViews: 0,
                totalSaves: 0,
                totalDismissals: 0,
                totalApplications: 0,
                saveRate: 0,
                dismissRate: 0
            }
        }
    }, [userId])

    // =========================================================================
    // Return
    // =========================================================================
    return {
        insights,
        loading,
        error,
        trackInteraction,
        dismissInsight,
        refreshInsights: fetchInsights,
        getDismissalPatterns,
        getInteractionStats
    }
}
