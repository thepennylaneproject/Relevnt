/**
 * Task: Job Extraction
 * 
 * Extracts structured job data from job posting text
 * Returns: title, company, location, requirements, salary, etc.
 */

import {
  normalizeJobWithFallback,
  type ExtractedJobData,
  type JobExtractionResponse,
} from '../providers/jobParser'
export type { ExtractedJobData, JobExtractionResponse } from '../providers/jobParser'

// ============================================================================
// TYPES
// ============================================================================

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
  const parseResult = await normalizeJobWithFallback(jobText)
  if (!parseResult.success) {
    console.warn('extractJobDescription: Job parsing failed', { error: parseResult.error })
  }
  return parseResult
}

/**
 * Alternative extraction using Anthropic Claude
 * For cases where DeepSeek fails or for premium users
 */
export async function extractJobDescriptionWithClaude(
  jobText: string
): Promise<JobExtractionResponse> {
  return extractJobDescription(jobText)
}

/**
 * Deduplication helper
 */
export function createJobDedupKey(job: ExtractedJobData): string {
  const parts = [job.title || '', job.company || '', job.location || '']
  return parts.map((p) => (p || '').toLowerCase().trim()).join('_')
}

/**
 * Export task handler function
 */
const handler = extractJobDescription

export { handler }
export default handler
