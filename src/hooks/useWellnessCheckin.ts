
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface WellnessCheckin {
    id: string
    user_id: string
    mood_score: number
    note?: string | null
    created_at: string
}

export interface UseWellnessCheckinReturn {
    checkins: WellnessCheckin[]
    loading: boolean
    error: string | null
    saveCheckin: (moodScore: number, note?: string) => Promise<void>
    refetch: () => Promise<void>
}

export function useWellnessCheckin(): UseWellnessCheckinReturn {
    const { user } = useAuth()
    const userId = user?.id

    const [checkins, setCheckins] = useState<WellnessCheckin[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCheckins = useCallback(async () => {
        if (!userId) return

        setLoading(true)
        setError(null)

        try {
            const { data, error: supaError } = await (supabase as any)
                .from('wellness_checkins')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(30) // Last 30 days

            if (supaError) throw supaError

            setCheckins(data || [])
        } catch (err: any) {
            console.error('Error fetching wellness check-ins:', err)
            setError(err.message || 'Failed to fetch check-ins')
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        fetchCheckins()
    }, [fetchCheckins])

    const saveCheckin = async (moodScore: number, note?: string) => {
        if (!userId) return

        try {
            const { error: supaError } = await (supabase as any)
                .from('wellness_checkins')
                .insert([{ user_id: userId, mood_score: moodScore, note }])

            if (supaError) throw supaError

            await fetchCheckins()
        } catch (err: any) {
            console.error('Error saving wellness check-in:', err)
            throw err
        }
    }

    return {
        checkins,
        loading,
        error,
        saveCheckin,
        refetch: fetchCheckins
    }
}
