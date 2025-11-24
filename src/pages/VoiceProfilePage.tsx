import React, { CSSProperties, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useRelevntColors } from '../hooks'
import { Container } from '../components/shared/Container'

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
}

export default function VoiceProfilePage(): JSX.Element {
  const { user } = useAuth()
  const colors = useRelevntColors()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)

  const [preset, setPreset] = useState<VoicePreset>('natural')
  const [sample, setSample] = useState('')
  const [formality, setFormality] = useState(50)
  const [playfulness, setPlayfulness] = useState(40)
  const [conciseness, setConciseness] = useState(60)

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)

      const { data, error: supaError } = await supabase
        .from('profiles')
        .select(
          'id, voice_preset, voice_custom_sample, voice_formality, voice_playfulness, voice_conciseness'
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
    }

    const { data, error: supaError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select(
        'id, voice_preset, voice_custom_sample, voice_formality, voice_playfulness, voice_conciseness'
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

  const titleStyles: CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: colors.text,
  }

  const subtitleStyles: CSSProperties = {
    fontSize: 13,
    color: colors.textSecondary,
    maxWidth: 620,
    lineHeight: 1.5,
  }

  const card: CSSProperties = {
    display: 'grid',
    gap: 16,
    borderRadius: 16,
    border: `1px solid ${colors.borderLight}`,
    backgroundColor: colors.surface,
    padding: '16px 16px 14px',
  }

  const section: CSSProperties = {
    display: 'grid',
    gap: 10,
  }

  const sectionTitle: CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: colors.text,
  }

  const sectionDesc: CSSProperties = {
    fontSize: 12,
    color: colors.textSecondary,
  }

  const textareaStyles: CSSProperties = {
    width: '100%',
    fontSize: 13,
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.background,
    padding: '10px 12px',
    color: colors.text,
    fontFamily: 'inherit',
    resize: 'vertical' as const,
  }

  const divider: CSSProperties = {
    borderTop: `1px solid ${colors.borderLight}`,
  }

  const buttonStyles: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.primary,
    color: colors.text,
    fontSize: 13,
    fontWeight: 600,
    padding: '10px 16px',
    border: 'none',
    cursor: saving ? 'not-allowed' : 'pointer',
    opacity: saving ? 0.7 : 1,
  }

  if (!user) {
    return (
      <div style={wrapper}>
        <Container maxWidth="lg" padding="md">
          <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }}>
            <p style={{ fontSize: 13, color: colors.textSecondary }}>
              Sign in to set up your writing voice.
            </p>
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
            <h1 style={titleStyles}>Your voice, your agent</h1>
            <p style={subtitleStyles}>
              Before Relevnt writes anything for you, it learns how you sound. This keeps your applications honest, consistent, and authentic.
            </p>
            {profile && (
              <p style={{ fontSize: 12, color: colors.textSecondary }}>
                You can update this anytime. Relevnt will use it for resume bullets, application answers, and cover letters when needed.
              </p>
            )}
          </div>
        </header>

        {loading && (
          <p style={{ fontSize: 12, color: colors.textSecondary }}>Loading your voice profile…</p>
        )}
        {error && (
          <p style={{ fontSize: 12, color: colors.error }}>
            {error}
          </p>
        )}

        {!loading && (
          <form onSubmit={handleSave} style={{ display: 'grid', gap: 12 }}>
            <section style={card}>
              <div style={section}>
                <h2 style={sectionTitle}>Choose your base style</h2>
                <p style={sectionDesc}>
                  This is the general tone you are comfortable with in professional writing. You can still fine tune below.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
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

              <div style={divider} />

              <section style={section}>
                <h2 style={sectionTitle}>Fine tune your tone</h2>
                <p style={sectionDesc}>
                  Adjust how playful, formal, and concise you want your writing assistant to be.
                </p>

                <ToneSlider
                  label="Formality"
                  left="More casual"
                  right="More formal"
                  value={formality}
                  onChange={setFormality}
                  colors={colors}
                />
                <ToneSlider
                  label="Playfulness"
                  left="Serious"
                  right="Playful"
                  value={playfulness}
                  onChange={setPlayfulness}
                  colors={colors}
                />
                <ToneSlider
                  label="Conciseness"
                  left="More detail"
                  right="More concise"
                  value={conciseness}
                  onChange={setConciseness}
                  colors={colors}
                  />
              </section>

              <div style={divider} />

              <section style={section}>
                <h2 style={sectionTitle}>Optional sample</h2>
                <p style={sectionDesc}>
                  Paste a short paragraph you have written. We will use it as additional context to match your voice.
                </p>
                <textarea
                  style={textareaStyles}
                  rows={4}
                  value={sample}
                  onChange={(e) => setSample(e.target.value)}
                  placeholder="Paste a short writing sample here…"
                />
              </section>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <p style={{ fontSize: 12, color: colors.textSecondary, maxWidth: 360 }}>
                  You can change this later in your settings. Your agent will start using this voice for new applications after you save.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  style={buttonStyles}
                >
                  {saving ? 'Saving…' : 'Save voice profile'}
                </button>
              </div>
            </section>
          </form>
        )}
      </Container>
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
  const colors = useRelevntColors()

  const cardBaseStyles: CSSProperties = {
    textAlign: 'left',
    borderRadius: 14,
    border: selected ? `1px solid ${colors.primary}` : `1px solid ${colors.borderLight}`,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    transition: 'all 0.2s ease',
    backgroundColor: selected ? colors.surfaceHover : colors.surface,
    color: colors.text,
    cursor: 'pointer',
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      style={cardBaseStyles}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        {selected && (
          <span style={{ fontSize: 11, letterSpacing: '0.05em', color: colors.textSecondary }}>
            Selected
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.4 }}>
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
  colors: ReturnType<typeof useRelevntColors>
}

function ToneSlider(props: ToneSliderProps) {
  const { label, left, right, value, onChange, colors } = props
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: colors.textSecondary }}>
          {value}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: colors.textSecondary }}>
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: colors.primary }}
      />
    </div>
  )
}
