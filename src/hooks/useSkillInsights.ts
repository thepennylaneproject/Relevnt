import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { buildSkillInsights, type SkillInsight } from '../lib/skills'
import { useAuth } from './useAuth'

type MaybeJSON = any[] | null | undefined

// Normalize everything into a flat string[] skill list
const normalize = (input: MaybeJSON): string[] => {
  if (!input) return []
  if (Array.isArray(input)) {
    return input
      .map((v) => {
        if (typeof v === 'string') return v.trim()
        if (typeof v === 'object' && v !== null) {
          // If extracted structure uses objects like { skill: "SQL" }
          if (v.skill) return String(v.skill).trim()
        }
        return null
      })
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
  }
  return []
}

export function useSkillInsights() {
  const { user } = useAuth()
  const [insights, setInsights] = useState<SkillInsight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        //
        // 1. Fetch default resume keywords
        //
        const { data: resumeData } = await supabase
          .from('resumes')
          .select('id, keywords')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle()

        const resumeKeywords = Array.isArray(resumeData?.keywords)
          ? resumeData.keywords.map((s: any) => String(s).trim())
          : []

        //
        // 2. Fetch the latest skill gap analysis (optional)
        //
        const { data: gapData } = await supabase
          .from('skill_gap_analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        //
        // 3. Fetch all saved/interested/applied jobs ONLY selecting REAL columns
        //
        const { data: jobsData, error: jobsErr } = await supabase
          .from('jobs')
          .select(`
            id,
            requirements,
            responsibilities,
            extracted_structure
          `)
          .in('status', ['saved', 'interested', 'applied'])

        if (jobsErr) throw jobsErr

        //
        // 4. Collect skills from every source
        //
        const jobSkills: string[] = []

          ; (jobsData || []).forEach((job: any) => {
            // requirements: jsonb[]
            jobSkills.push(...normalize(job.requirements))

            // responsibilities: jsonb[]
            jobSkills.push(...normalize(job.responsibilities))

            // extracted_structure: jsonb that may contain .skills
            if (job.extracted_structure && Array.isArray(job.extracted_structure.skills)) {
              jobSkills.push(...normalize(job.extracted_structure.skills))
            }
          })

        //
        // 5. Deduplicate + lowercase normalize
        //
        const unifiedJobSkills = Array.from(
          new Set(
            jobSkills.map((s) =>
              String(s)
                .trim()
                .toLowerCase()
            )
          )
        )

        //
        // 6. Build insights using your existing helper
        //
        const insightsResult = buildSkillInsights({
          resumeSkills: resumeKeywords.map((s) => s.toLowerCase()),
          jobSkills: unifiedJobSkills,
          gapAnalysisRow: gapData ?? undefined,
        })

        setInsights(insightsResult)
      } catch (err) {
        console.error(err)
        setError('Unable to load skill insights right now.')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [user])

  return { insights, isLoading, error }
}
