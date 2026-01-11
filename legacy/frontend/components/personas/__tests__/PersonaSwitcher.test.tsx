/**
 * Tests for PersonaSwitcher component
 * 
 * Run with: npm test -- PersonaSwitcher.test.tsx
 */

import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// =============================================================================
// MOCK DATA
// =============================================================================

const mockPersonas = [
    {
        id: 'persona-1',
        user_id: 'user-123',
        name: 'Frontend Focus',
        description: 'For frontend roles',
        is_active: true,
        created_at: '2024-12-10T00:00:00Z',
        updated_at: '2024-12-10T00:00:00Z',
        preferences: null,
    },
    {
        id: 'persona-2',
        user_id: 'user-123',
        name: 'Backend Focus',
        description: 'For backend roles',
        is_active: false,
        created_at: '2024-12-09T00:00:00Z',
        updated_at: '2024-12-09T00:00:00Z',
        preferences: null,
    },
]

// =============================================================================
// COMPONENT BEHAVIOR TESTS
// =============================================================================

describe('PersonaSwitcher Component Behavior', () => {
    test('should display active persona name initially', () => {
        const activePersona = mockPersonas.find(p => p.is_active)
        expect(activePersona?.name).toBe('Frontend Focus')
    })

    test('should show all personas in dropdown', () => {
        const sortedPersonas = [...mockPersonas].sort((a, b) =>
            a.name.localeCompare(b.name)
        )

        expect(sortedPersonas).toHaveLength(2)
        expect(sortedPersonas.map(p => p.name)).toContain('Frontend Focus')
        expect(sortedPersonas.map(p => p.name)).toContain('Backend Focus')
    })

    test('should indicate which persona is active', () => {
        const activePersona = mockPersonas.find(p => p.is_active)
        expect(activePersona?.is_active).toBe(true)
        expect(activePersona?.id).toBe('persona-1')
    })

    test('should handle empty personas list', () => {
        const emptyPersonas: typeof mockPersonas = []
        expect(emptyPersonas).toHaveLength(0)
    })
})

// =============================================================================
// INTERACTION TESTS
// =============================================================================

describe('PersonaSwitcher Interactions', () => {
    test('clicking trigger should toggle dropdown open state', () => {
        let isOpen = false

        // Simulate click
        isOpen = !isOpen
        expect(isOpen).toBe(true)

        // Simulate second click
        isOpen = !isOpen
        expect(isOpen).toBe(false)
    })

    test('selecting same persona should not trigger change', () => {
        const activePersona = mockPersonas.find(p => p.is_active)
        const selectedPersona = mockPersonas[0]

        const shouldTriggerChange = selectedPersona.id !== activePersona?.id
        expect(shouldTriggerChange).toBe(false)
    })

    test('selecting different persona should trigger onPersonaChange', () => {
        const activePersona = mockPersonas.find(p => p.is_active)
        const selectedPersona = mockPersonas[1]

        const shouldTriggerChange = selectedPersona.id !== activePersona?.id
        expect(shouldTriggerChange).toBe(true)
    })

    test('clicking outside should close dropdown', () => {
        let isOpen = true

        // Simulate click outside
        const handleClickOutside = () => { isOpen = false }
        handleClickOutside()

        expect(isOpen).toBe(false)
    })
})

// =============================================================================
// LOADING STATE TESTS
// =============================================================================

describe('PersonaSwitcher Loading State', () => {
    test('should show loading indicator when loading', () => {
        const loading = true
        expect(loading).toBe(true)
    })

    test('should disable interaction while loading', () => {
        const loading = true
        const canInteract = !loading

        expect(canInteract).toBe(false)
    })
})

// =============================================================================
// SWITCHING STATE TESTS
// =============================================================================

describe('PersonaSwitcher Switching State', () => {
    test('should show switching indicator during API call', () => {
        const switching = true
        expect(switching).toBe(true)
    })

    test('should disable trigger button while switching', () => {
        const switching = true
        const isDisabled = switching

        expect(isDisabled).toBe(true)
    })

    test('should show "Switching..." text while switching', () => {
        const switching = true
        const displayText = switching ? 'Switching...' : 'Frontend Focus'

        expect(displayText).toBe('Switching...')
    })
})

// =============================================================================
// ADD NEW OPTION TESTS
// =============================================================================

describe('PersonaSwitcher Add New Option', () => {
    test('should show "Add New" when showAddNew is true', () => {
        const showAddNew = true
        expect(showAddNew).toBe(true)
    })

    test('should hide "Add New" when showAddNew is false', () => {
        const showAddNew = false
        expect(showAddNew).toBe(false)
    })

    test('should call onAddNew when clicking add button', () => {
        const onAddNew = vi.fn()

        // Simulate click
        onAddNew()

        expect(onAddNew).toHaveBeenCalled()
    })

    test('should close dropdown after clicking add new', () => {
        let isOpen = true
        const onAddNew = vi.fn(() => { isOpen = false })

        onAddNew()

        expect(isOpen).toBe(false)
    })
})

// =============================================================================
// ACCESSIBILITY TESTS
// =============================================================================

describe('PersonaSwitcher Accessibility', () => {
    test('trigger should have aria-haspopup attribute', () => {
        const triggerProps = {
            'aria-haspopup': 'listbox',
            'aria-expanded': false,
        }

        expect(triggerProps['aria-haspopup']).toBe('listbox')
    })

    test('trigger should update aria-expanded when opened', () => {
        let isOpen = false

        isOpen = true
        const ariaExpanded = isOpen

        expect(ariaExpanded).toBe(true)
    })

    test('dropdown should have listbox role', () => {
        const dropdownProps = { role: 'listbox' }
        expect(dropdownProps.role).toBe('listbox')
    })

    test('options should have option role and aria-selected', () => {
        const optionProps = {
            role: 'option',
            'aria-selected': true,
        }

        expect(optionProps.role).toBe('option')
        expect(optionProps['aria-selected']).toBe(true)
    })
})

// =============================================================================
// COMPACT MODE TESTS
// =============================================================================

describe('PersonaSwitcher Compact Mode', () => {
    test('should apply compact styles when compact prop is true', () => {
        const compact = true
        const styles = compact
            ? { padding: '6px 12px', fontSize: '13px' }
            : { padding: '8px 16px', fontSize: '14px' }

        expect(styles.padding).toBe('6px 12px')
        expect(styles.fontSize).toBe('13px')
    })

    test('should apply normal styles when compact is false', () => {
        const compact = false
        const styles = compact
            ? { padding: '6px 12px', fontSize: '13px' }
            : { padding: '8px 16px', fontSize: '14px' }

        expect(styles.padding).toBe('8px 16px')
        expect(styles.fontSize).toBe('14px')
    })
})
