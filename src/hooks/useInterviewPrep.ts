import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { InterviewPracticeSession, InterviewQuestion } from '../shared/types'

export function useInterviewPrep() {
    const { user } = useAuth()
    const [currentSession, setCurrentSession] = useState<InterviewPracticeSession | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const startSession = useCallback(async (
        questions: InterviewQuestion[],
        prepId?: string,
        jobId?: string,
        applicationId?: string
    ) => {
        if (!user) return null

        setLoading(true)
        setError(null)
        try {
            const { data, error: dbError } = await (supabase
                .from('interview_practice_sessions' as any)
                .insert({
                    user_id: user.id,
                    interview_prep_id: prepId || null,
                    job_id: jobId || null,
                    application_id: applicationId || null,
                    questions: questions as any,
                    status: 'active',
                    practice_data: [] as any
                })
                .select()
                .single() as any)

            if (dbError) throw dbError
            setCurrentSession(data as unknown as InterviewPracticeSession)
            return data as unknown as InterviewPracticeSession
        } catch (err: any) {
            console.error('Error starting interview session:', err)
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
                .from('interview_practice_sessions' as any)
                .update({
                    practice_data: newPracticeData as any,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentSession.id)
                .select()
                .single() as any)

            if (dbError) throw dbError
            setCurrentSession(data as unknown as InterviewPracticeSession)
        } catch (err: any) {
            console.error('Error recording answer:', err)
            setError(err.message)
        }
    }, [currentSession, user])

    const completeSession = useCallback(async (overallFeedback?: any) => {
        if (!currentSession || !user) return

        try {
            const { data, error: dbError } = await (supabase
                .from('interview_practice_sessions' as any)
                .update({
                    status: 'completed',
                    overall_feedback: overallFeedback || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentSession.id)
                .select()
                .single() as any)

            if (dbError) throw dbError
            setCurrentSession(data as unknown as InterviewPracticeSession)
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
                .from('interview_practice_sessions' as any)
                .select('*')
                .eq('id', sessionId)
                .eq('user_id', user.id)
                .single() as any)

            if (dbError) throw dbError
            setCurrentSession(data as unknown as InterviewPracticeSession)
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
