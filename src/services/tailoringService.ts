// src/services/tailoringService.ts
// Service for generating AI-powered resume tailoring suggestions

import { supabase } from '../lib/supabase'
import type { TailoringContext, TailoringSuggestion } from '../types/tailoring'
import type { ResumeDraft } from '../types/resume-builder.types'

/**
 * Generate tailoring suggestions for a resume based on a specific job
 */
export async function generateTailoringSuggestions(
  resumeId: string,
  jobId: string
): Promise<TailoringContext> {
  try {
    // Fetch resume data
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single()

    if (resumeError || !resume) {
      throw new Error('Failed to fetch resume')
    }

    // Fetch job data
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      throw new Error('Failed to fetch job')
    }

    // Extract resume content and bullets
    const parsedFields = resume.parsed_fields as ResumeDraft | null
    const resumeBullets: Array<{ id: string; text: string }> = []
    let resumeText = ''

    if (parsedFields) {
      // Build resume text from parsed fields
      resumeText = [
        parsedFields.contact.fullName,
        parsedFields.summary.summary,
        parsedFields.skillGroups.map(g => g.skills.join(', ')).join(' '),
      ].join(' ')

      // Extract bullets from experience items
      parsedFields.experience.forEach((exp) => {
        // Assuming bullets is a string with line breaks or semicolons
        const bulletTexts = exp.bullets
          .split(/[\\n;]/)
          .map((b) => b.trim())
          .filter((b) => b.length > 0)

        bulletTexts.forEach((text, index) => {
          resumeBullets.push({
            id: `${exp.id}-${index}`,
            text,
          })
        })
      })
    }

    // Call AI function
    const response = await fetch('/.netlify/functions/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: 'tailor-resume-for-job',
        input: {
          resumeText,
          resumeBullets,
          jobTitle: job.title,
          jobDescription: job.description || '',
          company: job.company || 'Unknown Company',
        },
      }),
    })

    if (!response.ok) {
      throw new Error('AI service request failed')
    }

    const aiResult = await response.json()

    if (!aiResult.ok || !aiResult.output) {
      throw new Error(aiResult.error_message || 'AI analysis failed')
    }

    const data = aiResult.output.data || aiResult.output

    // Transform AI response into TailoringContext
    const suggestions: TailoringSuggestion[] = (data.suggestions || []).map(
      (s: any, index: number) => ({
        id: `suggestion-${index}`,
        bulletId: s.bulletId || '',
        currentText: s.currentText || '',
        suggestedText: s.suggestedText || '',
        reasoning: s.reasoning || '',
        relevantKeyword: s.relevantKeyword || '',
        confidence: s.confidence || 0.8,
      })
    )

    return {
      jobId: job.id,
      jobTitle: job.title,
      company: job.company || 'Unknown Company',
      keyRequirements: data.keyRequirements || [],
      missingKeywords: data.missingKeywords || [],
      suggestions,
    }
  } catch (error) {
    console.error('Error generating tailoring suggestions:', error)
    
    // Return empty context on error (graceful degradation)
    return {
      jobId,
      jobTitle: 'Unknown Job',
      company: 'Unknown Company',
      keyRequirements: [],
      missingKeywords: [],
      suggestions: [],
    }
  }
}
