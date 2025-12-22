import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'
import { useSettingsAutoSave, type AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'
import { Icon } from '../../ui/Icon'
import { useToast } from '../../ui/Toast'
import { RangeSliderWithPresets } from '../RangeSliderWithPresets'

interface VoiceStyleTabProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

type VoicePreset = 'direct' | 'warm' | 'strategic' | 'technical'

const VOICE_PRESETS: { id: VoicePreset; label: string; description: string }[] = [
    { id: 'direct', label: 'Direct & confident', description: 'Clear, assertive, no fluff' },
    { id: 'warm', label: 'Warm & human', description: 'Approachable and personable' },
    { id: 'strategic', label: 'Strategic & concise', description: 'Business-focused, efficient' },
    { id: 'technical', label: 'Technical & precise', description: 'Detail-oriented, specific' },
]

export function VoiceStyleTab({ onAutoSaveStatusChange }: VoiceStyleTabProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [loading, setLoading] = useState(true)
    const [preset, setPreset] = useState<VoicePreset>('warm')
    const [formality, setFormality] = useState(50)
    const [boldness, setBoldness] = useState(50)

    const saveVoice = async () => {
        if (!user) return false

        // Map our simplified presets to the DB schema
        const voicePresetMap: Record<VoicePreset, string> = {
            direct: 'direct',
            warm: 'professional_warm',
            strategic: 'direct',
            technical: 'academic',
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                voice_preset: voicePresetMap[preset],
                voice_formality: formality,
                voice_playfulness: 100 - boldness, // inverse mapping
            })
            .eq('id', user.id)

        return !error
    }

    const { status, triggerSave } = useSettingsAutoSave(saveVoice, { debounceMs: 800 })

    useEffect(() => {
        onAutoSaveStatusChange(status)
    }, [status, onAutoSaveStatusChange])

    useEffect(() => {
        async function loadProfile() {
            if (!user) {
                setLoading(false)
                return
            }

            const { data } = await supabase
                .from('profiles')
                .select('voice_preset, voice_formality, voice_playfulness')
                .eq('id', user.id)
                .maybeSingle()

            if (data) {
                // Map DB values to our simplified presets
                if (data.voice_preset === 'direct') setPreset('direct')
                else if (data.voice_preset === 'professional_warm') setPreset('warm')
                else if (data.voice_preset === 'academic') setPreset('technical')
                else setPreset('warm')

                setFormality(data.voice_formality ?? 50)
                setBoldness(100 - (data.voice_playfulness ?? 50))
            }
            setLoading(false)
        }

        loadProfile()
    }, [user])

    const handlePresetChange = (newPreset: VoicePreset) => {
        setPreset(newPreset)
        triggerSave()
    }

    const handleFormalityChange = (value: number) => {
        setFormality(value)
        triggerSave()
    }

    const handleBoldnessChange = (value: number) => {
        setBoldness(value)
        triggerSave()
    }

    if (loading) {
        return (
            <article className="surface-card">
                <div style={{ padding: 24, textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        Loading voice settings...
                    </span>
                </div>
            </article>
        )
    }

    return (
        <>
            {/* Voice Presets */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="microphone" size="sm" hideAccent />
                            <span>Choose your voice</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            This sets the base tone for all AI-generated content. Pick what feels most like you.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                        {VOICE_PRESETS.map((voicePreset) => {
                            const isActive = preset === voicePreset.id
                            return (
                                <button
                                    key={voicePreset.id}
                                    type="button"
                                    onClick={() => handlePresetChange(voicePreset.id)}
                                    className={`option-button ${isActive ? 'is-active' : ''}`}
                                    style={{
                                        textAlign: 'left',
                                        justifyContent: 'flex-start',
                                        alignItems: 'flex-start',
                                        padding: 16,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 4,
                                        height: '100%',
                                        borderRadius: 'var(--radius-lg)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600 }}>{voicePreset.label}</span>
                                        {isActive && <Icon name="check" size="sm" />}
                                    </div>
                                    <span style={{ fontSize: 12, color: isActive ? 'var(--text)' : 'var(--text-secondary)' }}>
                                        {voicePreset.description}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </article>

            {/* Fine-tuning Sliders */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="pocket-watch" size="sm" hideAccent />
                            <span>Fine-tune your tone</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Adjust these sliders to dial in exactly how you want to sound.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: 24, maxWidth: 500 }}>
                        <RangeSliderWithPresets
                            label="Formality"
                            value={formality}
                            min={0}
                            max={100}
                            onChange={handleFormalityChange}
                            leftLabel="Casual"
                            rightLabel="Formal"
                        />

                        <RangeSliderWithPresets
                            label="Boldness"
                            value={boldness}
                            min={0}
                            max={100}
                            onChange={handleBoldnessChange}
                            leftLabel="Conservative"
                            rightLabel="Bold"
                        />
                    </div>
                </div>
            </article>

            {/* Quick Actions */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="stars" size="sm" hideAccent />
                            <span>Quick actions</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button
                            type="button"
                            className="ghost-button button-sm"
                            onClick={() => {
                                showToast('Resume tone analysis coming soon! For now, try the voice presets above.', 'info')
                            }}
                        >
                            <Icon name="scroll" size="sm" hideAccent />
                            <span>Match my resume tone</span>
                        </button>
                    </div>
                </div>
            </article>
        </>
    )
}
