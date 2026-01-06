/**
 * Task: Strategic Insights Generation
 * 
 * Analyzes job application patterns and generates actionable recommendations
 * to improve interview rates based on historical data.
 */

import { callOpenAI } from '../providers/openai'

// ============================================================================
// TYPES
// ============================================================================

export interface StrategicInsightsInput {
  summary: {
    totalApplications: number
    responseRate: number
    interviewRate: number
    offerRate: number
  }
  trends: {
    timeSeries: Array<{
      week: string
      applications: number
      responses: number
      interviews: number
      responseRate: number
    }>
    trend: 'improving' | 'declining' | 'stable'
  }
  patterns: {
    topSkills: string[]
    strugglingSkills: string[]
    bestExperienceLevel?: {
      category: string
      interviewRate: number
    }
    bestCompanySize?: {
      category: string
      interviewRate: number
    }
    bestIndustry?: {
      category: string
      interviewRate: number
    }
    bestSource?: {
      category: string
      interviewRate: number
    }
  }
  skillGaps: Array<{
    skill: string
    rejectionCount: number
    appearanceCount: number
  }>
  userProfile: {
    skills: string[]
  }
}

export interface Recommendation {
  id: string
  type: 'skill_gap' | 'targeting' | 'resume' | 'strategy' | 'timing'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action: string
  linkedSection?: string
  linkedSectionLabel?: string
  confidence: number
}

export interface PatternFinding {
  pattern: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  statistic?: string
}

export interface StrategicInsightsResponse {
  success: boolean
  data?: {
    overview: {
      totalApplications: number
      interviewRate: number
      previousInterviewRate?: number
      trend: 'improving' | 'declining' | 'stable'
    }
    patterns: PatternFinding[]
    recommendations: Recommendation[]
    skillGaps: string[]
  }
  error?: string
}

// ============================================================================
// MAIN TASK HANDLER
// ============================================================================

/**
 * Generate strategic insights from application data
 */
export async function generateStrategicInsights(
  input: StrategicInsightsInput
): Promise<StrategicInsightsResponse> {
  try {
    const prompt = buildPrompt(input)

    const result = await callOpenAI(prompt, '', {
      model: 'gpt-4o',
      maxTokens: 4000,
      temperature: 0.7,
      forceJson: true,
    })

    if (!result.success || !result.content) {
      throw new Error(result.error || 'AI call failed')
    }

    // Parse response
    const parsed = JSON.parse(result.content)

    // Add unique IDs to recommendations if not present
    if (parsed.recommendations) {
      parsed.recommendations = parsed.recommendations.map((rec: any, idx: number) => ({
        ...rec,
        id: rec.id || `rec-${Date.now()}-${idx}`,
      }))
    }

    return {
      success: true,
      data: {
        overview: parsed.overview || {
          totalApplications: input.summary.totalApplications,
          interviewRate: input.summary.interviewRate,
          trend: input.trends.trend,
        },
        patterns: parsed.patterns || [],
        recommendations: parsed.recommendations || [],
        skillGaps: parsed.skillGaps || [],
      },
    }
  } catch (error) {
    console.error('Strategic insights generation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// PROMPT ENGINEERING
// ============================================================================

function buildPrompt(input: StrategicInsightsInput): string {
  const { summary, trends, patterns, skillGaps, userProfile } = input

  return `You are a senior career coach analyzing job application outcomes to provide data-driven recommendations.

## Application Performance Summary

**Current Period:**
- Total Applications: ${summary.totalApplications}
- Response Rate: ${summary.responseRate.toFixed(1)}%
- Interview Rate: ${summary.interviewRate.toFixed(1)}%
- Offer Rate: ${summary.offerRate.toFixed(1)}%

**Trend:** ${trends.trend}

**Time Series (Last 4 Weeks):**
${trends.timeSeries.map(ts => `- Week of ${ts.week}: ${ts.applications} apps, ${ts.interviews} interviews (${ts.responseRate.toFixed(1)}% response rate)`).join('\n')}

## Pattern Analysis

**Top Performing Skills:**
${patterns.topSkills.length > 0 ? patterns.topSkills.map(s => `- ${s}`).join('\n') : '- None identified'}

**Struggling Skills:**
${patterns.strugglingSkills.length > 0 ? patterns.strugglingSkills.map(s => `- ${s}`).join('\n') : '- None identified'}

${patterns.bestExperienceLevel ? `**Best Experience Level:** ${patterns.bestExperienceLevel.category} (${patterns.bestExperienceLevel.interviewRate.toFixed(1)}% interview rate)` : ''}

${patterns.bestCompanySize ? `**Best Company Size:** ${patterns.bestCompanySize.category} (${patterns.bestCompanySize.interviewRate.toFixed(1)}% interview rate)` : ''}

${patterns.bestIndustry ? `**Best Industry:** ${patterns.bestIndustry.category} (${patterns.bestIndustry.interviewRate.toFixed(1)}% interview rate)` : ''}

${patterns.bestSource ? `**Best Job Source:** ${patterns.bestSource.category} (${patterns.bestSource.interviewRate.toFixed(1)}% interview rate)` : ''}

## Skill Gaps

Skills appearing in rejected applications but missing from user profile:
${skillGaps.length > 0 ? skillGaps.map(gap => `- ${gap.skill} (in ${gap.rejectionCount} rejections, ${gap.appearanceCount} total appearances)`).join('\n') : '- None identified'}

**User's Current Skills:**
${userProfile.skills.length > 0 ? userProfile.skills.join(', ') : 'Not specified'}

---

## Your Task

Generate a strategic pivot report with:

1. **2-4 Key Findings** - Most significant patterns (positive, negative, or neutral)
2. **3-5 Specific Recommendations** - Actionable steps to improve interview rate
3. **Skill Gap Summary** - Top 3-5 missing skills to prioritize

### Output Format (JSON)

\`\`\`json
{
  "overview": {
    "totalApplications": ${summary.totalApplications},
    "interviewRate": ${summary.interviewRate},
    "trend": "${trends.trend}"
  },
  "patterns": [
    {
      "pattern": "Brief pattern name",
      "description": "What this means and why it matters",
      "impact": "positive | negative | neutral",
      "statistic": "Optional supporting stat (e.g., '75% interview rate')"
    }
  ],
  "recommendations": [
    {
      "type": "skill_gap | targeting | resume | strategy | timing",
      "priority": "high | medium | low",
      "title": "Short actionable title",
      "description": "Detailed explanation of the issue and opportunity",
      "action": "Specific step to take",
      "linkedSection": "settings/targeting | resume/skills | resume/experience | settings/profile",
      "linkedSectionLabel": "Update Targeting Settings",
      "confidence": 85
    }
  ],
  "skillGaps": ["skill1", "skill2", "skill3"]
}
\`\`\`

### Guidelines

1. **Be Specific**: Don't say "improve your resume" - say "Add Python to your skills section"
2. **Use Data**: Reference actual statistics from the analysis
3. **Prioritize Impact**: High priority = clear actionable change with strong supporting data
4. **Link Actions**: Map each recommendation to the correct section (settings/targeting, resume/skills, etc.)
5. **Be Encouraging**: Frame negative patterns as opportunities
6. **Confidence Scores**: 
   - 90-100: Very strong pattern (10+ data points)
   - 70-89: Good pattern (5-9 data points)
   - 50-69: Moderate pattern (2-4 data points)

Generate the JSON response now.`
}

/**
 * Export task handler
 */
const handler = generateStrategicInsights

export { handler }
export default handler
