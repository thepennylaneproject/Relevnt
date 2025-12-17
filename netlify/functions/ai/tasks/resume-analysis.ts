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

    // Get resume text content for analysis
    const resumeText = (resume as any).parsed_text || (resume as any).content || ''

    if (!resumeText || resumeText.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Resume content is empty. Please add content to your resume before analyzing.',
        }),
      }
    }

    // Call Anthropic API for real ATS analysis
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicApiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY')
    }

    const atsPrompt = `Analyze this resume for ATS (Applicant Tracking System) compatibility and provide a detailed assessment.

RESUME CONTENT:
${resumeText}

Provide a JSON response with the following structure:
{
  "ats_score": <number 0-100>,
  "overall_assessment": "<Excellent|Good|Needs Improvement>",
  "strengths": ["<strength1>", "<strength2>", ...],
  "weaknesses": ["<weakness1>", "<weakness2>", ...],
  "suggestions": [
    {
      "category": "<Keywords|Formatting|Content|Structure>",
      "priority": "<high|medium|low>",
      "suggestion": "<specific suggestion>",
      "reason": "<why this matters>"
    }
  ],
  "keywords_found": ["<keyword1>", "<keyword2>", ...],
  "missing_keywords": ["<keyword1>", "<keyword2>", ...],
  "keyword_density": [{"keyword": "<keyword>", "percentage": <number>}],
  "formatting_issues": ["<issue1>", "<issue2>"],
  "content_recommendations": ["<recommendation1>", "<recommendation2>"]
}

Focus on:
1. ATS compatibility (proper formatting, no images, standard fonts)
2. Keyword optimization for job matching
3. Clarity and structure
4. Metrics and quantifiable achievements
5. Modern technology and skill mentions

Be specific and actionable in your suggestions.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: atsPrompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error:', response.status, errorText)
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const apiResponse = await response.json() as any

    let analysis: AnalysisData
    try {
      // Extract JSON from the response
      const responseText = apiResponse.content?.[0]?.text || ''
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from response')
      }
      analysis = JSON.parse(jsonMatch[0]) as AnalysisData
    } catch (parseErr) {
      console.error('Failed to parse AI response:', parseErr)
      // Return a basic analysis if parsing fails
      analysis = {
        ats_score: 60,
        overall_assessment: 'Needs Improvement',
        strengths: ['Resume structure is present'],
        weaknesses: ['Unable to complete full analysis'],
        suggestions: [
          {
            category: 'Content',
            priority: 'high',
            suggestion: 'Try again or contact support if issues persist',
            reason: 'Initial analysis encountered an issue',
          },
        ],
        keywords_found: [],
        missing_keywords: [],
        keyword_density: [],
        formatting_issues: [],
        content_recommendations: [],
      }
    }

    // Ensure score is in valid range
    if (typeof analysis.ats_score !== 'number' || analysis.ats_score < 0 || analysis.ats_score > 100) {
      analysis.ats_score = Math.max(0, Math.min(100, analysis.ats_score || 60))
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
        cost: 0.003,
        provider: 'anthropic',
      }),
    }
  } catch (error) {
    console.error('Resume analysis error:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to analyze resume',
      }),
    }
  }
}

export { handler }