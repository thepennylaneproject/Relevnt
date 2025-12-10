import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../components/shared/Container'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/ui/Icon'
import {
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
  return (
    <article className="surface-card">
      <div className="rl-field-grid">
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
            {icon}
            <span>{title}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{subtitle}</p>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>{children}</div>
      </div>
    </article>
  )
}

const Field: React.FC<{
  label: string
  children: React.ReactNode
  helper?: string
}> = ({ label, children, helper }) => {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
      {children}
      {helper && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{helper}</span>}
    </label>
  )
}

const ToggleRow: React.FC<{
  label: string
  helper?: string
  checked: boolean
  onChange: (value: boolean) => void
}> = ({ label, helper, checked, onChange }) => {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="jobprefs-checkbox"
        style={{ width: 16, height: 16, marginTop: 3, accentColor: 'var(--color-accent)' }}
      />
      <div style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{label}</span>
        {helper && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{helper}</span>}
      </div>
    </label>
  )
}

export default function SettingsPage(): JSX.Element {
  const { user } = useAuth()
  const { settings, isLoading, saving, error, saveError, saveSettings } = useProfileSettings()
  const [form, setForm] = useState<ProfileSettings | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

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

  if (isLoading || !form) {
    return (
      <div className="page-wrapper">
        <Container maxWidth="lg" padding="md">
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Loading settings...</span>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <Container maxWidth="lg" padding="md">
        <header className="hero-shell">
          <div className="hero-header">
            <div className="hero-header-main">
              <div className="hero__badge">
                <Icon name="pocket-watch" size="sm" hideAccent />
                <span>Preferences</span>
              </div>
              <h1>Settings</h1>
              <p className="hero-subtitle">
                Tune how Relevnt works for you. We keep things simple, honest, and in your control.
              </p>
            </div>

            <div className="hero-actions" style={{ justifyContent: 'flex-start', paddingTop: 0 }}>
              <Link to="/job-preferences" className="link-pill">
                <Icon name="pocket-watch" size="sm" hideAccent />
                <span>Job preferences</span>
              </Link>
              <Link to="/profile/professional" className="link-pill">
                <Icon name="compass" size="sm" hideAccent />
                <span>Professional profile</span>
              </Link>
              <Link to="/voice" className="link-pill">
                <Icon name="microphone" size="sm" hideAccent />
                <span>Voice profile</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="page-stack">
          <article className="surface-card">
            <div className="rl-field-grid">
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                  <Icon name="compass" size="sm" hideAccent />
                  <span>Profile & account</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
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
            icon={<Icon name="pocket-watch" size="sm" hideAccent />}
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
                      className={`option-button ${form.themePreference === option ? 'is-active' : ''}`}
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
                      className={`option-button ${form.layoutDensity === option ? 'is-active' : ''}`}
                    >
                      {option === 'cozy' ? 'Cozy' : 'Compact'}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={<Icon name="stars" size="sm" hideAccent />}
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

              <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

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

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => console.log('TODO: export data')}
                  className="option-button"
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
                  className="option-button"
                  style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                >
                  Delete my account
                </button>
              </div>
            </div>
          </SectionCard>
        </div>

        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="primary-button"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {status === 'saved' && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Saved</span>
          )}
          {status === 'error' && (
            <span style={{ fontSize: 13, color: 'var(--color-error)' }}>
              We couldn't save your settings. Try again.
            </span>
          )}
          {error && (
            <span style={{ fontSize: 13, color: 'var(--color-error)' }}>
              {error}
            </span>
          )}
          {saveError && (
            <span style={{ fontSize: 13, color: 'var(--color-error)' }}>
              {saveError}
            </span>
          )}
        </div>
      </Container >
    </div >
  )
}
