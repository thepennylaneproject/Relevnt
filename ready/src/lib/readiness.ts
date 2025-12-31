/**
 * Readiness Calculation Utilities
 * 
 * Functions for calculating and tracking readiness scores based on the 4-pillar model:
 * - Practice (25%): Interview practice quality and quantity
 * - Assessment (25%): LinkedIn/Portfolio analysis scores
 * - Skills (25%): Progress on addressing skill gaps
 * - Narrative (25%): Career narrative completion
 */

import { supabase } from './supabase';

export interface ReadinessPillar {
    score: number; // 0-100
    weight: number; // 0-1
    meetsThreshold: boolean;
}

export interface ReadinessBreakdown {
    practice: ReadinessPillar;
    assessment: ReadinessPillar;
    skills: ReadinessPillar;
    narrative: ReadinessPillar;
    overall: number; // 0-100
}

export interface ReadinessCriteria {
    practiceAvgScore: number;
    practiceSessionCount: number;
    linkedInScore: number | null;
    portfolioScore: number | null;
    totalSkillGaps: number;
    addressedSkillGaps: number;
    hasCareerNarrative: boolean;
}

/**
 * Calculate Practice pillar score (25%)
 * Criteria: Average interview score >= 7, at least 3 sessions
 */
export function calculatePracticeScore(avgScore: number, sessionCount: number): ReadinessPillar {
    const meetsThreshold = avgScore >= 7 && sessionCount >= 3;
    
    // Score based on both quality and quantity
    const qualityScore = Math.min((avgScore / 10) * 100, 100);
    const quantityScore = Math.min((sessionCount / 10) * 100, 100);
    
    // 70% quality, 30% quantity
    const score = qualityScore * 0.7 + quantityScore * 0.3;
    
    return {
        score: Math.round(score),
        weight: 0.25,
        meetsThreshold,
    };
}

/**
 * Calculate Assessment pillar score (25%)
 * Criteria: LinkedIn OR Portfolio analyzed with score >= 70
 */
export function calculateAssessmentScore(
    linkedInScore: number | null,
    portfolioScore: number | null
): ReadinessPillar {
    const scores = [linkedInScore, portfolioScore].filter(s => s !== null) as number[];
    
    if (scores.length === 0) {
        return { score: 0, weight: 0.25, meetsThreshold: false };
    }
    
    // Use the highest score if both exist
    const bestScore = Math.max(...scores);
    const meetsThreshold = bestScore >= 70;
    
    return {
        score: Math.round(bestScore),
        weight: 0.25,
        meetsThreshold,
    };
}

/**
 * Calculate Skills pillar score (25%)
 * Criteria: At least 50% of critical gaps marked "addressed"
 */
export function calculateSkillsScore(totalGaps: number, addressedGaps: number): ReadinessPillar {
    if (totalGaps === 0) {
        // No gaps identified yet - encourage analysis
        return { score: 0, weight: 0.25, meetsThreshold: false };
    }
    
    const progressPercent = (addressedGaps / totalGaps) * 100;
    const meetsThreshold = progressPercent >= 50;
    
    return {
        score: Math.round(progressPercent),
        weight: 0.25,
        meetsThreshold,
    };
}

/**
 * Calculate Narrative pillar score (25%)
 * Criteria: Career narrative generated and saved
 */
export function calculateNarrativeScore(hasNarrative: boolean): ReadinessPillar {
    return {
        score: hasNarrative ? 100 : 0,
        weight: 0.25,
        meetsThreshold: hasNarrative,
    };
}

/**
 * Calculate overall readiness score and breakdown
 */
export function calculateReadinessScore(criteria: ReadinessCriteria): ReadinessBreakdown {
    const practice = calculatePracticeScore(criteria.practiceAvgScore, criteria.practiceSessionCount);
    const assessment = calculateAssessmentScore(criteria.linkedInScore, criteria.portfolioScore);
    const skills = calculateSkillsScore(criteria.totalSkillGaps, criteria.addressedSkillGaps);
    const narrative = calculateNarrativeScore(criteria.hasCareerNarrative);
    
    // Calculate weighted overall score
    const overall = Math.round(
        practice.score * practice.weight +
        assessment.score * assessment.weight +
        skills.score * skills.weight +
        narrative.score * narrative.weight
    );
    
    return {
        practice,
        assessment,
        skills,
        narrative,
        overall,
    };
}

/**
 * Check if user has crossed the 80% readiness threshold
 */
export function checkReadinessMilestone(
    currentScore: number,
    previousScore: number
): boolean {
    const MILESTONE_THRESHOLD = 80;
    return previousScore < MILESTONE_THRESHOLD && currentScore >= MILESTONE_THRESHOLD;
}

/**
 * Get detailed breakdown of readiness for UI display
 */
export function getReadinessBreakdown(breakdown: ReadinessBreakdown) {
    return {
        overall: breakdown.overall,
        pillars: [
            {
                name: 'Practice',
                score: breakdown.practice.score,
                threshold: breakdown.practice.meetsThreshold,
                description: breakdown.practice.meetsThreshold
                    ? 'Strong interview performance'
                    : 'Complete 3+ sessions with avg score 7+',
            },
            {
                name: 'Assessment',
                score: breakdown.assessment.score,
                threshold: breakdown.assessment.meetsThreshold,
                description: breakdown.assessment.meetsThreshold
                    ? 'Professional profile validated'
                    : 'Analyze LinkedIn or Portfolio (70+ score)',
            },
            {
                name: 'Skills',
                score: breakdown.skills.score,
                threshold: breakdown.skills.meetsThreshold,
                description: breakdown.skills.meetsThreshold
                    ? 'Gaps being addressed'
                    : 'Address 50%+ of identified gaps',
            },
            {
                name: 'Narrative',
                score: breakdown.narrative.score,
                threshold: breakdown.narrative.meetsThreshold,
                description: breakdown.narrative.meetsThreshold
                    ? 'Story ready to tell'
                    : 'Generate your career narrative',
            },
        ],
    };
}

/**
 * Save readiness snapshot to database
 */
export async function saveReadinessSnapshot(
    userId: string,
    breakdown: ReadinessBreakdown
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase.from('readiness_snapshots').insert({
            user_id: userId,
            overall_score: breakdown.overall,
            practice_score: breakdown.practice.score,
            assessment_score: breakdown.assessment.score,
            skills_score: breakdown.skills.score,
            narrative_score: breakdown.narrative.score,
            snapshot_date: new Date().toISOString(),
        });

        if (error) {
            console.error('Error saving readiness snapshot:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        console.error('Error saving readiness snapshot:', err);
        return { success: false, error: err.message };
    }
}
