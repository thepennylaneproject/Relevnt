import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersonas } from '../../../hooks/usePersonas'
import { useSettingsAutoSave, type AutoSaveStatus } from '../../../hooks/useSettingsAutoSave'
import { useToast } from '../../ui/Toast'
import { Button } from '../../ui/Button'
import type { UserPersona } from '../../../types/v2-personas'
import { Send } from 'lucide-react'

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
            <div className="tab-pane">
                <div className="card" style={{ textAlign: 'center' }}>
                    <p>Loading personas...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="tab-pane">
                <div className="card" style={{ textAlign: 'center', color: 'var(--color-error)' }}>
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="tab-pane">
            <h2>Your personas</h2>
            <p>Click a persona to activate it. Your active persona shapes how Relevnt matches and applies for you.</p>

            <div className="card-grid" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {personas.map((persona) => {
                    const isActive = persona.id === activePersona?.id
                    return (
                        <div
                            key={persona.id}
                            className={`card card-persona ${isActive ? 'active' : ''}`}
                            onClick={() => handlePersonaSelect(persona)}
                        >
                            <h3>{persona.name || 'Untitled Persona'}</h3>
                            {persona.description && (
                                <p className="card-description">
                                    {persona.description}
                                </p>
                            )}
                            <Button type="button" variant="ghost" size="sm">
                                {isActive ? 'Active' : 'Click to activate'}
                            </Button>
                        </div>
                    )
                })}

                {personas.length === 0 && (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-ink-tertiary)' }}>
                        <p>No personas yet. Create one to get started.</p>
                    </div>
                )}
            </div>

            <div className="card" style={{ marginTop: 40 }}>
                <h3>Add a new persona</h3>
                <p>Which best describes this search?</p>
                <div className="persona-options">
                    {SEARCH_MODE_OPTIONS.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            className="option-button"
                            onClick={() => {
                                showToast(`Configuring your "${option.label}" persona...`, 'info')
                                navigate('/personas')
                            }}
                        >
                            <span className="option-title">{option.label}</span>
                            <span className="option-desc">{option.description}</span>
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                     <Button 
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/personas')}
                     >
                        <span>Manage all personas</span>
                        <Send size={14} style={{ marginLeft: 8 }} />
                     </Button>
                </div>
            </div>
        </div>
    )
}
