/**
 * ============================================================================
 * SALARY SCORE
 * ============================================================================
 * Score salary fit between user expectations and job offering.
 * 
 * Scoring (0-10):
 * - Perfect fit (within range): 10 points
 * - Exceeds expectations: 8-10 points
 * - Slightly below minimum: 5-7 points
 * - Significantly below: 0-4 points
 * - No salary info: 5 points (neutral)
 * ============================================================================
 */

import type { FactorResult } from '../types'
import { MAX_SCORES } from '../types'

/**
 * Score salary fit.
 * 
 * @param userMinSalary - User's minimum acceptable salary
 * @param userMaxSalary - User's target/ideal salary
 * @param jobMinSalary - Job's minimum salary (if range provided)
 * @param jobMaxSalary - Job's maximum salary
 * @returns Score (0-10) and reasons
 */
export function scoreSalary(
    userMinSalary: number | null,
    userMaxSalary: number | null,
    jobMinSalary: number | null,
    jobMaxSalary: number | null
): FactorResult {
    const result: FactorResult = {
        score: 0,
        maxScore: MAX_SCORES.salary_fit,
        reasons: [],
    }

    // No job salary info = neutral
    if (jobMinSalary === null && jobMaxSalary === null) {
        result.score = 5
        result.reasons.push('Salary not specified')
        return result
    }

    // Use the effective job salary (prefer max, fall back to min)
    const jobSalary = jobMaxSalary ?? jobMinSalary ?? 0
    const jobSalaryMin = jobMinSalary ?? jobSalary

    // Format salary for display
    const formatSalary = (n: number) => {
        if (n >= 1000) {
            return `$${Math.round(n / 1000)}k`
        }
        return `$${n}`
    }

    // No user salary preference = neutral
    if (userMinSalary === null && userMaxSalary === null) {
        result.score = 5
        result.reasons.push(`Salary range: ${formatSalary(jobSalaryMin)}-${formatSalary(jobSalary)}`)
        return result
    }

    const userMin = userMinSalary ?? 0
    const userMax = userMaxSalary ?? userMin * 1.5

    // Check for overlap between ranges
    if (jobSalary >= userMin) {
        if (jobSalary >= userMax) {
            // Exceeds expectations
            result.score = 10
            result.reasons.push(`✓ Salary ${formatSalary(jobSalary)} exceeds your target`)
        } else if (jobSalary >= userMin) {
            // Within range
            result.score = 10
            result.reasons.push(`✓ Salary ${formatSalary(jobSalary)} fits your range perfectly`)
        }
    } else {
        // Below minimum
        const percentBelow = ((userMin - jobSalary) / userMin) * 100

        if (percentBelow <= 10) {
            result.score = 7
            result.reasons.push(`Salary ${formatSalary(jobSalary)} slightly below your minimum`)
        } else if (percentBelow <= 20) {
            result.score = 5
            result.reasons.push(`Salary ${formatSalary(jobSalary)} is ${Math.round(percentBelow)}% below minimum`)
        } else if (percentBelow <= 30) {
            result.score = 3
            result.reasons.push(`Salary ${formatSalary(jobSalary)} is significantly below target`)
        } else {
            result.score = 1
            result.reasons.push(`⚠️ Salary ${formatSalary(jobSalary)} is well below your minimum`)
        }
    }

    return result
}
