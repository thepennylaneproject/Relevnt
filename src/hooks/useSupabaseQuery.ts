// src/hooks/useSupabaseQuery.ts

/**
 * ============================================================================
 * useSupabaseQuery
 * ============================================================================
 *
 * Lightweight generic hook for running a Supabase query from a builder
 * function and managing loading / error / data state.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useSupabaseQuery(
 *     () => supabase.from('jobs').select('*').eq('user_id', userId),
 *     [userId]
 *   )
 *
 * The builder should return an awaitable Supabase query:
 *   () => supabase.from('table').select(...).eq(...)
 * ============================================================================
 */

import { useEffect, useState, useCallback } from 'react'

/**
 * We keep this intentionally loose so it works with Supabase v2's
 * PostgrestFilterBuilder / promise-like objects without fighting TS.
 */
type Builder<T> = () => any

export interface UseSupabaseQueryResult<T> {
  data: T[] | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSupabaseQuery<T = any>(
  builder: Builder<T>,
  deps: any[] = []
): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const runQuery = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Supabase query builders are "thenable", so this works:
      const result = await builder()

      // Support both { data, error } and raw arrays (just in case)
      const responseData = result?.data ?? (Array.isArray(result) ? result : null)
      const responseError = result?.error ?? null

      if (responseError) {
        throw responseError
      }

      setData(responseData ?? [])
    } catch (err: any) {
      const message =
        typeof err?.message === 'string'
          ? err.message
          : 'Failed to load data from Supabase'
      setError(message)
      console.error('useSupabaseQuery error:', err)
    } finally {
      setLoading(false)
    }
  }, [builder])

  useEffect(() => {
    let isActive = true

    const load = async () => {
      await runQuery()
    }

    load()

    return () => {
      // in case we later add abort logic
      isActive = false
    }
  }, [runQuery, ...deps])

  return {
    data,
    loading,
    error,
    refetch: runQuery,
  }
}