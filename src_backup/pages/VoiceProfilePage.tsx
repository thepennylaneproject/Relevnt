import React, { useEffect, useState, CSSProperties } from 'react';
import PageBackground from '../components/shared/PageBackground';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRelevntColors } from '../hooks';

type VoicePreset =
  | 'natural'
  | 'professional_warm'
  | 'direct'
  | 'creative'
  | 'values_driven'
  | 'academic';

type ProfileRow = {
  id: string;
  voice_preset: VoicePreset | null;
  voice_custom_sample: string | null;
  voice_formality: number | null;
  voice_playfulness: number | null;
  voice_conciseness: number | null;
};

export default function VoiceProfilePage(): JSX.Element {
  const { user } = useAuth();
  const colors = useRelevntColors();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [preset, setPreset] = useState<VoicePreset>('natural');
  const [sample, setSample] = useState('');
  const [formality, setFormality] = useState(50);
  const [playfulness, setPlayfulness] = useState(40);
  const [conciseness, setConciseness] = useState(60);

  // ============================================================
  // STYLES
  // ============================================================

  const containerStyles: CSSProperties = {
    minHeight: '100vh',
    padding: '2rem 1rem',
    display: 'flex',
    justifyContent: 'center',
  };

  const contentStyles: CSSProperties = {
    width: '100%',
    maxWidth: '48rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  };

  const headerStyles: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  const titleStyles: CSSProperties = {
    fontSize: '1.875rem',
    fontWeight: 700,
    color: colors.text,
  };

  const subtitleStyles: CSSProperties = {
    fontSize: '0.875rem',
    color: colors.textSecondary,
    maxWidth: '42rem',
  };

  const noteStyles: CSSProperties = {
    fontSize: '0.75rem',
    color: colors.textSecondary,
    opacity: 0.8,
  };

  const formStyles: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    borderRadius: '0.75rem',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.surface,
    padding: '1.25rem 1rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  };

  const sectionStyles: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  };

  const sectionTitleStyles: CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: colors.text,
  };

  const sectionDescStyles: CSSProperties = {
    fontSize: '0.75rem',
    color: colors.textSecondary,
  };

  const textareaStyles: CSSProperties = {
    width: '100%',
    fontSize: '0.875rem',
    borderRadius: '0.375rem',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.background,
    padding: '0.75rem',
    color: colors.text,
    fontFamily: 'inherit',
    resize: 'vertical' as const,
  };

  const dividerStyles: CSSProperties = {
    borderTop: `1px solid ${colors.border}`,
  };

  const buttonStyles: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.375rem',
    backgroundColor: colors.accent,
    color: '#000',
    fontSize: '0.875rem',
    fontWeight: 500,
    padding: '0.5rem 1rem',
    border: 'none',
    cursor: saving ? 'not-allowed' : 'pointer',
    opacity: saving ? 0.6 : 1,
  };

  const footerStyles: CSSProperties = {
    paddingTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    flexWrap: 'wrap',
  };

  const footerNoteStyles: CSSProperties = {
    fontSize: '0.6875rem',
    color: colors.textSecondary,
    maxWidth: '24rem',
  };

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, voice_preset, voice_custom_sample, voice_formality, voice_playfulness, voice_conciseness'
        )
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile voice settings', error);
        setError('Could not load your voice settings, please try again.');
        setLoading(false);
        return;
      }

      if (data) {
        const p = data as ProfileRow;
        setProfile(p);
        setPreset((p.voice_preset as VoicePreset) || 'natural');
        setSample(p.voice_custom_sample || '');
        setFormality(p.voice_formality ?? 50);
        setPlayfulness(p.voice_playfulness ?? 40);
        setConciseness(p.voice_conciseness ?? 60);
      }

      setLoading(false);
    }

    loadProfile();
  }, [user]);

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);

    const payload = {
      voice_preset: preset,
      voice_custom_sample: sample || null,
      voice_formality: formality,
      voice_playfulness: playfulness,
      voice_conciseness: conciseness,
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select(
        'id, voice_preset, voice_custom_sample, voice_formality, voice_playfulness, voice_conciseness'
      )
      .maybeSingle();

    setSaving(false);

    if (error) {
      console.error('Error saving voice settings', error);
      setError('Something went wrong while saving, please try again.');
      return;
    }

    if (data) {
      setProfile(data as ProfileRow);
    }
  }

  if (!user) {
    return (
      <PageBackground>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }}>
          <p style={{ fontSize: '0.875rem', color: colors.textSecondary }}>
            Sign in to set up your writing voice.
          </p>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <div style={containerStyles}>
        <div style={contentStyles}>
          {/* Header */}
          <header style={headerStyles}>
            <h1 style={titleStyles}>
              Your Voice, Your Agent
            </h1>
            <p style={subtitleStyles}>
              Before Relevnt writes anything for you, it learns how you sound.
              This keeps your applications honest, consistent, and authentic.
            </p>
            {profile && (
              <p style={noteStyles}>
                You can update this anytime. Relevnt will use it for resume
                bullets, application answers, and cover letters when needed.
              </p>
            )}
          </header>

          {/* Loading / error */}
          {loading && (
            <p style={{ fontSize: '0.75rem', color: colors.textSecondary }}>
              Loading your voice profile…
            </p>
          )}
          {error && (
            <p style={{ fontSize: '0.75rem', color: colors.error }}>
              {error}
            </p>
          )}

          {!loading && (
            <form
              onSubmit={handleSave}
              style={formStyles}
            >
              {/* Presets */}
              <section style={sectionStyles}>
                <h2 style={sectionTitleStyles}>
                  Choose your base style
                </h2>
                <p style={sectionDescStyles}>
                  This is the general tone you are comfortable with in
                  professional writing. You can still fine tune below.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
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
                    label="Analytical"
                    description="Structured, evidence based, and precise. Good for research and academic work."
                    selected={preset === 'academic'}
                    onSelect={() => setPreset('academic')}
                  />
                </div>
              </section>

              <hr style={dividerStyles} />

              {/* Custom sample */}
              <section style={sectionStyles}>
                <h2 style={sectionTitleStyles}>
                  Write in your own voice
                </h2>
                <p style={sectionDescStyles}>
                  Use three to six sentences that feel like you. You can describe
                  how you work, what you care about, or how you like to
                  communicate. Relevnt uses this as your voice fingerprint.
                </p>

                <textarea
                  rows={6}
                  value={sample}
                  onChange={(e) => setSample(e.target.value)}
                  style={textareaStyles}
                  placeholder="Example: I am straightforward but supportive. I do not like fluff, I explain things clearly, and I try to stay human even when work is intense..."
                />
                <p style={{ fontSize: '0.6875rem', color: colors.textSecondary }}>
                  Relevnt will not share this text with employers. It is only
                  used to keep your applications consistent with your real
                  voice.
                </p>
              </section>

              <hr style={dividerStyles} />

              {/* Sliders */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={sectionTitleStyles}>
                  Fine tune the vibe
                </h2>

                <ToneSlider
                  label="Formality"
                  left="Casual"
                  right="Formal"
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

              {/* Actions */}
              <div style={footerStyles}>
                <p style={footerNoteStyles}>
                  You can change this later in your settings. Your agent will
                  start using this voice for new applications after you save.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  style={buttonStyles}
                >
                  {saving ? 'Saving…' : 'Save voice profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageBackground>
  );
}

type PresetCardProps = {
  id: string;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
};

function PresetCard(props: PresetCardProps) {
  const { label, description, selected, onSelect } = props;
  const colors = useRelevntColors();

  const cardBaseStyles: CSSProperties = {
    textAlign: 'left',
    borderRadius: '0.5rem',
    border: selected ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    backgroundColor: selected ? colors.accent : colors.surface,
    color: selected ? '#000' : colors.text,
    cursor: 'pointer',
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      style={cardBaseStyles}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = colors.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = colors.border;
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
        {selected && (
          <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Selected
          </span>
        )}
      </div>
      <p style={{ fontSize: '0.6875rem', color: selected ? 'rgba(0,0,0,0.7)' : colors.textSecondary }}>
        {description}
      </p>
    </button>
  );
}

type ToneSliderProps = {
  label: string;
  left: string;
  right: string;
  value: number;
  onChange: (v: number) => void;
  colors: ReturnType<typeof useRelevntColors>;
};

function ToneSlider(props: ToneSliderProps) {
  const { label, left, right, value, onChange, colors } = props;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: colors.text }}>
          {label}
        </span>
        <span style={{ fontSize: '0.6875rem', color: colors.textSecondary }}>
          {value}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: colors.textSecondary, marginBottom: '0.25rem' }}>
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}