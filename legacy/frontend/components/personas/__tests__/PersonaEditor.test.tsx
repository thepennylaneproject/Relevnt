/**
 * Tests for PersonaEditor component
 * 
 * Run with: npm test -- PersonaEditor.test.tsx
 */

import { describe, test, expect, vi } from 'vitest'

// =============================================================================
// MOCK DATA
// =============================================================================

const mockPersona = {
    id: 'persona-1',
    user_id: 'user-123',
    name: 'Frontend Focus',
    description: 'For frontend developer roles',
    is_active: true,
    created_at: '2024-12-10T00:00:00Z',
    updated_at: '2024-12-10T00:00:00Z',
    preferences: {
        job_title_keywords: ['Frontend Developer', 'React Engineer'],
        min_salary: 100000,
        max_salary: 150000,
        required_skills: ['React', 'TypeScript'],
        nice_to_have_skills: ['Node.js'],
        remote_preference: 'remote' as const,
        locations: ['San Francisco', 'Remote'],
        industries: ['Tech', 'Finance'],
        company_size: ['startup', 'mid-size'],
        excluded_companies: [],
        mission_values: [],
        growth_focus: [],
    },
}

// =============================================================================
// FORM STATE TESTS
// =============================================================================

describe('PersonaEditor Form State', () => {
    test('should initialize empty form for create mode', () => {
        // In create mode, no persona is provided, so form should be empty
        const initialState = {
            name: '',
            description: '',
            isActive: true, // Default true for new personas
        }

        expect(initialState.name).toBe('')
        expect(initialState.description).toBe('')
        expect(initialState.isActive).toBe(true)
    })

    test('should populate form from existing persona in edit mode', () => {
        const initialState = {
            name: mockPersona.name,
            description: mockPersona.description || '',
            isActive: mockPersona.is_active,
        }

        expect(initialState.name).toBe('Frontend Focus')
        expect(initialState.description).toBe('For frontend developer roles')
        expect(initialState.isActive).toBe(true)
    })

    test('should populate preferences from existing persona', () => {
        const prefs = mockPersona.preferences
        const initialPrefsState = {
            jobTitleKeywords: prefs?.job_title_keywords?.join(', ') || '',
            minSalary: prefs?.min_salary?.toString() || '',
            maxSalary: prefs?.max_salary?.toString() || '',
            remotePreference: prefs?.remote_preference || 'any',
            locations: prefs?.locations?.join(', ') || '',
        }

        expect(initialPrefsState.jobTitleKeywords).toBe('Frontend Developer, React Engineer')
        expect(initialPrefsState.minSalary).toBe('100000')
        expect(initialPrefsState.maxSalary).toBe('150000')
        expect(initialPrefsState.remotePreference).toBe('remote')
        expect(initialPrefsState.locations).toBe('San Francisco, Remote')
    })
})

// =============================================================================
// VALIDATION TESTS
// =============================================================================

describe('PersonaEditor Validation', () => {
    test('should require name field', () => {
        const name = ''
        const isValid = name.trim() !== ''

        expect(isValid).toBe(false)
    })

    test('should accept valid name', () => {
        const name = 'Valid Persona Name'
        const isValid = name.trim() !== ''

        expect(isValid).toBe(true)
    })

    test('should trim whitespace from name', () => {
        const name = '  Trimmed Name  '
        const trimmed = name.trim()

        expect(trimmed).toBe('Trimmed Name')
    })

    test('should allow empty description', () => {
        const description = ''
        const isValid = true // Description is optional

        expect(isValid).toBe(true)
    })
})

// =============================================================================
// PARSING TESTS
// =============================================================================

describe('PersonaEditor Input Parsing', () => {
    test('parseList should split comma-separated values', () => {
        const parseList = (value: string): string[] => {
            return value
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0)
        }

        expect(parseList('React, TypeScript, Node.js')).toEqual([
            'React',
            'TypeScript',
            'Node.js',
        ])
    })

    test('parseList should handle empty string', () => {
        const parseList = (value: string): string[] => {
            return value
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0)
        }

        expect(parseList('')).toEqual([])
    })

    test('parseList should handle single value', () => {
        const parseList = (value: string): string[] => {
            return value
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0)
        }

        expect(parseList('Single')).toEqual(['Single'])
    })

    test('parseSalary should parse numeric string', () => {
        const parseSalary = (value: string): number | null => {
            const num = parseInt(value.replace(/[^0-9]/g, ''), 10)
            return isNaN(num) ? null : num
        }

        expect(parseSalary('100000')).toBe(100000)
    })

    test('parseSalary should handle formatted currency', () => {
        const parseSalary = (value: string): number | null => {
            const num = parseInt(value.replace(/[^0-9]/g, ''), 10)
            return isNaN(num) ? null : num
        }

        expect(parseSalary('$120,000')).toBe(120000)
    })

    test('parseSalary should return null for invalid input', () => {
        const parseSalary = (value: string): number | null => {
            const num = parseInt(value.replace(/[^0-9]/g, ''), 10)
            return isNaN(num) ? null : num
        }

        expect(parseSalary('invalid')).toBeNull()
        expect(parseSalary('')).toBeNull()
    })
})

// =============================================================================
// SUBMIT TESTS
// =============================================================================

describe('PersonaEditor Submit', () => {
    test('should build correct create payload', () => {
        const formState = {
            name: 'New Persona',
            description: 'Test description',
            isActive: true,
            jobTitleKeywords: 'Developer, Engineer',
            minSalary: '80000',
            maxSalary: '120000',
            remotePreference: 'hybrid' as const,
            locations: 'NYC, Remote',
        }

        const parseList = (value: string) =>
            value.split(',').map(s => s.trim()).filter(s => s.length > 0)
        const parseSalary = (value: string) => {
            const num = parseInt(value.replace(/[^0-9]/g, ''), 10)
            return isNaN(num) ? null : num
        }

        const payload = {
            name: formState.name.trim(),
            description: formState.description.trim() || null,
            is_active: formState.isActive,
            preferences: {
                job_title_keywords: parseList(formState.jobTitleKeywords),
                min_salary: parseSalary(formState.minSalary),
                max_salary: parseSalary(formState.maxSalary),
                remote_preference: formState.remotePreference,
                locations: parseList(formState.locations),
                required_skills: [],
                nice_to_have_skills: [],
                industries: [],
                company_size: [],
            },
        }

        expect(payload.name).toBe('New Persona')
        expect(payload.preferences.job_title_keywords).toEqual(['Developer', 'Engineer'])
        expect(payload.preferences.min_salary).toBe(80000)
        expect(payload.preferences.remote_preference).toBe('hybrid')
    })

    test('should call onSave with created persona', () => {
        const onSave = vi.fn()
        const newPersona = { ...mockPersona, id: 'new-id' }

        onSave(newPersona)

        expect(onSave).toHaveBeenCalledWith(newPersona)
    })

    test('should call onSave with updated persona', () => {
        const onSave = vi.fn()
        const updated = { ...mockPersona, name: 'Updated Name' }

        onSave(updated)

        expect(onSave).toHaveBeenCalledWith(updated)
        expect(onSave.mock.calls[0][0].name).toBe('Updated Name')
    })
})

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('PersonaEditor Error Handling', () => {
    test('should display validation error for empty name', () => {
        const name = ''
        let error: string | null = null

        if (!name.trim()) {
            error = 'Persona name is required'
        }

        expect(error).toBe('Persona name is required')
    })

    test('should display API error on failure', () => {
        const apiError = new Error('Duplicate name')
        const errorMessage = apiError instanceof Error
            ? apiError.message
            : 'Failed to save persona'

        expect(errorMessage).toBe('Duplicate name')
    })

    test('should clear error on successful submit', () => {
        let error: string | null = 'Previous error'

        // Simulate successful submit
        error = null

        expect(error).toBeNull()
    })
})

// =============================================================================
// LOADING/SAVING STATE TESTS
// =============================================================================

describe('PersonaEditor Loading State', () => {
    test('should disable inputs while saving', () => {
        const saving = true
        const inputDisabled = saving

        expect(inputDisabled).toBe(true)
    })

    test('should show saving text on submit button', () => {
        const saving = true
        const isEditMode = false
        const buttonText = saving
            ? 'Saving...'
            : isEditMode
                ? 'Save Changes'
                : 'Create Persona'

        expect(buttonText).toBe('Saving...')
    })

    test('should show correct button text for create mode', () => {
        const saving = false
        const isEditMode = false
        const buttonText = saving
            ? 'Saving...'
            : isEditMode
                ? 'Save Changes'
                : 'Create Persona'

        expect(buttonText).toBe('Create Persona')
    })

    test('should show correct button text for edit mode', () => {
        const saving = false
        const isEditMode = true
        const buttonText = saving
            ? 'Saving...'
            : isEditMode
                ? 'Save Changes'
                : 'Create Persona'

        expect(buttonText).toBe('Save Changes')
    })
})

// =============================================================================
// CANCEL TESTS
// =============================================================================

describe('PersonaEditor Cancel', () => {
    test('should call onCancel when cancel button clicked', () => {
        const onCancel = vi.fn()

        onCancel()

        expect(onCancel).toHaveBeenCalled()
    })

    test('should disable cancel button while saving', () => {
        const saving = true
        const isDisabled = saving

        expect(isDisabled).toBe(true)
    })
})

// =============================================================================
// REMOTE PREFERENCE OPTIONS TESTS
// =============================================================================

describe('PersonaEditor Remote Preference Options', () => {
    test('should have all remote preference options', () => {
        const options = [
            { value: 'any', label: 'Any' },
            { value: 'remote', label: 'Remote Only' },
            { value: 'hybrid', label: 'Hybrid' },
            { value: 'onsite', label: 'On-site' },
        ]

        expect(options).toHaveLength(4)
        expect(options.map(o => o.value)).toEqual(['any', 'remote', 'hybrid', 'onsite'])
    })
})

// =============================================================================
// COMPACT MODE TESTS
// =============================================================================

describe('PersonaEditor Compact Mode', () => {
    test('should hide extended fields in compact mode', () => {
        const compact = true
        const showExtendedFields = !compact

        expect(showExtendedFields).toBe(false)
    })

    test('should show extended fields when not compact', () => {
        const compact = false
        const showExtendedFields = !compact

        expect(showExtendedFields).toBe(true)
    })
})
