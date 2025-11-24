export type SkillInsightStatus = 'solid' | 'emerging' | 'gap'

export type SkillInsight = {
  slug: string
  displayName: string
  evidenceCount: number
  demandScore: number
  category?: string
  status: SkillInsightStatus
}

export interface BuildSkillInsightOptions {
  resumeSkills: string[]
  jobSkills: string[]
  gapAnalysisRow?: Record<string, unknown> | null
}

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const displayFromSlug = (slug: string): string =>
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const extractStringsFromAnalysis = (row?: Record<string, unknown> | null): string[] => {
  if (!row) return []
  const collected: string[] = []

  Object.values(row).forEach((val) => {
    if (Array.isArray(val)) {
      val.forEach((v) => {
        if (typeof v === 'string') collected.push(v)
      })
    }
  })

  return collected
}

export function buildSkillInsights(opts: BuildSkillInsightOptions): SkillInsight[] {
  const { resumeSkills, jobSkills, gapAnalysisRow } = opts

  const resumeCounts: Record<string, number> = {}
  const jobCounts: Record<string, number> = {}

  resumeSkills.forEach((skill) => {
    const slug = slugify(skill)
    if (!slug) return
    resumeCounts[slug] = (resumeCounts[slug] || 0) + 1
  })

  jobSkills.forEach((skill) => {
    const slug = slugify(skill)
    if (!slug) return
    jobCounts[slug] = (jobCounts[slug] || 0) + 1
  })

  const gapStrings = extractStringsFromAnalysis(gapAnalysisRow)
  gapStrings.forEach((skill) => {
    const slug = slugify(skill)
    if (!slug) return
    jobCounts[slug] = (jobCounts[slug] || 0) + 1
  })

  const allSlugs = Array.from(
    new Set([...Object.keys(resumeCounts), ...Object.keys(jobCounts)])
  )

  const insights: SkillInsight[] = allSlugs.map((slug) => {
    const evidenceCount = resumeCounts[slug] || 0
    const demandScore = jobCounts[slug] || 0

    let status: SkillInsightStatus = 'emerging'
    if (demandScore >= 3 && evidenceCount >= 2) status = 'solid'
    else if (demandScore >= 2 && evidenceCount === 0) status = 'gap'
    else if (demandScore >= 3 && evidenceCount === 0) status = 'gap'
    else if (evidenceCount > 0 && demandScore >= 1) status = 'emerging'
    else if (evidenceCount >= 2 && demandScore === 0) status = 'solid'

    return {
      slug,
      displayName: displayFromSlug(slug),
      evidenceCount,
      demandScore,
      status,
    }
  })

  return insights.sort((a, b) => {
    if (a.status === b.status) return b.demandScore - a.demandScore
    const order: Record<SkillInsightStatus, number> = { gap: 0, emerging: 1, solid: 2 }
    return order[a.status] - order[b.status]
  })
}
