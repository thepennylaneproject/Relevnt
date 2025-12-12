// src/components/ResumeBuilder/SaveToPersona.tsx
// Save resume to a persona for role-specific optimization

import React, { useState } from 'react'
import { Icon } from '../ui/Icon'
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
            <button
                type="button"
                onClick={() => setShowModal(true)}
                className="ghost-button button-sm"
            >
                <Icon name="compass" size="sm" />
                Save to Persona
            </button>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-lg font-semibold">Save to Persona</h2>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="ghost-button button-xs"
                            >
                                ✕
                            </button>
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
                                <button
                                    type="button"
                                    onClick={onCreateNew}
                                    className="ghost-button button-sm w-full"
                                    style={{ marginTop: 12 }}
                                >
                                    <Icon name="stars" size="sm" />
                                    Create New Persona
                                </button>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="ghost-button"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!selectedId || saving}
                                className="primary-button"
                            >
                                {saving ? 'Saving...' : 'Save Resume'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default SaveToPersona
