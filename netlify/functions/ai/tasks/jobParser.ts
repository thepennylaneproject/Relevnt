// providers/jobParser.ts
// Wrapper for job-post normalization — tries AI/ML API first, then falls back to DeepSeek/Claude if needed

import { callAimlApi, AimlApiMessage, AimlApiResponse } from '../providers/aimlapi'
import { callDeepSeek } from '../providers/deepseek'
import { callAnthropic } from '../providers/anthropic'

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
  data?: ExtractedJobData
  error?: string
}

const JOB_NORMALIZER_SYSTEM_PROMPT = `
You are an expert at extracting structured job data from messy job postings.

Task:
Read the job posting text below and return ONLY valid JSON matching the ExtractedJobData TypeScript interface.

You MUST follow these rules:
- Only use information present in the posting; do not hallucinate.
- If a value is not clearly present, set it to null or an empty array.
- Infer 'remoteType' only when the posting explicitly states remote, hybrid, or onsite.
- Infer 'seniority' only if title or description uses words like Senior, Lead, Director, Junior, etc.
- For 'skills', extract up to 20 concrete skills/technologies/competencies.
- Return exactly one JSON object, no extra text, no markdown, no comments.
`

async function tryNormalizeWithAiml(rawText: string, model = 'gpt-4.1-mini'): Promise<ExtractedJobData> {
  const messages: AimlApiMessage[] = [
    { role: 'system', content: JOB_NORMALIZER_SYSTEM_PROMPT },
    { role: 'user', content: rawText }
  ]

  const res: AimlApiResponse = await callAimlApi(model, messages)
  if (!res.success) {
    throw new Error('AIML API failure: ' + (res.error ?? 'Unknown error'))
  }

  const match = res.content.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error('Invalid JSON from AIML API')
  }

  return JSON.parse(match[0]) as ExtractedJobData
}

async function tryNormalizeWithDeepSeek(rawText: string): Promise<ExtractedJobData> {
  const prompt = `
Extract structured job information from this posting. Return ONLY valid JSON matching the ExtractedJobData interface.

Job Posting:
${rawText}
  `
  const resp = await callDeepSeek('deepseek-chat', [
    { role: 'user', content: prompt }
  ])

  if (!resp.success) throw new Error('DeepSeek failed: ' + (resp.error ?? 'Unknown'))

  const match = resp.content.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Invalid JSON from DeepSeek')

  return JSON.parse(match[0]) as ExtractedJobData
}

async function tryNormalizeWithClaude(rawText: string): Promise<ExtractedJobData> {
  const prompt = `
You are a job data extraction expert. Extract structured information from this job posting. Return ONLY valid JSON matching the ExtractedJobData interface.

Job Posting:
${rawText}
  `
  const resp = await callAnthropic('claude-sonnet-4-20250514', [
    { role: 'user', content: prompt }
  ])

  if (!resp.success) throw new Error('Claude failed: ' + (resp.error ?? 'Unknown'))

  const match = resp.content.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Invalid JSON from Claude')

  return JSON.parse(match[0]) as ExtractedJobData
}

/**
 * normalizeJobWithFallback
 * Attempts to parse raw job posting text into structured data.
 * Uses AI/ML API first, then fallback providers if that fails.
 */
export async function normalizeJobWithFallback(rawText: string): Promise<JobExtractionResponse> {
  try {
    const data = await tryNormalizeWithAiml(rawText)
    return { success: true, data }
  } catch (primaryError) {
    console.warn('AIML API normalization failed — falling back', primaryError)

    try {
      const data = await tryNormalizeWithDeepSeek(rawText)
      return { success: true, data }
    } catch (deepSeekError) {
      console.warn('DeepSeek fallback failed — trying Claude', deepSeekError)

      try {
        const data = await tryNormalizeWithClaude(rawText)
        return { success: true, data }
      } catch (claudeError) {
        console.error('All normalization attempts failed', claudeError)
        return { success: false, error: 'All parsers failed: ' + claudeError }
      }
    }
  }
}