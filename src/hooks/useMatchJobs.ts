// src/hooks/useMatchJobs.ts
import { useCallback, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { MatchResult } from '../shared/types'

export type MatchJobsResult = MatchResult

type MatchJobsApiResponse = {
  matches: MatchJobsResult[]
  count: number
}

export type UseMatchJobsResult = {
  matches: MatchJobsResult[]
  loading: boolean
  error: Error | null
  runMatchJobs: (trackId?: string | null) => Promise<void>
}

export default function useMatchJobs(): UseMatchJobsResult {
  const { user } = useAuth()

  const [matches, setMatches] = useState<MatchJobsResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const runMatchJobs = useCallback(
    async (trackId?: string | null) => {
      if (!user) {
        setError(
          new Error('You need to be signed in to see your personalized feed.')
        )
        setMatches([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set('user_id', user.id)
        if (trackId) {
          params.set('track_id', trackId)
        }

        const url = `/.netlify/functions/match_jobs?${params.toString()}`

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(`match_jobs failed: ${res.status} ${text || res.statusText}`)
        }

        const data = (await res.json()) as MatchJobsApiResponse

        if (!data || !Array.isArray(data.matches)) {
          throw new Error('match_jobs returned an unexpected payload')
        }

        setMatches(data.matches)
      } catch (err) {
        console.error('runMatchJobs error:', err)
        setError(
          err instanceof Error
            ? err
            : new Error('Something went wrong loading your matches.')
        )
        setMatches([])
      } finally {
        setLoading(false)
      }
    },
    [user]
  )

  return {
    matches,
    loading,
    error,
    runMatchJobs,
  }
}