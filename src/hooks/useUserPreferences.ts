// src/hooks/useUserPreferences.ts
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export type UserPreferences = {
  min_salary: number | null
  remote_preference: '' | 'remote_only' | 'hybrid' | 'onsite'
  preferred_locations: string // simple comma or semicolon separated string
  keywords_include: string
  keywords_exclude: string
  target_titles: string
}

type UseUserPreferencesResult = {
  prefs: UserPreferences | null
  loading: boolean
  saving: boolean
  error: string | null
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>
  resetLocal: () => void
}

type ProfileRow = {
  min_salary: number | null
  remote_preference: 'remote_only' | 'hybrid' | 'onsite' | '' | null
  preferred_locations: string | null
  keywords_include: string | null
  keywords_exclude: string | null
  target_titles: string | null
}

const DEFAULT_PREFS: UserPreferences = {
  min_salary: null,
  remote_preference: '',
  preferred_locations: '',
  keywords_include: '',
  keywords_exclude: '',
  target_titles: '',
}

export function useUserPreferences(): UseUserPreferencesResult {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // load from profiles
  useEffect(() => {
    if (!user) {
      setPrefs(null)
      setError(null)
      setLoading(false)
      setSaving(false)
      return
    }

    let cancelled = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('job_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) {
          console.warn('useUserPreferences: load failed', error)
          if (!cancelled) {
            setError('Could not load your preferences yet.')
            setPrefs({ ...DEFAULT_PREFS })
          }
          return
        }

        if (!cancelled) {
          const next: UserPreferences = {
            min_salary: data?.min_salary ?? null,
            remote_preference: (data?.remote_preference as any) ?? '',
            preferred_locations: (data?.preferred_locations as string[])?.join(', ') ?? '',
            keywords_include: (data?.include_keywords as string[])?.join(', ') ?? '',
            keywords_exclude: (data?.avoid_keywords as string[])?.join(', ') ?? '',
            target_titles: data?.primary_title ?? '',
          }
          setPrefs(next)
        }
      } catch (err) {
        console.warn('useUserPreferences: unexpected error', err)
        if (!cancelled) {
          setError('Something went wrong loading preferences.')
          setPrefs({ ...DEFAULT_PREFS })
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [user])

  const updatePreferences = useCallback(
    async (patch: Partial<UserPreferences>) => {
      if (!user) return

      const current = prefs ?? DEFAULT_PREFS
      const merged: UserPreferences = {
        ...current,
        ...patch,
      }

      // optimistic update
      setPrefs(merged)
      setSaving(true)
      setError(null)

      try {
        const payload = {
          min_salary: merged.min_salary,
          remote_preference: merged.remote_preference || null,
          preferred_locations: merged.preferred_locations ? merged.preferred_locations.split(',').map(s => s.trim()) : [],
          include_keywords: merged.keywords_include ? merged.keywords_include.split(',').map(s => s.trim()) : [],
          avoid_keywords: merged.keywords_exclude ? merged.keywords_exclude.split(',').map(s => s.trim()) : [],
          primary_title: merged.target_titles || null,
        }

        const { error } = await supabase
          .from('job_preferences')
          .update(payload)
          .eq('user_id', user.id)

        if (error) {
          console.warn(
            'useUserPreferences: update failed',
            error
          )
          setError('Could not save your preferences.')
        }
      } catch (err) {
        console.warn(
          'useUserPreferences: unexpected save error',
          err
        )
        setError('Something went wrong saving preferences.')
      } finally {
        setSaving(false)
      }
    },
    [user, prefs]
  )

  const resetLocal = useCallback(() => {
    setPrefs(DEFAULT_PREFS)
    setError(null)
  }, [])

  return {
    prefs,
    loading,
    saving,
    error,
    updatePreferences,
    resetLocal,
  }
}