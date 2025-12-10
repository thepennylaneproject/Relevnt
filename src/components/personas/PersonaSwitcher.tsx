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
    const [isOpen, setIsOpen] = useState(false)
    const [switching, setSwitching] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

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
                    <span style={styles.loadingDot}>●</span>
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
                <span style={styles.personaIcon}>👤</span>
                <span style={styles.personaName}>
                    {switching ? 'Switching...' : activePersona?.name || 'Select Persona'}
                </span>
                <span style={styles.chevron}>{isOpen ? '▲' : '▼'}</span>
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
                            <span style={styles.itemName}>{persona.name}</span>
                            {persona.id === activePersona?.id && (
                                <span style={styles.checkmark}>✓</span>
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
    },

    triggerButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: 'var(--surface-secondary, #1a1a1a)',
        border: '1px solid var(--border-subtle, #333)',
        borderRadius: '8px',
        color: 'var(--text-primary, #fff)',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '160px',
        justifyContent: 'space-between',
    },

    compactButton: {
        padding: '6px 12px',
        fontSize: '13px',
        minWidth: '140px',
    },

    disabledButton: {
        opacity: 0.6,
        cursor: 'not-allowed',
    },

    personaIcon: {
        fontSize: '16px',
    },

    personaName: {
        flex: 1,
        textAlign: 'left',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },

    chevron: {
        fontSize: '10px',
        opacity: 0.6,
    },

    dropdown: {
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        right: 0,
        minWidth: '200px',
        backgroundColor: 'var(--surface-secondary, #1a1a1a)',
        border: '1px solid var(--border-subtle, #333)',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
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
        color: 'var(--text-primary, #fff)',
        fontSize: '14px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
    },

    activeItem: {
        backgroundColor: 'var(--surface-tertiary, #252525)',
        color: 'var(--accent-primary, #d4af37)',
    },

    itemName: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },

    checkmark: {
        color: 'var(--accent-primary, #d4af37)',
        fontWeight: 600,
    },

    divider: {
        height: '1px',
        backgroundColor: 'var(--border-subtle, #333)',
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
        color: 'var(--accent-primary, #d4af37)',
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
        backgroundColor: 'var(--surface-secondary, #1a1a1a)',
        border: '1px solid var(--border-subtle, #333)',
        borderRadius: '8px',
        color: 'var(--text-secondary, #888)',
        fontSize: '14px',
    },

    loadingDot: {
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
        backgroundColor: 'var(--accent-primary, #d4af37)',
        border: 'none',
        borderRadius: '8px',
        color: '#000',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
    },

    emptyText: {
        color: 'var(--text-secondary, #888)',
        fontSize: '14px',
        fontStyle: 'italic',
    },
}

export default PersonaSwitcher
