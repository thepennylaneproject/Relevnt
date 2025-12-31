/**
 * usePracticeSession - Hook for managing practice sessions
 * 
 * Handles starting, recording answers, and completing practice sessions.
 */

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { PracticeSession, PracticeQuestion } from '../shared/types'

export function usePracticeSession() {
    const { user } = useAuth()
    const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const startSession = useCallback(async (
        questions: PracticeQuestion[],
        prepId?: string
    ) => {
        if (!user) return null

        setLoading(true)
        setError(null)
        try {
            const { data, error: dbError } = await (supabase
                .from('practice_sessions' as any)
                .insert({
                    user_id: user.id,
                    practice_prep_id: prepId || null,
                    questions: questions as any,
                    status: 'active',
                    practice_data: [] as any
                })
                .select()
                .single() as any)

            if (dbError) throw dbError
            setCurrentSession(data as unknown as PracticeSession)
            return data as unknown as PracticeSession
        } catch (err: any) {
            console.error('Error starting practice session:', err)
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [user])

    const recordAnswer = useCallback(async (
        question: string,
        response: string,
        feedback: any,
        score: number
    ) => {
        if (!currentSession || !user) return

        const newPracticeData = [
            ...(currentSession.practice_data || []),
            {
                question,
                response,
                feedback,
                score,
                timestamp: new Date().toISOString()
            }
        ]

        try {
            const { data, error: dbError } = await (supabase
                .from('practice_sessions' as any)
                .update({
                    practice_data: newPracticeData as any,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentSession.id)
                .select()
                .single() as any)

            if (dbError) throw dbError
            setCurrentSession(data as unknown as PracticeSession)
        } catch (err: any) {
            console.error('Error recording answer:', err)
            setError(err.message)
        }
    }, [currentSession, user])

    const completeSession = useCallback(async (overallFeedback?: any) => {
        if (!currentSession || !user) return

        try {
            const { data, error: dbError } = await (supabase
                .from('practice_sessions' as any)
                .update({
                    status: 'completed',
                    overall_feedback: overallFeedback || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentSession.id)
                .select()
                .single() as any)

            if (dbError) throw dbError
            setCurrentSession(data as unknown as PracticeSession)
        } catch (err: any) {
            console.error('Error completing session:', err)
            setError(err.message)
        }
    }, [currentSession, user])

    const fetchSession = useCallback(async (sessionId: string) => {
        if (!user) return

        setLoading(true)
        try {
            const { data, error: dbError } = await (supabase
                .from('practice_sessions' as any)
                .select('*')
                .eq('id', sessionId)
                .eq('user_id', user.id)
                .single() as any)

            if (dbError) throw dbError
            setCurrentSession(data as unknown as PracticeSession)
        } catch (err: any) {
            console.error('Error fetching session:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [user])

    return {
        currentSession,
        loading,
        error,
        startSession,
        recordAnswer,
        completeSession,
        fetchSession
    }
}
