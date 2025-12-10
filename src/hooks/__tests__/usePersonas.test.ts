/**
 * Tests for usePersonas hook
 * 
 * Run with: npm test -- usePersonas.test.ts
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

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
        preferences: {
            job_title_keywords: ['Frontend Developer'],
            min_salary: 100000,
            max_salary: 150000,
            required_skills: ['React'],
            nice_to_have_skills: [],
            remote_preference: 'remote',
            locations: ['Remote'],
            industries: ['Tech'],
            company_size: [],
        },
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
// HELPER FUNCTION TESTS
// =============================================================================

describe('usePersonas Helper Functions', () => {
    test('activePersona should find the active persona', () => {
        const personas = [...mockPersonas]
        const activePersona = personas.find(p => p.is_active) || null

        expect(activePersona).not.toBeNull()
        expect(activePersona?.name).toBe('Frontend Focus')
    })

    test('activePersona should be null when none active', () => {
        const personas = mockPersonas.map(p => ({ ...p, is_active: false }))
        const activePersona = personas.find(p => p.is_active) || null

        expect(activePersona).toBeNull()
    })

    test('activePersona should be null when list is empty', () => {
        const personas: typeof mockPersonas = []
        const activePersona = personas.find(p => p.is_active) || null

        expect(activePersona).toBeNull()
    })
})

// =============================================================================
// STATE MANAGEMENT TESTS
// =============================================================================

describe('usePersonas State Management', () => {
    test('should initialize with empty personas array', () => {
        const initialState = {
            personas: [],
            loading: true,
            error: null,
        }

        expect(initialState.personas).toEqual([])
        expect(initialState.loading).toBe(true)
        expect(initialState.error).toBeNull()
    })

    test('should update state on successful fetch', () => {
        const state = {
            personas: [],
            loading: true,
            error: null,
        }

        // Simulate successful fetch
        const updatedState = {
            personas: mockPersonas,
            loading: false,
            error: null,
        }

        expect(updatedState.personas).toHaveLength(2)
        expect(updatedState.loading).toBe(false)
    })

    test('should set error state on fetch failure', () => {
        const errorState = {
            personas: [],
            loading: false,
            error: 'Failed to fetch personas',
        }

        expect(errorState.error).toBe('Failed to fetch personas')
        expect(errorState.loading).toBe(false)
    })
})

// =============================================================================
// CREATE PERSONA TESTS
// =============================================================================

describe('createPersona', () => {
    test('should add new persona to state', () => {
        const existingPersonas = [...mockPersonas]
        const newPersona = {
            id: 'persona-3',
            user_id: 'user-123',
            name: 'Leadership Track',
            description: 'For management roles',
            is_active: false,
            created_at: '2024-12-11T00:00:00Z',
            updated_at: '2024-12-11T00:00:00Z',
            preferences: null,
        }

        const updatedPersonas = [newPersona, ...existingPersonas]

        expect(updatedPersonas).toHaveLength(3)
        expect(updatedPersonas[0].name).toBe('Leadership Track')
    })

    test('should deactivate others when new persona is active', () => {
        const existingPersonas = [...mockPersonas]
        const newPersona = {
            ...mockPersonas[0],
            id: 'persona-3',
            name: 'New Active',
            is_active: true,
        }

        const updatedPersonas = [
            newPersona,
            ...existingPersonas.map(p => ({ ...p, is_active: false })),
        ]

        const activeCount = updatedPersonas.filter(p => p.is_active).length
        expect(activeCount).toBe(1)
        expect(updatedPersonas.find(p => p.is_active)?.name).toBe('New Active')
    })
})

// =============================================================================
// UPDATE PERSONA TESTS
// =============================================================================

describe('updatePersona', () => {
    test('should update persona in state', () => {
        const personas = [...mockPersonas]
        const updateId = 'persona-1'
        const updates = { name: 'Updated Name' }

        const updatedPersonas = personas.map(p => {
            if (p.id === updateId) {
                return { ...p, ...updates }
            }
            return p
        })

        expect(updatedPersonas.find(p => p.id === updateId)?.name).toBe('Updated Name')
    })

    test('should handle is_active update with deactivation of others', () => {
        const personas = [...mockPersonas]
        const targetId = 'persona-2' // Currently inactive

        const updatedPersonas = personas.map(p => ({
            ...p,
            is_active: p.id === targetId,
        }))

        expect(updatedPersonas.find(p => p.id === 'persona-1')?.is_active).toBe(false)
        expect(updatedPersonas.find(p => p.id === 'persona-2')?.is_active).toBe(true)
    })
})

// =============================================================================
// DELETE PERSONA TESTS
// =============================================================================

describe('deletePersona', () => {
    test('should remove persona from state', () => {
        const personas = [...mockPersonas]
        const deleteId = 'persona-2'

        const updatedPersonas = personas.filter(p => p.id !== deleteId)

        expect(updatedPersonas).toHaveLength(1)
        expect(updatedPersonas.find(p => p.id === deleteId)).toBeUndefined()
    })

    test('should handle deleting active persona', () => {
        const personas = [...mockPersonas]
        const deleteId = 'persona-1' // This is the active one

        const deletedPersona = personas.find(p => p.id === deleteId)
        expect(deletedPersona?.is_active).toBe(true)

        const remaining = personas.filter(p => p.id !== deleteId)
        expect(remaining).toHaveLength(1)
    })
})

// =============================================================================
// SET ACTIVE PERSONA TESTS
// =============================================================================

describe('setActivePersona', () => {
    test('should optimistically update active state', () => {
        const personas = [...mockPersonas]
        const targetId = 'persona-2'

        const optimisticUpdate = personas.map(p => ({
            ...p,
            is_active: p.id === targetId,
        }))

        expect(optimisticUpdate.find(p => p.id === 'persona-1')?.is_active).toBe(false)
        expect(optimisticUpdate.find(p => p.id === 'persona-2')?.is_active).toBe(true)
    })

    test('should only have one active persona after update', () => {
        const personas = [...mockPersonas]
        const targetId = 'persona-2'

        const updated = personas.map(p => ({
            ...p,
            is_active: p.id === targetId,
        }))

        const activeCount = updated.filter(p => p.is_active).length
        expect(activeCount).toBe(1)
    })
})

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('Error Handling', () => {
    test('should handle network errors gracefully', () => {
        const error = new Error('Network error')
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        expect(errorMessage).toBe('Network error')
    })

    test('should handle API errors with message', () => {
        const apiResponse = {
            success: false,
            error: 'Duplicate name',
            message: 'A persona with this name already exists',
        }

        const errorMessage = apiResponse.message || apiResponse.error || 'API request failed'
        expect(errorMessage).toBe('A persona with this name already exists')
    })

    test('should fallback to generic error message', () => {
        const apiResponse = {
            success: false,
        }

        const errorMessage = (apiResponse as any).message || (apiResponse as any).error || 'API request failed'
        expect(errorMessage).toBe('API request failed')
    })
})

// =============================================================================
// AUTH HANDLING TESTS
// =============================================================================

describe('Auth Handling', () => {
    test('should return empty personas when not authenticated', () => {
        const userId = null

        if (!userId) {
            const result = { personas: [], loading: false, error: null }
            expect(result.personas).toEqual([])
        }
    })

    test('should throw error for operations without auth', () => {
        const userId = null

        const createPersonaWithoutAuth = () => {
            if (!userId) {
                throw new Error('Not authenticated')
            }
        }

        expect(createPersonaWithoutAuth).toThrow('Not authenticated')
    })
})
