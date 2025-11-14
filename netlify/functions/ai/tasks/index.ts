/**
 * Task: Skill Gap Analysis
 * 
 * Identifies missing skills and provides learning recommendations
 */

import { callDeepSeek } from '../providers/deepseek'

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
    const prompt = `Analyze skill gaps for a career transition.

Current Skills:
${currentSkills.join(', ')}

Target Role: ${targetRole}

Job Requirements:
${jobRequirements.join(', ')}

Provide analysis in JSON format:
{
  "gaps": [
    {
      "skill": "skill name",
      "importance": "critical|important|nice-to-have",
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "strengths": ["transferable_skill"],
  "actionPlan": "learning pathway"
}`

    const response = await callDeepSeek('deepseek-chat', [
      { role: 'user', content: prompt },
    ])

    if (!response.success) {
      throw new Error(response.error)
    }

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON in response')
    }

    const data = JSON.parse(jsonMatch[0])

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