import React, { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Container } from '../components/shared/Container'
import { useProfessionalProfile } from '../hooks'
import { Icon } from '../components/ui/Icon'
// TODO(buttons): Retired screen still uses legacy button classes; migrate if reactivated.

export default function ProfileProfessionalPage(): JSX.Element {
  const {
    profile,
    loading,
    saving,
    error,
    saveStatus,
    setField,
    save,
  } = useProfessionalProfile()

  const handleSave = () => {
    if (!saving) {
      void save()
    }
  }

  if (loading || !profile) {
    return (
      <div className="page-wrapper">
        <Container maxWidth="lg" padding="md">
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Loading profile...</span>
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
                <Icon name="compass" size="sm" hideAccent />
                <span>Professional Profile</span>
              </div>
              <h1>Professional profile</h1>
              <p className="hero-subtitle">
                This is the version of you Relevnt uses when drafting resumes, cover letters,
                and outreach. Later we will sync this with your saved resumes and matching logic.
              </p>
            </div>

            <div className="hero-actions" style={{ justifyContent: 'flex-start', paddingTop: 0 }}>
              <Link to="/settings" className="ghost-button button-sm">
                <Icon name="pocket-watch" size="sm" hideAccent />
                <span>Settings</span>
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
                  <span>Your story</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Define how you want to be positioned in the market.
                </p>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <label className="rl-label">
                  Headline
                  <input
                    className="rl-input"
                    type="text"
                    value={profile.headline_raw ?? ''}
                    onChange={(e) => setField('headline_raw', e.target.value)}
                    placeholder="e.g., Senior Content Strategist focused on ethical tech and clarity"
                  />
                </label>

                <label className="rl-label">
                  Target roles / lanes
                  <textarea
                    className="rl-textarea"
                    rows={3}
                    value={profile.target_roles_raw ?? ''}
                    onChange={(e) => setField('target_roles_raw', e.target.value)}
                    placeholder="Short list of the main paths you are open to."
                  />
                </label>

                <label className="rl-label">
                  Short professional story
                  <textarea
                    className="rl-textarea"
                    rows={5}
                    value={profile.summary_raw ?? ''}
                    onChange={(e) => setField('summary_raw', e.target.value)}
                    placeholder="A 3–5 sentence summary of who you are, who you serve, and what you are building."
                  />
                </label>

                <label className="rl-label">
                  Top skills you want highlighted
                  <textarea
                    className="rl-textarea"
                    rows={3}
                    value={profile.top_skills_raw ?? ''}
                    onChange={(e) => setField('top_skills_raw', e.target.value)}
                    placeholder="Comma-separated skills we should lean on when we write for you."
                  />
                </label>

                <label className="rl-label">
                  Links to surface
                  <textarea
                    className="rl-textarea"
                    rows={2}
                    value={profile.links_raw ?? ''}
                    onChange={(e) => setField('links_raw', e.target.value)}
                    placeholder="LinkedIn, portfolio, GitHub, Substack, etc."
                  />
                </label>
              </div>
            </div>
          </article>

          <article className="surface-card">
            <div className="rl-field-grid">
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                  <Icon name="scroll" size="sm" hideAccent />
                  <span>Application details</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  These are the boring questions forms ask over and over. We use them to prefill
                  applications and flag anything that needs your approval.
                </p>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <label className="rl-label">
                  Work authorization
                  <input
                    className="rl-input"
                    type="text"
                    value={profile.work_auth_raw ?? ''}
                    onChange={(e) => setField('work_auth_raw', e.target.value)}
                    placeholder="e.g., Authorized to work in the U.S. without sponsorship"
                  />
                </label>

                <div style={{ display: 'grid', gap: 8 }}>
                  <div className="rl-label">Do you now or will you in the future require sponsorship?</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['no', 'yes'].map((val) => {
                      const label = val === 'no' ? 'No' : 'Yes'
                      const active = profile.needs_sponsorship === (val === 'yes')
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setField('needs_sponsorship', val === 'yes')}
                          className={`option-button ${active ? 'is-active' : ''}`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <div className="rl-label">Open to relocation?</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      { value: 'no', label: 'No' },
                      { value: 'yes', label: 'Yes' },
                      { value: 'depends', label: 'Depends on role' },
                    ].map((opt) => {
                      const active = profile.relocate_preference === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setField('relocate_preference', opt.value as any)}
                          className={`option-button ${active ? 'is-active' : ''}`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  <textarea
                    className="rl-textarea"
                    rows={2}
                    value={profile.relocate_notes ?? ''}
                    onChange={(e) => setField('relocate_notes', e.target.value)}
                    placeholder="e.g., Open to Seattle, Portland, or Vancouver for the right role."
                    style={{ marginTop: 8 }}
                  />
                </div>

                <label className="rl-label">
                  Earliest start date (optional)
                  <input
                    className="rl-input"
                    type="text"
                    value={profile.earliest_start_raw ?? ''}
                    onChange={(e) => setField('earliest_start_raw', e.target.value)}
                    placeholder="e.g., 2 weeks after offer, or specific date"
                  />
                </label>

                <div>
                  <div className="rl-label">Travel</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      { value: 'none', label: 'No travel' },
                      { value: 'some', label: 'Occasional' },
                      { value: 'frequent', label: 'Frequent OK' },
                    ].map((opt) => {
                      const active = profile.travel_preference === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setField('travel_preference', opt.value as any)}
                          className={`option-button ${active ? 'is-active' : ''}`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <label className="rl-label">
                  Evergreen “Why you?” answer
                  <textarea
                    className="rl-textarea"
                    rows={4}
                    value={profile.evergreen_why_raw ?? ''}
                    onChange={(e) => setField('evergreen_why_raw', e.target.value)}
                    placeholder="Treat this as raw material. We will rephrase and adapt in your voice later."
                  />
                </label>

                <label className="rl-label">
                  Strengths or story you want highlighted
                  <textarea
                    className="rl-textarea"
                    rows={4}
                    value={profile.evergreen_strengths_raw ?? ''}
                    onChange={(e) => setField('evergreen_strengths_raw', e.target.value)}
                    placeholder="Write this in whatever form is easiest for you, even bullets. Relevnt will polish it for resumes and outreach using your voice profile."
                  />
                </label>
              </div>
            </div>
          </article>
        </div>

        <div style={{ marginTop: 24, paddingBottom: 64, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="primary-button"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>

          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            This page is v1. Later, we will connect it to your stored profiles and use it as the
            source of truth for AI-generated applications and outreach.
          </span>

          {saveStatus === 'saved' && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Saved.</span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontSize: 13, color: 'var(--color-error)' }}>
              We could not save your profile. Try again.
            </span>
          )}
          {error && (
            <span style={{ fontSize: 13, color: 'var(--color-error)' }}>
              {error}
            </span>
          )}
        </div>
      </Container>
    </div>
  )
}
