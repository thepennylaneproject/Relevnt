/**
 * Task: Cover Letter Generation
 * 
 * Generates tailored cover letters for specific jobs
 */

import { callAnthropic } from '../providers/anthropic'

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedJob {
  title: string
  company: string
  location: string
  requirements: string[]
  responsibilities: string[]
}

export interface UserProfile {
  name: string
  email: string
  phone: string
  experience: string
  skills: string[]
  achievements: string[]
  targetRole: string
}

export interface CoverLetterResponse {
  success: boolean
  draft?: string
  keyPoints?: string[]
  keywords?: string[]
  error?: string
}

// ============================================================================
// MAIN TASK HANDLER
// ============================================================================

/**
 * Generate a tailored cover letter
 */
export async function generateCoverLetter(
  jobData: ExtractedJob,
  userProfile: UserProfile
): Promise<CoverLetterResponse> {
  try {
    const prompt = `Write a professional cover letter for this job application.

Job:
- Position: ${jobData.title}
- Company: ${jobData.company}
- Key Requirements: ${jobData.requirements.join(', ')}
- Main Responsibilities: ${jobData.responsibilities.join(', ')}

Candidate:
- Name: ${userProfile.name}
- Email: ${userProfile.email}
- Phone: ${userProfile.phone}
- Experience: ${userProfile.experience}
- Key Skills: ${userProfile.skills.join(', ')}
- Notable Achievements: ${userProfile.achievements.join(', ')}

Write a compelling, concise cover letter (3-4 paragraphs) that:
1. Shows genuine interest in the role and company
2. Highlights matching skills and experience
3. Demonstrates cultural fit
4. Includes a clear call to action

Start with: "Dear Hiring Manager,"
End with: "Sincerely, [Name]"`

    const response = await callAnthropic('claude-sonnet-4-20250514', [
      { role: 'user', content: prompt },
    ])

    if (!response.success) {
      throw new Error(response.error)
    }

    // Extract key points from the job and profile
    const keyPoints = [
      ...jobData.requirements.slice(0, 3),
      ...userProfile.skills.slice(0, 2),
    ]

    return {
      success: true,
      draft: response.content,
      keyPoints,
      keywords: jobData.requirements.slice(0, 5),
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
const handler = generateCoverLetter

export { handler }
export default handler