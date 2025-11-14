import React, { useEffect, useState } from 'react';
import PageBackground from '../components/shared/PageBackground';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [preset, setPreset] = useState<VoicePreset>('natural');
  const [sample, setSample] = useState('');
  const [formality, setFormality] = useState(50);
  const [playfulness, setPlayfulness] = useState(40);
  const [conciseness, setConciseness] = useState(60);

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
      <PageBackground version="v2" overlayOpacity={0.12}>
        <div className="min-h-screen flex items-center justify-center px-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Sign in to set up your writing voice.
          </p>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground version="v2" overlayOpacity={0.12}>
      <div className="min-h-screen px-4 py-8 flex justify-center">
        <div className="w-full max-w-3xl space-y-8">
          {/* Header */}
          <header className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              Your Voice, Your Agent
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              Before Relevnt writes anything for you, it learns how you sound.
              This keeps your applications honest, consistent, and authentic.
            </p>
            {profile && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can update this anytime. Relevnt will use it for resume
                bullets, application answers, and cover letters when needed.
              </p>
            )}
          </header>

          {/* Loading / error */}
          {loading && (
            <p className="text-xs text-slate-500">Loading your voice profile…</p>
          )}
          {error && (
            <p className="text-xs text-rose-500">
              {error}
            </p>
          )}

          {!loading && (
            <form
              onSubmit={handleSave}
              className="space-y-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 py-5 shadow-sm"
            >
              {/* Presets */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Choose your base style
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This is the general tone you are comfortable with in
                  professional writing. You can still fine tune below.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Custom sample */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Write in your own voice
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Use three to six sentences that feel like you. You can describe
                  how you work, what you care about, or how you like to
                  communicate. Relevnt uses this as your voice fingerprint.
                </p>

                <textarea
                  rows={6}
                  value={sample}
                  onChange={(e) => setSample(e.target.value)}
                  className="w-full text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500/70"
                  placeholder="Example: I am straightforward but supportive. I do not like fluff, I explain things clearly, and I try to stay human even when work is intense..."
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Relevnt will not share this text with employers. It is only
                  used to keep your applications consistent with your real
                  voice.
                </p>
              </section>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Sliders */}
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Fine tune the vibe
                </h2>

                <ToneSlider
                  label="Formality"
                  left="Casual"
                  right="Formal"
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
              </section>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                  You can change this later in your settings. Your agent will
                  start using this voice for new applications after you save.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
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

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'text-left rounded-lg border px-3 py-3 space-y-1 transition shadow-sm',
        selected
          ? 'border-slate-900 bg-slate-900 text-slate-50'
          : 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {selected && (
          <span className="text-[11px] uppercase tracking-wide">
            Selected
          </span>
        )}
      </div>
      <p
        className={
          'text-[11px] ' +
          (selected ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400')
        }
      >
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
};

function ToneSlider(props: ToneSliderProps) {
  const { label, left, right, value, onChange } = props;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
          {label}
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {value}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}