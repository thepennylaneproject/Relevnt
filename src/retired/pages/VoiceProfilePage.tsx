import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Container } from '../components/shared/Container'
import { Icon } from '../components/ui/Icon'
// TODO(buttons): Retired screen still uses legacy button classes; migrate if reactivated.
import { useAITask } from '../hooks/useAITask'
import { useCareerProfile } from '../hooks/useCareerProfile'

type VoicePreset =
  | 'natural'
  | 'professional_warm'
  | 'direct'
  | 'creative'
  | 'values_driven'
  | 'academic'

type ProfileRow = {
  id: string
  voice_preset: VoicePreset | null
  voice_custom_sample: string | null
  voice_formality: number | null
  voice_playfulness: number | null
  voice_conciseness: number | null
  career_narrative_origin: string | null
  career_narrative_pivot: string | null
  career_narrative_value: string | null
  career_narrative_future: string | null
}

export default function VoiceProfilePage(): JSX.Element {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)

  const [preset, setPreset] = useState<VoicePreset>('natural')
  const [sample, setSample] = useState('')
  const [formality, setFormality] = useState(50)
  const [playfulness, setPlayfulness] = useState(40)
  const [conciseness, setConciseness] = useState(60)

  const [narratives, setNarratives] = useState<{
    origin: string
    pivot: string
    value: string
    future: string
  }>({
    origin: '',
    pivot: '',
    value: '',
    future: ''
  })

  const { execute: runAI, loading: aiLoading } = useAITask()
  const { profile: careerProfile } = useCareerProfile()

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)

      const { data, error: supaError } = await (supabase as any)
        .from('profiles')
        .select(
          'id, voice_preset, voice_custom_sample, voice_formality, voice_playfulness, voice_conciseness, career_narrative_origin, career_narrative_pivot, career_narrative_value, career_narrative_future'
        )
        .eq('id', user.id)
        .maybeSingle()

      if (supaError) {
        console.error('Error loading profile voice settings', supaError)
        setError('Could not load your voice settings, please try again.')
        setLoading(false)
        return
      }

      if (data) {
        const p = data as ProfileRow
        setProfile(p)
        setPreset((p.voice_preset as VoicePreset) || 'natural')
        setSample(p.voice_custom_sample || '')
        setFormality(p.voice_formality ?? 50)
        setPlayfulness(p.voice_playfulness ?? 40)
        setConciseness(p.voice_conciseness ?? 60)
        setNarratives({
          origin: p.career_narrative_origin || '',
          pivot: p.career_narrative_pivot || '',
          value: p.career_narrative_value || '',
          future: p.career_narrative_future || ''
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [user])

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!user) return

    setSaving(true)
    setError(null)

    const payload = {
      voice_preset: preset,
      voice_custom_sample: sample || null,
      voice_formality: formality,
      voice_playfulness: playfulness,
      voice_conciseness: conciseness,
      career_narrative_origin: narratives.origin || null,
      career_narrative_pivot: narratives.pivot || null,
      career_narrative_value: narratives.value || null,
      career_narrative_future: narratives.future || null,
    }

    const { data, error: supaError } = await (supabase as any)
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select(
        'id, voice_preset, voice_custom_sample, voice_formality, voice_playfulness, voice_conciseness, career_narrative_origin, career_narrative_pivot, career_narrative_value, career_narrative_future'
      )
      .maybeSingle()

    setSaving(false)

    if (supaError) {
      console.error('Error saving voice settings', supaError)
      setError('Something went wrong while saving, please try again.')
      return
    }

    if (data) {
      setProfile(data as ProfileRow)
    }
  }

  async function handleGenerateNarrative() {
    if (!careerProfile) {
      setError('Please complete your career profile first.')
      return
    }

    try {
      const result = await runAI('generate-career-narrative', {
        profile: careerProfile,
        voiceSettings: {
          preset,
          formality,
          playfulness,
          conciseness
        }
      })

      if (result.success && result.data) {
        const narrativeData = (result as any).data
        setNarratives({
          origin: narrativeData.origin,
          pivot: narrativeData.pivot,
          value: narrativeData.value,
          future: narrativeData.future
        })
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to generate narratives')
    }
  }

  if (!user) {
    return (
      <div className="page-wrapper">
        <Container maxWidth="lg" padding="md">
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Sign in to set up your writing voice.
            </p>
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
                <Icon name="microphone" size="sm" hideAccent />
                <span>Voice Profile</span>
              </div>
              <h1>Your voice, your agent</h1>
              <p className="hero-subtitle">
                Before Relevnt writes anything for you, it learns how you sound. This keeps your applications honest, consistent, and authentic.
              </p>
              {profile && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                  Relevnt uses this for resume bullets, application answers, and cover letters.
                </p>
              )}
            </div>
          </div>
        </header>

        {loading && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Loading your voice profile…</p>
        )}
        {error && (
          <p style={{ fontSize: 12, color: 'var(--color-error)' }}>
            {error}
          </p>
        )}

        {!loading && (
          <form onSubmit={handleSave} className="page-stack">
            <section className="surface-card">
              <div style={{ padding: 24, display: 'grid', gap: 24 }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Choose your base style</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    This is the general tone you are comfortable with in professional writing. You can still fine tune below.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <PresetCard
                      id="natural"
                      label="Natural you"
                      description="Balanced, human, clear. Sounds like your best self on a good day."
                      selected={preset === 'natural'}
                      onSelect={() => setPreset('natural')}
                    />
                    <PresetCard
                      id="professional_warm"
                      label="Professional but warm"
                      description="Friendly, polished, and approachable. Great for most roles."
                      selected={preset === 'professional_warm'}
                      onSelect={() => setPreset('professional_warm')}
                    />
                    <PresetCard
                      id="direct"
                      label="Direct and concise"
                      description="Short, efficient, and to the point. Ideal for senior or technical roles."
                      selected={preset === 'direct'}
                      onSelect={() => setPreset('direct')}
                    />
                    <PresetCard
                      id="creative"
                      label="Creative storyteller"
                      description="A bit more narrative and expressive. Good for creative careers."
                      selected={preset === 'creative'}
                      onSelect={() => setPreset('creative')}
                    />
                    <PresetCard
                      id="values_driven"
                      label="Values driven"
                      description="Emphasizes impact, ethics, and alignment. Ideal for mission driven orgs."
                      selected={preset === 'values_driven'}
                      onSelect={() => setPreset('values_driven')}
                    />
                    <PresetCard
                      id="academic"
                      label="Academic"
                      description="Measured, well structured, and grounded in evidence."
                      selected={preset === 'academic'}
                      onSelect={() => setPreset('academic')}
                    />
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

                <div style={{ display: 'grid', gap: 16 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Fine tune your tone</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Adjust how playful, formal, and concise you want your writing assistant to be.
                  </p>

                  <div style={{ display: 'grid', gap: 24, maxWidth: 600 }}>
                    <ToneSlider
                      label="Formality"
                      left="More casual"
                      right="More formal"
                      value={formality}
                      onChange={setFormality}
                    />
                    <ToneSlider
                      label="Playfulness"
                      left="Serious"
                      right="Playful"
                      value={playfulness}
                      onChange={setPlayfulness}
                    />
                    <ToneSlider
                      label="Conciseness"
                      left="More detail"
                      right="More concise"
                      value={conciseness}
                      onChange={setConciseness}
                    />
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'grid', gap: 10 }}>
                      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Career Narrative Engine</h2>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Generate consistent "elevator pitches" for your career transition.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateNarrative}
                      disabled={aiLoading || !careerProfile}
                      className="secondary-button text-xs"
                    >
                      {aiLoading ? 'Developing story...' : 'Synthesize narratives'}
                    </button>
                  </div>

                  {!careerProfile && (
                    <div className="surface-accent p-3 rounded-lg border border-accent/20">
                      <p className="text-[10px] muted">
                        <Icon name="alert-triangle" size="sm" /> Complete your career profile to enable narrative synthesis.
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    <NarrativeField
                      label="The Origin"
                      description="How it all started. Your foundational why."
                      value={narratives.origin}
                      onChange={(v: string) => setNarratives(prev => ({ ...prev, origin: v }))}
                    />
                    <NarrativeField
                      label="The Pivot"
                      description="The bridge between what you did and where you're going."
                      value={narratives.pivot}
                      onChange={(v: string) => setNarratives(prev => ({ ...prev, pivot: v }))}
                    />
                    <NarrativeField
                      label="The Value"
                      description="The unique ROI you bring to an organization."
                      value={narratives.value}
                      onChange={(v: string) => setNarratives(prev => ({ ...prev, value: v }))}
                    />
                    <NarrativeField
                      label="The Future"
                      description="Where you are heading and the impact you want to make."
                      value={narratives.future}
                      onChange={(v: string) => setNarratives(prev => ({ ...prev, future: v }))}
                    />
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

                <div style={{ display: 'grid', gap: 10 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Optional sample</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Paste a short paragraph you have written. We will use it as additional context to match your voice.
                  </p>
                  <textarea
                    className="rl-textarea"
                    rows={4}
                    value={sample}
                    onChange={(e) => setSample(e.target.value)}
                    placeholder="Paste a short writing sample here…"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', paddingTop: 8 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 360 }}>
                    You can change this later in your settings. Your agent will start using this voice for new applications after you save.
                  </p>
                  <button
                    type="submit"
                    disabled={saving}
                    className="primary-button"
                  >
                    {saving ? 'Saving…' : 'Save voice profile'}
                  </button>
                </div>
              </div>
            </section>
          </form>
        )}
      </Container>
    </div>
  )
}

function NarrativeField({ label, description, value, onChange }: {
  label: string,
  description: string,
  value: string,
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div>
        <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{label}</h4>
        <p style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{description}</p>
      </div>
      <textarea
        className="rl-textarea text-xs"
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Capture your ${label.toLowerCase()}...`}
      />
    </div>
  )
}

type PresetCardProps = {
  id: string
  label: string
  description: string
  selected: boolean
  onSelect: () => void
}

function PresetCard(props: PresetCardProps) {
  const { label, description, selected, onSelect } = props

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`option-button ${selected ? 'is-active' : ''}`}
      style={{
        textAlign: 'left',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: '100%',
        width: '100%',
        borderRadius: 'var(--radius-lg)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
        {selected && (
          <Icon name="check" size="sm" />
        )}
      </div>
      <p style={{ fontSize: 13, color: selected ? 'var(--text)' : 'var(--text-secondary)', lineHeight: 1.4, fontWeight: 400 }}>
        {description}
      </p>
    </button>
  )
}

type ToneSliderProps = {
  label: string
  left: string
  right: string
  value: number
  onChange: (v: number) => void
}

function ToneSlider(props: ToneSliderProps) {
  const { label, left, right, value, onChange } = props
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {label}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: 'var(--color-accent)',
          cursor: 'pointer'
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  )
}
