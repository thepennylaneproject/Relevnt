import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface CareerPriorities {
    salary: number      // 1-10
    work_life_balance: number
    career_growth: number
    team_culture: number
    impact: number
    [key: string]: number
}

export function usePriorities() {
    const { user } = useAuth()
    const [priorities, setPriorities] = useState<CareerPriorities>({
        salary: 5,
        work_life_balance: 5,
        career_growth: 5,
        team_culture: 5,
        impact: 5
    })
    const [loading, setLoading] = useState(true)

    const fetchPriorities = useCallback(async () => {
        if (!user) return
        setLoading(true)
        const { data, error } = await (supabase as any)
            .from('profiles')
            .select('career_priorities')
            .eq('id', user.id)
            .maybeSingle()

        if (data?.career_priorities) {
            setPriorities(data.career_priorities)
        }
        setLoading(false)
    }, [user])

    useEffect(() => {
        fetchPriorities()
    }, [fetchPriorities])

    const updatePriorities = async (newPriorities: CareerPriorities) => {
        if (!user) return
        const { error } = await (supabase as any)
            .from('profiles')
            .update({ career_priorities: newPriorities })
            .eq('id', user.id)

        if (!error) {
            setPriorities(newPriorities)
        }
    }

    return { priorities, loading, updatePriorities, refetch: fetchPriorities }
}
