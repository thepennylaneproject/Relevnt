import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export type JobPreferences = {
  primary_title: string
  related_titles: string[]
  seniority_levels: string[]
  remote_preference: string
  preferred_locations: string[]
  allowed_timezones: string[]

  min_salary: number | null
  salary_currency: string
  salary_unit: 'yearly' | 'hourly'

  exclude_titles: string[]
  exclude_companies: string[]
  exclude_contract_types: string[]
  include_keywords: string[]
  avoid_keywords: string[]

  enable_auto_apply: boolean
  auto_apply_min_match_score: number | null
  auto_apply_max_apps_per_day: number | null
}


type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useJobPreferences(): UseJobPreferencesReturn {
  const { user } = useAuth()

  const [prefs, setPrefs] = useState<JobPreferences | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // sane defaults for a brand-new user
  const buildDefaults = (): JobPreferences => ({
    primary_title: '',
    related_titles: [],
    seniority_levels: [],

    remote_preference: '',
    preferred_locations: [],
    allowed_timezones: [],

    min_salary: null,
    salary_currency: 'USD',
    salary_unit: 'yearly',

    exclude_titles: [],
    exclude_companies: [],
    exclude_contract_types: [],
    include_keywords: [],
    avoid_keywords: [],

    enable_auto_apply: false,
    auto_apply_min_match_score: null,
    auto_apply_max_apps_per_day: null,
  })

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setPrefs(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: loadErr } = await supabase
        .from('user_match_preferences') // ← unified table
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (loadErr) {
        console.warn('Failed to load user_match_preferences', loadErr)
        // fall back to defaults, do not hard-error the UI
        setPrefs(buildDefaults())
        setLoading(false)
        return
      }

      const row = data ?? {}

      const next: JobPreferences = {
        primary_title: row.primary_title ?? '',
        related_titles: row.related_titles ?? [],
        seniority_levels: row.seniority_levels ?? [],

        remote_preference: row.remote_preference ?? '',
        preferred_locations: row.preferred_locations ?? [],
        allowed_timezones: row.allowed_timezones ?? [],

        min_salary:
          typeof row.min_salary === 'number'
            ? row.min_salary
            : row.min_salary != null
              ? Number(row.min_salary)
              : null,

        salary_currency: row.salary_currency ?? 'USD',
        salary_unit: (row.salary_unit as 'yearly' | 'hourly') ?? 'yearly',

        exclude_titles: row.exclude_titles ?? [],
        exclude_companies: row.exclude_companies ?? [],
        exclude_contract_types: row.exclude_contract_types ?? [],
        include_keywords: row.include_keywords ?? [],
        avoid_keywords: row.avoid_keywords ?? [],

        enable_auto_apply: !!row.enable_auto_apply,
        auto_apply_min_match_score:
          row.auto_apply_min_match_score != null
            ? Number(row.auto_apply_min_match_score)
            : null,
        auto_apply_max_apps_per_day:
          row.auto_apply_max_apps_per_day != null
            ? Number(row.auto_apply_max_apps_per_day)
            : null,
      }

      setPrefs(next)
      setLoading(false)
    }

    load()
  }, [user])

  const setField = <K extends keyof JobPreferences>(
    key: K,
    value: JobPreferences[K]
  ) => {
    setSaveStatus('idle')
    setError(null)
    setPrefs((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const save = async () => {
    if (!user || !prefs) return

    setSaving(true)
    setSaveStatus('saving')
    setError(null)

    const payload = {
      user_id: user.id,
      ...prefs,
    }

    const { error: upsertErr } = await supabase
      .from('user_match_preferences') // ← same table
      .upsert(payload, { onConflict: 'user_id' })

    if (upsertErr) {
      console.error('Failed to save user_match_preferences', upsertErr)
      setError('We could not save your job preferences.')
      setSaveStatus('error')
    } else {
      setSaveStatus('saved')
    }

    setSaving(false)
  }

  return {
    prefs,
    loading,
    saving,
    error,
    saveStatus,
    setField,
    save,
  }
}

export type UseJobPreferencesReturn = {
  prefs: JobPreferences | null
  loading: boolean
  saving: boolean
  error: string | null
  saveStatus: SaveStatus
  setField: <K extends keyof JobPreferences>(
    key: K,
    value: JobPreferences[K]
  ) => void
  save: () => Promise<void>
}
