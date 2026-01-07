import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useHelperSettingsSummary } from '../../hooks/useHelperSettingsSummary'
import { MISSING_SETTING_LABELS } from '../../types/helper'

interface InlineQuestionHelperProps {
  questionText: string
  fieldValue: string
  onInsert: (text: string) => void
  jobDescription?: string
  personaId?: string
}

type HelperState = 'idle' | 'loading' | 'active' | 'blocked'

export function InlineQuestionHelper({
  questionText,
  fieldValue,
  onInsert,
  jobDescription,
  personaId,
}: InlineQuestionHelperProps) {
  const { summary, loading: settingsLoading } = useHelperSettingsSummary()
  const [state, setState] = useState<HelperState>('idle')
  const [draft, setDraft] = useState('')
  const helperRef = useRef<HTMLDivElement>(null)

  // Dismiss on click outside
  useEffect(() => {
    if (state !== 'active') return
    const handleClickOutside = (e: MouseEvent) => {
      if (helperRef.current && !helperRef.current.contains(e.target as Node)) {
        dismiss()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [state])

  // Dismiss on Escape
  useEffect(() => {
    if (state !== 'active') return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [state])

  const dismiss = () => {
    setState('idle')
    setDraft('')
  }

  const handleActivate = async () => {
    // Gate: block if settings not configured
    if (!summary?.settings_configured) {
      setState('blocked')
      return
    }

    setState('loading')

    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token

      if (!token) {
        dismiss()
        return
      }

      const res = await fetch('/.netlify/functions/application_helper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: questionText,
          mode: 'default',
          jobDescription: jobDescription || '',
          resumeContext: fieldValue || '',
          personaId: personaId || '',
          settingsSummary: summary,
        })
      })

      const data = await res.json()

      // Handle incomplete settings response from server
      if (data.incomplete_settings) {
        setState('blocked')
        return
      }

      if (!res.ok || !data.ok) {
        dismiss()
        return
      }

      setDraft(data.output?.answer || '')
      setState('active')
    } catch {
      dismiss()
    }
  }

  const handleRewrite = async (mode: 'concise' | 'confident' | 'default') => {
    if (!summary?.settings_configured) {
      setState('blocked')
      return
    }

    setState('loading')

    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token

      if (!token) {
        setState('active')
        return
      }

      const res = await fetch('/.netlify/functions/application_helper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: questionText,
          mode,
          jobDescription: jobDescription || '',
          resumeContext: draft || fieldValue || '',
          personaId: personaId || '',
          settingsSummary: summary,
        })
      })

      const data = await res.json()

      if (data.incomplete_settings) {
        setState('blocked')
        return
      }

      if (!res.ok || !data.ok) {
        setState('active')
        return
      }

      setDraft(data.output?.answer || draft)
      setState('active')
    } catch {
      setState('active')
    }
  }

  const handleInsert = () => {
    onInsert(draft)
    dismiss()
  }

  // Build a one-line echo of active constraints
  const buildConstraintsEcho = (): string => {
    if (!summary) return ''
    const parts: string[] = []

    // Remote preference
    const remote = summary.hard_constraints.remote_preference
    if (remote === 'remote') parts.push('Remote only')
    else if (remote === 'hybrid') parts.push('Hybrid')
    else if (remote === 'onsite') parts.push('Onsite')

    // Seniority
    const seniority = summary.hard_constraints.seniority_levels
    if (seniority.length > 0) {
      parts.push(seniority.join(', '))
    }

    // Salary
    if (summary.hard_constraints.min_salary !== null) {
      const salaryK = Math.round(summary.hard_constraints.min_salary / 1000)
      parts.push(`$${salaryK}K+`)
    }

    // Sponsorship: only show if explicitly set
    if (summary.hard_constraints.needs_sponsorship === true) {
      parts.push('Sponsorship required')
    }

    return parts.length > 0 ? `Using: ${parts.join(', ')}` : ''
  }

  // Loading settings state
  if (settingsLoading) {
    return (
      <span className="type-meta">
        Loading...
      </span>
    )
  }

  // Blocked state: settings not configured
  if (state === 'blocked' || (state === 'idle' && summary && !summary.settings_configured)) {
    const missingLabels = (summary?.missing ?? [])
      .map(key => MISSING_SETTING_LABELS[key])
      .join(', ')

    return (
      <div className="type-meta">
        <strong>Quick setup needed</strong>
        <p style={{ margin: '0.25rem 0' }}>
          To give reliable help, I need a couple settings first: {missingLabels || 'some settings'}. 
          Once those are set, I can answer without guessing.
        </p>
        <Link to="/settings#search-strategy" style={{ textDecoration: 'underline' }}>
          Go to Settings
        </Link>
      </div>
    )
  }

  // Idle state
  if (state === 'idle') {
    return (
      <span
        className="type-meta"
        style={{ cursor: 'pointer' }}
        onClick={handleActivate}
      >
        Need help?
      </span>
    )
  }

  // Loading state
  if (state === 'loading') {
    return (
      <span className="type-meta">
        Drafting...
      </span>
    )
  }

  // Active state
  const constraintsEcho = buildConstraintsEcho()

  return (
    <div ref={helperRef}>
      {constraintsEcho && (
        <span className="type-meta" style={{ display: 'block', marginBottom: '0.25rem', opacity: 0.7 }}>
          {constraintsEcho}
        </span>
      )}
      <textarea
        className="type-body"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        style={{
          width: '100%',
          resize: 'vertical',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          padding: 0,
          margin: '0.5rem 0',
          fontFamily: 'inherit',
        }}
      />
      <span className="type-meta">
        <span
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => handleRewrite('concise')}
        >
          Shorter
        </span>
        {' · '}
        <span
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => handleRewrite('confident')}
        >
          More direct
        </span>
        {' · '}
        <span
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => handleRewrite('default')}
        >
          More conversational
        </span>
        {' · '}
        <span
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={handleInsert}
        >
          Insert
        </span>
      </span>
    </div>
  )
}
