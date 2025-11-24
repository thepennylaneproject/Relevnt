/**
 * ============================================================================
 * CUSTOM HOOK: useResumes
 * ============================================================================
 * 🎓 PURPOSE: Manages all resume data fetching and CRUD operations
 *
 * This hook handles:
 * - Fetching user's resumes from Supabase
 * - Creating new resumes
 * - Deleting resumes
 * - Setting default resume
 *
 * PATTERN: This abstracts DB/API logic away from components so they stay clean.
 * ============================================================================
 */

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Resume {
  id: string
  user_id: string
  title: string
  is_default: boolean
  version_number: number
  ats_score: number | null
  created_at: string
  updated_at: string
}

export interface UseResumesReturn {
  // State
  resumes: Resume[]
  loading: boolean
  error: string | null

  // Actions
  fetchResumes: () => Promise<void>
  createResume: (title: string) => Promise<Resume | null>
  deleteResume: (id: string) => Promise<void>
  setDefaultResume: (id: string) => Promise<void>
  updateResumeTitle: (id: string, title: string) => Promise<void>

  // Utilities
  isCreating: boolean
  isDeleting: boolean
  refresh: () => Promise<void>
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useResumes(user: User): UseResumesReturn {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // =========================================================================
  // FETCH RESUMES
  // =========================================================================

  const fetchResumes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: supabaseError } = await supabase
        .from('resumes')
        .select(
          `
          id,
          user_id,
          title,
          is_default,
          version_number,
          ats_score,
          created_at,
          updated_at
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError

      setResumes((data as Resume[]) || [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch resumes'
      setError(message)
      console.error('Error fetching resumes:', err)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  // =========================================================================
  // CREATE RESUME
  // =========================================================================

  const createResume = useCallback(
    async (title: string): Promise<Resume | null> => {
      setIsCreating(true)
      setError(null)

      try {
        if (!title.trim()) {
          throw new Error('Resume title cannot be empty')
        }

        if (title.length > 100) {
          throw new Error('Resume title must be less than 100 characters')
        }

        const isFirstResume = resumes.length === 0

        const { data, error: supabaseError } = await supabase
          .from('resumes')
          .insert({
            user_id: user.id,
            title: title.trim(),
            is_default: isFirstResume,
            version_number: 1,
          })
          .select(
            `
            id,
            user_id,
            title,
            is_default,
            version_number,
            ats_score,
            created_at,
            updated_at
          `
          )
          .single()

        if (supabaseError) throw supabaseError

        if (data) {
          setResumes((prev) => [data as Resume, ...prev])
        }

        return (data as Resume) || null
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create resume'
        setError(message)
        console.error('Error creating resume:', err)
        return null
      } finally {
        setIsCreating(false)
      }
    },
    [user.id, resumes]
  )

  // =========================================================================
  // DELETE RESUME
  // =========================================================================

  const deleteResume = useCallback(
    async (id: string): Promise<void> => {
      setIsDeleting(true)
      setError(null)

      try {
        if (!id) {
          throw new Error('Resume ID is required')
        }

        if (resumes.length === 1) {
          throw new Error('You must keep at least one resume')
        }

        const { error: supabaseError } = await supabase
          .from('resumes')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (supabaseError) throw supabaseError

        setResumes((prev) => prev.filter((r) => r.id !== id))
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete resume'
        setError(message)
        console.error('Error deleting resume:', err)
        throw err
      } finally {
        setIsDeleting(false)
      }
    },
    [user.id, resumes]
  )

  // =========================================================================
  // UPDATE RESUME TITLE
  // =========================================================================

  const updateResumeTitle = useCallback(
    async (id: string, title: string): Promise<void> => {
      setError(null)
      try {
        if (!id) {
          throw new Error('Resume ID is required')
        }

        if (!title.trim()) {
          throw new Error('Resume title cannot be empty')
        }

        const { error: supabaseError } = await supabase
          .from('resumes')
          .update({ title: title.trim() })
          .eq('id', id)
          .eq('user_id', user.id)

        if (supabaseError) throw supabaseError

        setResumes((prev) =>
          prev.map((r) => (r.id === id ? { ...r, title: title.trim() } : r))
        )
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update resume'
        setError(message)
        console.error('Error updating resume:', err)
        throw err
      }
    },
    [user.id]
  )

  // =========================================================================
  // SET DEFAULT RESUME
  // =========================================================================

  const setDefaultResume = useCallback(
    async (id: string): Promise<void> => {
      setError(null)

      try {
        if (!id) {
          throw new Error('Resume ID is required')
        }

        // Reset all to false for this user
        const { error: resetError } = await supabase
          .from('resumes')
          .update({ is_default: false })
          .eq('user_id', user.id)

        if (resetError) throw resetError

        // Set requested resume as default (scoped to user for safety)
        const { error: setDefaultError } = await supabase
          .from('resumes')
          .update({ is_default: true })
          .eq('id', id)
          .eq('user_id', user.id)

        if (setDefaultError) throw setDefaultError

        setResumes((prev) =>
          prev.map((r) => ({
            ...r,
            is_default: r.id === id,
          }))
        )
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to set default resume'
        setError(message)
        console.error('Error setting default resume:', err)
        throw err
      }
    },
    [user.id]
  )

  // =========================================================================
  // UTILITIES
  // =========================================================================

  const refresh = useCallback(async () => {
    await fetchResumes()
  }, [fetchResumes])

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  useEffect(() => {
    fetchResumes()
  }, [fetchResumes])

  return {
    resumes,
    loading,
    error,
    fetchResumes,
    createResume,
    deleteResume,
    setDefaultResume,
    updateResumeTitle,
    isCreating,
    isDeleting,
    refresh,
  }
}