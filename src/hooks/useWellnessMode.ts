/**
 * =============================================================================
 * useWellnessMode Hook
 * =============================================================================
 * Derive dashboard mood/mode based on recent wellness check-ins.
 * Enables the app to adapt its tone and behavior based on user's emotional state.
 * Part of Lyra Intelligence Layer - Phase 1.3
 * =============================================================================
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// =============================================================================
// Types
// =============================================================================

export type WellnessMode = 'normal' | 'gentle' | 'encouraging'

export interface WellnessModeData {
    mode: WellnessMode
    avgMoodScore: number | null
    recentCheckins: number
    moodTrend: 'up' | 'down' | 'stable' | 'unknown'
    lastCheckinDate: string | null
    loading: boolean
}

export interface WellnessGuidance {
    greeting: string
    tone: 'energetic' | 'calm' | 'supportive'
    showAggressive: boolean
    notificationLevel: 'all' | 'important' | 'critical'
    suggestedActions: string[]
    hidePerformanceMetrics: boolean  // Hide anxiety-inducing stats in gentle mode
}

// =============================================================================
// Constants
// =============================================================================

const GENTLE_THRESHOLD = 4      // Avg mood below this triggers gentle mode
const ENCOURAGING_TREND = 0.5   // Mood trending up by this much triggers encouraging

// =============================================================================
// Hook Implementation
// =============================================================================

export function useWellnessMode(): WellnessModeData & {
    getGuidance: () => WellnessGuidance
    refresh: () => Promise<void>
} {
    const { user } = useAuth()
    const userId = user?.id

    const [checkins, setCheckins] = useState<Array<{ mood_score: number; created_at: string }>>([])
    const [loading, setLoading] = useState(true)

    // Fetch recent check-ins
    const fetchCheckins = useCallback(async () => {
        if (!userId) {
            setCheckins([])
            setLoading(false)
            return
        }

        setLoading(true)

        try {
            // Get last 7 days of check-ins
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            const { data, error } = await (supabase as any)
                .from('wellness_checkins')
                .select('mood_score, created_at')
                .eq('user_id', userId)
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error

            setCheckins(data || [])
        } catch (err) {
            console.error('Error fetching wellness check-ins:', err)
            setCheckins([])
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        fetchCheckins()
    }, [fetchCheckins])

    // Calculate mood metrics
    const moodMetrics = useMemo(() => {
        if (checkins.length === 0) {
            return {
                avgMoodScore: null,
                moodTrend: 'unknown' as const,
                lastCheckinDate: null
            }
        }

        // Average mood score
        const avgMoodScore = checkins.reduce((sum, c) => sum + c.mood_score, 0) / checkins.length

        // Calculate trend (compare first half to second half)
        let moodTrend: 'up' | 'down' | 'stable' | 'unknown' = 'stable'
        if (checkins.length >= 3) {
            const halfPoint = Math.floor(checkins.length / 2)
            const recentHalf = checkins.slice(0, halfPoint)
            const olderHalf = checkins.slice(halfPoint)

            const recentAvg = recentHalf.reduce((sum, c) => sum + c.mood_score, 0) / recentHalf.length
            const olderAvg = olderHalf.reduce((sum, c) => sum + c.mood_score, 0) / olderHalf.length

            const diff = recentAvg - olderAvg
            if (diff > ENCOURAGING_TREND) {
                moodTrend = 'up'
            } else if (diff < -ENCOURAGING_TREND) {
                moodTrend = 'down'
            }
        }

        return {
            avgMoodScore: Math.round(avgMoodScore * 10) / 10,
            moodTrend,
            lastCheckinDate: checkins[0]?.created_at || null
        }
    }, [checkins])

    // Determine wellness mode
    const mode = useMemo((): WellnessMode => {
        const { avgMoodScore, moodTrend } = moodMetrics

        // No data = normal mode
        if (avgMoodScore === null) return 'normal'

        // Low mood = gentle mode
        if (avgMoodScore < GENTLE_THRESHOLD) return 'gentle'

        // Mood trending up = encouraging mode
        if (moodTrend === 'up') return 'encouraging'

        // Default
        return 'normal'
    }, [moodMetrics])

    // Generate guidance based on mode
    const getGuidance = useCallback((): WellnessGuidance => {
        switch (mode) {
            case 'gentle':
                return {
                    greeting: getGentleGreeting(),
                    tone: 'calm',
                    showAggressive: false,
                    notificationLevel: 'important',
                    hidePerformanceMetrics: true,  // Hide anxiety-inducing metrics
                    suggestedActions: [
                        'Take a short break',
                        'Review your wins from this week',
                        'Reach out to a friend or mentor'
                    ]
                }

            case 'encouraging':
                return {
                    greeting: getEncouragingGreeting(),
                    tone: 'energetic',
                    showAggressive: true,
                    notificationLevel: 'all',
                    hidePerformanceMetrics: false,  // Show all metrics
                    suggestedActions: [
                        'Your momentum is building!',
                        'Consider applying to a stretch role',
                        'Update your resume with recent wins'
                    ]
                }

            case 'normal':
            default:
                return {
                    greeting: getNormalGreeting(),
                    tone: 'supportive',
                    showAggressive: true,
                    notificationLevel: 'all',
                    hidePerformanceMetrics: false,  // Show all metrics
                    suggestedActions: []
                }
        }
    }, [mode])

    return {
        mode,
        avgMoodScore: moodMetrics.avgMoodScore,
        recentCheckins: checkins.length,
        moodTrend: moodMetrics.moodTrend,
        lastCheckinDate: moodMetrics.lastCheckinDate,
        loading,
        getGuidance,
        refresh: fetchCheckins
    }
}

// =============================================================================
// Greeting Helpers
// =============================================================================

function getNormalGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning! Here's your daily briefing."
    if (hour < 17) return "Good afternoon! Let's check in on your job search."
    return "Good evening! Here's what's new."
}

function getGentleGreeting(): string {
    const options = [
        "Job searching is hard. You're doing great just by showing up.",
        "Take it easy today. Here's one small win to focus on.",
        "Remember: every step forward counts, no matter how small.",
        "It's okay to take a break. We'll be here when you're ready.",
        "Your wellbeing matters more than any job. Be gentle with yourself."
    ]
    return options[Math.floor(Math.random() * options.length)]
}

function getEncouragingGreeting(): string {
    const options = [
        "Your momentum is building! Keep it up! 🚀",
        "You're on a roll! Let's make today count.",
        "Your energy is high — perfect time to tackle something new!",
        "Things are looking up! Here's what's trending for you.",
        "Great progress! Let's keep the momentum going."
    ]
    return options[Math.floor(Math.random() * options.length)]
}

export default useWellnessMode
