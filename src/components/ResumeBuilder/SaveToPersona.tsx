// src/components/ResumeBuilder/SaveToPersona.tsx
// Save resume to a persona for role-specific optimization

import React, { useState } from 'react'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import type { ResumeDraft } from '../../types/resume-builder.types'

// ============================================================================
// TYPES
// ============================================================================

interface Persona {
    id: string
    name: string
    targetRole?: string
    industry?: string
}

interface Props {
    draft: ResumeDraft
    personas?: Persona[]
    currentPersonaId?: string
    onSave: (personaId: string) => void
    onCreateNew?: () => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SaveToPersona: React.FC<Props> = ({
    draft,
    personas = [],
    currentPersonaId,
    onSave,
    onCreateNew,
}) => {
    const [showModal, setShowModal] = useState(false)
    const [selectedId, setSelectedId] = useState(currentPersonaId || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (!selectedId) return

        setSaving(true)
        try {
            await onSave(selectedId)
            setShowModal(false)
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(true)}
            >
                <Icon name="compass" size="sm" />
                Save to Persona
            </Button>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-lg font-semibold">Save to Persona</h2>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowModal(false)}
                            >
                                ✕
                            </Button>
                        </div>

                        <div className="modal-body">
                            <p className="text-sm muted" style={{ marginBottom: 16 }}>
                                Link this resume to a persona for easy access and role-specific optimization.
                            </p>

                            {personas.length > 0 ? (
                                <div className="persona-list">
                                    {personas.map((persona) => (
                                        <button
                                            key={persona.id}
                                            type="button"
                                            onClick={() => setSelectedId(persona.id)}
                                            className={`persona-option ${selectedId === persona.id ? 'active' : ''}`}
                                        >
                                            <div className="persona-option-icon">
                                                <Icon name="compass" size="sm" />
                                            </div>
                                            <div className="persona-option-info">
                                                <strong className="text-sm">{persona.name}</strong>
                                                {persona.targetRole && (
                                                    <span className="text-xs muted">{persona.targetRole}</span>
                                                )}
                                            </div>
                                            {selectedId === persona.id && (
                                                <span className="persona-check">✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-personas">
                                    <Icon name="compass" size="md" />
                                    <p className="text-sm">No personas yet</p>
                                    <p className="text-xs muted">
                                        Create a persona to save different resumes for different job targets.
                                    </p>
                                </div>
                            )}

                            {onCreateNew && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="w-full"
                                    onClick={onCreateNew}
                                    style={{ marginTop: 12 }}
                                >
                                    <Icon name="stars" size="sm" />
                                    Create New Persona
                                </Button>
                            )}
                        </div>

                        <div className="modal-footer">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleSave}
                                disabled={!selectedId || saving}
                            >
                                {saving ? 'Saving...' : 'Save Resume'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default SaveToPersona
