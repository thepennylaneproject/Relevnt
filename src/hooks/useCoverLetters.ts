import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface CoverLetter {
    id: string
    user_id: string
    application_id: string | null
    resume_id: string | null
    title: string
    content: string
    job_description: string | null
    company_name: string | null
    created_at: string
    updated_at: string
}

export function useCoverLetters() {
    const { user } = useAuth()
    const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCoverLetters = useCallback(async () => {
        if (!user) return
        setLoading(true)
        const { data, error } = await (supabase as any)
            .from('cover_letters')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            setError(error.message)
        } else {
            setCoverLetters((data || []) as CoverLetter[])
        }
        setLoading(false)
    }, [user])

    const saveCoverLetter = async (letter: Partial<CoverLetter>) => {
        if (!user) return null
        const { data, error } = await (supabase as any)
            .from('cover_letters')
            .upsert({ ...letter, user_id: user.id, updated_at: new Date().toISOString() })
            .select()
            .single()

        if (error) {
            setError(error.message)
            return null
        } else {
            const savedLetter = data as CoverLetter
            setCoverLetters(prev => {
                const index = prev.findIndex(l => l.id === savedLetter.id)
                if (index > -1) {
                    const updated = [...prev]
                    updated[index] = savedLetter
                    return updated
                }
                return [savedLetter, ...prev]
            })
            return savedLetter
        }
    }

    const deleteCoverLetter = async (id: string) => {
        if (!user) return
        const { error } = await supabase
            .from('cover_letters')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            setError(error.message)
        } else {
            setCoverLetters(prev => prev.filter(l => l.id !== id))
        }
    }

    useEffect(() => {
        fetchCoverLetters()
    }, [fetchCoverLetters])

    return {
        coverLetters,
        loading,
        error,
        saveCoverLetter,
        deleteCoverLetter,
        refresh: fetchCoverLetters
    }
}
