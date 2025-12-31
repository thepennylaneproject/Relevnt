import type { Handler } from '@netlify/functions'
import { createResponse, handleCORS, verifyToken } from './utils/supabase'

// Curated resource catalog
interface LearningResource {
    id: string
    name: string
    provider: string
    url: string
    type: 'course' | 'tutorial' | 'video' | 'article' | 'certification'
    free: boolean
    estimatedHours: number
    skills: string[]
    level: 'beginner' | 'intermediate' | 'advanced'
}

const RESOURCE_CATALOG: LearningResource[] = [
    // Technical Skills
    {
        id: 'cs-python',
        name: 'Python for Everybody',
        provider: 'Coursera',
        url: 'https://www.coursera.org/specializations/python',
        type: 'course',
        free: true,
        estimatedHours: 80,
        skills: ['python', 'programming', 'data analysis'],
        level: 'beginner'
    },
    {
        id: 'edx-sql',
        name: 'Databases and SQL for Data Science',
        provider: 'edX',
        url: 'https://www.edx.org/learn/sql',
        type: 'course',
        free: true,
        estimatedHours: 20,
        skills: ['sql', 'databases', 'data analysis'],
        level: 'beginner'
    },
    {
        id: 'yt-js',
        name: 'JavaScript Full Course',
        provider: 'YouTube',
        url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
        type: 'video',
        free: true,
        estimatedHours: 4,
        skills: ['javascript', 'programming', 'web development'],
        level: 'beginner'
    },
    {
        id: 'li-react',
        name: 'React.js Essential Training',
        provider: 'LinkedIn Learning',
        url: 'https://www.linkedin.com/learning/react-js-essential-training',
        type: 'course',
        free: false,
        estimatedHours: 5,
        skills: ['react', 'javascript', 'frontend'],
        level: 'intermediate'
    },
    // Soft Skills
    {
        id: 'cs-communication',
        name: 'Effective Communication',
        provider: 'Coursera',
        url: 'https://www.coursera.org/learn/wharton-communication-skills',
        type: 'course',
        free: true,
        estimatedHours: 10,
        skills: ['communication', 'presentation', 'public speaking'],
        level: 'beginner'
    },
    {
        id: 'edx-leadership',
        name: 'Leadership Principles',
        provider: 'edX',
        url: 'https://www.edx.org/learn/leadership',
        type: 'course',
        free: true,
        estimatedHours: 16,
        skills: ['leadership', 'management', 'team building'],
        level: 'intermediate'
    },
    {
        id: 'yt-negotiation',
        name: 'Negotiation Skills Masterclass',
        provider: 'YouTube',
        url: 'https://www.youtube.com/results?search_query=negotiation+skills',
        type: 'video',
        free: true,
        estimatedHours: 3,
        skills: ['negotiation', 'salary negotiation', 'communication'],
        level: 'intermediate'
    },
    // Data & Analytics
    {
        id: 'cs-data-science',
        name: 'Google Data Analytics Certificate',
        provider: 'Coursera',
        url: 'https://www.coursera.org/professional-certificates/google-data-analytics',
        type: 'certification',
        free: true,
        estimatedHours: 180,
        skills: ['data analysis', 'excel', 'sql', 'visualization', 'r'],
        level: 'beginner'
    },
    {
        id: 'edx-machine-learning',
        name: 'Machine Learning Fundamentals',
        provider: 'edX',
        url: 'https://www.edx.org/learn/machine-learning',
        type: 'course',
        free: true,
        estimatedHours: 40,
        skills: ['machine learning', 'python', 'data science', 'ai'],
        level: 'intermediate'
    },
    // Product & Design
    {
        id: 'cs-product',
        name: 'Digital Product Management',
        provider: 'Coursera',
        url: 'https://www.coursera.org/learn/uva-darden-digital-product-management',
        type: 'course',
        free: true,
        estimatedHours: 15,
        skills: ['product management', 'agile', 'product strategy'],
        level: 'intermediate'
    },
    {
        id: 'yt-figma',
        name: 'Figma UI Design Tutorial',
        provider: 'YouTube',
        url: 'https://www.youtube.com/watch?v=FTFaQWZBqQ8',
        type: 'video',
        free: true,
        estimatedHours: 12,
        skills: ['figma', 'ui design', 'ux design', 'prototyping'],
        level: 'beginner'
    },
    // Project Management
    {
        id: 'cs-pm',
        name: 'Google Project Management Certificate',
        provider: 'Coursera',
        url: 'https://www.coursera.org/professional-certificates/google-project-management',
        type: 'certification',
        free: true,
        estimatedHours: 160,
        skills: ['project management', 'agile', 'scrum', 'stakeholder management'],
        level: 'beginner'
    }
]

function matchSkillToResources(skill: string): LearningResource[] {
    const normalizedSkill = skill.toLowerCase().trim()
    
    return RESOURCE_CATALOG.filter(resource => 
        resource.skills.some(s => 
            s.includes(normalizedSkill) || 
            normalizedSkill.includes(s) ||
            levenshteinDistance(s, normalizedSkill) <= 2
        )
    )
}

function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []
    
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i]
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j
    }
    
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                )
            }
        }
    }
    
    return matrix[b.length][a.length]
}

export const handler: Handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return handleCORS()
    }

    if (event.httpMethod !== 'POST') {
        return createResponse(405, { error: 'Method not allowed' })
    }

    const authHeader = event.headers.authorization || event.headers.Authorization
    const { userId, error: authError } = await verifyToken(authHeader)
    if (authError || !userId) {
        return createResponse(401, { error: authError || 'Unauthorized' })
    }

    try {
        const body = JSON.parse(event.body || '{}')
        const { skillGaps, freeOnly = true, maxResults = 10 } = body

        if (!skillGaps || !Array.isArray(skillGaps) || skillGaps.length === 0) {
            return createResponse(400, { error: 'Missing or empty skillGaps array' })
        }

        // Find resources for each skill gap
        const recommendations: Array<{
            skill: string
            importance?: string
            resources: LearningResource[]
        }> = []

        const seenResourceIds = new Set<string>()

        for (const gap of skillGaps) {
            const skill = typeof gap === 'string' ? gap : gap.skill
            const importance = typeof gap === 'object' ? gap.importance : undefined
            
            let matches = matchSkillToResources(skill)
            
            // Filter by free if requested
            if (freeOnly) {
                matches = matches.filter(r => r.free)
            }
            
            // Prioritize by level matching importance
            if (importance === 'critical') {
                matches.sort((a, b) => {
                    const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 }
                    return levelOrder[a.level] - levelOrder[b.level]
                })
            }
            
            // Dedupe across skills
            const uniqueMatches = matches.filter(r => {
                if (seenResourceIds.has(r.id)) return false
                seenResourceIds.add(r.id)
                return true
            })

            recommendations.push({
                skill,
                importance,
                resources: uniqueMatches.slice(0, 3) // Top 3 per skill
            })
        }

        // Flatten for summary
        const allResources = recommendations.flatMap(r => r.resources)
        const totalHours = allResources.reduce((sum, r) => sum + r.estimatedHours, 0)

        return createResponse(200, {
            ok: true,
            data: {
                recommendations,
                summary: {
                    totalResources: allResources.length,
                    totalEstimatedHours: totalHours,
                    freeResources: allResources.filter(r => r.free).length,
                    byProvider: {
                        coursera: allResources.filter(r => r.provider === 'Coursera').length,
                        edx: allResources.filter(r => r.provider === 'edX').length,
                        youtube: allResources.filter(r => r.provider === 'YouTube').length,
                        linkedin: allResources.filter(r => r.provider === 'LinkedIn Learning').length
                    }
                }
            }
        })

    } catch (err: any) {
        console.error('[Learning] Handler error:', err)
        return createResponse(500, { error: 'Internal server error', details: err.message })
    }
}
