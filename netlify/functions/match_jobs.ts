// netlify/functions/match_jobs.ts
import type { Handler } from '@netlify/functions'
import { createAdminClient } from './utils/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  JobRow,
  MatchResult,
  UserMatchPreferences,
  Profile,
  CareerTrack,
} from '../../src/shared/types'

import {
  safeLower,
  tokenize,
  extractResumeKeywords,
} from './utils/resumeParsing'
// ------------- helpers -------------

function isJobRowArray(data: unknown): data is JobRow[] {
  if (!Array.isArray(data)) return false
  return data.every((item) => {
    if (!item || typeof item !== 'object') return false
    const obj = item as Record<string, unknown>
    return typeof obj.id === 'string' && typeof obj.title === 'string'
  })
}


function normalizeListField(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'string' ? v : String(v)))
      .flatMap((v) =>
        v
          .split(/[;,]/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
  }
  if (typeof value === 'string') {
    return value
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}


function buildProfessionalProfileBlob(profile: Profile | null): string {
  if (!profile) return ''
  const p = profile as any

  // Likely professional-profile fields. If some do not exist, they just become empty.
  const candidateFields: unknown[] = [
    p.headline,
    p.professional_headline,
    p.current_title,
    p.currentRoleTitle,
    p.primary_title,
    p.target_titles,
    p.target_roles,
    p.professional_summary,
    p.summary,
    p.about,
    p.experience_highlights,
    p.key_achievements,
    p.impact_raw,
    p.strengths_raw,
    p.skills_raw,
    p.goals_raw,
  ]

  const strings: string[] = candidateFields
    .map((v) => (typeof v === 'string' ? v : ''))
    .filter(Boolean)

  // Also fold in any string[]-style list fields if they exist
  const listFieldKeys = [
    'skills_primary',
    'skills_secondary',
    'domains',
    'industries_focus',
    'focus_skills',
    'avoid_skills',
  ]

  for (const key of listFieldKeys) {
    const val = p[key]
    if (Array.isArray(val)) {
      strings.push(val.join(', '))
    }
  }

  return strings.join('\n')
}

// clamp score into 0–100
function clampScore(score: number): number {
  if (!isFinite(score)) return 0
  if (score < 0) return 0
  if (score > 100) return 100
  return score
}

// rough days difference
function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  return diffMs / (1000 * 60 * 60 * 24)
}

async function loadUserMatchPreferences(
  client: SupabaseClient,
  userId: string
): Promise<UserMatchPreferences> {
  const { data, error } = await client
    .from('user_match_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('Failed to load user_match_preferences', error)
  }

  if (!data) {
    return {
      user_id: userId,
      weight_salary: 0.6,
      weight_location: 0.5,
      weight_remote: 0.7,
      weight_mission: 0.4,
      weight_growth: 0.5,
      location_mode: 'remote_or_local',
      min_salary_local: null,
      min_salary_remote: null,
      min_salary_relocate: null,
    }
  }

  return data as UserMatchPreferences
}

// ------------- scoring engine -------------

function scoreJobAgainstProfile(job: JobRow, profile: Profile | null): MatchResult {
  let score = 0
  const reasons: string[] = []

  const title = safeLower(job.title)
  const description = safeLower(job.description ?? '')
  const textBlob = `${title} ${description}`

  // Pull skills from enriched profile (resume_keywords or skills_primary)
  const extractedSkills: string[] = Array.isArray(
    (profile as any)?.skills_primary
  )
    ? (((profile as any).skills_primary as unknown[]) as string[])
    : Array.isArray((profile as any)?.resume_keywords)
      ? (((profile as any).resume_keywords as unknown[]) as string[])
      : []

  // Resume skill matching
  let skillMatches = 0
  let skillReasons: string[] = []

  if (extractedSkills && extractedSkills.length > 0) {
    for (const skill of extractedSkills) {
      const skillLower = skill.toLowerCase()

      if (
        (job.description || '').toLowerCase().includes(skillLower) ||
        (job.title || '').toLowerCase().includes(skillLower)
      ) {
        skillMatches++
        skillReasons.push(`Mentions your skill: ${skill}`)
      }
    }
  }

  const resumeScore = Math.min(skillMatches * 5, 30)
  score += resumeScore
  reasons.push(...skillReasons)

  const minSalaryPref: number =
    Number(
      (profile as any)?.min_salary ??
      (profile as any)?.salary_min ??
      (profile as any)?.target_salary ??
      0
    ) || 0

  const remotePref: string = safeLower(
    (profile as any)?.remote_preference ??
    (profile as any)?.remote_preference_mode ??
    (profile as any)?.work_mode ??
    (profile as any)?.work_style ??
    ''
  )

  const preferredLocations: string[] = normalizeListField(
    (profile as any)?.preferred_locations ??
    (profile as any)?.location_preference ??
    (profile as any)?.target_locations
  )

  const includeKeywords: string[] = normalizeListField(
    (profile as any)?.keywords_include ??
    (profile as any)?.target_keywords ??
    (profile as any)?.skills_primary
  )

  const excludeKeywords: string[] = normalizeListField(
    (profile as any)?.keywords_exclude ??
    (profile as any)?.avoid_keywords
  )

  const targetTitles: string[] = normalizeListField(
    (profile as any)?.target_titles ??
    (profile as any)?.job_targets ??
    (profile as any)?.headline
  )

  // 1) Title / role alignment (0–35)
  let titleComponent = 0
  if (targetTitles.length > 0) {
    const hits = targetTitles.filter((t) =>
      title.includes(t.toLowerCase())
    )
    if (hits.length > 0) {
      titleComponent += 25
      reasons.push(`Title lines up with your target roles (${hits[0]})`)
    } else {
      const titleTokens = tokenize(job.title)
      const targetTokens = targetTitles.flatMap(tokenize)
      const overlap = titleTokens.filter((t) =>
        targetTokens.includes(t)
      )
      if (overlap.length > 0) {
        titleComponent += Math.min(20, overlap.length * 5)
        reasons.push('Title overlaps with your target roles')
      }
    }
  } else {
    titleComponent += 5
  }
  score += titleComponent

  // 2) Keyword / skills fit (0–25)
  let skillComponent = 0
  if (includeKeywords.length > 0 && textBlob) {
    const matches = includeKeywords.filter((kw) =>
      textBlob.includes(kw.toLowerCase())
    )
    if (matches.length > 0) {
      skillComponent += Math.min(25, matches.length * 5)
      reasons.push('Mentions several of your skills or interests')
    }
  }
  score += skillComponent

  // 3) Remote / work-mode fit (0–15)
  let remoteComponent = 0
  const jobIsRemote =
    job.remote_type === 'remote' ||
    (job.location && job.location.toLowerCase().includes('remote'))

  if (remotePref.includes('remote') || remotePref.includes('hybrid')) {
    if (jobIsRemote) {
      remoteComponent += 15
      reasons.push('Matches your remote / hybrid preference')
    } else if (!job.location) {
      remoteComponent += 5
    }
  } else if (remotePref.includes('onsite') || remotePref.includes('on-site')) {
    if (!jobIsRemote) {
      remoteComponent += 8
    }
  } else {
    remoteComponent += 3
  }
  score += remoteComponent

  // 4) Location proximity (0–10)
  let locationComponent = 0
  const jobLocation = safeLower(job.location)

  if (preferredLocations.length > 0 && jobLocation) {
    const match = preferredLocations.find((loc) =>
      jobLocation.includes(loc.toLowerCase())
    )
    if (match) {
      locationComponent += 10
      reasons.push(`Located in one of your preferred regions (${match})`)
    }
  }
  score += locationComponent

  // 5) Salary fit (0–15)
  let salaryComponent = 0
  const jobMin = Number(job.salary_min || 0)
  const jobMax = Number(job.salary_max || 0)
  const effective = jobMax || jobMin

  if (minSalaryPref > 0 && effective > 0) {
    if (effective >= minSalaryPref) {
      salaryComponent += 15
      reasons.push('Meets or beats your minimum salary target')
    } else if (effective >= minSalaryPref * 0.8) {
      salaryComponent += 8
      reasons.push('Slightly below your salary target but close')
    } else {
      salaryComponent += 2
    }
  } else if (effective > 0) {
    salaryComponent += 5
  }
  score += salaryComponent

  // 6) Recency / freshness (0–15)
  let recencyComponent = 0
  const days = daysSince(job.posted_date)
  if (days !== null) {
    if (days <= 3) {
      recencyComponent += 15
      reasons.push('Very fresh posting')
    } else if (days <= 7) {
      recencyComponent += 10
      reasons.push('Posted within the last week')
    } else if (days <= 30) {
      recencyComponent += 6
      reasons.push('Posted within the last month')
    } else {
      recencyComponent += 2
    }
  }
  score += recencyComponent

  // 7) Competitiveness hint (0–5)
  let marketComponent = 0
  const level = safeLower(job.competitiveness_level)
  if (level) {
    if (level.includes('balanced') || level.includes('moderate')) {
      marketComponent += 4
      reasons.push('Competition looks reasonable for this one')
    } else if (level.includes('low')) {
      marketComponent += 5
      reasons.push('Lower competition, could be easier to land')
    } else if (level.includes('high')) {
      marketComponent += 1
    }
  }
  score += marketComponent

  return {
    job_id: job.id,
    job,
    score: clampScore(score),
    reasons,
  }
}

// ------------- handler -------------

export const handler: Handler = async (event) => {
  try {
    const supabase = createAdminClient()

    const userId = event.queryStringParameters?.user_id
    const trackId = event.queryStringParameters?.track_id || null

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing user_id' }),
      }
    }

    // 0) Optional: load career track if provided
    let track: CareerTrack | null = null
    if (trackId) {
      const { data: trackRow, error: trackErr } = await supabase
        .from('career_tracks')
        .select('*')
        .eq('id', trackId)
        .eq('user_id', userId)
        .maybeSingle()

      if (trackErr) {
        console.warn('match_jobs: failed to load career_track', trackErr)
      } else if (trackRow) {
        track = trackRow as CareerTrack
      }
    }

// 1) Load base profile
// 1) Load profile
const { data: profile, error: profileErr } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId) // your profiles table uses "id", not "user_id"
  .maybeSingle()

if (profileErr) {
  console.error('match_jobs: failed to load profile', profileErr)
  // we fall back to null profile, scoring still works with generic signals
}

    const typedProfile: Profile | null = profile ? (profile as Profile) : null

    // 1b) Load the user's primary or most recent resume (optional)
    let resumeText = ''
    try {
      const { data: resumeRows, error: resumeErr } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', userId)
        // newest activity first
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)

      if (resumeErr) {
        console.warn('match_jobs: failed to load resumes', resumeErr)
      } else if (resumeRows && resumeRows.length > 0) {
        const resume = resumeRows[0] as any
        resumeText =
          typeof resume.parsed_text === 'string'
            ? resume.parsed_text
            : typeof resume.content === 'string'
              ? resume.content
              : ''
      }
    } catch (resumeErr) {
      console.warn('match_jobs: unexpected resume load error', resumeErr)
    }

    let enrichedProfile: Profile = typedProfile ? { ...typedProfile } : {}

    if (resumeText) {
      const resumeKeywords = extractResumeKeywords(resumeText, 40)
        ; (enrichedProfile as any).resume_text = resumeText
        ; (enrichedProfile as any).resume_keywords = resumeKeywords

      if (!(enrichedProfile as any).skills_primary) {
        ; (enrichedProfile as any).skills_primary = resumeKeywords
      }
    }

    // --- Professional profile enrichment ---
    const profBlob = buildProfessionalProfileBlob(typedProfile)

    if (profBlob.trim().length > 0) {
      const profKeywords = extractResumeKeywords(profBlob, 40)

        ; (enrichedProfile as any).professional_profile_text = profBlob
        ; (enrichedProfile as any).professional_keywords = profKeywords

      const existingSkillsRaw = (enrichedProfile as any).skills_primary
      const existingSkills: string[] = Array.isArray(existingSkillsRaw)
        ? existingSkillsRaw.map((v: unknown) => String(v))
        : []

      const mergedSkills = new Set<string>([...existingSkills, ...profKeywords])
      if (mergedSkills.size > 0) {
        ; (enrichedProfile as any).skills_primary = Array.from(mergedSkills)
      }

      const rawTargets =
        (typedProfile as any)?.target_titles ||
        (typedProfile as any)?.target_roles ||
        (typedProfile as any)?.primary_title ||
        (typedProfile as any)?.headline ||
        ''

      if (rawTargets && !(enrichedProfile as any).target_titles) {
        ; (enrichedProfile as any).target_titles = normalizeListField(rawTargets)
      }

      if (!(enrichedProfile as any).keywords_include) {
        ; (enrichedProfile as any).keywords_include = profKeywords
      }
    }

    // 1c) Load job preferences (optional)
    let jobPrefs: any = null
    try {
      const { data: jobPrefRow, error: jobPrefErr } = await supabase
        .from('job_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (jobPrefErr) {
        console.warn('match_jobs: failed to load job_preferences', jobPrefErr)
      } else if (jobPrefRow) {
        jobPrefs = jobPrefRow
      }
    } catch (jobPrefErr) {
      console.warn('match_jobs: unexpected job_preferences error', jobPrefErr)
    }

    // 1d) Load match-weight preferences (still user-level for now)
    const prefs = await loadUserMatchPreferences(supabase, userId)
    // prefs is currently not threaded into the scoring engine directly, but kept for future hard filters

    // Attach job preferences in a flattened way so scoring sees them
    if (jobPrefs) {
      ;(enrichedProfile as any).job_preferences = jobPrefs

      // Remote preference: e.g. "remote", "hybrid", "on site"
      if (!(enrichedProfile as any).remote_preference && jobPrefs.remote_preference) {
        ;(enrichedProfile as any).remote_preference = jobPrefs.remote_preference
      }

      // Preferred locations: cities / regions
      if (
        !(enrichedProfile as any).preferred_locations &&
        Array.isArray(jobPrefs.preferred_locations)
      ) {
        ;(enrichedProfile as any).preferred_locations = jobPrefs.preferred_locations
      }

      // Salary floor
      if (
        (enrichedProfile as any).min_salary == null &&
        typeof jobPrefs.min_salary === 'number'
      ) {
        ;(enrichedProfile as any).min_salary = jobPrefs.min_salary
      }

      // “No thanks” titles and companies feed into exclude_keywords
      const excludeTitles = Array.isArray(jobPrefs.exclude_titles)
        ? jobPrefs.exclude_titles
        : []
      const excludeCompanies = Array.isArray(jobPrefs.exclude_companies)
        ? jobPrefs.exclude_companies
        : []

      const existingExcludes = normalizeListField(
        (enrichedProfile as any).keywords_exclude ??
          (enrichedProfile as any).avoid_keywords
      )

      const mergedExcludes = [
        ...existingExcludes,
        ...excludeTitles,
        ...excludeCompanies,
      ]

      if (mergedExcludes.length > 0) {
        ;(enrichedProfile as any).keywords_exclude = mergedExcludes
      }
    }

    // 2) Load active jobs
    const { data: jobsData, error: jobsErr } = await supabase
      .from('jobs')
      .select(
        `
        id,
        title,
        company,
        location,
        employment_type,
        remote_type,
        source_slug,
        external_url,
        posted_date,
        created_at,
        salary_min,
        salary_max,
        competitiveness_level,
        match_score,
        description
      `
      )
      .eq('is_active', true)
      .order('posted_date', { ascending: false })
      .limit(400)

    if (jobsErr) {
      console.error('match_jobs: failed to load jobs', jobsErr)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to load jobs' }),
      }
    }

    if (!isJobRowArray(jobsData)) {
      console.error('match_jobs: unexpected jobs payload', jobsData)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Bad jobs payload' }),
      }
    }

    const jobs = jobsData as JobRow[]

    // 3) Compute scores
    const results: MatchResult[] = jobs
      .map((job) => scoreJobAgainstProfile(job, enrichedProfile))
      .filter((m) => m.score > 0)

    if (results.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          matches: [],
          count: 0,
        }),
      }
    }

    const sorted = results.sort((a, b) => b.score - a.score)

    return {
      statusCode: 200,
      body: JSON.stringify({
        matches: sorted,
        count: sorted.length,
      }),
    }
  } catch (err) {
    console.error('match_jobs: unexpected error', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected error' }),
    }
  }
}