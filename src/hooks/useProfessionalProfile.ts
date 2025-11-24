// src/hooks/useProfessionalProfile.ts
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { ProfessionalProfile } from '../shared/types'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type UseProfessionalProfileResult = {
  profile: ProfessionalProfile | null
  loading: boolean
  saving: boolean
  error: string | null
  saveStatus: SaveStatus
  setField: <K extends keyof ProfessionalProfile>(
    key: K,
    value: ProfessionalProfile[K]
  ) => void
  save: () => Promise<boolean>
}

const createEmptyProfile = (userId: string): ProfessionalProfile => ({
  user_id: userId,

  headline_raw: '',
  headline_polished: null,

  target_roles_raw: '',
  target_roles: [],

  summary_raw: '',
  summary_polished: null,

  top_skills_raw: '',
  top_skills: [],

  links_raw: '',
  links: [],

  work_auth_raw: '',
  needs_sponsorship: null,

  relocate_preference: null,
  relocate_notes: '',

  work_types: [],

  earliest_start_raw: '',

  travel_preference: null,

  evergreen_why_raw: '',
  evergreen_why_polished: null,

  evergreen_strengths_raw: '',
  evergreen_strengths_polished: null,

  created_at: undefined,
  updated_at: undefined,
})

export function useProfessionalProfile(): UseProfessionalProfileResult {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: dbError } = await supabase
        .from('user_professional_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (dbError) {
        console.error('useProfessionalProfile: load error', dbError)
        setError('We could not load your professional profile.')
        setProfile(createEmptyProfile(user.id))
        setLoading(false)
        return
      }

      if (!data) {
        setProfile(createEmptyProfile(user.id))
      } else {
        // basic defensive defaults so undefined does not blow up the UI
        const row = data as ProfessionalProfile
        setProfile({
          ...createEmptyProfile(user.id),
          ...row,
          target_roles: row.target_roles ?? [],
          top_skills: row.top_skills ?? [],
          links: row.links ?? [],
          work_types: row.work_types ?? [],
        })
      }

      setLoading(false)
    }

    load()
  }, [user])

  const setField = useCallback(
    <K extends keyof ProfessionalProfile>(key: K, value: ProfessionalProfile[K]) => {
      setProfile((prev) => {
        if (!prev) return prev
        return { ...prev, [key]: value }
      })
      setSaveStatus('idle')
      setError(null)
    },
    []
  )

  const save = useCallback(async () => {
    if (!user || !profile) return false

    setSaving(true)
    setSaveStatus('saving')
    setError(null)

    const payload: ProfessionalProfile = {
      ...profile,
      user_id: user.id,
    }

    const { error: dbError } = await supabase
      .from('user_professional_profiles')
      .upsert(payload, {
        onConflict: 'user_id',
      })

    setSaving(false)

    if (dbError) {
      console.error('useProfessionalProfile: save error', dbError)
      setError('We could not save your professional profile.')
      setSaveStatus('error')
      return false
    }

    setSaveStatus('saved')
    return true
  }, [user, profile])

  return {
    profile,
    loading,
    saving,
    error,
    saveStatus,
    setField,
    save,
  }
}