/**
 * Task: Skill Gap Analysis
 * 
 * Identifies missing skills and provides learning recommendations for Ready
 */

import { routeLegacyTask } from '../legacyTaskRouter'

// ============================================================================
// TYPES
// ============================================================================

export interface SkillGapResponse {
  success: boolean
  gaps?: {
    gaps: Array<{
      skill: string
      importance: 'critical' | 'important' | 'nice-to-have'
      difficulty: 'beginner' | 'intermediate' | 'advanced'
    }>
    strengths: string[]
    actionPlan: string
  }
  error?: string
}

// ============================================================================
// MAIN TASK HANDLER
// ============================================================================

/**
 * Analyze skill gaps for target role
 */
export async function analyzeSkillGaps(
  currentSkills: string[],
  targetRole: string,
  jobRequirements: string[]
): Promise<SkillGapResponse> {
  try {
    const response = await routeLegacyTask('analyze-skills-gap', {
      currentSkills,
      targetRole,
      jobRequirements,
    })

    if (!response.ok || !response.output) {
      throw new Error(response.error_message || 'AI routing failed')
    }

    const data = (response.output as any).data || response.output

    return {
      success: true,
      gaps: {
        gaps: data.gaps || [],
        strengths: data.strengths || [],
        actionPlan: data.actionPlan || '',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Export task handler
 */
const handler = analyzeSkillGaps

export { handler }
export default handler
