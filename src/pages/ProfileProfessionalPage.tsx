import React, { CSSProperties } from 'react'
import { Container } from '../components/shared/Container'
import { useRelevntColors, useProfessionalProfile } from '../hooks'
import { ProfileIcon } from '../components/icons/RelevntIcons'

export default function ProfileProfessionalPage(): JSX.Element {
  const colors = useRelevntColors()
  const {
    profile,
    loading,
    saving,
    error,
    saveStatus,
    setField,
    save,
  } = useProfessionalProfile()

  const wrapper: CSSProperties = {
    flex: 1,
    backgroundColor: colors.background,
  }

  const header: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 24,
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

  const card: CSSProperties = {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.borderLight}`,
    display: 'grid',
    gap: 12,
  }

  // inside ProfileProfessionalPage, below the existing card:

  const appCard: CSSProperties = {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.borderLight}`,
    display: 'grid',
    gap: 12,
  }

  const handleSave = () => {
    if (!saving) {
      void save()
    }
  }

  if (loading || !profile) {
    return (
      <div style={{ flex: 1, backgroundColor: colors.background }}>
        <Container maxWidth="lg" padding="md">
          <div
            style={{
              display: 'grid',
              gap: 12,
            }}
          >
            <div
              style={{
                height: 140,
                borderRadius: 16,
                backgroundColor: colors.surfaceHover,
              }}
            />
            <div
              style={{
                height: 140,
                borderRadius: 16,
                backgroundColor: colors.surfaceHover,
              }}
            />
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div style={wrapper}>
      <Container maxWidth="lg" padding="md">
        <header style={header}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ProfileIcon size={18} strokeWidth={1.7} />
                <h1 style={title}>Professional profile</h1>
              </div>
              <p style={subtitle}>
                This is the version of you Relevnt uses when drafting resumes, cover letters,
                and outreach. Later we will sync this with your saved resumes and matching logic.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: 'none',
                backgroundColor: colors.primary,
                color: colors.text,
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </header>

        <div style={{ display: 'grid', gap: 12 }}>
          <article style={card}>
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
          </article>
          <article style={appCard}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: colors.text }}>
              Application details
            </h2>
            <p style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 8 }}>
              These are the boring questions forms ask over and over. We use them to prefill
              applications and flag anything that needs your approval.
            </p>

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
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        border: active
                          ? `1px solid ${colors.primary}`
                          : `1px solid ${colors.borderLight}`,
                        backgroundColor: active ? colors.surfaceHover : colors.surface,
                        fontSize: 12,
                        cursor: 'pointer',
                        color: colors.text,
                      }}
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
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        border: active
                          ? `1px solid ${colors.primary}`
                          : `1px solid ${colors.borderLight}`,
                        backgroundColor: active ? colors.surfaceHover : colors.surface,
                        fontSize: 12,
                        cursor: 'pointer',
                        color: colors.text,
                      }}
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
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        border: active
                          ? `1px solid ${colors.primary}`
                          : `1px solid ${colors.borderLight}`,
                        backgroundColor: active ? colors.surfaceHover : colors.surface,
                        fontSize: 12,
                        cursor: 'pointer',
                        color: colors.text,
                      }}
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
          </article>
          <div style={{ marginTop: 12, fontSize: 12, color: colors.textSecondary }}>
            This page is v1. Later, we will connect it to your stored profiles and use it as the
            source of truth for AI-generated applications and outreach.
            {saveStatus === 'saved' && (
              <span style={{ marginLeft: 8 }}>Saved.</span>
            )}
            {saveStatus === 'error' && (
              <span style={{ marginLeft: 8, color: colors.error }}>
                We could not save your profile. Try again.
              </span>
            )}
            {error && (
              <span style={{ marginLeft: 8, color: colors.error }}>
                {error}
              </span>
            )}
          </div>
        </div>
      </Container>
    </div>
  )
}