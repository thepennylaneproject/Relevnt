import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

export type SkillGap = {
  skill_key: string
  job_count: number
  priority: number | null
  explanation: string | null
}

export function useSkillGaps(userId?: string) {
  const [data, setData] = useState<SkillGap[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!userId) return
      setIsLoading(true)
      setError(null)
      try {
        const { data: rows, error: err } = await supabase
          .from('skill_gap_analyses')
          .select('*')
          .eq('user_id', userId)

        if (err) throw err

        type Row = Database['public']['Tables']['skill_gap_analyses']['Row']

        const grouped: Record<
          string,
          { jobIds: Set<string>; priority: number | null; explanation: string | null }
        > = {}

          ; (rows as Row[] | null)?.forEach((row) => {
            const key = row.skill_key
            if (!key) return

            const gaps = row.gaps as any
            const priority =
              gaps && typeof gaps.priority === 'number' ? gaps.priority : null
            const explanation =
              gaps && typeof gaps.explanation === 'string' ? gaps.explanation : null

            const existing =
              grouped[key] ||
              {
                jobIds: new Set<string>(),
                priority,
                explanation,
              }

            if (row.job_id) existing.jobIds.add(row.job_id)

            if (
              priority != null &&
              (existing.priority == null || priority < existing.priority)
            ) {
              existing.priority = priority
              existing.explanation = explanation ?? existing.explanation
            }

            grouped[key] = existing
          })

        const result: SkillGap[] = Object.entries(grouped).map(([skill, meta]) => ({
          skill_key: skill,
          job_count: meta.jobIds.size,
          priority: meta.priority,
          explanation: meta.explanation,
        }))

        result.sort((a, b) => {
          const pa = a.priority ?? 99
          const pb = b.priority ?? 99
          if (pa !== pb) return pa - pb
          return a.skill_key.localeCompare(b.skill_key)
        })

        setData(result)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load skill gaps')
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [userId])

  return { data, isLoading, error }
}