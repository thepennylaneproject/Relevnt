/**
 * ============================================================================
 * CUSTOM HOOK: useResumes
 * ============================================================================
 * ðŸŽ" PURPOSE: Manages all resume data fetching and CRUD operations
 * 
 * This hook handles:
 * - Fetching user's resumes from Supabase
 * - Creating new resumes
 * - Deleting resumes
 * - Setting default resume
 * 
 * ðŸŽ" PATTERN: This is the first of many custom hooks that will abstract
 * away database/API complexity from components, making them cleaner and
 * easier to test.
 * ============================================================================
 */

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Resume data model - matches what's stored in Supabase
 * 
 * ðŸŽ" NOTE: We keep this simple in the hook. The full resume data
 * (work_experience, education, etc.) is stored but we don't load it
 * until specifically requested to keep performance fast.
 */
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

/**
 * Hook return type - everything a component needs to work with resumes
 */
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
  
  // Utilities
  isCreating: boolean
  isDeleting: boolean
  refresh: () => Promise<void>
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * useResumes - Manage user's resumes
 * 
 * Usage:
 * ```tsx
 * const { resumes, loading, error, createResume } = useResumes(user)
 * 
 * const handleCreate = async () => {
 *   const newResume = await createResume('My Resume')
 * }
 * ```
 * 
 * @param user - Supabase User object (required for auth)
 * @returns Hook with resume management capabilities
 */
export function useResumes(user: User): UseResumesReturn {
  // =========================================================================
  // STATE
  // =========================================================================
  
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // =========================================================================
  // FETCH RESUMES
  // =========================================================================
  
  /**
   * Fetch all resumes for the user
   * 
   * ðŸŽ" useCallback: We wrap this in useCallback so components can pass it
   * to other hooks without triggering infinite loops
   */
  const fetchResumes = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('resumes')
        .select(
          `id, 
           user_id, 
           title, 
           is_default, 
           version_number, 
           ats_score, 
           created_at, 
           updated_at`
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (supabaseError) throw supabaseError
      
      setResumes(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch resumes'
      setError(message)
      console.error('Error fetching resumes:', err)
    } finally {
      setLoading(false)
    }
  }, [user.id])
  
  // =========================================================================
  // CREATE RESUME
  // =========================================================================
  
  /**
   * Create a new resume
   * 
   * ðŸŽ" BUSINESS LOGIC: First resume is automatically set as default
   */
  const createResume = useCallback(async (title: string): Promise<Resume | null> => {
    setIsCreating(true)
    setError(null)
    
    try {
      // Validate input
      if (!title.trim()) {
        throw new Error('Resume title cannot be empty')
      }
      
      if (title.length > 100) {
        throw new Error('Resume title must be less than 100 characters')
      }
      
      // First resume is default
      const isFirstResume = resumes.length === 0
      
      const { data, error: supabaseError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          title: title.trim(),
          is_default: isFirstResume,
          version_number: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(
          `id, 
           user_id, 
           title, 
           is_default, 
           version_number, 
           ats_score, 
           created_at, 
           updated_at`
        )
        .single()
      
      if (supabaseError) throw supabaseError
      
      if (data) {
        // ðŸŽ" OPTIMISTIC UPDATE: Add to local state immediately
        // This gives instant feedback to the user
        setResumes([data, ...resumes])
      }
      
      return data || null
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create resume'
      setError(message)
      console.error('Error creating resume:', err)
      return null
    } finally {
      setIsCreating(false)
    }
  }, [user.id, resumes])
  
  // =========================================================================
  // DELETE RESUME
  // =========================================================================
  
  /**
   * Delete a resume
   * 
   * ðŸŽ" SAFETY: Requires explicit ID (prevents accidental deletions)
   */
  const deleteResume = useCallback(async (id: string): Promise<void> => {
    setIsDeleting(true)
    setError(null)
    
    try {
      // Validate input
      if (!id) {
        throw new Error('Resume ID is required')
      }
      
      // Prevent deleting the only resume
      if (resumes.length === 1) {
        throw new Error('You must keep at least one resume')
      }
      
      const { error: supabaseError } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // ðŸŽ" SAFETY: Double-check user_id
      
      if (supabaseError) throw supabaseError
      
      // ðŸŽ" OPTIMISTIC UPDATE: Remove from local state
      setResumes(resumes.filter(r => r.id !== id))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete resume'
      setError(message)
      console.error('Error deleting resume:', err)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }, [user.id, resumes])
  
  // =========================================================================
  // SET DEFAULT RESUME
  // =========================================================================
  
  /**
   * Set a resume as the default one
   * 
   * ðŸŽ" BUSINESS LOGIC: Only one resume can be default at a time
   */
  const setDefaultResume = useCallback(async (id: string): Promise<void> => {
    setError(null)
    
    try {
      // Validate input
      if (!id) {
        throw new Error('Resume ID is required')
      }
      
      // First, set all to false
      const { error: resetError } = await supabase
        .from('resumes')
        .update({ is_default: false })
        .eq('user_id', user.id)
      
      if (resetError) throw resetError
      
      // Then set this one to true
      const { error: setError } = await supabase
        .from('resumes')
        .update({ is_default: true })
        .eq('id', id)
      
      if (setError) throw setError
      
      // ðŸŽ" OPTIMISTIC UPDATE: Update local state
      setResumes(
        resumes.map(r => ({
          ...r,
          is_default: r.id === id
        }))
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set default resume'
      setError(message)
      console.error('Error setting default resume:', err)
      throw err
    }
  }, [user.id, resumes])
  
  // =========================================================================
  // UTILITIES
  // =========================================================================
  
  /**
   * Refresh - convenience method to re-fetch resumes
   * 
   * ðŸŽ" USE CASE: After an operation completes, you might want to ensure
   * your local state is in sync with the database
   */
  const refresh = useCallback(async () => {
    await fetchResumes()
  }, [fetchResumes])
  
  // =========================================================================
  // LIFECYCLE
  // =========================================================================
  
  /**
   * Load resumes when component mounts or user changes
   * 
   * ðŸŽ" REACT PATTERN: useEffect with dependency array ensures we load
   * resumes exactly once when the hook mounts
   */
  useEffect(() => {
    fetchResumes()
  }, [fetchResumes])
  
  // =========================================================================
  // RETURN
  // =========================================================================
  
  return {
    // State
    resumes,
    loading,
    error,
    
    // Actions
    fetchResumes,
    createResume,
    deleteResume,
    setDefaultResume,
    
    // Utilities
    isCreating,
    isDeleting,
    refresh,
  }
}
