// providers/jobParser.ts
// Routed through the central AI layer (no direct provider calls)

import { routeLegacyTask } from '../legacyTaskRouter'

export interface ExtractedJobData {
  title: string
  company: string | null
  location: string | null
  salary?: {
    min: number | null
    max: number | null
    currency: string | null
  }
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary' | 'other' | null
  remoteType?: 'remote' | 'hybrid' | 'onsite' | null
  seniority?: 'junior' | 'mid' | 'senior' | 'lead' | 'director' | null
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  postedDate?: string | null
  applyUrl?: string | null
  description: string
  skills?: string[]
}

export interface JobExtractionResponse {
  success: boolean
  data?: ExtractedJobData | { jobs: ExtractedJobData[] }
  error?: string
}

export async function normalizeJobWithFallback(rawText: string): Promise<JobExtractionResponse> {
  try {
    const response = await routeLegacyTask('extract-jobs', { content: rawText })
    if (!response.ok || !response.output) {
      throw new Error(response.error_message || 'AI routing failed')
    }

    const payload = (response.output as any).data || response.output
    return { success: true, data: payload as any }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
