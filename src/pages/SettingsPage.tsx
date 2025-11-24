import React, { CSSProperties, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../components/shared/Container'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  ProfileIcon,
  PreferencesIcon,
  NotificationsIcon,
} from '../components/icons/RelevntIcons'
import {
  useRelevntColors,
  useProfileSettings,
  type ProfileSettings,
  type ThemePreference,
  type LayoutDensity,
} from '../hooks'

type FieldChange = <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => void

const timezones = [
  'Use system default',
  'America/Chicago',
  'America/New_York',
  'America/Los_Angeles',
  'America/Denver',
  'UTC',
]

const SectionCard: React.FC<{
  icon: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode
}> = ({ icon, title, subtitle, children }) => {
  const colors = useRelevntColors()
  const card: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 1fr) 2fr',
    gap: 16,
    padding: '16px 16px 14px',
    borderRadius: 16,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.borderLight}`,
  }

  const header: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }

  const titleStyles: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 15,
    fontWeight: 600,
    color: colors.text,
  }

  const subtitleStyles: CSSProperties = {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 1.5,
  }

  return (
    <article style={card}>
      <div style={header}>
        <div style={titleStyles}>
          {icon}
          <span>{title}</span>
        </div>
        <p style={subtitleStyles}>{subtitle}</p>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>{children}</div>
    </article>
  )
}

const Field: React.FC<{
  label: string
  children: React.ReactNode
  helper?: string
}> = ({ label, children, helper }) => {
  const colors = useRelevntColors()
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{label}</span>
      {children}
      {helper && <span style={{ fontSize: 12, color: colors.textSecondary }}>{helper}</span>}
    </label>
  )
}

const ToggleRow: React.FC<{
  label: string
  helper?: string
  checked: boolean
  onChange: (value: boolean) => void
}> = ({ label, helper, checked, onChange }) => {
  const colors = useRelevntColors()
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, marginTop: 3 }}
      />
      <div style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 13, color: colors.text, fontWeight: 600 }}>{label}</span>
        {helper && <span style={{ fontSize: 12, color: colors.textSecondary }}>{helper}</span>}
      </div>
    </label>
  )
}

export default function SettingsPage(): JSX.Element {
  const colors = useRelevntColors()
  const { user } = useAuth()
  const { settings, isLoading, saving, error, saveError, saveSettings } = useProfileSettings()
  const [form, setForm] = useState<ProfileSettings | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [skillStatus, setSkillStatus] = useState<'idle' | 'saved' | 'error' | 'saving'>('idle')
  const [skillPrefs, setSkillPrefs] = useState<{
    focusSkills: string[]
    avoidSkills: string[]
    learningStyle: 'quick_hits' | 'video' | 'reading' | 'projects' | ''
  }>({ focusSkills: [], avoidSkills: [], learningStyle: '' })
  const [skillDrafts, setSkillDrafts] = useState<{ focus: string; avoid: string }>({ focus: '', avoid: '' })

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  useEffect(() => {
    const loadSkillPrefs = async () => {
      if (!user) return
      const { data, error: prefError } = await supabase
        .from('user_skill_preferences')
        .select('focus_skills, avoid_skills, learning_style')
        .eq('user_id', user.id)
        .maybeSingle()

      if (prefError) {
        console.error(prefError)
        return
      }
      const focus = (data?.focus_skills as string[] | null) ?? []
      const avoid = (data?.avoid_skills as string[] | null) ?? []
      const style = (data?.learning_style as string | null) ?? ''
      setSkillPrefs({
        focusSkills: focus,
        avoidSkills: avoid,
        learningStyle: style as any,
      })
    }
    loadSkillPrefs()
  }, [user])

  const handleChange: FieldChange = (key, value) => {
    if (!form) return
    setStatus('idle')
    setForm({ ...form, [key]: value })
  }

  const handleSave = async () => {
    if (!form) return
    setStatus('saving')
    const ok = await saveSettings(form)
    setStatus(ok ? 'saved' : 'error')
  }

  const addChip = (type: 'focusSkills' | 'avoidSkills') => {
    const draft = type === 'focusSkills' ? skillDrafts.focus : skillDrafts.avoid
    const trimmed = draft.trim()
    if (!trimmed) return
    setSkillPrefs((prev) => ({
      ...prev,
      [type]: [...prev[type], trimmed],
    }))
    setSkillDrafts((d) => ({ ...d, [type === 'focusSkills' ? 'focus' : 'avoid']: '' }))
    setSkillStatus('idle')
  }

  const removeChip = (type: 'focusSkills' | 'avoidSkills', value: string) => {
    setSkillPrefs((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item !== value),
    }))
    setSkillStatus('idle')
  }

  const handleSkillSave = async () => {
    if (!user) return
    setSkillStatus('saving')
    const { error: saveErr } = await supabase
      .from('user_skill_preferences')
      .upsert({
        user_id: user.id,
        focus_skills: skillPrefs.focusSkills,
        avoid_skills: skillPrefs.avoidSkills,
        learning_style: skillPrefs.learningStyle || null,
      })

    if (saveErr) {
      console.error(saveErr)
      setSkillStatus('error')
      return
    }
    setSkillStatus('saved')
  }

  const wrapper: CSSProperties = {
    flex: 1,
    backgroundColor: colors.background,
  }

  const pageHeader: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  }

  const titleRow: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  }

  const title: CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: colors.text,
  }

  const subtitle: CSSProperties = {
    fontSize: 13,
    color: colors.textSecondary,
    maxWidth: 540,
  }

  const badge: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 10px',
    borderRadius: 999,
    border: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surfaceHover,
    fontSize: 11,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: colors.textSecondary,
  }

  if (isLoading || !form) {
    return (
      <div style={wrapper}>
        <Container maxWidth="lg" padding="md">
          <div style={{ ...pageHeader }}>
            <div style={titleRow}>
              <div style={{ width: 180, height: 20, backgroundColor: colors.surfaceHover, borderRadius: 8 }} />
              <div style={{ width: 260, height: 14, backgroundColor: colors.surfaceHover, borderRadius: 8 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ height: 140, borderRadius: 16, backgroundColor: colors.surfaceHover }} />
            <div style={{ height: 140, borderRadius: 16, backgroundColor: colors.surfaceHover }} />
            <div style={{ height: 140, borderRadius: 16, backgroundColor: colors.surfaceHover }} />
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div style={wrapper}>
      <Container maxWidth="lg" padding="md">
        <header style={pageHeader}>
          <div style={titleRow}>
            <h1 style={title}>Settings</h1>
            <p style={subtitle}>
              Tune how Relevnt works for you. We keep things simple, honest, and in your control.
            </p>

            {/* Quick links to other preference pages */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 8,
              }}
            >
              <Link
                to="/job-preferences"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: `1px solid ${colors.borderLight}`,
                  backgroundColor: colors.surface,
                  color: colors.text,
                  fontSize: 11,
                  textDecoration: 'none',
                }}
              >
                <PreferencesIcon size={14} strokeWidth={1.6} />
                <span>Job preferences</span>
              </Link>

              <Link
                to="/profile/professional"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: `1px solid ${colors.borderLight}`,
                  backgroundColor: colors.surface,
                  color: colors.text,
                  fontSize: 11,
                  textDecoration: 'none',
                }}
              >
                <ProfileIcon size={14} strokeWidth={1.6} />
                <span>Professional profile</span>
              </Link>

              <Link
                to="/voice"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: `1px solid ${colors.borderLight}`,
                  backgroundColor: colors.surface,
                  color: colors.text,
                  fontSize: 11,
                  textDecoration: 'none',
                }}
              >
                <NotificationsIcon size={14} strokeWidth={1.6} />
                <span>Voice profile</span>
              </Link>
            </div>
          </div>

          <div style={badge}>
            <PreferencesIcon size={16} strokeWidth={1.6} />
            <span>Preferences</span>
          </div>
        </header>

        <div style={{ display: 'grid', gap: 12 }}>
          <article
            style={{
              display: 'grid',
              padding: '16px 16px 14px',
              borderRadius: 16,
              backgroundColor: colors.surface,
              border: `1px solid ${colors.borderLight}`,
            }}
          >
            <div className="rl-field-grid">
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: colors.text }}>
                  <ProfileIcon size={18} strokeWidth={1.7} />
                  <span>Profile & account</span>
                </div>
                <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>
                  Basic details to personalize recommendations and copy.
                </p>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <label className="rl-label">
                  Full name
                  <input
                    className="rl-input"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="Full legal name"
                  />
                </label>

                <label className="rl-label">
                  Preferred name
                  <input
                    className="rl-input"
                    type="text"
                    value={form.preferredName}
                    onChange={(e) => handleChange('preferredName', e.target.value)}
                    placeholder="What should we call you?"
                  />
                </label>

                <div>
                  <label className="rl-label">
                    Location
                    <input
                      className="rl-input"
                      type="text"
                      value={form.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="Seattle, WA, United States"
                    />
                  </label>
                  <div className="rl-help">
                    We use this to localize roles, salaries, and suggestions. No spam, no sharing.
                  </div>
                </div>

                <label className="rl-label">
                  Timezone
                  <select
                    className="rl-select"
                    value={form.timezone || 'Use system default'}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz === 'Use system default' ? '' : tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rl-label">
                  Current role title
                  <input
                    className="rl-input"
                    type="text"
                    value={form.currentRoleTitle}
                    onChange={(e) => handleChange('currentRoleTitle', e.target.value)}
                    placeholder="e.g., Product Marketing Manager"
                  />
                </label>
              </div>
            </div>
          </article>

          <SectionCard
            icon={<PreferencesIcon size={18} strokeWidth={1.7} />}
            title="How Relevnt behaves"
            subtitle="Set your theme and how tightly we pack information on screen."
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <Field label="Theme preference" helper="You can still toggle in the header. This sets your default.">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(['system', 'light', 'dark'] as ThemePreference[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleChange('themePreference', option)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        border:
                          form.themePreference === option
                            ? `1px solid ${colors.primary}`
                            : `1px solid ${colors.borderLight}`,
                        backgroundColor:
                          form.themePreference === option ? colors.surfaceHover : colors.surface,
                        color: colors.text,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Layout density" helper="Compact mode squeezes more data into view for power browsing.">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(['cozy', 'compact'] as LayoutDensity[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleChange('layoutDensity', option)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        border:
                          form.layoutDensity === option
                            ? `1px solid ${colors.primary}`
                            : `1px solid ${colors.borderLight}`,
                        backgroundColor:
                          form.layoutDensity === option ? colors.surfaceHover : colors.surface,
                        color: colors.text,
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {option === 'cozy' ? 'Cozy' : 'Compact'}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </SectionCard>

          <article
            style={{
              display: 'grid',
              padding: '16px 16px 14px',
              borderRadius: 16,
              backgroundColor: colors.surface,
              border: `1px solid ${colors.borderLight}`,
            }}
          >
            <div className="rl-field-grid">
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: colors.text }}>
                  <PreferencesIcon size={18} strokeWidth={1.7} />
                  <span>Skills & growth</span>
                </div>
                <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>
                  Tell us what you want to get better at, and what to avoid in job suggestions.
                </p>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label className="rl-label">
                    Skills you’re actively growing
                    <input
                      className="rl-input"
                      type="text"
                      value={skillDrafts.focus}
                      onChange={(e) => setSkillDrafts({ ...skillDrafts, focus: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addChip('focusSkills')
                        }
                      }}
                      placeholder="Add skills one by one"
                    />
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {skillPrefs.focusSkills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 10px',
                          borderRadius: 999,
                          border: `1px solid ${colors.borderLight}`,
                          backgroundColor: colors.surfaceHover,
                          fontSize: 12,
                          color: colors.text,
                        }}
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeChip('focusSkills', skill)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: colors.textSecondary,
                            cursor: 'pointer',
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="rl-label">
                    Skills you’d rather avoid
                    <input
                      className="rl-input"
                      type="text"
                      value={skillDrafts.avoid}
                      onChange={(e) => setSkillDrafts({ ...skillDrafts, avoid: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addChip('avoidSkills')
                        }
                      }}
                      placeholder="Add skills one by one"
                    />
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {skillPrefs.avoidSkills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 10px',
                          borderRadius: 999,
                          border: `1px solid ${colors.borderLight}`,
                          backgroundColor: colors.surfaceHover,
                          fontSize: 12,
                          color: colors.text,
                        }}
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeChip('avoidSkills', skill)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: colors.textSecondary,
                            cursor: 'pointer',
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="rl-label" style={{ marginBottom: 6 }}>
                    Learning style
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      { value: 'quick_hits', label: 'Quick hits (under 1 hour)' },
                      { value: 'video', label: 'Video first' },
                      { value: 'reading', label: 'Reading & deep dives' },
                      { value: 'projects', label: 'Projects & practice' },
                    ].map((opt) => {
                      const active = skillPrefs.learningStyle === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setSkillPrefs((prev) => ({ ...prev, learningStyle: opt.value as any }))
                          }
                          style={{
                            padding: '8px 12px',
                            borderRadius: 999,
                            border: active ? `1px solid ${colors.primary}` : `1px solid ${colors.borderLight}`,
                            backgroundColor: active ? colors.surfaceHover : colors.surface,
                            color: colors.text,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleSkillSave}
                    disabled={skillStatus === 'saving'}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 999,
                      border: 'none',
                      backgroundColor: colors.primary,
                      color: colors.text,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: skillStatus === 'saving' ? 'not-allowed' : 'pointer',
                      opacity: skillStatus === 'saving' ? 0.7 : 1,
                    }}
                  >
                    {skillStatus === 'saving' ? 'Saving…' : 'Save skill preferences'}
                  </button>
                  {skillStatus === 'saved' && (
                    <span style={{ fontSize: 12, color: colors.textSecondary }}>Saved</span>
                  )}
                  {skillStatus === 'error' && (
                    <span style={{ fontSize: 12, color: colors.error }}>
                      We couldn't save. Try again.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </article>

          <SectionCard
            icon={<NotificationsIcon size={18} strokeWidth={1.7} />}
            title="Notifications & privacy"
            subtitle="Control what reaches your inbox and how your data is used."
          >
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gap: 10 }}>
                <ToggleRow
                  label="New high-confidence matches"
                  helper="We email you when fresh roles hit your threshold."
                  checked={form.notifHighMatch}
                  onChange={(val) => handleChange('notifHighMatch', val)}
                />
                <ToggleRow
                  label="Application status updates"
                  helper="Progress, rejections, or ghosting patterns we can detect."
                  checked={form.notifApplicationUpdates}
                  onChange={(val) => handleChange('notifApplicationUpdates', val)}
                />
                <ToggleRow
                  label="Weekly digest"
                  helper="A simple snapshot of activity and next steps."
                  checked={form.notifWeeklyDigest}
                  onChange={(val) => handleChange('notifWeeklyDigest', val)}
                />
              </div>

              <div style={{ height: 1, backgroundColor: colors.borderLight }} />

              <div style={{ display: 'grid', gap: 10 }}>
                <ToggleRow
                  label="Use my data to improve recommendations"
                  helper="We only use your data to rank jobs for you, never to sell or share."
                  checked={form.useDataForRecommendations}
                  onChange={(val) => handleChange('useDataForRecommendations', val)}
                />
                <ToggleRow
                  label="Show experimental features"
                  helper="You may see features that are still in progress."
                  checked={form.enableExperimentalFeatures}
                  onChange={(val) => handleChange('enableExperimentalFeatures', val)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => console.log('TODO: export data')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: `1px solid ${colors.borderLight}`,
                    backgroundColor: colors.surface,
                    color: colors.text,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Export my data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                      console.log('TODO: delete account')
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 999,
                    border: `1px solid ${colors.error}`,
                    backgroundColor: 'transparent',
                    color: colors.error,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Delete my account
                </button>
              </div>
            </div>
          </SectionCard>
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: 'none',
              backgroundColor: colors.primary,
              color: colors.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {status === 'saved' && (
            <span style={{ fontSize: 12, color: colors.textSecondary }}>Saved</span>
          )}
          {status === 'error' && (
            <span style={{ fontSize: 12, color: colors.error }}>
              We couldn't save your settings. Try again.
            </span>
          )}
          {error && (
            <span style={{ fontSize: 12, color: colors.error }}>
              {error}
            </span>
          )}
          {saveError && (
            <span style={{ fontSize: 12, color: colors.error }}>
              {saveError}
            </span>
          )}
        </div>
      </Container>
    </div>
  )
}
