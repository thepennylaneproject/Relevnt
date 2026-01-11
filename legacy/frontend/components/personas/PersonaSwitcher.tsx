/**
 * =============================================================================
 * PersonaSwitcher Component
 * =============================================================================
 * 
 * A dropdown/select component for switching between user personas.
 * Designed to be placed in headers, sidebars, or at the top of job feeds.
 * 
 * Features:
 * - Lists all personas by name
 * - Shows active persona indicator
 * - Compact design for header placement
 * - Optional "Add New" button
 * 
 * =============================================================================
 */

import { useState, useRef, useEffect } from 'react'
import { usePersonas } from '../../hooks/usePersonas'
import { useResumes } from '../../hooks/useResumes'
import { useAuth } from '../../contexts/AuthContext'
import { Icon } from '../ui/Icon'
import type { UserPersona } from '../../types/v2-personas'

// =============================================================================
// TYPES
// =============================================================================

export interface PersonaSwitcherProps {
    /** Optional callback when persona changes */
    onPersonaChange?: (persona: UserPersona) => void

    /** Show "Add New" option in dropdown */
    showAddNew?: boolean

    /** Callback when "Add New" is clicked */
    onAddNew?: () => void

    /** Custom className */
    className?: string

    /** Compact mode for tight spaces */
    compact?: boolean
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PersonaSwitcher({
    onPersonaChange,
    showAddNew = false,
    onAddNew,
    className = '',
    compact = false,
}: PersonaSwitcherProps) {
    const { personas, activePersona, loading, setActivePersona } = usePersonas()
    const { user } = useAuth()
    const { resumes, loading: resumesLoading } = useResumes(user!)
    const [isOpen, setIsOpen] = useState(false)
    const [switching, setSwitching] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Helper to get resume name by ID
    const getResumeName = (resumeId: string | null | undefined): string | null => {
        if (!resumeId || resumesLoading) return null
        const resume = resumes.find(r => r.id === resumeId)
        return resume?.title || null
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Handle persona selection
    const handleSelect = async (persona: UserPersona) => {
        if (persona.id === activePersona?.id) {
            setIsOpen(false)
            return
        }

        try {
            setSwitching(true)
            await setActivePersona(persona.id)
            onPersonaChange?.(persona)
        } catch (err) {
            console.error('Failed to switch persona:', err)
        } finally {
            setSwitching(false)
            setIsOpen(false)
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className={`persona-switcher persona-switcher--loading ${className}`} style={styles.container}>
                <div style={styles.loadingButton}>
                    <div style={styles.loadingCircle} />
                    <span style={styles.loadingText}>Loading...</span>
                </div>
            </div>
        )
    }

    // No personas state
    if (personas.length === 0) {
        return (
            <div className={`persona-switcher persona-switcher--empty ${className}`} style={styles.container}>
                {showAddNew && onAddNew ? (
                    <button
                        onClick={onAddNew}
                        style={{
                            ...styles.addButton,
                            ...(compact ? styles.compactButton : {}),
                        }}
                    >
                        + Create Persona
                    </button>
                ) : (
                    <span style={styles.emptyText}>No personas</span>
                )}
            </div>
        )
    }

    return (
        <div
            ref={dropdownRef}
            className={`persona-switcher ${className}`}
            style={styles.container}
        >
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={switching}
                style={{
                    ...styles.triggerButton,
                    ...(compact ? styles.compactButton : {}),
                    ...(switching ? styles.disabledButton : {}),
                }}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <div style={styles.personaIcon}>
                    <Icon name="user" size="sm" hideAccent />
                </div>
                <span style={styles.personaName}>
                    {switching ? 'Switching...' : activePersona?.name || 'Select Persona'}
                </span>
                <div style={styles.chevron}>
                    <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size="sm" hideAccent />
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={styles.dropdown} role="listbox">
                    {personas.map((persona) => (
                        <button
                            key={persona.id}
                            onClick={() => handleSelect(persona)}
                            style={{
                                ...styles.dropdownItem,
                                ...(persona.id === activePersona?.id ? styles.activeItem : {}),
                            }}
                            role="option"
                            aria-selected={persona.id === activePersona?.id}
                        >
                            <div style={styles.itemContent}>
                                <span style={styles.itemName}>{persona.name}</span>
                                {getResumeName(persona.resume_id) && (
                                    <div style={styles.resumeSubtitle}>
                                        <Icon name="scroll" size="sm" hideAccent />
                                        <span>{getResumeName(persona.resume_id)}</span>
                                    </div>
                                )}
                            </div>
                            {persona.id === activePersona?.id && (
                                <div style={styles.checkmark}>
                                    <Icon name="check" size="sm" />
                                </div>
                            )}
                        </button>
                    ))}

                    {/* Add New Option */}
                    {showAddNew && onAddNew && (
                        <>
                            <div style={styles.divider} />
                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    onAddNew()
                                }}
                                style={styles.addNewItem}
                            >
                                <span style={styles.addIcon}>+</span>
                                <span>Add New Persona</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

// =============================================================================
// STYLES
// =============================================================================

const styles: Record<string, React.CSSProperties> = {
    container: {
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        maxWidth: '220px',
    },

    triggerButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: 'var(--text)',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '160px',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '220px',
    },

    compactButton: {
        padding: '6px 12px',
        fontSize: '13px',
        minWidth: '140px',
        maxWidth: '180px',
    },

    disabledButton: {
        opacity: 0.6,
        cursor: 'not-allowed',
    },

    personaIcon: {
        display: 'flex',
        alignItems: 'center',
        color: 'var(--text-muted)',
    },

    personaName: {
        flex: 1,
        textAlign: 'left',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },

    chevron: {
        display: 'flex',
        alignItems: 'center',
        opacity: 0.6,
        width: '16px',
    },

    dropdown: {
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        right: 0,
        minWidth: '200px',
        maxWidth: '100vw',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        zIndex: 100,
        overflow: 'hidden',
    },

    dropdownItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '10px 16px',
        backgroundColor: 'transparent',
        border: 'none',
        color: 'var(--text)',
        fontSize: '14px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
    },

    activeItem: {
        backgroundColor: 'var(--surface-soft)',
        color: 'var(--accent)',
    },

    itemContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        flex: 1,
        overflow: 'hidden',
    },

    itemName: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontWeight: 500,
    },

    resumeSubtitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },

    checkmark: {
        display: 'flex',
        alignItems: 'center',
        color: 'var(--accent)',
    },

    divider: {
        height: '1px',
        backgroundColor: 'var(--border)',
        margin: '4px 0',
    },

    addNewItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '10px 16px',
        backgroundColor: 'transparent',
        border: 'none',
        color: 'var(--accent)',
        fontSize: '14px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
    },

    addIcon: {
        fontSize: '16px',
        fontWeight: 600,
    },

    loadingButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: 'var(--text-muted)',
        fontSize: '14px',
    },

    loadingCircle: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: 'var(--accent)',
        animation: 'pulse 1s infinite',
    },

    loadingText: {
        fontStyle: 'italic',
    },

    addButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: 'var(--accent)',
        border: 'none',
        borderRadius: '8px',
        color: 'var(--text)',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
    },

    emptyText: {
        color: 'var(--text-muted)',
        fontSize: '14px',
        fontStyle: 'italic',
    },
}

export default PersonaSwitcher
