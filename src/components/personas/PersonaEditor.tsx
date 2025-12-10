/**
 * =============================================================================
 * PersonaEditor Component
 * =============================================================================
 * 
 * A form component for creating and editing user personas with their preferences.
 * Can be used standalone or inside a modal.
 * 
 * Features:
 * - Name and description fields
 * - Job search preferences (titles, salary, remote, locations)
 * - Create and Edit modes
 * - Validation and error handling
 * 
 * =============================================================================
 */

import { useState, useEffect, FormEvent } from 'react'
import { usePersonas } from '../../hooks/usePersonas'
import type {
    UserPersona,
    PersonaPreferences,
    CreatePersonaInput,
    UpdatePersonaInput,
    RemotePreference,
    DEFAULT_PERSONA_PREFERENCES,
} from '../../types/v2-personas'

// =============================================================================
// TYPES
// =============================================================================

export interface PersonaEditorProps {
    /** Persona to edit (null/undefined for create mode) */
    persona?: UserPersona | null

    /** Callback when save is complete */
    onSave?: (persona: UserPersona) => void

    /** Callback when cancel is clicked */
    onCancel?: () => void

    /** Custom className */
    className?: string

    /** Show in compact mode (fewer fields) */
    compact?: boolean
}

// Remote preference options
const REMOTE_OPTIONS: { value: RemotePreference; label: string }[] = [
    { value: 'any', label: 'Any' },
    { value: 'remote', label: 'Remote Only' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'onsite', label: 'On-site' },
]

// =============================================================================
// COMPONENT
// =============================================================================

export function PersonaEditor({
    persona,
    onSave,
    onCancel,
    className = '',
    compact = false,
}: PersonaEditorProps) {
    const { createPersona, updatePersona } = usePersonas()
    const isEditMode = !!persona

    // ---------------------------------------------------------------------------
    // FORM STATE
    // ---------------------------------------------------------------------------

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isActive, setIsActive] = useState(false)

    // Preferences
    const [jobTitleKeywords, setJobTitleKeywords] = useState('')
    const [minSalary, setMinSalary] = useState('')
    const [maxSalary, setMaxSalary] = useState('')
    const [remotePreference, setRemotePreference] = useState<RemotePreference>('any')
    const [locations, setLocations] = useState('')
    const [requiredSkills, setRequiredSkills] = useState('')
    const [industries, setIndustries] = useState('')

    // UI state
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // ---------------------------------------------------------------------------
    // INITIALIZE FROM PERSONA
    // ---------------------------------------------------------------------------

    useEffect(() => {
        if (persona) {
            setName(persona.name)
            setDescription(persona.description || '')
            setIsActive(persona.is_active)

            const prefs = persona.preferences
            if (prefs) {
                setJobTitleKeywords(prefs.job_title_keywords?.join(', ') || '')
                setMinSalary(prefs.min_salary?.toString() || '')
                setMaxSalary(prefs.max_salary?.toString() || '')
                setRemotePreference(prefs.remote_preference || 'any')
                setLocations(prefs.locations?.join(', ') || '')
                setRequiredSkills(prefs.required_skills?.join(', ') || '')
                setIndustries(prefs.industries?.join(', ') || '')
            }
        } else {
            // Reset form for create mode
            setName('')
            setDescription('')
            setIsActive(true) // New personas default to active
            setJobTitleKeywords('')
            setMinSalary('')
            setMaxSalary('')
            setRemotePreference('any')
            setLocations('')
            setRequiredSkills('')
            setIndustries('')
        }
    }, [persona])

    // ---------------------------------------------------------------------------
    // HELPERS
    // ---------------------------------------------------------------------------

    // Parse comma-separated string into array
    const parseList = (value: string): string[] => {
        return value
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0)
    }

    // Parse salary string to number or null
    const parseSalary = (value: string): number | null => {
        const num = parseInt(value.replace(/[^0-9]/g, ''), 10)
        return isNaN(num) ? null : num
    }

    // ---------------------------------------------------------------------------
    // FORM SUBMIT
    // ---------------------------------------------------------------------------

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (!name.trim()) {
            setError('Persona name is required')
            return
        }

        const preferences: Omit<PersonaPreferences, 'id' | 'persona_id' | 'created_at' | 'updated_at'> = {
            job_title_keywords: parseList(jobTitleKeywords),
            min_salary: parseSalary(minSalary),
            max_salary: parseSalary(maxSalary),
            remote_preference: remotePreference,
            locations: parseList(locations),
            required_skills: parseList(requiredSkills),
            nice_to_have_skills: [],
            industries: parseList(industries),
            company_size: [],
            excluded_companies: [],
            mission_values: [],
            growth_focus: [],
        }

        try {
            setSaving(true)

            if (isEditMode && persona) {
                // Update existing persona
                const updateData: UpdatePersonaInput = {
                    name: name.trim(),
                    description: description.trim() || null,
                    is_active: isActive,
                    preferences,
                }
                await updatePersona(persona.id, updateData)

                // Create updated persona object for callback
                const updated: UserPersona = {
                    ...persona,
                    name: name.trim(),
                    description: description.trim() || null,
                    is_active: isActive,
                    preferences: {
                        ...persona.preferences,
                        ...preferences,
                    } as PersonaPreferences,
                }
                onSave?.(updated)
            } else {
                // Create new persona
                const createData: CreatePersonaInput = {
                    name: name.trim(),
                    description: description.trim() || null,
                    is_active: isActive,
                    preferences,
                }
                const newPersona = await createPersona(createData)
                onSave?.(newPersona)
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save persona'
            setError(message)
        } finally {
            setSaving(false)
        }
    }

    // ---------------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------------

    return (
        <form
            onSubmit={handleSubmit}
            className={`persona-editor ${className}`}
            style={styles.form}
        >
            {/* Error Message */}
            {error && (
                <div style={styles.error}>
                    {error}
                </div>
            )}

            {/* Basic Info Section */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Basic Information</h3>

                <div style={styles.field}>
                    <label htmlFor="persona-name" style={styles.label}>
                        Persona Name <span style={styles.required}>*</span>
                    </label>
                    <input
                        id="persona-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Frontend Focus, Leadership Track"
                        style={styles.input}
                        required
                    />
                </div>

                <div style={styles.field}>
                    <label htmlFor="persona-description" style={styles.label}>
                        Description
                    </label>
                    <textarea
                        id="persona-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the purpose of this persona..."
                        style={styles.textarea}
                        rows={2}
                    />
                </div>

                <div style={styles.field}>
                    <label style={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            style={styles.checkbox}
                        />
                        <span>Set as active persona</span>
                    </label>
                </div>
            </div>

            {/* Preferences Section */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Job Preferences</h3>

                <div style={styles.field}>
                    <label htmlFor="job-titles" style={styles.label}>
                        Job Title Keywords
                    </label>
                    <input
                        id="job-titles"
                        type="text"
                        value={jobTitleKeywords}
                        onChange={(e) => setJobTitleKeywords(e.target.value)}
                        placeholder="e.g., Frontend Developer, React Engineer"
                        style={styles.input}
                    />
                    <span style={styles.hint}>Separate multiple keywords with commas</span>
                </div>

                <div style={styles.row}>
                    <div style={styles.field}>
                        <label htmlFor="min-salary" style={styles.label}>
                            Min Salary
                        </label>
                        <input
                            id="min-salary"
                            type="text"
                            value={minSalary}
                            onChange={(e) => setMinSalary(e.target.value)}
                            placeholder="e.g., 80000"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.field}>
                        <label htmlFor="max-salary" style={styles.label}>
                            Max Salary
                        </label>
                        <input
                            id="max-salary"
                            type="text"
                            value={maxSalary}
                            onChange={(e) => setMaxSalary(e.target.value)}
                            placeholder="e.g., 150000"
                            style={styles.input}
                        />
                    </div>
                </div>

                <div style={styles.field}>
                    <label htmlFor="remote-pref" style={styles.label}>
                        Remote Preference
                    </label>
                    <select
                        id="remote-pref"
                        value={remotePreference}
                        onChange={(e) => setRemotePreference(e.target.value as RemotePreference)}
                        style={styles.select}
                    >
                        {REMOTE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={styles.field}>
                    <label htmlFor="locations" style={styles.label}>
                        Preferred Locations
                    </label>
                    <input
                        id="locations"
                        type="text"
                        value={locations}
                        onChange={(e) => setLocations(e.target.value)}
                        placeholder="e.g., San Francisco, New York, Remote"
                        style={styles.input}
                    />
                    <span style={styles.hint}>Separate multiple locations with commas</span>
                </div>

                {!compact && (
                    <>
                        <div style={styles.field}>
                            <label htmlFor="skills" style={styles.label}>
                                Required Skills
                            </label>
                            <input
                                id="skills"
                                type="text"
                                value={requiredSkills}
                                onChange={(e) => setRequiredSkills(e.target.value)}
                                placeholder="e.g., React, TypeScript, Node.js"
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.field}>
                            <label htmlFor="industries" style={styles.label}>
                                Preferred Industries
                            </label>
                            <input
                                id="industries"
                                type="text"
                                value={industries}
                                onChange={(e) => setIndustries(e.target.value)}
                                placeholder="e.g., Tech, Finance, Healthcare"
                                style={styles.input}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Actions */}
            <div style={styles.actions}>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        style={styles.cancelButton}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    style={styles.saveButton}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Persona'}
                </button>
            </div>
        </form>
    )
}

// =============================================================================
// STYLES
// =============================================================================

const styles: Record<string, React.CSSProperties> = {
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },

    error: {
        padding: '12px 16px',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        border: '1px solid rgba(220, 53, 69, 0.3)',
        borderRadius: '8px',
        color: '#dc3545',
        fontSize: '14px',
    },

    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },

    sectionTitle: {
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--text-primary, #fff)',
        margin: 0,
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border-subtle, #333)',
    },

    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flex: 1,
    },

    row: {
        display: 'flex',
        gap: '16px',
    },

    label: {
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--text-secondary, #888)',
    },

    required: {
        color: '#dc3545',
    },

    input: {
        padding: '10px 14px',
        backgroundColor: 'var(--surface-tertiary, #252525)',
        border: '1px solid var(--border-subtle, #333)',
        borderRadius: '6px',
        color: 'var(--text-primary, #fff)',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s ease',
    },

    textarea: {
        padding: '10px 14px',
        backgroundColor: 'var(--surface-tertiary, #252525)',
        border: '1px solid var(--border-subtle, #333)',
        borderRadius: '6px',
        color: 'var(--text-primary, #fff)',
        fontSize: '14px',
        outline: 'none',
        resize: 'vertical',
        minHeight: '60px',
    },

    select: {
        padding: '10px 14px',
        backgroundColor: 'var(--surface-tertiary, #252525)',
        border: '1px solid var(--border-subtle, #333)',
        borderRadius: '6px',
        color: 'var(--text-primary, #fff)',
        fontSize: '14px',
        outline: 'none',
        cursor: 'pointer',
    },

    hint: {
        fontSize: '12px',
        color: 'var(--text-tertiary, #666)',
    },

    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: 'var(--text-primary, #fff)',
        cursor: 'pointer',
    },

    checkbox: {
        width: '18px',
        height: '18px',
        accentColor: 'var(--accent-primary, #d4af37)',
    },

    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-subtle, #333)',
    },

    cancelButton: {
        padding: '10px 20px',
        backgroundColor: 'transparent',
        border: '1px solid var(--border-subtle, #444)',
        borderRadius: '6px',
        color: 'var(--text-secondary, #888)',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },

    saveButton: {
        padding: '10px 24px',
        backgroundColor: 'var(--accent-primary, #d4af37)',
        border: 'none',
        borderRadius: '6px',
        color: '#000',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
}

export default PersonaEditor
