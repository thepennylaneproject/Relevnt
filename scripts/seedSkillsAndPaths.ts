import { createClient } from '@supabase/supabase-js'

const serviceUrl = process.env.SUPABASE_SERVICE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceUrl || !serviceKey) {
  throw new Error('Missing SUPABASE_SERVICE_URL/KEY env vars')
}

const supabase = createClient(serviceUrl, serviceKey)

const skills = [
  { slug: 'seo', display_name: 'SEO', category: 'marketing' },
  { slug: 'sql', display_name: 'SQL', category: 'data' },
  { slug: 'hubspot_automation', display_name: 'HubSpot automation', category: 'marketing ops' },
  { slug: 'ga4', display_name: 'Google Analytics 4', category: 'analytics' },
  { slug: 'llm_copy', display_name: 'AI-assisted copywriting', category: 'ai' },
]

const learningPaths = [
  {
    title: 'SQL foundations for marketers',
    short_description: 'Query basics to slice campaign data without waiting on data teams.',
    estimated_minutes: 45,
    skill_slug: 'sql',
    difficulty: 'starter',
  },
  {
    title: 'GA4 basics for content & growth',
    short_description: 'Instrument GA4 and read engagement signals that matter for SEO.',
    estimated_minutes: 60,
    skill_slug: 'ga4',
    difficulty: 'starter',
  },
  {
    title: 'AI-assisted copy for job applications',
    short_description: 'Use AI to draft bullet points and answers that still sound like you.',
    estimated_minutes: 30,
    skill_slug: 'llm_copy',
    difficulty: 'starter',
  },
]

const learningPathSteps = [
  {
    title: 'Intro to SELECT and WHERE',
    step_order: 1,
    estimated_minutes: 15,
    path_title: 'SQL foundations for marketers',
  },
  {
    title: 'JOIN campaign + spend data',
    step_order: 2,
    estimated_minutes: 15,
    path_title: 'SQL foundations for marketers',
  },
  {
    title: 'Group by channel and attribute lift',
    step_order: 3,
    estimated_minutes: 15,
    path_title: 'SQL foundations for marketers',
  },
  {
    title: 'Install GA4 on a sample site',
    step_order: 1,
    estimated_minutes: 20,
    path_title: 'GA4 basics for content & growth',
  },
  {
    title: 'Set up key events and conversions',
    step_order: 2,
    estimated_minutes: 20,
    path_title: 'GA4 basics for content & growth',
  },
  {
    title: 'Read engagement and drop-off reports',
    step_order: 3,
    estimated_minutes: 20,
    path_title: 'GA4 basics for content & growth',
  },
  {
    title: 'Collect your own voice sample',
    step_order: 1,
    estimated_minutes: 10,
    path_title: 'AI-assisted copy for job applications',
  },
  {
    title: 'Draft bullets with a guardrail prompt',
    step_order: 2,
    estimated_minutes: 10,
    path_title: 'AI-assisted copy for job applications',
  },
  {
    title: 'Refine tone and structure',
    step_order: 3,
    estimated_minutes: 10,
    path_title: 'AI-assisted copy for job applications',
  },
]

export async function run() {
  console.log('Seeding skills...')
  const { error: skillErr } = await supabase.from('skills_library').upsert(skills)
  if (skillErr) throw skillErr

  console.log('Seeding learning paths...')
  const { data: insertedPaths, error: pathErr } = await supabase
    .from('learning_paths')
    .upsert(learningPaths)
    .select('id, title')
  if (pathErr) throw pathErr

  const pathMap: Record<string, string> = {}
  insertedPaths?.forEach((p) => {
    pathMap[p.title] = p.id
  })

  console.log('Seeding learning path steps...')
  const stepsPayload = learningPathSteps
    .map((step) => {
      const pathId = pathMap[step.path_title]
      if (!pathId) return null
      return {
        learning_path_id: pathId,
        title: step.title,
        step_order: step.step_order,
        estimated_minutes: step.estimated_minutes,
      }
    })
    .filter(Boolean)

  const { error: stepsErr } = await supabase.from('learning_path_steps').upsert(stepsPayload as any)
  if (stepsErr) throw stepsErr
}

if (require.main === module) {
  run()
    .then(() => {
      console.log('Seed completed.')
      process.exit(0)
    })
    .catch((err) => {
      console.error('Seed failed', err)
      process.exit(1)
    })
}
