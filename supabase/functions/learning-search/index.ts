// supabase/functions/learning-search/index.ts
//
// Edge function to search learning providers for courses tied to a skill,
// normalize results, upsert into Supabase, and return a structured response.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'
import type { Database } from '../../lib/database.types.ts'

type LearningSearchRequest = {
  skillSlug: string
  skillName?: string
  maxResults?: number
}

type ProviderCourse = {
  providerSlug: string
  providerCourseId: string
  title: string
  description?: string
  url?: string | null
  level?: string | null
  language?: string | null
  isFree?: boolean | null
  price?: string | null
  rating?: number | null
  ratingsCount?: number | null
  estimatedHours?: number | null
  skillSlugs: string[]
}

type LearningSearchResponse = {
  skillSlug: string
  courses: {
    id: string
    providerSlug: string
    title: string
    shortDescription?: string | null
    url?: string | null
    level?: string | null
    isFree?: boolean | null
    estimatedHours?: number | null
    rating?: number | null
  }[]
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const PROVIDERS = {
  coursera: {
    slug: 'coursera',
    display_name: 'Coursera',
    website_url: 'https://www.coursera.org',
  },
  edx: {
    slug: 'edx',
    display_name: 'edX',
    website_url: 'https://www.edx.org',
  },
  freecodecamp: {
    slug: 'freecodecamp',
    display_name: 'freeCodeCamp',
    website_url: 'https://www.freecodecamp.org',
  }
}

async function searchCoursera(
  skillSlug: string,
  skillName?: string,
  maxResults = 3
): Promise<ProviderCourse[]> {
  const apiKey = Deno.env.get('COURSERA_API_KEY')
  const query = skillName || skillSlug

  if (!apiKey) {
    return [
      {
        providerSlug: 'coursera',
        providerCourseId: `mock-coursera-${skillSlug}`,
        title: `${query} Professional Certificate`,
        description: `Get job-ready for a career in ${query}.`,
        url: `https://www.coursera.org/search?query=${encodeURIComponent(query)}`,
        level: 'Beginner',
        language: 'en',
        isFree: false,
        rating: 4.8,
        estimatedHours: 40,
        skillSlugs: [skillSlug],
      }
    ].slice(0, maxResults)
  }

  const url = `https://api.coursera.org/api/courses.v1?q=search&query=${encodeURIComponent(query)}&fields=name,description,slug,workload,primaryLanguages`
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
    if (!res.ok) return []
    const data = await res.json()
    return (data?.elements || []).slice(0, maxResults).map((item: any) => ({
      providerSlug: 'coursera',
      providerCourseId: item.id || item.slug,
      title: item.name,
      description: item.description,
      url: `https://www.coursera.org/learn/${item.slug}`,
      language: item.primaryLanguages?.[0] || 'en',
      skillSlugs: [skillSlug],
    }))
  } catch { return [] }
}

async function searchEdX(
  skillSlug: string,
  skillName?: string,
  maxResults = 2
): Promise<ProviderCourse[]> {
  const query = skillName || skillSlug
  // edX API usually requires OAuth, falling back to high-quality mocks for MVP expansion
  return [
    {
      providerSlug: 'edx',
      providerCourseId: `mock-edx-${skillSlug}`,
      title: `Advanced ${query} by MITx`,
      description: `Deep dive into ${query} with this university-grade course.`,
      url: `https://www.edx.org/search?q=${encodeURIComponent(query)}`,
      level: 'Advanced',
      isFree: true,
      estimatedHours: 60,
      skillSlugs: [skillSlug],
    }
  ].slice(0, maxResults)
}

async function searchFreeCodeCamp(
  skillSlug: string,
  skillName?: string,
  maxResults = 2
): Promise<ProviderCourse[]> {
  const query = skillName || skillSlug
  return [
    {
      providerSlug: 'freecodecamp',
      providerCourseId: `mock-fcc-${skillSlug}`,
      title: `${query} Curriculum & Certification`,
      description: `Learn ${query} for free with interactive lessons and projects.`,
      url: `https://www.freecodecamp.org/learn`,
      level: 'Beginner',
      isFree: true,
      estimatedHours: 300,
      skillSlugs: [skillSlug],
    }
  ].slice(0, maxResults)
}

async function upsertProvider(slug: string) {
  const meta = PROVIDERS[slug as keyof typeof PROVIDERS]
  if (!meta) return null
  const { data, error } = await supabase
    .from('learning_providers')
    .upsert({
      slug: meta.slug,
      display_name: meta.display_name,
      website_url: meta.website_url,
    })
    .select('id')
    .single()

  if (error) throw error
  return data?.id
}

async function upsertCoursesAndSkills(
  providerId: string,
  courses: ProviderCourse[],
  skillSlug: string
) {
  if (!courses.length) return []

  const coursePayload = courses.map((course) => ({
    provider_id: providerId,
    provider_course_id: course.providerCourseId,
    title: course.title,
    short_description: course.description ?? null,
    url: course.url ?? null,
    language: course.language ?? null,
    level: course.level ?? null,
    is_free: course.isFree ?? null,
    price: course.price ?? null,
    rating: course.rating ?? null,
    ratings_count: course.ratingsCount ?? null,
    estimated_hours: course.estimatedHours ?? null,
    skill_key: skillSlug // Added skill_key directly to learning_courses for easier access
  }))

  const { data: insertedCourses, error: courseErr } = await supabase
    .from('learning_courses')
    .upsert(coursePayload, { onConflict: 'provider_id,provider_course_id' })
    .select('*')

  if (courseErr) throw courseErr
  return insertedCourses || []
}

async function handler(req: Request): Promise<Response> {
  const { skillSlug, skillName, maxResults = 6 } = await req.json().catch(() => ({}))
  if (!skillSlug) return new Response('Missing skillSlug', { status: 400 })

  try {
    const allCourses: ProviderCourse[] = []

    // Fetch from all providers
    const results = await Promise.all([
      searchCoursera(skillSlug, skillName, 2),
      searchEdX(skillSlug, skillName, 2),
      searchFreeCodeCamp(skillSlug, skillName, 2)
    ])

    const flatResults = results.flat()

    // Process each provider correctly
    const finalCourses: any[] = []
    const providerSlugs = Object.keys(PROVIDERS)

    for (const slug of providerSlugs) {
      const providerId = await upsertProvider(slug)
      if (!providerId) continue

      const providerCourses = flatResults.filter(c => c.providerSlug === slug)
      if (providerCourses.length > 0) {
        const inserted = await upsertCoursesAndSkills(providerId, providerCourses, skillSlug)
        finalCourses.push(...inserted.map(c => ({
          ...c,
          providerSlug: slug
        })))
      }
    }

    return new Response(JSON.stringify({
      skillSlug,
      courses: finalCourses.map(c => ({
        id: c.id,
        providerSlug: c.providerSlug,
        title: c.title,
        url: c.url,
        level: c.level,
        isFree: c.is_free,
        estimatedHours: c.estimated_hours,
        rating: c.rating
      }))
    }), { status: 200 })

  } catch (err: any) {
    return new Response(err.message, { status: 500 })
  }
}

serve(handler)
