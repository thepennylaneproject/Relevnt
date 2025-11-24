// src/hooks/useCareerTracks.ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { CareerTrack } from '../shared/types'

export type UseCareerTracksResult = {
  tracks: CareerTrack[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export default function useCareerTracks(): UseCareerTracksResult {
  const { user } = useAuth()
  const [tracks, setTracks] = useState<CareerTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!user) {
      setTracks([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: dbErr } = await supabase
        .from('career_tracks')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false })

      if (dbErr) {
        throw dbErr
      }

      setTracks((data || []) as CareerTrack[])
    } catch (err) {
      console.error('Failed to load career_tracks', err)
      setError(
        err instanceof Error ? err : new Error('Could not load career tracks')
      )
      setTracks([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  return {
    tracks,
    loading,
    error,
    refresh: load,
  }
}