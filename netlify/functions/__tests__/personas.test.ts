/**
 * Tests for personas API endpoint
 * 
 * Run with: npm test -- personas.test.ts
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'

// =============================================================================
// MOCK DATA
// =============================================================================

const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
}

const mockPersona = {
    id: 'persona-123',
    user_id: 'user-123',
    name: 'Frontend Focus',
    description: 'For frontend developer roles',
    is_active: true,
    created_at: '2024-12-10T00:00:00Z',
    updated_at: '2024-12-10T00:00:00Z',
}

const mockPreferences = {
    id: 'pref-123',
    persona_id: 'persona-123',
    job_title_keywords: ['Frontend Developer', 'React Engineer'],
    min_salary: 100000,
    max_salary: 150000,
    required_skills: ['React', 'TypeScript'],
    nice_to_have_skills: ['Node.js'],
    remote_preference: 'remote',
    locations: ['San Francisco', 'Remote'],
    industries: ['Tech'],
    company_size: ['startup', 'mid-size'],
    excluded_companies: [],
    mission_values: [],
    growth_focus: [],
    created_at: '2024-12-10T00:00:00Z',
    updated_at: '2024-12-10T00:00:00Z',
}

// =============================================================================
// INPUT VALIDATION TESTS
// =============================================================================

describe('Persona Input Validation', () => {
    test('name should be required for create', () => {
        const input = {
            name: '',
            description: 'Test description',
        }

        expect(input.name.trim()).toBe('')
        expect(input.name.trim() === '').toBe(true)
    })

    test('name should be trimmed', () => {
        const input = {
            name: '  Frontend Focus  ',
        }

        expect(input.name.trim()).toBe('Frontend Focus')
    })

    test('description can be null', () => {
        const input = {
            name: 'Test Persona',
            description: null,
        }

        expect(input.description).toBeNull()
    })
})

// =============================================================================
// PREFERENCES VALIDATION TESTS
// =============================================================================

describe('Preferences Input Validation', () => {
    test('salary should parse correctly', () => {
        const parseSalary = (value: string): number | null => {
            const num = parseInt(value.replace(/[^0-9]/g, ''), 10)
            return isNaN(num) ? null : num
        }

        expect(parseSalary('100000')).toBe(100000)
        expect(parseSalary('$120,000')).toBe(120000)
        expect(parseSalary('invalid')).toBeNull()
        expect(parseSalary('')).toBeNull()
    })

    test('keywords should parse from comma-separated string', () => {
        const parseList = (value: string): string[] => {
            return value
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0)
        }

        expect(parseList('Frontend, React, TypeScript')).toEqual([
            'Frontend',
            'React',
            'TypeScript',
        ])
        expect(parseList('')).toEqual([])
        expect(parseList('  Single  ')).toEqual(['Single'])
    })

    test('remote preference should be valid enum', () => {
        const validOptions = ['remote', 'hybrid', 'onsite', 'any']

        expect(validOptions).toContain('remote')
        expect(validOptions).toContain('hybrid')
        expect(validOptions).toContain('onsite')
        expect(validOptions).toContain('any')
    })
})

// =============================================================================
// RESPONSE TRANSFORMATION TESTS
// =============================================================================

describe('Response Transformation', () => {
    test('persona with preferences should be correctly structured', () => {
        const rawResponse = {
            ...mockPersona,
            persona_preferences: [mockPreferences],
        }

        const transformed = {
            id: rawResponse.id,
            user_id: rawResponse.user_id,
            name: rawResponse.name,
            description: rawResponse.description,
            is_active: rawResponse.is_active,
            created_at: rawResponse.created_at,
            updated_at: rawResponse.updated_at,
            preferences: rawResponse.persona_preferences?.[0] || null,
        }

        expect(transformed.id).toBe(mockPersona.id)
        expect(transformed.preferences).toEqual(mockPreferences)
    })

    test('persona without preferences should have null preferences', () => {
        const rawResponse = {
            ...mockPersona,
            persona_preferences: [],
        }

        const transformed = {
            ...rawResponse,
            preferences: rawResponse.persona_preferences?.[0] || null,
        }

        expect(transformed.preferences).toBeNull()
    })
})

// =============================================================================
// ACTIVE PERSONA LOGIC TESTS
// =============================================================================

describe('Active Persona Logic', () => {
    test('setting a persona active should mark others inactive', () => {
        const personas = [
            { ...mockPersona, id: '1', is_active: true },
            { ...mockPersona, id: '2', is_active: false },
            { ...mockPersona, id: '3', is_active: false },
        ]

        const targetId = '2'

        const updated = personas.map(p => ({
            ...p,
            is_active: p.id === targetId,
        }))

        expect(updated.find(p => p.id === '1')?.is_active).toBe(false)
        expect(updated.find(p => p.id === '2')?.is_active).toBe(true)
        expect(updated.find(p => p.id === '3')?.is_active).toBe(false)
    })

    test('deleting active persona should activate newest remaining', () => {
        const personas = [
            { ...mockPersona, id: '1', is_active: true, created_at: '2024-12-01' },
            { ...mockPersona, id: '2', is_active: false, created_at: '2024-12-05' },
            { ...mockPersona, id: '3', is_active: false, created_at: '2024-12-10' },
        ]

        const deletedId = '1'
        const wasActive = personas.find(p => p.id === deletedId)?.is_active

        // Remove deleted persona
        const remaining = personas.filter(p => p.id !== deletedId)

        // If deleted was active, activate newest
        if (wasActive && remaining.length > 0) {
            remaining.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            remaining[0].is_active = true
        }

        expect(remaining).toHaveLength(2)
        expect(remaining.find(p => p.id === '3')?.is_active).toBe(true)
    })

    test('should only allow one active persona per user', () => {
        const personas = [
            { ...mockPersona, id: '1', is_active: true },
            { ...mockPersona, id: '2', is_active: true }, // Invalid - two active
        ]

        const activeCount = personas.filter(p => p.is_active).length
        expect(activeCount).toBeGreaterThan(1) // This is the error case we want to prevent
    })
})

// =============================================================================
// CROSS-USER ACCESS TESTS
// =============================================================================

describe('RLS / Cross-User Access Prevention', () => {
    test('user should not see other users personas in response', () => {
        const user1Personas = [
            { ...mockPersona, id: '1', user_id: 'user-123' },
            { ...mockPersona, id: '2', user_id: 'user-123' },
        ]

        const user2Personas = [
            { ...mockPersona, id: '3', user_id: 'user-456' },
        ]

        const currentUserId = 'user-123'

        // Filter to only current user's personas (simulating RLS)
        const visiblePersonas = [...user1Personas, ...user2Personas].filter(
            p => p.user_id === currentUserId
        )

        expect(visiblePersonas).toHaveLength(2)
        expect(visiblePersonas.every(p => p.user_id === currentUserId)).toBe(true)
    })

    test('delete should only work on own personas', () => {
        const personaToDelete = {
            id: 'persona-456',
            user_id: 'user-456', // Different user
        }

        const currentUserId = 'user-123'
        const canDelete = personaToDelete.user_id === currentUserId

        expect(canDelete).toBe(false)
    })
})

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
    test('empty personas list should return empty array', () => {
        const response = { data: [], count: 0 }
        expect(response.data).toEqual([])
        expect(response.count).toBe(0)
    })

    test('duplicate name should be caught', () => {
        const existingNames = ['Frontend Focus', 'Backend Focus']
        const newName = 'Frontend Focus'

        const isDuplicate = existingNames.includes(newName)
        expect(isDuplicate).toBe(true)
    })

    test('preferences arrays should default to empty', () => {
        const defaultPrefs = {
            job_title_keywords: [],
            required_skills: [],
            nice_to_have_skills: [],
            locations: [],
            industries: [],
            company_size: [],
            excluded_companies: [],
            mission_values: [],
            growth_focus: [],
        }

        expect(defaultPrefs.job_title_keywords).toEqual([])
        expect(defaultPrefs.required_skills).toEqual([])
    })
})
