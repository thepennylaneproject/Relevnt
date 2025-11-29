import type { Handler } from '@netlify/functions'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    }
  }

  let body: any
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: 'Invalid JSON body' }),
    }
  }

  const task = body.task as string | undefined
  const input = body.input

  if (!task) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: 'Missing task name' }),
    }
  }

  try {
    let response

    switch (task) {
      case 'extract-resume':
        response = handleExtractResume(input)
        break
      case 'analyze-resume':
        response = handleAnalyzeResume(input)
        break
      case 'optimize-resume':
        response = handleOptimizeResume(input)
        break
      default:
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            error: `Unknown task: ${task}`,
          }),
        }
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        data: response,
        usage: {
          tier: 'starter',
          remaining: null,
        },
      }),
    }
  } catch (err) {
    console.error('AI function error for task', task, err)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'AI task failed on the server',
      }),
    }
  }
}

function getResumeText(input: any): string {
  if (!input) return ''

  if (typeof input === 'string') {
    return input
  }

  if (typeof input.resumeText === 'string') {
    return input.resumeText
  }

  if (typeof input.text === 'string') {
    return input.text
  }

  return ''
}

function parseResumeContent(raw: unknown): {
  name: string
  email: string
  phone: string
  location: string
  summary: string
  skills: string[]
} {
  if (typeof raw !== 'string') {
    return {
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      skills: [],
    }
  }

  function extractSkillsFromText(text: string): string[] {
    const lower = text.toLowerCase()

    const headings = [
      'technical skills',
      '\ntechnical skills',
      'skills & technologies',
      '\nskills',
    ]

    let section = ''

    for (const rawHeading of headings) {
      const heading = rawHeading.toLowerCase().replace('\n', '')
      // try both “Technical Skills” and “\nTechnical Skills”
      const idx = lower.indexOf(heading)
      if (idx !== -1) {
        const slice = text.slice(idx)

        // Stop at blank line or a known next section heading
        const endMatch = slice.search(
          /\n\s*\n|education & personal development|education|professional experience|experience/i
        )
        if (endMatch > 0) {
          section = slice.slice(0, endMatch)
        } else {
          section = slice
        }
        break
      }
    }

    if (!section) return []

    // Strip heading labels and obvious mini-headings
    section = section
      .replace(/technical skills[:\s]*/gi, '')
      .replace(/skills & technologies[:\s]*/gi, '')
      .replace(/marketing & content creation[:\s]*/gi, '')
      .replace(/ai tools & productivity platforms[:\s]*/gi, '')

    // Split on commas, bullets, pipes, semicolons
    const rawTokens = section.split(/[,•;|]/)

    const cleaned = rawTokens
      .map((t) => t.replace(/\s+/g, ' ').trim())
      .filter((t) => t.length > 1)
      .filter((t) => !/^technical skills$/i.test(t))

    // De-duplicate while preserving order
    const seen = new Set<string>()
    const unique: string[] = []

    for (const token of cleaned) {
      const key = token.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(token)
      }
    }

    return unique
  }
  
  const text = raw.replace(/\r\n/g, '\n')
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  let name = ''
  let email = ''
  let phone = ''
  let location = ''

  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  const phoneRegex = /(\+?\d[\d\-\.\s]{7,}\d)/
  const locationRegex = /[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}/

  const headerScanLimit = Math.min(lines.length, 15)

  for (let i = 0; i < headerScanLimit; i++) {
    const line = lines[i]

    if (!email) {
      const m = line.match(emailRegex)
      if (m) email = m[0]
    }

    if (!phone) {
      const m = line.match(phoneRegex)
      if (m) phone = m[0]
    }

    if (!location) {
      const m = line.match(locationRegex)
      if (m) location = m[0]
    }
  }

  // Name: take the first non-empty line, strip after '|'
  const nameLine = lines[0] || ''
  name = nameLine.split('|')[0].trim()
  if (/resume/i.test(name)) {
    name = ''
  }

  // Build body text without obvious header/footer lines
  const bodyLines = lines.filter((l) => {
    const normalized = l.toLowerCase()

    if (email && l.includes(email)) return false
    if (phone && l.includes(phone)) return false
    if (normalized.includes('linkedin.com')) return false
    if (/resume page\s*0?\d/i.test(normalized)) return false

    // Drop “super header” line that has both name and email
    if (name && l.includes(name) && email && l.includes(email)) return false

    return true
  })

  let bodyText = bodyLines.join(' ')

  // If location appears early in the text, cut everything before it
  if (location) {
    const idx = bodyText.indexOf(location)
    if (idx !== -1) {
      bodyText = bodyText.slice(idx + location.length).trim()
    }
  }

  // Stop summary at the first big section heading
  const sectionBreakRegex =
    /(professional experience|experience|work experience|education & personal development|education)[:]?/i
  const sectionMatch = bodyText.match(sectionBreakRegex)

  let summarySource = bodyText
  if (sectionMatch && sectionMatch.index !== undefined) {
    summarySource = bodyText.slice(0, sectionMatch.index).trim()
  }

  // Take first 2–3 sentences as summary
  const sentences = summarySource
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  let summary = ''
  if (sentences.length > 0) {
    summary = sentences.slice(0, 3).join(' ')
    if (summary.length > 700) {
      summary = summary.slice(0, 700).trim()
    }
  }

  // Skills: pull from “Technical Skills” / skills sections
  const skills = extractSkillsFromText(text)

  return {
    name,
    email,
    phone,
    location,
    summary,
    skills,
  }
}

function handleExtractResume(input: any) {
  const text = getResumeText(input)

  if (!text || !text.trim()) {
    return {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      skills: [],
      experience: [],
      education: [],
    }
  }

  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const lines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Use a larger "header" region to improve name / contact detection
  const headerLimit = 800
  const headerChunk = normalized.slice(0, headerLimit)

  // Email
  const emailMatch = headerChunk.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  const email = emailMatch ? emailMatch[0] : ''

  // Phone (very forgiving)
  const phoneMatch = headerChunk.match(/(\+?\d[\d\-\.\s\(\)]{7,}\d)/)
  const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, ' ').trim() : ''

  // Location (City, ST 12345 or City, ST)
  let location = ''
  const locationMatch =
    headerChunk.match(/[A-Za-z .]+,\s*[A-Z]{2}\s+\d{5}/) ||
    headerChunk.match(/[A-Za-z .]+,\s*[A-Z]{2}\b/)
  if (locationMatch) {
    location = locationMatch[0].trim()
  }

  // Name: strip out email/phone, then take the leading text before digits or pipes
  let nameSource = headerChunk
  if (email) {
    nameSource = nameSource.split(email)[0]
  }
  if (phone) {
    nameSource = nameSource.split(phone)[0]
  }
  nameSource = nameSource.split('|')[0]

  const nameCandidate = nameSource
    .replace(/\s+/g, ' ')
    .replace(/[|,]/g, ' ')
    .trim()

  let fullName = ''
  if (nameCandidate) {
    const tokens = nameCandidate
      .split(' ')
      .filter((t) => t && !/@/.test(t) && !/\d/.test(t))

    if (tokens.length >= 2) {
      fullName = tokens.slice(0, 3).join(' ')
    } else {
      fullName = nameCandidate
    }
  }

  // ---------- SUMMARY DETECTION ----------
  // Try to grab the first paragraph after the contact header
  let summary = ''

  // Heuristic: header is the first line, everything after that is body
  const firstNewlineIndex = normalized.indexOf('\n')
  const bodyText =
    firstNewlineIndex !== -1
      ? normalized.slice(firstNewlineIndex + 1).trim()
      : normalized

  if (bodyText) {
    // Stop at first double newline or after 600 characters
    const doubleNewlineIndex = bodyText.indexOf('\n\n')
    const rawSummary =
      doubleNewlineIndex !== -1
        ? bodyText.slice(0, doubleNewlineIndex)
        : bodyText.slice(0, 600)

    summary = rawSummary.replace(/\s+/g, ' ').trim()

    // Keep summaries fairly tight
    if (summary.length > 400) {
      summary = summary.slice(0, 400).trim()
    }
  }

  // ---------- SKILLS DETECTION ----------
  let skills: string[] = []

  const sectionHeadings = [
    'professional experience',
    'experience',
    'work experience',
    'employment',
    'education',
    'projects',
    'certifications',
  ]

  const skillsIndex = lines.findIndex((l) =>
    /\b(technical skills|skills)\b/i.test(l)
  )

  if (skillsIndex !== -1) {
    // Collect lines after "Skills" until the next major section heading
    const tailLines: string[] = []
    for (let i = skillsIndex + 1; i < lines.length; i++) {
      const lower = lines[i].toLowerCase()
      const isHeading = sectionHeadings.some((h) => lower.includes(h))
      if (isHeading) break
      tailLines.push(lines[i])
    }

    const tail = tailLines.join(' ')
    skills = tail
      .split(/[,•\-|]/)
      .map((s) => s.replace(/&amp;/g, '&').trim())
      .filter((s) => s.length > 1)
      .slice(0, 60)
  }

  return {
    fullName,
    email,
    phone,
    location,
    summary,
    skills,
    experience: [],
    education: [],
  }
}

function handleAnalyzeResume(input: any) {
  const text = getResumeText(input).toLowerCase()

  const keywords = [
    'experience',
    'lead',
    'managed',
    'strategy',
    'results',
    'growth',
    'campaign',
    'analytics',
    'stakeholder',
    'cross-functional',
    'ai',
    'llm',
  ]

  const keywordMatches = keywords.filter((k) => text.includes(k))

  const wordCount = text.split(/\s+/).filter(Boolean).length
  const lengthScore = Math.max(0, Math.min(60, Math.floor(wordCount / 10)))
  const keywordScore = Math.min(40, keywordMatches.length * 5)

  let atsScore = lengthScore + keywordScore
  if (atsScore > 100) atsScore = 100

  const improvements: string[] = []

  if (!/summary/i.test(text)) {
    improvements.push('Add a clear professional summary at the top, 3–4 lines.')
  }
  if (!/experience/i.test(text)) {
    improvements.push('Include a dedicated "Experience" section with bullet points.')
  }
  if (!/results|achieved|increased|reduced|grew|improved/i.test(text)) {
    improvements.push('Highlight measurable results using verbs like "increased", "improved", or specific metrics.')
  }
  if (wordCount < 200) {
    improvements.push('Consider expanding your experience bullets so each role shows impact and scope.')
  }

  if (improvements.length === 0) {
    improvements.push('This resume is structurally solid. Focus next on tailoring to specific job descriptions.')
  }

  return {
    atsScore,
    keywordMatches,
    improvements,
  }
}

function handleOptimizeResume(input: any) {
  const resumeText = getResumeText(input)

  let jobDescription = ''
  if (input && typeof input.jobDescription === 'string') {
    jobDescription = input.jobDescription
  }

  const baseAnalysis = handleAnalyzeResume({ resumeText })

  const improvements = [...baseAnalysis.improvements]

  if (jobDescription) {
    const jdText = jobDescription.toLowerCase()

    const jdKeywords = [
      'leadership',
      'communication',
      'stakeholder',
      'roadmap',
      'metrics',
      'reporting',
      'mentorship',
      'collaboration',
      'testing',
      'experimentation',
      'accessibility',
    ]

    const missingFromResume = jdKeywords.filter(
      (k) => jdText.includes(k) && !resumeText.toLowerCase().includes(k)
    )

    if (missingFromResume.length > 0) {
      improvements.push(
        `The job description emphasizes: ${missingFromResume.join(
          ', '
        )}. Consider weaving these into your bullets where they are honest and accurate.`
      )
    }
  }

  const optimizedResume =
    resumeText.trim().length > 0
      ? resumeText
      : 'Paste your current resume to see optimization suggestions.'

  return {
    atsScore: baseAnalysis.atsScore,
    optimizedResume,
    improvements,
  }
}

export { handler }