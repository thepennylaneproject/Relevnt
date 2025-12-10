// providers/jobParser.ts
// Robust job-post normalization with provider fallback and logging

import { callAimlApi, AimlApiMessage } from './aimlapi'
import { callDeepSeek } from './deepseek'
import { callAnthropic } from './anthropic'

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

const USER_PROMPT_TEMPLATE = `
Extract structured job information from the following posting. Return ONLY valid JSON with exactly these keys:
{
  "title": "string",
  "company": "string | null",
  "location": "string | null",
  "salary": {
    "min": number | null,
    "max": number | null,
    "currency": "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "INR" | null
  },
  "jobType": "full-time" | "part-time" | "contract" | "internship" | "temporary" | "other" | null,
  "remoteType": "remote" | "hybrid" | "onsite" | null,
  "seniority": "junior" | "mid" | "senior" | "lead" | "director" | null,
  "requirements": ["string"],
  "responsibilities": ["string"],
  "benefits": ["string"],
  "postedDate": "ISO date string or null",
  "applyUrl": "url or null",
  "description": "string",
  "skills": ["string"]
}

Job Posting:
`

function buildUserPrompt(rawText: string): string {
  return `${USER_PROMPT_TEMPLATE}${rawText}`
}

function parseJobJson(content: string): ExtractedJobData {
  const jsonMatch = content?.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON object found in provider response')
  }

  try {
    return JSON.parse(jsonMatch[0]) as ExtractedJobData
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON'
    throw new Error(`Invalid JSON from provider: ${msg}`)
  }
}

function isValidExtractedJobData(data: any): data is ExtractedJobData {
  if (!data || typeof data !== 'object') return false
  if (typeof data.title !== 'string' || data.title.trim() === '') return false
  if (!('company' in data) || !(typeof data.company === 'string' || data.company === null)) return false
  if (!('location' in data) || !(typeof data.location === 'string' || data.location === null)) return false

  const allowedJobTypes = ['full-time', 'part-time', 'contract', 'internship', 'temporary', 'other', null]
  if (!('jobType' in data) || !allowedJobTypes.includes(data.jobType)) return false

  if (!Array.isArray(data.requirements) || !Array.isArray(data.responsibilities) || !Array.isArray(data.benefits)) {
    return false
  }

  if (typeof data.description !== 'string') return false

  const allowedRemoteTypes = ['remote', 'hybrid', 'onsite', null]
  if ('remoteType' in data && data.remoteType !== undefined && !allowedRemoteTypes.includes(data.remoteType)) {
    return false
  }

  const allowedSeniorities = ['junior', 'mid', 'senior', 'lead', 'director', null]
  if ('seniority' in data && data.seniority !== undefined && !allowedSeniorities.includes(data.seniority)) {
    return false
  }

  if ('skills' in data && data.skills !== undefined && !Array.isArray(data.skills)) {
    return false
  }

  if ('salary' in data && data.salary !== undefined) {
    const salary = data.salary
    if (
      !salary ||
      typeof salary !== 'object' ||
      !('min' in salary) ||
      !('max' in salary) ||
      !('currency' in salary)
    ) {
      return false
    }
    const minValid = salary.min === null || typeof salary.min === 'number'
    const maxValid = salary.max === null || typeof salary.max === 'number'
    const currencyValid = salary.currency === null || typeof salary.currency === 'string'
    if (!minValid || !maxValid || !currencyValid) return false
  }

  if ('postedDate' in data && data.postedDate !== undefined && !(typeof data.postedDate === 'string' || data.postedDate === null)) {
    return false
  }

  if ('applyUrl' in data && data.applyUrl !== undefined && !(typeof data.applyUrl === 'string' || data.applyUrl === null)) {
    return false
  }

  return true
}

function logAttempt(provider: string, start: Date, success: boolean, error?: string) {
  const end = new Date()
  const logger = success ? console.warn : console.error
  logger(
    `[jobParser] provider=${provider} start=${start.toISOString()} end=${end.toISOString()} success=${success}` +
      (error ? ` error=${error}` : '')
  )
}

async function tryNormalizeWithAiml(rawText: string): Promise<JobExtractionResponse> {
  const start = new Date()
  try {
    const messages: AimlApiMessage[] = [
      { role: 'system', content: JOB_NORMALIZER_SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(rawText) },
    ]
    const res = await callAimlApi('gpt-4.1-mini', messages, 0.15, 1400)
    if (!res.success) {
      throw new Error(res.error || 'AIML API call failed')
    }

    const parsed = parseJobJson(res.content)
    if (!isValidExtractedJobData(parsed)) {
      throw new Error('Parsed JSON missing required fields')
    }

    logAttempt('aimlapi', start, true)
    return { success: true, data: parsed }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logAttempt('aimlapi', start, false, message)
    return { success: false, error: message }
  }
}

async function tryNormalizeWithDeepSeek(rawText: string): Promise<JobExtractionResponse> {
  const start = new Date()
  try {
    const response = await callDeepSeek(
      'deepseek-chat',
      [{ role: 'user', content: buildUserPrompt(rawText) }],
      { systemPrompt: JOB_NORMALIZER_SYSTEM_PROMPT, maxTokens: 1400, temperature: 0.2 }
    )

    if (!response.success) {
      throw new Error(response.error || 'DeepSeek API call failed')
    }

    const parsed = parseJobJson(response.content)
    if (!isValidExtractedJobData(parsed)) {
      throw new Error('Parsed JSON missing required fields')
    }

    logAttempt('deepseek', start, true)
    return { success: true, data: parsed }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logAttempt('deepseek', start, false, message)
    return { success: false, error: message }
  }
}

async function tryNormalizeWithClaude(rawText: string): Promise<JobExtractionResponse> {
  const start = new Date()
  try {
    const response = await callAnthropic(
      'claude-sonnet-4-20250514',
      [{ role: 'user', content: buildUserPrompt(rawText) }],
      { systemPrompt: JOB_NORMALIZER_SYSTEM_PROMPT, maxTokens: 1400, temperature: 0.2 }
    )

    if (!response.success) {
      throw new Error(response.error || 'Claude API call failed')
    }

    const parsed = parseJobJson(response.content)
    if (!isValidExtractedJobData(parsed)) {
      throw new Error('Parsed JSON missing required fields')
    }

    logAttempt('claude', start, true)
    return { success: true, data: parsed }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logAttempt('claude', start, false, message)
    return { success: false, error: message }
  }
}

/**
 * normalizeJobWithFallback
 * Attempts to parse raw job posting text into structured data.
 * Uses AI/ML API first, then fallback providers if that fails.
 */
export async function normalizeJobWithFallback(rawText: string): Promise<JobExtractionResponse> {
  const attempts = [tryNormalizeWithAiml, tryNormalizeWithDeepSeek, tryNormalizeWithClaude]
  const errors: string[] = []

  for (const attempt of attempts) {
    const result = await attempt(rawText)
    if (result.success && result.data) {
      return result
    }
    if (result.error) errors.push(result.error)
  }

  return {
    success: false,
    error: `All parsers failed: ${errors.join(' | ') || 'no error messages captured'}`,
  }
}
