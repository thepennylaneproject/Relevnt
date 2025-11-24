import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export type JobStatus =
  | 'saved'
  | 'interested'
  | 'applied'
  | 'none'
  | null

export interface Job {
  id: string
  user_id: string
  title: string
  company: string
  location?: string
  job_type?: string
  salary_range?: string
  description?: string
  requirements?: any
  responsibilities?: any
  benefits?: any
  external_job_id?: string
  external_source?: string
  external_url?: string
  company_logo_url?: string
  match_score?: number
  match_reasons?: any
  status: JobStatus
  posted_date?: string
  saved_date?: string
  created_at: string
  updated_at: string
  ranking_score?: number
  probability_estimate?: number
  extracted_structure?: any
  dedup_key?: string
  source_url?: string
  original_posting_url?: string
  competitiveness_level?: string
  is_official?: boolean
  url?: string
  salary_min?: number
  salary_max?: number
}

export interface UseJobsOptions {
  status?: JobStatus
  limit?: number
  offset?: number
}

export interface UseJobsReturn {
  jobs: Job[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  saveJob: (jobId: string) => Promise<void>
  unsaveJob: (jobId: string) => Promise<void>
  setStatus: (jobId: string, status: JobStatus) => Promise<void>
}

export function useJobs(options: UseJobsOptions = {}): UseJobsReturn {
  const { user } = useAuth()
  const userId = user?.id

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { status, limit, offset } = options

  const fetchJobs = useCallback(async () => {
    if (!userId) {
      setJobs([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)

      if (status) {
        query = query.eq('status', status)
      }

      if (limit) {
        query = query.limit(limit)
      }

      if (offset !== undefined && limit !== undefined) {
        query = query.range(offset, offset + limit - 1)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setJobs((data || []) as Job[])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch jobs'
      console.error('Error fetching jobs:', err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [userId, status, limit, offset])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Save job
  const saveJob = useCallback(
    async (jobId: string) => {
      if (!user) return

      const { error } = await supabase
        .from('jobs')
        .update({
          status: 'saved',
          saved_date: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('user_id', user.id)

      if (error) throw error

      await fetchJobs()
    },
    [user, fetchJobs],
  )

  // Unsave job
  const unsaveJob = useCallback(
    async (jobId: string) => {
      if (!user) return

      const { error } = await supabase
        .from('jobs')
        .update({
          status: null,
          saved_date: null,
        })
        .eq('id', jobId)
        .eq('user_id', user.id)

      if (error) throw error

      await fetchJobs()
    },
    [user, fetchJobs],
  )

  // General status setter
  const setStatus = useCallback(
    async (jobId: string, status: JobStatus) => {
      if (!user) return

      const { error } = await supabase
        .from('jobs')
        .update({ status })
        .eq('id', jobId)
        .eq('user_id', user.id)

      if (error) throw error

      await fetchJobs()
    },
    [user, fetchJobs],
  )

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
    saveJob,
    unsaveJob,
    setStatus,
  }
}