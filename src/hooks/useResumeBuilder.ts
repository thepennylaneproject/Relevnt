// src/pages/ResumeBuilder/hooks/useResumeBuilder.ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase' // TODO: adjust path if needed

import {
  ResumeDraft,
  ResumeContact,
  ResumeSummary,
  ResumeSkillGroup,
  ResumeExperienceItem,
  ResumeEducationItem,
  ResumeCertificationItem,
  ResumeProjectItem,
} from '../types/resume-builder.types' // TODO: adjust path to your shared types

export type ResumeBuilderStatus = 'idle' | 'loading' | 'saving' | 'error'

interface UseResumeBuilderOptions {
  resumeId?: string
  supabaseClient?: SupabaseClient
  autosaveDelayMs?: number
}

const EMPTY_CONTACT: ResumeContact = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  headline: '',
  links: [],
}

const EMPTY_SUMMARY: ResumeSummary = {
  headline: '',
  summary: '',
}

const createEmptyDraft = (id?: string): ResumeDraft => ({
  id,
  contact: EMPTY_CONTACT,
  summary: EMPTY_SUMMARY,
  skillGroups: [],
  experience: [],
  education: [],
  certifications: [],
  projects: [],
  lastUpdatedAt: new Date().toISOString(),
})

export interface UseResumeBuilderResult {
  draft: ResumeDraft
  setDraft: (updater: (prev: ResumeDraft) => ResumeDraft) => void
  status: ResumeBuilderStatus
  error: string | null
  lastSavedAt: string | null
  isDirty: boolean
  updateContact: (contact: Partial<ResumeContact>) => void
  updateSummary: (summary: Partial<ResumeSummary>) => void
  setSkillGroups: (groups: ResumeSkillGroup[]) => void
  setExperience: (items: ResumeExperienceItem[]) => void
  setEducation: (items: ResumeEducationItem[]) => void
  setCertifications: (items: ResumeCertificationItem[]) => void
  setProjects: (items: ResumeProjectItem[]) => void
  manualSave: () => Promise<void>
}

/**
 * useResumeBuilder
 *
 * Source of truth for ResumeDraft. Loads/saves from/to Supabase
 * resumes.parsed_fields and manages autosave.
 */
export const useResumeBuilder = (
  options: UseResumeBuilderOptions = {}
): UseResumeBuilderResult => {
  const { resumeId, supabaseClient = supabase, autosaveDelayMs = 1500 } = options

  const [draft, internalSetDraft] = useState<ResumeDraft>(() => createEmptyDraft(resumeId))
  const [status, setStatus] = useState<ResumeBuilderStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const autosaveTimerRef = useRef<number | null>(null)
  const isInitialLoadRef = useRef(true)

  // Load existing resume from Supabase if id is provided
  useEffect(() => {
    const load = async () => {
      if (!resumeId) return
      setStatus('loading')

      const { data, error } = await supabaseClient
        .from('resumes')
        .select('id, parsed_fields, updated_at')
        .eq('id', resumeId)
        .single()

      if (error) {
        // If there is no existing row, just use an empty draft and let creation
        // happen on first save.
        console.error('Error loading resume draft', error)
        setError(error.message)
        setStatus('error')
        return
      }

      const parsedFields = (data?.parsed_fields ?? {}) as Partial<ResumeDraft>

      const loadedDraft: ResumeDraft = {
        ...createEmptyDraft(data.id),
        ...parsedFields,
        id: data.id,
        lastUpdatedAt: data.updated_at || new Date().toISOString(),
      }

      internalSetDraft(loadedDraft)
      setLastSavedAt(data.updated_at ?? new Date().toISOString())
      setStatus('idle')
      isInitialLoadRef.current = false
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId])

  const markDirtyAndSetDraft = useCallback((updater: (prev: ResumeDraft) => ResumeDraft) => {
    internalSetDraft((prev) => {
      const next = updater(prev)
      setIsDirty(true)
      return {
        ...next,
        lastUpdatedAt: new Date().toISOString(),
      }
    })
  }, [])

  const manualSave = useCallback(async () => {
    if (!resumeId) return
    setStatus('saving')
    setError(null)

    const payload = {
      parsed_fields: draft as any,
    }

    const { error: upsertError } = await supabaseClient
      .from('resumes')
      .update(payload)
      .eq('id', resumeId)

    if (upsertError) {
      console.error('Error saving resume draft', upsertError)
      setError(upsertError.message)
      setStatus('error')
      return
    }

    setStatus('idle')
    setIsDirty(false)
    const now = new Date().toISOString()
    setLastSavedAt(now)

    internalSetDraft((prev) => ({
      ...prev,
      lastUpdatedAt: now,
    }))
  }, [draft, resumeId, supabaseClient])

  // Autosave on draft changes
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      return
    }
    if (!resumeId) return
    if (!isDirty) return

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current)
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      manualSave().catch((err) => {
        console.error('Autosave failed', err)
      })
    }, autosaveDelayMs)

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [draft, isDirty, resumeId, autosaveDelayMs, manualSave])

  const updateContact = useCallback((contact: Partial<ResumeContact>) => {
    markDirtyAndSetDraft((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        ...contact,
      },
    }))
  }, [markDirtyAndSetDraft])

  const updateSummary = useCallback((summary: Partial<ResumeSummary>) => {
    markDirtyAndSetDraft((prev) => ({
      ...prev,
      summary: {
        ...prev.summary,
        ...summary,
      },
    }))
  }, [markDirtyAndSetDraft])

  const setSkillGroups = useCallback((groups: ResumeSkillGroup[]) => {
    markDirtyAndSetDraft((prev) => ({
      ...prev,
      skillGroups: groups,
    }))
  }, [markDirtyAndSetDraft])

  const setExperience = useCallback((items: ResumeExperienceItem[]) => {
    markDirtyAndSetDraft((prev) => ({
      ...prev,
      experience: items,
    }))
  }, [markDirtyAndSetDraft])

  const setEducation = useCallback((items: ResumeEducationItem[]) => {
    markDirtyAndSetDraft((prev) => ({
      ...prev,
      education: items,
    }))
  }, [markDirtyAndSetDraft])

  const setCertifications = useCallback((items: ResumeCertificationItem[]) => {
    markDirtyAndSetDraft((prev) => ({
      ...prev,
      certifications: items,
    }))
  }, [markDirtyAndSetDraft])

  const setProjects = useCallback((items: ResumeProjectItem[]) => {
    markDirtyAndSetDraft((prev) => ({
      ...prev,
      projects: items,
    }))
  }, [markDirtyAndSetDraft])

  return {
    draft,
    setDraft: markDirtyAndSetDraft,
    status,
    error,
    lastSavedAt,
    isDirty,
    updateContact,
    updateSummary,
    setSkillGroups,
    setExperience,
    setEducation,
    setCertifications,
    setProjects,
    manualSave,
  }
}