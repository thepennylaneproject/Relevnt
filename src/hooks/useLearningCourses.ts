// src/hooks/useLearningCourses.ts
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

export type LearningCourse = {
  id: string
  providerSlug: string
  providerName?: string | null
  providerUrl?: string | null
  title: string
  shortDescription?: string | null
  url?: string | null
  level?: string | null
  isFree?: boolean | null
  estimatedHours?: number | null
  rating?: number | null
  difficulty?: string | null
  language?: string | null
  skillKey?: string | null
}

type Options =
  | string
  | null
  | {
    skillKey?: string | null
  }

export function useLearningCourses(options?: Options): {
  courses: LearningCourse[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const [courses, setCourses] = useState<LearningCourse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const skillKey = useMemo(() => {
    if (typeof options === 'string' || options === undefined) {
      return options ?? null
    }
    if (options === null) {
      return null
    }
    return options.skillKey ?? null
  }, [options])

  const shouldFetchAll = useMemo(() => {
    if (options === undefined) return true
    if (typeof options === 'object' && options !== null && !('skillKey' in options)) return true
    if (typeof options === 'object' && options !== null && 'skillKey' in options && options.skillKey === undefined) return true
    return false
  }, [options])

  const fetchCourses = useCallback(async () => {
    // If explicitly scoped to a skillKey and none is provided, bail out
    if (skillKey === null && !shouldFetchAll) {
      setCourses([])
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Base query
      let query = supabase.from('learning_courses').select('*')

      if (skillKey) {
        query = query.eq('skill_key', skillKey)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      // Provider metadata for nicer display
      const { data: providers } = await supabase
        .from('learning_providers')
        .select('id, slug, display_name, website_url')

      const rows =
        (data ?? []) as Database['public']['Tables']['learning_courses']['Row'][]

      const mapped: LearningCourse[] = rows.map((row) => ({
        id: row.id,
        providerSlug: row.provider_id || 'provider',
        providerName:
          providers?.find((p) => p.id === row.provider_id)?.display_name ?? null,
        providerUrl:
          providers?.find((p) => p.id === row.provider_id)?.website_url ?? null,
        title: row.title,
        // These columns do not exist in the DB schema anymore,
        // so we keep them nullable on the frontend only.
        shortDescription: null,
        url: row.url,
        level: row.level,
        difficulty: row.level,
        isFree: row.is_free,
        estimatedHours: row.estimated_hours,
        rating: row.rating ?? undefined,
        language: row.language ?? undefined,
        skillKey: row.skill_key,
      }))

      setCourses(mapped)
    } catch (err) {
      console.error(err)
      const message =
        err instanceof Error ? err.message : 'Failed to load courses'
      setError(message)
      setCourses([])
    } finally {
      setIsLoading(false)
    }
  }, [skillKey, shouldFetchAll])

  useEffect(() => {
    void fetchCourses()
  }, [fetchCourses])

  return {
    courses,
    isLoading,
    error,
    refetch: fetchCourses,
  }
}