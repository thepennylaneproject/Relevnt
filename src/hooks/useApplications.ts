import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export type ApplicationStatus =
  | 'applied'
  | 'in-progress'
  | 'rejected'
  | 'offer'
  | 'accepted'
  | 'withdrawn'

export interface Application {
  id: string
  user_id: string
  job_id?: string | null
  resume_id?: string | null

  company: string
  position: string
  location?: string | null

  status?: ApplicationStatus | null
  cover_letter?: string | null
  notes?: string | null
  salary_expectation?: string | null

  recruiter_name?: string | null
  recruiter_email?: string | null
  recruiter_phone?: string | null

  applied_date: string
  follow_up_date?: string | null
  interview_date?: string | null
  offer_date?: string | null
  response_deadline?: string | null

  created_at: string
  updated_at: string

  cover_letter_draft?: string | null
  cover_letter_final?: string | null
  ats_optimization_applied?: boolean | null
  qa_answers?: any
  estimated_probability?: number | null
  ranking_explanation?: string | null
  ai_suggestions?: any

  job?: {
    id: string
    title: string
    company: string
    location?: string | null
    salary_min?: number | null
    salary_max?: number | null
  }
}

export interface UseApplicationsOptions {
  status?: ApplicationStatus
  limit?: number
  offset?: number
}

export interface UseApplicationsReturn {
  applications: Application[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateStatus: (applicationId: string, status: ApplicationStatus) => Promise<void>
  addNote: (applicationId: string, note: string) => Promise<void>
  createApplication: (jobId: string | null, data: Partial<Application>) => Promise<void>
  deleteApplication: (applicationId: string) => Promise<void>
  statusCounts: Record<ApplicationStatus, number>
  totalCount: number
}

export function useApplications(options: UseApplicationsOptions = {}): UseApplicationsReturn {
  const { user } = useAuth()
  const userId = user?.id

  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusCounts, setStatusCounts] = useState<Record<ApplicationStatus, number>>({
    applied: 0,
    'in-progress': 0,
    rejected: 0,
    offer: 0,
    accepted: 0,
    withdrawn: 0,
  })
  const [totalCount, setTotalCount] = useState(0)

  const { status, limit, offset } = options

  const fetchApplications = useCallback(async () => {
    if (!userId) {
      setApplications([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('applications')
        // If the jobs relationship name is slightly different in Supabase,
        // you can adjust this select string later.
        .select(
          '*, jobs(id, title, company, location, salary_min, salary_max)',
          { count: 'exact' }
        )
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

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      const transformed: Application[] = (data || []).map((app: any) => ({
        id: app.id,
        user_id: app.user_id,
        job_id: app.job_id,
        resume_id: app.resume_id,
        company: app.company,
        position: app.position,
        location: app.location,
        status: app.status as ApplicationStatus | null,
        cover_letter: app.cover_letter,
        notes: app.notes,
        salary_expectation: app.salary_expectation,
        recruiter_name: app.recruiter_name,
        recruiter_email: app.recruiter_email,
        recruiter_phone: app.recruiter_phone,
        applied_date: app.applied_date,
        follow_up_date: app.follow_up_date,
        interview_date: app.interview_date,
        offer_date: app.offer_date,
        response_deadline: app.response_deadline,
        created_at: app.created_at,
        updated_at: app.updated_at,
        cover_letter_draft: app.cover_letter_draft,
        cover_letter_final: app.cover_letter_final,
        ats_optimization_applied: app.ats_optimization_applied,
        qa_answers: app.qa_answers,
        estimated_probability: app.estimated_probability,
        ranking_explanation: app.ranking_explanation,
        ai_suggestions: app.ai_suggestions,
        job: app.jobs
          ? {
            id: app.jobs.id,
            title: app.jobs.title,
            company: app.jobs.company,
            location: app.jobs.location,
            salary_min: app.jobs.salary_min,
            salary_max: app.jobs.salary_max,
          }
          : undefined,
      }))

      setApplications(transformed)
      setTotalCount(count || 0)

      const counts: Record<ApplicationStatus, number> = {
        applied: 0,
        'in-progress': 0,
        rejected: 0,
        offer: 0,
        accepted: 0,
        withdrawn: 0,
      }

      transformed.forEach((a) => {
        const key = a.status as ApplicationStatus | null
        if (key && counts[key] !== undefined) {
          counts[key] = counts[key] + 1
        }
      })

      setStatusCounts(counts)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch applications'
      console.error('Error fetching applications:', err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [userId, status, limit, offset])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const updateStatus = useCallback(
    async (applicationId: string, status: ApplicationStatus) => {
      if (!user) return

      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating application status:', updateError)
        throw updateError
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status } : app,
        ),
      )

      await fetchApplications()
    },
    [user, fetchApplications],
  )

  const addNote = useCallback(
    async (applicationId: string, note: string) => {
      if (!user) return

      const { error: updateError } = await supabase
        .from('applications')
        .update({
          notes: note,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error adding note:', updateError)
        throw updateError
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, notes: note } : app,
        ),
      )
    },
    [user],
  )

  const createApplication = useCallback(
    async (jobId: string | null, data: Partial<Application>) => {
      if (!user) return

      const today = (data.applied_date || new Date().toISOString()).slice(0, 10)

      const payload = {
        user_id: user.id,
        job_id: jobId,
        company: data.company,
        position: data.position,
        location: data.location ?? null,
        status: data.status ?? 'applied',
        applied_date: today,
        notes: data.notes ?? null,
        resume_id: data.resume_id ?? null,
        cover_letter: data.cover_letter ?? null,
        salary_expectation: data.salary_expectation ?? null,
        recruiter_name: data.recruiter_name ?? null,
        recruiter_email: data.recruiter_email ?? null,
        recruiter_phone: data.recruiter_phone ?? null,
        follow_up_date: data.follow_up_date ?? null,
        interview_date: data.interview_date ?? null,
        offer_date: data.offer_date ?? null,
        response_deadline: data.response_deadline ?? null,
      }

      const { error: createError } = await supabase
        .from('applications')
        .insert(payload)

      if (createError) {
        console.error('Error creating application:', createError)
        throw createError
      }

      await fetchApplications()
    },
    [user, fetchApplications],
  )

  const deleteApplication = useCallback(
    async (applicationId: string) => {
      if (!user) return

      const { error: deleteError } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error deleting application:', deleteError)
        throw deleteError
      }

      setApplications((prev) => prev.filter((app) => app.id !== applicationId))
      await fetchApplications()
    },
    [user, fetchApplications],
  )

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
    updateStatus,
    addNote,
    createApplication,
    deleteApplication,
    statusCounts,
    totalCount,
  }
}