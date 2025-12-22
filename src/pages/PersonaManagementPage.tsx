import React, { useState } from 'react'
import { usePersonas } from '../hooks/usePersonas'
import { PersonaEditor } from '../components/personas/PersonaEditor'
import PageBackground from '../components/shared/PageBackground'
import { Container } from '../components/shared/Container'
import { Icon } from '../components/ui/Icon'
import { copy } from '../config/i18n.config'
import type { UserPersona } from '../types/v2-personas'

export default function PersonaManagementPage() {
    const { personas, loading, deletePersona, setActivePersona } = usePersonas()
    const [isCreating, setIsCreating] = useState(false)
    const [editingPersona, setEditingPersona] = useState<UserPersona | null>(null)

    // Handlers
    const handleEdit = (persona: UserPersona) => {
        setEditingPersona(persona)
        setIsCreating(false)
    }

    const handleCreate = () => {
        setEditingPersona(null)
        setIsCreating(true)
    }

    const handleCloseEditor = () => {
        setEditingPersona(null)
        setIsCreating(false)
    }

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this persona?')) {
            await deletePersona(id)
        }
    }

    const isEditorOpen = isCreating || !!editingPersona

    if (loading && personas.length === 0) {
        return (
            <PageBackground>
                <Container maxWidth="lg" padding="md">
                    <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="muted">Loading personas...</div>
                    </div>
                </Container>
            </PageBackground>
        )
    }

    return (
        <PageBackground>
            <Container maxWidth="lg" padding="md">
                <div className="persona-page-layout">
                    {/* Header */}
                    <header className="page-header mb-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-surface-secondary rounded-xl">
                                <Icon name="lighthouse" size="lg" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-display font-semibold text-text-primary">
                                    {copy.personas.pageTitle}
                                </h1>
                                <p className="text-text-secondary">
                                    {copy.personas.pageSubtitle}
                                </p>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Persona List */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-semibold text-text-primary">Your Personas</h2>
                                <button
                                    onClick={handleCreate}
                                    className="ghost-button text-accent-primary hover:text-accent-hover"
                                    disabled={isEditorOpen && isCreating}
                                >
                                    <Icon name="plus" size="sm" hideAccent />
                                    New
                                </button>
                            </div>

                            <div className="space-y-3">
                                {personas.map(persona => (
                                    <div
                                        key={persona.id}
                                        className={`
                      surface-card p-4 transition-all cursor-pointer border-2
                      ${persona.is_active ? 'border-accent-primary/50 bg-surface-secondary' : 'border-transparent hover:border-border-subtle'}
                      ${editingPersona?.id === persona.id ? 'ring-2 ring-accent-primary' : ''}
                    `}
                                        onClick={() => handleEdit(persona)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-medium text-text-primary">{persona.name}</h3>
                                            {persona.is_active && (
                                                <span className="text-xs bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded-full">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        {persona.description && (
                                            <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                                                {persona.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle">
                                            {!persona.is_active && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setActivePersona(persona.id)
                                                    }}
                                                    className="text-xs text-text-secondary hover:text-text-primary"
                                                >
                                                    Set as active
                                                </button>
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(persona.id)
                                                }}
                                                className="text-xs text-error hover:text-error-hover ml-auto"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {personas.length === 0 && (
                                    <div className="text-center p-8 border-2 border-dashed border-border-subtle rounded-xl">
                                        <p className="text-text-secondary text-sm mb-4">
                                            {copy.personas.emptyState}
                                        </p>
                                        <button onClick={handleCreate} className="primary-button">
                                            Create your first persona
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Editor */}
                        <div className="lg:col-span-2">
                            {isEditorOpen ? (
                                <div className="surface-card p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle">
                                        <h2 className="text-xl font-semibold text-text-primary">
                                            {isCreating ? 'Create New Persona' : `Edit ${editingPersona?.name}`}
                                        </h2>
                                        <button onClick={handleCloseEditor} className="ghost-button">
                                            Close
                                        </button>
                                    </div>

                                    <PersonaEditor
                                        persona={editingPersona}
                                        onSave={() => {
                                            handleCloseEditor()
                                        }}
                                        onCancel={handleCloseEditor}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-50">
                                    <div className="p-6 bg-surface-secondary rounded-full mb-4">
                                        <Icon name="lighthouse" size="xl" />
                                    </div>
                                    <h3 className="text-lg font-medium text-text-primary mb-2">
                                        Manage your personas
                                    </h3>
                                    <p className="text-text-secondary max-w-md">
                                        Select a persona from the list to edit its preferences, or create a new one to target different roles.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Container>
        </PageBackground>
    )
}
