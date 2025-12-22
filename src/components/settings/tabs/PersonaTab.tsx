import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersonas } from '../../../hooks/usePersonas'
import { useSettingsAutoSave, type AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'
import { Icon } from '../../ui/Icon'
import { useToast } from '../../ui/Toast'
import type { UserPersona } from '../../../types/v2-personas'

interface PersonaTabProps {
    onAutoSaveStatusChange: (status: AutoSaveStatus) => void
}

const SEARCH_MODE_OPTIONS = [
    { id: 'active', label: 'Actively looking', description: 'Ready to apply and interview' },
    { id: 'casual', label: 'Casually browsing', description: 'Open to the right opportunity' },
    { id: 'pivot', label: 'Career pivot', description: 'Exploring new directions' },
    { id: 'explore', label: 'Exploration / learning', description: 'Just seeing what\'s out there' },
] as const

export function PersonaTab({ onAutoSaveStatusChange }: PersonaTabProps) {
    const navigate = useNavigate()
    const { showToast } = useToast()
    const { personas, activePersona, setActivePersona, loading, error } = usePersonas()

    const { status, triggerSave } = useSettingsAutoSave(
        async () => {
            // Persona switching is already handled by usePersonas
            return true
        },
        { debounceMs: 500 }
    )

    useEffect(() => {
        onAutoSaveStatusChange(status)
    }, [status, onAutoSaveStatusChange])

    const handlePersonaSelect = async (persona: UserPersona) => {
        if (persona.id !== activePersona?.id) {
            await setActivePersona(persona.id)
            triggerSave()
        }
    }

    if (loading) {
        return (
            <article className="surface-card">
                <div style={{ padding: 24, textAlign: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        Loading personas...
                    </span>
                </div>
            </article>
        )
    }

    if (error) {
        return (
            <article className="surface-card">
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-error)' }}>
                    <span style={{ fontSize: 13 }}>{error}</span>
                </div>
            </article>
        )
    }

    return (
        <>
            {/* Active Personas */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="compass" size="sm" hideAccent />
                            <span>Your personas</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Click a persona to activate it. Your active persona shapes how Relevnt matches and applies for you.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                        {personas.map((persona) => {
                            const isActive = persona.id === activePersona?.id
                            return (
                                <button
                                    key={persona.id}
                                    type="button"
                                    onClick={() => handlePersonaSelect(persona)}
                                    className={`option-button ${isActive ? 'is-active' : ''}`}
                                    style={{
                                        textAlign: 'left',
                                        justifyContent: 'flex-start',
                                        alignItems: 'flex-start',
                                        padding: 16,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8,
                                        height: '100%',
                                        width: '100%',
                                        borderRadius: 'var(--radius-lg)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                                        <span style={{ fontSize: 14, fontWeight: 700 }}>{persona.name || 'Untitled Persona'}</span>
                                        {isActive && <Icon name="check" size="sm" />}
                                    </div>
                                    {persona.description && (
                                        <p style={{ fontSize: 13, color: isActive ? 'var(--text)' : 'var(--text-secondary)', lineHeight: 1.4, fontWeight: 400 }}>
                                            {persona.description}
                                        </p>
                                    )}
                                    {persona.preferences?.job_title_keywords && persona.preferences.job_title_keywords.length > 0 && (
                                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {persona.preferences.job_title_keywords.slice(0, 2).join(', ')}
                                        </span>
                                    )}
                                </button>
                            )
                        })}

                        {personas.length === 0 && (
                            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <p style={{ fontSize: 13 }}>No personas yet. Create one to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </article>

            {/* Add Persona Guided Chooser */}
            <article className="surface-card">
                <div className="rl-field-grid">
                    <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                            <Icon name="stars" size="sm" hideAccent />
                            <span>Add a new persona</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Which best describes this search?
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                        {SEARCH_MODE_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                className="option-button"
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
                                onClick={() => {
                                    showToast(`Configuring your "${option.label}" persona...`, 'info')
                                    navigate('/personas')
                                }}
                            >
                                <span style={{ fontSize: 14, fontWeight: 600 }}>{option.label}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{option.description}</span>
                            </button>
                        ))}
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                         <button 
                            onClick={() => navigate('/personas')}
                            className="ghost-button text-xs"
                         >
                            Manage all personas
                            <Icon name="paper-airplane" size="sm" />
                         </button>
                    </div>
                </div>
            </article>
        </>
    )
}
