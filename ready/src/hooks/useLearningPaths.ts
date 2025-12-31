/**
 * useLearningPaths - Hook for fetching learning path recommendations
 */

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export type LearningPath = {
  id: string
  title: string
  short_description: string
  estimated_minutes: number | null
  skill_slug: string
  difficulty: string | null
  provider?: string
  url?: string
  is_free?: boolean
}

export function useLearningPaths(skillGaps?: string[]) {
  const { user } = useAuth()
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        // If no skill gaps provided, fetch from recent analysis
        let targetSkills = skillGaps || []
        
        if (targetSkills.length === 0) {
          const { data: analysis } = await supabase
            .from('skill_gap_analyses')
            .select('missing_skills')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (analysis?.missing_skills) {
            targetSkills = analysis.missing_skills.slice(0, 5)
          }
        }

        if (targetSkills.length === 0) {
          setPaths([])
          return
        }

        // Fetch learning paths matching skills
        const { data, error: lpError } = await supabase
          .from('learning_paths')
          .select('id, title, short_description, estimated_minutes, skill_slug, difficulty, provider, url, is_free')
          .eq('is_active', true)
          .order('estimated_minutes', { ascending: true })
          .limit(10)

        if (lpError) throw lpError

        // Filter and sort by relevance to skill gaps
        const list = (data as LearningPath[] | null) ?? []
        
        const sortedPaths = list
          .filter(path => 
            targetSkills.some(skill => 
              path.skill_slug?.toLowerCase().includes(skill.toLowerCase()) ||
              path.title?.toLowerCase().includes(skill.toLowerCase())
            )
          )
          .slice(0, 4)

        setPaths(sortedPaths)
      } catch (err) {
        console.error(err)
        setError('Unable to load learning paths right now.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [user, skillGaps])

  return { paths, isLoading, error }
}
