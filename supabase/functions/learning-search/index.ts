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
  url?: string
  level?: string
  language?: string
  isFree?: boolean
  price?: string
  rating?: number
  ratingsCount?: number
  estimatedHours?: number
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

const providerMeta = {
  coursera: {
    slug: 'coursera',
    display_name: 'Coursera',
    website_url: 'https://www.coursera.org',
  },
}

async function courseraSearchCourses(
  skillSlug: string,
  skillName?: string,
  maxResults = 5
): Promise<ProviderCourse[]> {
  const apiKey = Deno.env.get('COURSERA_API_KEY')
  if (!apiKey) {
    console.warn('COURSERA_API_KEY not set; returning empty results')
    return []
  }

  const query = skillName || skillSlug
  // Placeholder endpoint; replace with real Coursera search API
  const url = `https://api.coursera.org/api/courses.v1?q=search&query=${encodeURIComponent(query)}`

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  if (!res.ok) {
    console.error('Coursera API error', await res.text())
    return []
  }

  // TODO: map Coursera response fields to ProviderCourse shape
  const data = await res.json()
  const elements: any[] = data?.elements || []

  return elements.slice(0, maxResults).map((item) => ({
    providerSlug: 'coursera',
    providerCourseId: String(item.id || item.slug || crypto.randomUUID()),
    title: item.name || item.title || 'Untitled course',
    description: item.description || '',
    url: item.link || item.url || null,
    level: item.level || null,
    language: item.language || null,
    isFree: item.isFree ?? null,
    price: item.price || null,
    rating: typeof item.rating === 'number' ? item.rating : null,
    ratingsCount: typeof item.ratingsCount === 'number' ? item.ratingsCount : null,
    estimatedHours: item.estimatedHours || null,
    skillSlugs: [skillSlug],
  }))
}

async function upsertProvider(slug: string) {
  const meta = providerMeta[slug as keyof typeof providerMeta]
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
  }))

  const { data: insertedCourses, error: courseErr } = await supabase
    .from('learning_courses')
    .upsert(coursePayload, { onConflict: 'provider_id,provider_course_id' })
    .select('id, provider_course_id, title, short_description, url, level, is_free, estimated_hours, rating')

  if (courseErr) throw courseErr

  const courseIdByProviderId: Record<string, string> = {}
  insertedCourses?.forEach((c) => {
    courseIdByProviderId[c.provider_course_id] = c.id
  })

  const skillLinks = courses
    .map((course) => {
      const courseId = courseIdByProviderId[course.providerCourseId]
      if (!courseId) return null
      return {
        course_id: courseId,
        skill_slug: skillSlug,
      }
    })
    .filter(Boolean)

  if (skillLinks.length > 0) {
    const { error: linkErr } = await supabase
      .from('learning_course_skills')
      .upsert(skillLinks as any, { onConflict: 'course_id,skill_slug' })
    if (linkErr) throw linkErr
  }

  return insertedCourses || []
}

async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let body: LearningSearchRequest | null = null
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  if (!body?.skillSlug) {
    return new Response(JSON.stringify({ error: 'skillSlug is required' }), { status: 400 })
  }

  const maxResults = body.maxResults && body.maxResults > 0 ? body.maxResults : 5

  // Validate user (optional here, but recommended)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    // Ensure provider exists
    const providerId = await upsertProvider('coursera')
    if (!providerId) throw new Error('Provider missing')

    // Fetch courses
    const courses = await courseraSearchCourses(body.skillSlug, body.skillName, maxResults)

    // Upsert courses and skill links
    const inserted = await upsertCoursesAndSkills(providerId, courses, body.skillSlug)

    const response: LearningSearchResponse = {
      skillSlug: body.skillSlug,
      courses: inserted.map((c) => ({
        id: c.id,
        providerSlug: 'coursera',
        title: c.title,
        shortDescription: c.short_description,
        url: c.url,
        level: c.level,
        isFree: c.is_free,
        estimatedHours: c.estimated_hours,
        rating: c.rating,
      })),
    }

    return new Response(JSON.stringify(response), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Failed to search learning providers' }), {
      status: 500,
    })
  }
}

serve(handler)
