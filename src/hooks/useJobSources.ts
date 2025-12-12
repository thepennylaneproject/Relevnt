// src/hooks/useJobSources.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Shape taken from your job_sources table
import { Database } from '../lib/database.types'
export type JobSource = Database['public']['Tables']['job_sources']['Row']

interface UseJobSourcesReturn {
  sources: JobSource[]
  loading: boolean
  error: string | null
  updateSource: (id: string, patch: Partial<JobSource>) => Promise<void>
  refetch: () => Promise<void>
}

export function useJobSources(): UseJobSourcesReturn {
  const [sources, setSources] = useState<JobSource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('job_sources')
        .select('*')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      setSources((data ?? []) as JobSource[])
    } catch (err) {
      console.error('Error fetching job sources:', err)
      const msg =
        err instanceof Error ? err.message : 'Failed to load job sources'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSource = useCallback(
    async (id: string, patch: Partial<JobSource>) => {
      try {
        const { error: updateError } = await supabase
          .from('job_sources')
          .update(patch)
          .eq('id', id)

        if (updateError) throw updateError

        // Optimistic local update
        setSources(prev =>
          prev.map(src =>
            src.id === id ? ({ ...src, ...patch } as JobSource) : src
          )
        )
      } catch (err) {
        console.error('Error updating job source:', err)
        throw err
      }
    },
    []
  )

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  return { sources, loading, error, updateSource, refetch: fetchSources }
}