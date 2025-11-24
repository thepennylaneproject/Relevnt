// netlify/functions/utils/resumeParsing.ts

// Lowercase helper
export function safeLower(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.toLowerCase()
}

// Tokenizer
export function tokenize(input: unknown): string[] {
  const text = safeLower(input)
  if (!text) return []
  return text
    .split(/[^a-z0-9+]+/i)
    .map((t) => t.trim())
    .filter(Boolean)
}

// Extract important-ish keywords from resume text
export function extractResumeKeywords(resumeText: string, max = 40): string[] {
  const rawTokens = tokenize(resumeText)
  if (!rawTokens.length) return []

  const stopwords = new Set([
    'and', 'or', 'the', 'a', 'an', 'for', 'with', 'from', 'that', 'this',
    'to', 'in', 'of', 'on', 'at', 'by', 'as', 'is', 'are', 'was', 'were',
    'be', 'being', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
    'but', 'if', 'then', 'so', 'it', 'its', 'their', 'our', 'your', 'you',
    'i', 'we', 'they', 'he', 'she', 'them', 'us'
  ])

  const counts = new Map<string, number>()

  for (const token of rawTokens) {
    if (token.length < 3) continue
    if (stopwords.has(token)) continue
    const prev = counts.get(token) ?? 0
    counts.set(token, prev + 1)
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([token]) => token)
}