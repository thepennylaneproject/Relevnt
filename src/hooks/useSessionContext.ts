/**
 * useSessionContext
 *
 * Persists and restores user session context for return visits:
 * - Last visited route
 * - Active persona identifier
 * - Jobs filter settings
 *
 * This ensures users return to meaningful context without having to
 * reconfigure their view each time.
 */

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export interface JobsFilterState {
  source: string
  posted: string
  type: string
  minSalary: number
  remote: boolean
}

export interface SessionContext {
  lastRoute: string | null
  activePersonaId: string | null
  jobsFilters: JobsFilterState | null
  lastUpdated: string | null
}

const DEFAULT_SESSION_CONTEXT: SessionContext = {
  lastRoute: null,
  activePersonaId: null,
  jobsFilters: null,
  lastUpdated: null,
}

const DEFAULT_JOBS_FILTERS: JobsFilterState = {
  source: '',
  posted: '',
  type: '',
  minSalary: 0,
  remote: false,
}

function getStorageKey(userId: string): string {
  return `relevnt_session_context_${userId}`
}

export function useSessionContext() {
  const { user } = useAuth()
  const [context, setContext] = useState<SessionContext>(DEFAULT_SESSION_CONTEXT)
  const [loaded, setLoaded] = useState(false)

  // Load context from localStorage on mount
  useEffect(() => {
    if (!user) {
      setContext(DEFAULT_SESSION_CONTEXT)
      setLoaded(true)
      return
    }

    try {
      const key = getStorageKey(user.id)
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored) as SessionContext
        setContext(parsed)
      }
    } catch (err) {
      console.warn('useSessionContext: failed to load context', err)
    }
    setLoaded(true)
  }, [user])

  // Save context to localStorage
  const saveContext = useCallback((newContext: Partial<SessionContext>) => {
    if (!user) return

    const updated: SessionContext = {
      ...context,
      ...newContext,
      lastUpdated: new Date().toISOString(),
    }

    try {
      const key = getStorageKey(user.id)
      localStorage.setItem(key, JSON.stringify(updated))
      setContext(updated)
    } catch (err) {
      console.warn('useSessionContext: failed to save context', err)
    }
  }, [user, context])

  // Update last visited route
  const setLastRoute = useCallback((route: string) => {
    // Don't save auth-related routes
    if (route === '/login' || route === '/signup' || route === '/') {
      return
    }
    saveContext({ lastRoute: route })
  }, [saveContext])

  // Update active persona
  const setActivePersonaId = useCallback((personaId: string | null) => {
    saveContext({ activePersonaId: personaId })
  }, [saveContext])

  // Update jobs filter state
  const setJobsFilters = useCallback((filters: JobsFilterState) => {
    saveContext({ jobsFilters: filters })
  }, [saveContext])

  // Get jobs filters or return defaults
  const getJobsFilters = useCallback((): JobsFilterState => {
    return context.jobsFilters ?? DEFAULT_JOBS_FILTERS
  }, [context.jobsFilters])

  // Clear all session context
  const clearContext = useCallback(() => {
    if (!user) return
    try {
      const key = getStorageKey(user.id)
      localStorage.removeItem(key)
      setContext(DEFAULT_SESSION_CONTEXT)
    } catch (err) {
      console.warn('useSessionContext: failed to clear context', err)
    }
  }, [user])

  return {
    context,
    loaded,
    setLastRoute,
    setActivePersonaId,
    setJobsFilters,
    getJobsFilters,
    clearContext,
  }
}
