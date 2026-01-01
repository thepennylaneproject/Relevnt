import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'
import { useSettingsAutoSave, type AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'
import { useToast } from '../../ui/Toast'
import { Button } from '../../ui/Button'

interface VoiceStyleTabProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

type VoicePreset = 'direct' | 'warm' | 'strategic'

const VOICE_PRESETS: { id: VoicePreset; label: string }[] = [
    { id: 'warm', label: 'Natural' },
    { id: 'strategic', label: 'Professional' },
    { id: 'direct', label: 'Direct' },
]

import { useProfessionalProfile } from '../../../hooks/useProfessionalProfile'

export function VoiceStyleTab({ onAutoSaveStatusChange }: VoiceStyleTabProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const { profile, setField: setProfileField, save: saveProfile } = useProfessionalProfile()
    
    const [loading, setLoading] = useState(true)
    const [preset, setPreset] = useState<VoicePreset>('warm')
    const [formality, setFormality] = useState(50)
    const [boldness, setBoldness] = useState(50)

    const [headline, setHeadline] = useState('')
    const [strengths, setStrengths] = useState<string[]>([
        'Led cross-functional teams of 5-12 through complex product launches',
        'Increased user engagement 40% through data-driven feature prioritization',
        'Expert in translating stakeholder needs into actionable roadmaps'
    ])

    const saveVoice = async () => {
        if (!user) return false

        const voicePresetMap: Record<VoicePreset, string> = {
            direct: 'direct',
            warm: 'professional_warm',
            strategic: 'direct',
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                voice_preset: voicePresetMap[preset],
                voice_formality: formality,
                voice_playfulness: 100 - boldness,
                headline_raw: headline
            })
            .eq('id', user.id)

        return !error
    }

    const { status, triggerSave } = useSettingsAutoSave(
        async () => {
            const v = await saveVoice()
            const p = await saveProfile()
            return v && p
        }, 
        { debounceMs: 800 }
    )

    useEffect(() => {
        onAutoSaveStatusChange(status)
    }, [status, onAutoSaveStatusChange])

    useEffect(() => {
        if (profile) {
            setHeadline(profile.headline_raw || '')
        }
    }, [profile])

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
                if (data.voice_preset === 'direct') setPreset('direct')
                else if (data.voice_preset === 'professional_warm') setPreset('warm')
                else if (data.voice_preset === 'strategic') setPreset('strategic')
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

    if (loading) {
        return (
            <div className="tab-pane">
                <div className="card">
                    <p>Loading voice settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="tab-pane">
            <div className="card">
                <h3>Choose your voice</h3>
                <div className="radio-card-group">
                    {VOICE_PRESETS.map((vp) => (
                        <label key={vp.id} className="radio-card">
                            <input 
                                type="radio" 
                                name="voice" 
                                checked={preset === vp.id} 
                                onChange={() => handlePresetChange(vp.id)}
                            />
                            <div className="radio-card-content">
                                <h4>{vp.label}</h4>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="card">
                <h3>Fine-tune your tone</h3>
                <div className="form-group">
                    <div className="slider-header">
                        <label className="form-label">Formality</label>
                    </div>
                    <input 
                        type="range" 
                        className="form-slider" 
                        min="0" max="100" 
                        value={formality} 
                        onChange={(e) => {
                            setFormality(parseInt(e.target.value))
                            triggerSave()
                        }}
                    />
                    <div className="slider-labels">
                        <span>Casual</span>
                        <span>Formal</span>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: 24 }}>
                    <div className="slider-header">
                        <label className="form-label">Boldness</label>
                    </div>
                    <input 
                        type="range" 
                        className="form-slider" 
                        min="0" max="100" 
                        value={boldness} 
                        onChange={(e) => {
                            setBoldness(parseInt(e.target.value))
                            triggerSave()
                        }}
                    />
                </div>
            </div>

            <div className="card">
                <h3>Your headline</h3>
                <textarea 
                    className="form-textarea" 
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Strategic Product Leader with 10+ years experience..."
                    rows={2}
                ></textarea>
                <div className="action-group">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => showToast('AI generation coming soon', 'info')}
                    >
                        Generate with AI
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setHeadline(profile?.headline_raw || '')}
                    >
                        Undo
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            setProfileField('headline_raw', headline)
                            triggerSave()
                        }}
                    >
                        Save Headline
                    </Button>
                </div>
            </div>

            <div className="card">
                <h3>Key strengths</h3>
                <ul className="strengths-list">
                    {strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
                <div className="action-group">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => showToast('Regenerating strengths...', 'info')}
                    >
                        Regenerate
                    </Button>
                    <Button type="button" variant="ghost" size="sm">
                        Edit Manually
                    </Button>
                    <Button type="button" variant="primary" size="sm">
                        Accept All
                    </Button>
                </div>
            </div>

            <div className="card">
                <h3>Quick confirmations</h3>
                <div className="confirmation-group">
                    <div className="confirmation-question">
                        <h4>Do you require visa sponsorship?</h4>
                        <div className="button-group">
                            <Button 
                                type="button"
                                variant={profile?.needs_sponsorship === false ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => {
                                    setProfileField('needs_sponsorship', false)
                                    triggerSave()
                                }}
                            >No</Button>
                            <Button 
                                type="button"
                                variant={profile?.needs_sponsorship === true ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => {
                                    setProfileField('needs_sponsorship', true)
                                    triggerSave()
                                }}
                            >Yes</Button>
                        </div>
                    </div>

                    <div className="confirmation-question">
                        <h4>Open to relocation?</h4>
                        <div className="button-group">
                            {['no', 'yes', 'depends'].map((opt) => (
                                <Button 
                                    key={opt}
                                    type="button"
                                    variant={profile?.relocate_preference === opt ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => {
                                        setProfileField('relocate_preference', opt as any)
                                        triggerSave()
                                    }}
                                >{opt === 'depends' ? 'Depends on role' : opt.charAt(0).toUpperCase() + opt.slice(1)}</Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
