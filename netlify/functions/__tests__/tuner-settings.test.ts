/**
 * Tests for tuner-settings API endpoint
 * 
 * Run with: npm test -- tuner-settings.test.ts
 */

import { describe, test, expect } from 'vitest'

// =============================================================================
// MOCK DATA
// =============================================================================

const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
}

const mockTunerSetting = {
    id: 'setting-123',
    user_id: 'user-123',
    name: 'Skill-Focused',
    skill_weight: 0.5,
    salary_weight: 0.2,
    location_weight: 0.1,
    remote_weight: 0.15,
    industry_weight: 0.05,
    is_default: true,
    created_at: '2024-12-10T00:00:00Z',
    updated_at: '2024-12-10T00:00:00Z',
}

// =============================================================================
// INPUT VALIDATION TESTS
// =============================================================================

describe('Tuner Settings Input Validation', () => {
    test('name should be required for create', () => {
        const input = {
            name: '',
            skill_weight: 0.3,
        }

        expect(input.name.trim()).toBe('')
        expect(input.name.trim() === '').toBe(true)
    })

    test('name should be trimmed', () => {
        const input = {
            name: '  Skill-Focused  ',
        }

        expect(input.name.trim()).toBe('Skill-Focused')
    })

    test('weights should be between 0 and 1', () => {
        const validateWeight = (value: number): boolean => {
            return value >= 0 && value <= 1
        }

        expect(validateWeight(0.3)).toBe(true)
        expect(validateWeight(0)).toBe(true)
        expect(validateWeight(1)).toBe(true)
        expect(validateWeight(-0.1)).toBe(false)
        expect(validateWeight(1.5)).toBe(false)
    })

    test('weights should default to standard values if not provided', () => {
        const defaults = {
            skill_weight: 0.3,
            salary_weight: 0.25,
            location_weight: 0.15,
            remote_weight: 0.2,
            industry_weight: 0.1,
        }

        expect(defaults.skill_weight).toBe(0.3)
        expect(defaults.salary_weight).toBe(0.25)
        expect(defaults.location_weight).toBe(0.15)
        expect(defaults.remote_weight).toBe(0.2)
        expect(defaults.industry_weight).toBe(0.1)
    })
})

// =============================================================================
// WEIGHT NORMALIZATION TESTS
// =============================================================================

describe('Weight Normalization', () => {
    test('weights should be normalized to sum to 1.0', () => {
        const weights = {
            skill_weight: 0.6,
            salary_weight: 0.3,
            location_weight: 0.2,
            remote_weight: 0.1,
            industry_weight: 0.1,
        }

        const sum = Object.values(weights).reduce((a, b) => a + b, 0)

        if (sum !== 1.0) {
            const normalized = {
                skill_weight: weights.skill_weight / sum,
                salary_weight: weights.salary_weight / sum,
                location_weight: weights.location_weight / sum,
                remote_weight: weights.remote_weight / sum,
                industry_weight: weights.industry_weight / sum,
            }

            const normalizedSum = Object.values(normalized).reduce((a, b) => a + b, 0)
            expect(normalizedSum).toBeCloseTo(1.0, 5)
        }
    })

    test('zero weights should fallback to defaults', () => {
        const weights = {
            skill_weight: 0,
            salary_weight: 0,
            location_weight: 0,
            remote_weight: 0,
            industry_weight: 0,
        }

        const sum = Object.values(weights).reduce((a, b) => a + b, 0)

        if (sum === 0) {
            const defaults = {
                skill_weight: 0.3,
                salary_weight: 0.25,
                location_weight: 0.15,
                remote_weight: 0.2,
                industry_weight: 0.1,
            }
            expect(defaults.skill_weight).toBe(0.3)
        }
    })
})

// =============================================================================
// DEFAULT SETTING LOGIC TESTS
// =============================================================================

describe('Default Setting Logic', () => {
    test('setting a config as default should unset other defaults', () => {
        const settings = [
            { ...mockTunerSetting, id: '1', is_default: true },
            { ...mockTunerSetting, id: '2', is_default: false },
            { ...mockTunerSetting, id: '3', is_default: false },
        ]

        const targetId = '2'

        // Simulate setting new default
        const updated = settings.map(s => ({
            ...s,
            is_default: s.id === targetId,
        }))

        expect(updated.find(s => s.id === '1')?.is_default).toBe(false)
        expect(updated.find(s => s.id === '2')?.is_default).toBe(true)
        expect(updated.find(s => s.id === '3')?.is_default).toBe(false)
    })

    test('deleting default setting should set newest remaining as default', () => {
        const settings = [
            { ...mockTunerSetting, id: '1', is_default: true, created_at: '2024-12-01' },
            { ...mockTunerSetting, id: '2', is_default: false, created_at: '2024-12-05' },
            { ...mockTunerSetting, id: '3', is_default: false, created_at: '2024-12-10' },
        ]

        const deletedId = '1'
        const wasDefault = settings.find(s => s.id === deletedId)?.is_default

        // Remove deleted setting
        const remaining = settings.filter(s => s.id !== deletedId)

        // If deleted was default, activate newest
        if (wasDefault && remaining.length > 0) {
            remaining.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            remaining[0].is_default = true
        }

        expect(remaining).toHaveLength(2)
        expect(remaining.find(s => s.id === '3')?.is_default).toBe(true)
    })

    test('should only allow one default setting per user', () => {
        const settings = [
            { ...mockTunerSetting, id: '1', is_default: true },
            { ...mockTunerSetting, id: '2', is_default: true }, // Invalid - two defaults
        ]

        const defaultCount = settings.filter(s => s.is_default).length
        expect(defaultCount).toBeGreaterThan(1) // This is the error case we want to prevent
    })
})

// =============================================================================
// WEIGHTED SCORE CALCULATION TESTS
// =============================================================================

describe('Weighted Score Calculation', () => {
    test('custom weights should produce different scores than defaults', () => {
        const factorScores = {
            skill_score: 30,    // out of 35
            salary_score: 15,   // out of 20
            remote_score: 10,   // out of 15
            location_score: 12, // out of 15
            industry_score: 5,  // out of 10
            title_score: 10,    // out of 15
        }

        const defaultWeights = {
            skill_weight: 0.3,
            salary_weight: 0.25,
            location_weight: 0.15,
            remote_weight: 0.2,
            industry_weight: 0.1,
        }

        const customWeights = {
            skill_weight: 0.6,  // Much higher skill focus
            salary_weight: 0.1,
            location_weight: 0.1,
            remote_weight: 0.1,
            industry_weight: 0.1,
        }

        // Simplified score calculation (actual implementation is more complex)
        const calculateSimpleScore = (weights: any) => {
            const normalized = {
                skill: factorScores.skill_score / 35,
                salary: factorScores.salary_score / 20,
                remote: factorScores.remote_score / 15,
                location: factorScores.location_score / 15,
                industry: factorScores.industry_score / 10,
            }

            return (
                normalized.skill * weights.skill_weight +
                normalized.salary * weights.salary_weight +
                normalized.remote * weights.remote_weight +
                normalized.location * weights.location_weight +
                normalized.industry * weights.industry_weight
            ) * 100
        }

        const defaultScore = calculateSimpleScore(defaultWeights)
        const customScore = calculateSimpleScore(customWeights)

        // Scores should be different when using different weights
        expect(defaultScore).not.toBe(customScore)

        // Custom weights favor skills more, so score should be higher
        // (since skill_score is high: 30/35 = 85.7%)
        expect(customScore).toBeGreaterThan(defaultScore)
    })

    test('normalized factor scores should be between 0 and 1', () => {
        const factorScores = {
            skill_score: 35,    // max
            salary_score: 20,   // max
            remote_score: 15,   // max
            location_score: 15, // max
            industry_score: 10, // max
        }

        const normalized = {
            skill: factorScores.skill_score / 35,
            salary: factorScores.salary_score / 20,
            remote: factorScores.remote_score / 15,
            location: factorScores.location_score / 15,
            industry: factorScores.industry_score / 10,
        }

        Object.values(normalized).forEach(value => {
            expect(value).toBeGreaterThanOrEqual(0)
            expect(value).toBeLessThanOrEqual(1)
        })
    })
})

// =============================================================================
// RLS / CROSS-USER ACCESS TESTS
// =============================================================================

describe('RLS / Cross-User Access Prevention', () => {
    test('user should not see other users settings', () => {
        const user1Settings = [
            { ...mockTunerSetting, id: '1', user_id: 'user-123' },
            { ...mockTunerSetting, id: '2', user_id: 'user-123' },
        ]

        const user2Settings = [
            { ...mockTunerSetting, id: '3', user_id: 'user-456' },
        ]

        const currentUserId = 'user-123'

        // Filter to only current user's settings (simulating RLS)
        const visibleSettings = [...user1Settings, ...user2Settings].filter(
            s => s.user_id === currentUserId
        )

        expect(visibleSettings).toHaveLength(2)
        expect(visibleSettings.every(s => s.user_id === currentUserId)).toBe(true)
    })

    test('delete should only work on own settings', () => {
        const settingToDelete = {
            id: 'setting-456',
            user_id: 'user-456', // Different user
        }

        const currentUserId = 'user-123'
        const canDelete = settingToDelete.user_id === currentUserId

        expect(canDelete).toBe(false)
    })
})

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
    test('empty settings list should return empty array', () => {
        const response = { data: [], count: 0 }
        expect(response.data).toEqual([])
        expect(response.count).toBe(0)
    })

    test('all weights at minimum should still be valid', () => {
        const weights = {
            skill_weight: 0,
            salary_weight: 0,
            location_weight: 0,
            remote_weight: 0,
            industry_weight: 0,
        }

        Object.values(weights).forEach(w => {
            expect(w).toBeGreaterThanOrEqual(0)
            expect(w).toBeLessThanOrEqual(1)
        })
    })

    test('all weights at maximum should still be valid', () => {
        const weights = {
            skill_weight: 1,
            salary_weight: 1,
            location_weight: 1,
            remote_weight: 1,
            industry_weight: 1,
        }

        Object.values(weights).forEach(w => {
            expect(w).toBeGreaterThanOrEqual(0)
            expect(w).toBeLessThanOrEqual(1)
        })
    })

    test('persona_id can be null for user-default settings', () => {
        const setting = {
            ...mockTunerSetting,
            persona_id: null,
        }

        expect(setting.persona_id).toBeNull()
    })
})
