/**
 * Task: Job Extraction
 * 
 * Extracts structured job data from job posting text
 * Returns: title, company, location, requirements, salary, etc.
 */

import { callDeepSeek } from '../providers/deepseek'
import { callAnthropic } from '../providers/anthropic'

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedJobData {
  title: string
  company: string
  location: string
  salary?: {
    min: number
    max: number
    currency: string
  }
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship'
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  postedDate?: string
  applyUrl?: string
  description: string
}

export interface JobExtractionResponse {
  success: boolean
  data?: ExtractedJobData
  error?: string
}

// ============================================================================
// MAIN TASK HANDLER
// ============================================================================

/**
 * Extract structured job data from posting text
 * 
 * @param jobText - Raw job posting text
 * @returns Structured job data
 */
export async function extractJobDescription(jobText: string): Promise<JobExtractionResponse> {
  try {
    const prompt = `Extract structured job information from this posting. Return ONLY valid JSON.

Job Posting:
${jobText}

Return this JSON structure exactly:
{
  "title": "string",
  "company": "string",
  "location": "string",
  "salary": {
    "min": number,
    "max": number,
    "currency": "USD"
  },
  "jobType": "full-time",
  "requirements": ["string"],
  "responsibilities": ["string"],
  "benefits": ["string"],
  "description": "string"
}`

    // Use DeepSeek for cost efficiency
    const response = await callDeepSeek('deepseek-chat', [
      {
        role: 'user',
        content: prompt,
      },
    ])

    if (!response.success) {
      throw new Error(response.error || 'DeepSeek API call failed')
    }

    // Parse the JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const extractedData = JSON.parse(jsonMatch[0]) as ExtractedJobData

    return {
      success: true,
      data: extractedData,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Alternative extraction using Anthropic Claude
 * For cases where DeepSeek fails or for premium users
 */
export async function extractJobDescriptionWithClaude(
  jobText: string
): Promise<JobExtractionResponse> {
  try {
    const prompt = `You are a job data extraction expert. Extract structured information from this job posting.

Job Posting:
${jobText}

Return ONLY valid JSON with this structure:
{
  "title": "Job title",
  "company": "Company name",
  "location": "Location",
  "salary": {"min": 0, "max": 0, "currency": "USD"},
  "jobType": "full-time",
  "requirements": ["skill1", "skill2"],
  "responsibilities": ["task1", "task2"],
  "benefits": ["benefit1"],
  "description": "Full description"
}`

    const response = await callAnthropic('claude-sonnet-4-20250514', [
      {
        role: 'user',
        content: prompt,
      },
    ])

    if (!response.success) {
      throw new Error(response.error || 'Claude API call failed')
    }

    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const extractedData = JSON.parse(jsonMatch[0]) as ExtractedJobData

    return {
      success: true,
      data: extractedData,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Deduplication helper
 */
export function createJobDedupKey(job: ExtractedJobData): string {
  return `${job.title}_${job.company}_${job.location}`.toLowerCase().trim()
}

/**
 * Export task handler function
 */
const handler = extractJobDescription

export { handler }
export default handler