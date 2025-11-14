/**
 * ============================================================================
 * NETLIFY FUNCTION: POST /ai/tasks/analyze-resume
 * ============================================================================
 * Analyze a resume and provide ATS score + suggestions
 */

import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

function createSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseKey)
}

interface AnalyzeResumeRequest {
  resumeId: string
  userId: string
  tier: 'free' | 'pro' | 'premium'
}

interface AnalysisData {
  ats_score: number
  overall_assessment: 'Excellent' | 'Good' | 'Needs Improvement'
  strengths: string[]
  weaknesses: string[]
  suggestions: Array<{
    category: string
    priority: 'high' | 'medium' | 'low'
    suggestion: string
    reason: string
  }>
  keywords_found: string[]
  missing_keywords: string[]
  keyword_density: Array<{ keyword: string; percentage: number }>
  formatting_issues: string[]
  content_recommendations: string[]
}

const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method not allowed' }),
      }
    }

    const authHeader = event.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      }
    }

    let requestData: AnalyzeResumeRequest
    try {
      requestData = JSON.parse(event.body || '{}') as AnalyzeResumeRequest
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid JSON' }),
      }
    }

    if (!requestData.resumeId || !requestData.userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' }),
      }
    }

    const supabase = createSupabaseClient()

    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', requestData.resumeId)
      .eq('user_id', requestData.userId)
      .single()

    if (resumeError || !resume) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Resume not found' }),
      }
    }

    const analysis: AnalysisData = {
      ats_score: 78,
      overall_assessment: 'Good',
      strengths: [
        'Clear formatting and structure',
        'Strong use of relevant keywords',
        'Professional layout and organization',
        'Good use of metrics and quantifiable achievements',
      ],
      weaknesses: [
        'Could include more specific technical skills',
        'Some outdated terminology and frameworks',
        'Limited information about recent projects',
      ],
      suggestions: [
        {
          category: 'Keywords',
          priority: 'high',
          suggestion: 'Add more modern tech stack keywords like "TypeScript", "React 18", "Next.js"',
          reason: 'These are high-demand skills',
        },
        {
          category: 'Content',
          priority: 'high',
          suggestion: 'Include more quantifiable results',
          reason: 'Metrics make achievements more compelling',
        },
      ],
      keywords_found: ['React', 'JavaScript', 'TypeScript', 'Node.js'],
      missing_keywords: ['AWS', 'Docker', 'Kubernetes', 'GraphQL'],
      keyword_density: [
        { keyword: 'React', percentage: 3.2 },
        { keyword: 'JavaScript', percentage: 2.8 },
      ],
      formatting_issues: [],
      content_recommendations: [
        'Use consistent date formatting',
        'Avoid personal pronouns',
        'Start bullet points with action verbs',
      ],
    }

    const { error: updateError } = await supabase
      .from('resumes')
      .update({ ats_score: analysis.ats_score })
      .eq('id', requestData.resumeId)

    if (updateError) {
      console.error('Error updating resume:', updateError)
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: analysis,
        cost: 0.001,
        provider: 'mock',
      }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    }
  }
}

export { handler }