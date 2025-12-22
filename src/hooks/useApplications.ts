
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { ResumeRow } from '../shared/types'

export type ApplicationStatus =
  | 'applied'
  | 'interviewing'
  | 'in-progress'
  | 'rejected'
  | 'offer'
  | 'accepted'
  | 'withdrawn'

export interface ApplicationEvent {
  id: string
  application_id: string
  event_type: string
  title: string
  description?: string | null
  created_at: string
  event_date?: string | null
}

export interface Application {
  id: string
  user_id: string
  job_id?: string | null
  resume_id?: string | null
  resume_snapshot?: any | null
  rejection_analysis?: any | null

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

  offer_details?: any | null
  negotiation_strategy?: string | null
  negotiation_notes?: string | null
  target_salary_min?: number | null
  target_salary_max?: number | null

  created_at: string
  updated_at: string

  events?: ApplicationEvent[]

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
  addEvent: (applicationId: string, type: string, title: string, description?: string) => Promise<void>
  createApplication: (jobId: string | null, data: Partial<Application>) => Promise<void>
  deleteApplication: (applicationId: string) => Promise<void>
  updateApplication: (applicationId: string, data: Partial<Application>) => Promise<void>
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
    interviewing: 0,
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
        .select(
          '*, jobs(id, title, company, location, salary_min, salary_max), application_events(*)',
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

      query = query.order('updated_at', { ascending: false })

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      const transformed: Application[] = (data || []).map((app: any) => ({
        ...app,
        status: app.status as ApplicationStatus | null,
        events: (app.application_events || []).sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).map((e: any) => ({
          id: e.id,
          application_id: e.application_id,
          event_type: e.event_type,
          title: e.title,
          description: e.description,
          created_at: e.created_at,
          event_date: e.event_date
        })),
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
        interviewing: 0,
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
      console.error('Error fetching applications:', err)
      setError('Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }, [userId, status, limit, offset])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const addEvent = useCallback(async (applicationId: string, type: string, title: string, description?: string) => {
    if (!user) return

    const { error: eventError } = await supabase
      .from('application_events')
      .insert({
        application_id: applicationId,
        user_id: user.id,
        event_type: type,
        title: title,
        description: description || null,
        event_date: new Date().toISOString()
      })

    if (eventError) {
      console.error('Error adding event:', eventError)
      throw eventError
    }

    await fetchApplications()
  }, [user, fetchApplications])

  const updateStatus = useCallback(
    async (applicationId: string, newStatus: ApplicationStatus) => {
      if (!user) return

      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating application status:', updateError)
        throw updateError
      }

      await addEvent(applicationId, 'status_change', `Status to ${newStatus}`)
    },
    [user, addEvent],
  )

  const createApplication = useCallback(
    async (jobId: string | null, data: Partial<Application>) => {
      if (!user) return

      const today = (data.applied_date || new Date().toISOString()).slice(0, 10)

      const payload = {
        user_id: user.id,
        job_id: jobId,
        company: data.company!,
        position: data.position!,
        location: data.location ?? null,
        status: data.status ?? 'applied',
        applied_date: today,
        notes: data.notes ?? null,
        resume_id: data.resume_id ?? null,
        resume_snapshot: data.resume_snapshot ?? null,
        rejection_analysis: data.rejection_analysis ?? null,
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

      const { data: newApp, error: createError } = await supabase
        .from('applications')
        .insert(payload)
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating application:', createError)
        throw createError
      }

      if (newApp) {
        await addEvent(newApp.id, 'status_change', `Initial: ${payload.status}`)
      }

      await fetchApplications()
    },
    [user, fetchApplications, addEvent],
  )

  const deleteApplication = useCallback(
    async (applicationId: string) => {
      if (!user) return

      const { error: deleteError } = await (supabase as any)
        .from('applications')
        .delete()
        .eq('id', applicationId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error deleting application:', deleteError)
        throw deleteError
      }

      await fetchApplications()
    },
    [user, fetchApplications]
  )

  const updateApplication = useCallback(
    async (applicationId: string, data: Partial<Application>) => {
      if (!user) return

      const { error: updateError } = await (supabase as any)
        .from('applications')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating application:', updateError)
        throw updateError
      }

      await fetchApplications()
    },
    [user, fetchApplications]
  )

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
    updateStatus,
    addEvent,
    createApplication,
    deleteApplication,
    updateApplication,
    statusCounts,
    totalCount,
  }
}