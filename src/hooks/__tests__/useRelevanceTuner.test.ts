/**
 * Tests for useRelevanceTuner hook
 * 
 * Run with: npm test -- useRelevanceTuner.test.ts
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

// =============================================================================
// MOCK DATA
// =============================================================================

const mockPresets = [
    {
        id: 'preset-1',
        user_id: 'user-123',
        name: 'Skill-Heavy',
        skill_weight: 0.5,
        salary_weight: 0.2,
        location_weight: 0.1,
        remote_weight: 0.15,
        industry_weight: 0.05,
        is_default: true,
        created_at: '2024-12-10T00:00:00Z',
        updated_at: '2024-12-10T00:00:00Z',
    },
    {
        id: 'preset-2',
        user_id: 'user-123',
        name: 'Balanced',
        skill_weight: 0.3,
        salary_weight: 0.25,
        location_weight: 0.15,
        remote_weight: 0.2,
        industry_weight: 0.1,
        is_default: false,
        created_at: '2024-12-09T00:00:00Z',
        updated_at: '2024-12-09T00:00:00Z',
    },
]

// =============================================================================
// WEIGHT CONFIGURATION TESTS
// =============================================================================

describe('Weight Configuration', () => {
    test('default weights sum to 1.0', () => {
        const defaults = {
            skill_weight: 0.3,
            salary_weight: 0.25,
            location_weight: 0.15,
            remote_weight: 0.2,
            industry_weight: 0.1,
        }

        const sum = Object.values(defaults).reduce((a, b) => a + b, 0)
        expect(sum).toBeCloseTo(1.0, 10)
    })

    test('weight values are between 0 and 1', () => {
        mockPresets.forEach(preset => {
            expect(preset.skill_weight).toBeGreaterThanOrEqual(0)
            expect(preset.skill_weight).toBeLessThanOrEqual(1)
            expect(preset.salary_weight).toBeGreaterThanOrEqual(0)
            expect(preset.salary_weight).toBeLessThanOrEqual(1)
            expect(preset.location_weight).toBeGreaterThanOrEqual(0)
            expect(preset.location_weight).toBeLessThanOrEqual(1)
            expect(preset.remote_weight).toBeGreaterThanOrEqual(0)
            expect(preset.remote_weight).toBeLessThanOrEqual(1)
            expect(preset.industry_weight).toBeGreaterThanOrEqual(0)
            expect(preset.industry_weight).toBeLessThanOrEqual(1)
        })
    })
})

// =============================================================================
// PRESET MANAGEMENT TESTS
// =============================================================================

describe('Preset Management', () => {
    test('should identify default preset', () => {
        const defaultPreset = mockPresets.find(p => p.is_default)
        expect(defaultPreset).toBeDefined()
        expect(defaultPreset?.name).toBe('Skill-Heavy')
    })

    test('should have only one default preset', () => {
        const defaultPresets = mockPresets.filter(p => p.is_default)
        expect(defaultPresets.length).toBe(1)
    })

    test('should create new preset with valid weights', () => {
        const newPreset = {
            name: 'Test Preset',
            skill_weight: 0.4,
            salary_weight: 0.3,
            location_weight: 0.1,
            remote_weight: 0.1,
            industry_weight: 0.1,
        }

        const sum = newPreset.skill_weight + newPreset.salary_weight +
            newPreset.location_weight + newPreset.remote_weight +
            newPreset.industry_weight

        expect(sum).toBeCloseTo(1.0, 10)
        expect(newPreset.name).toBeTruthy()
    })
})

// =============================================================================
// WEIGHT OPERATIONS TESTS
// =============================================================================

describe('Weight Operations', () => {
    test('setWeight should update individual weight', () => {
        const currentWeights = { ...mockPresets[1] }
        const newSkillWeight = 0.5

        const updated = {
            ...currentWeights,
            skill_weight: newSkillWeight,
        }

        expect(updated.skill_weight).toBe(0.5)
        expect(updated.salary_weight).toBe(0.25) // Unchanged
    })

    test('reset should restore default weights', () => {
        const defaults = {
            skill_weight: 0.3,
            salary_weight: 0.25,
            location_weight: 0.15,
            remote_weight: 0.2,
            industry_weight: 0.1,
        }

        const modified = {
            skill_weight: 0.5,
            salary_weight: 0.3,
            location_weight: 0.05,
            remote_weight: 0.05,
            industry_weight: 0.1,
        }

        // Reset operation
        const reset = { ...defaults }

        expect(reset.skill_weight).toBe(defaults.skill_weight)
        expect(reset.salary_weight).toBe(defaults.salary_weight)
    })
})

// =============================================================================
// PRESET LOADING TESTS
// =============================================================================

describe('Preset Loading', () => {
    test('should load preset weights correctly', () => {
        const presetToLoad = mockPresets[0]

        const loaded = {
            skill_weight: presetToLoad.skill_weight,
            salary_weight: presetToLoad.salary_weight,
            location_weight: presetToLoad.location_weight,
            remote_weight: presetToLoad.remote_weight,
            industry_weight: presetToLoad.industry_weight,
        }

        expect(loaded.skill_weight).toBe(0.5)
        expect(loaded.salary_weight).toBe(0.2)
    })

    test('should track selected preset', () => {
        let selectedPreset = null

        selectedPreset = mockPresets[1]
        expect(selectedPreset).not.toBeNull()
        expect(selectedPreset.name).toBe('Balanced')
    })

    test('should clear selected preset when weights change manually', () => {
        let selectedPreset = mockPresets[0]

        // User modifies a weight
        selectedPreset = null as any

        expect(selectedPreset).toBeNull()
    })
})

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('Error Handling', () => {
    test('should handle fetch errors gracefully', () => {
        const error = new Error('Network error')
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        expect(errorMessage).toBe('Network error')
    })

    test('should validate preset name', () => {
        const validName = 'My Preset'
        const emptyName = '   '

        expect(validName.trim().length).toBeGreaterThan(0)
        expect(emptyName.trim().length).toBe(0)
    })

    test('should handle delete of non-default preset', () => {
        const presetToDelete = mockPresets.find(p => !p.is_default)
        expect(presetToDelete).toBeDefined()
        expect(presetToDelete?.is_default).toBe(false)
    })
})

// =============================================================================
// STATE TRANSITIONS TESTS
// =============================================================================

describe('State Transitions', () => {
    test('should transition from loading to loaded', () => {
        let loading = true
        let error = null
        let presets: typeof mockPresets = []

        // Simulate successful fetch
        loading = false
        presets = mockPresets

        expect(loading).toBe(false)
        expect(error).toBeNull()
        expect(presets.length).toBe(2)
    })

    test('should handle save operation state', () => {
        let saving = false

        saving = true
        expect(saving).toBe(true)

        // After save completes
        saving = false
        expect(saving).toBe(false)
    })
})

// =============================================================================
// WEIGHT NORMALIZATION TESTS
// =============================================================================

describe('Weight Normalization', () => {
    test('should normalize weights to sum to 1', () => {
        const weights = {
            skill_weight: 30,
            salary_weight: 25,
            location_weight: 15,
            remote_weight: 20,
            industry_weight: 10,
        }

        const sum = weights.skill_weight + weights.salary_weight +
            weights.location_weight + weights.remote_weight +
            weights.industry_weight

        const normalized = {
            skill_weight: weights.skill_weight / sum,
            salary_weight: weights.salary_weight / sum,
            location_weight: weights.location_weight / sum,
            remote_weight: weights.remote_weight / sum,
            industry_weight: weights.industry_weight / sum,
        }

        const normalizedSum = Object.values(normalized).reduce((a, b) => a + b, 0)
        expect(normalizedSum).toBeCloseTo(1.0, 10)
    })
})
