// src/hooks/useLearningPaths.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useSkillInsights } from './useSkillInsights'

export type LearningPath = {
  id: string
  title: string
  short_description: string
  estimated_minutes: number | null
  skill_slug: string
  difficulty: string | null
}

export function useLearningPaths() {
  const { user } = useAuth()
  const { insights, isLoading: insightsLoading } = useSkillInsights()
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const topGapSlugs = insights
          .filter((s) => s.status === 'gap')
          .sort((a, b) => b.demandScore - a.demandScore)
          .slice(0, 5)
          .map((s) => s.slug)

        const { data: prefRow } = await supabase
          .from('user_skill_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        const preferredSlugs: string[] = Array.isArray((prefRow as any)?.preferred_skills)
          ? ((prefRow as any).preferred_skills as string[])
          : []

        const targetSlugs = topGapSlugs.length > 0 ? topGapSlugs : preferredSlugs

        const { data, error: lpError } = await supabase
          .from('learning_paths')
          .select(
            'id, title, short_description, estimated_minutes, skill_slug, difficulty, is_active'
          )
          .eq('is_active', true)
          .in('skill_slug', targetSlugs.length > 0 ? targetSlugs : topGapSlugs)
          .order('estimated_minutes', { ascending: true })

        if (lpError) throw lpError

        const list = (data as LearningPath[] | null) ?? []

        const sorted = list.sort((a, b) => {
          const aDemand = insights.find((s) => s.slug === a.skill_slug)?.demandScore || 0
          const bDemand = insights.find((s) => s.slug === b.skill_slug)?.demandScore || 0

          if (aDemand === bDemand) {
            const aMin = a.estimated_minutes || 0
            const bMin = b.estimated_minutes || 0
            return aMin - bMin
          }

          return bDemand - aDemand
        })

        setPaths(sorted.slice(0, 4))
      } catch (err) {
        console.error(err)
        setError('Unable to load learning paths right now.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [user, insights])

  return { paths, isLoading: isLoading || insightsLoading, error }
}