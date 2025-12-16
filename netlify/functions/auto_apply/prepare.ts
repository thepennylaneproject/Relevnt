
import type { Handler } from '@netlify/functions'
import { createAdminClient } from '../utils/supabase'
import { runAI } from '../ai/run'
import type { AITaskName } from '../../src/lib/ai/types'

// Helper to stringify resume for AI context
function formatResumeForAI(resume: any, experiences: any[], education: any[], skills: any[]): string {
    let text = `Name: ${resume.full_name}\n`
    if (resume.professional_summary) text += `Summary: ${resume.professional_summary}\n`

    if (experiences.length > 0) {
        text += '\nExperience:\n'
        experiences.forEach((exp: any) => {
            text += `- ${exp.position} at ${exp.company} (${exp.start_date || ''} - ${exp.end_date || 'Present'})\n`
            if (exp.description) text += `  ${exp.description}\n`
        })
    }

    if (education.length > 0) {
        text += '\nEducation:\n'
        education.forEach((edu: any) => {
            text += `- ${edu.degree} in ${edu.field_of_study} from ${edu.institution} (${edu.graduation_date || ''})\n`
        })
    }

    if (skills.length > 0) {
        text += '\nSkills: ' + skills.map((s: any) => s.name).join(', ') + '\n'
    }

    return text
}

export const handler: Handler = async (event) => {
    // 1. Auth & Setup
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Make a POST request' }
    }

    const adminSecret = event.headers['x-admin-secret'] || event.headers['X-Admin-Secret']
    const isScheduled = event.headers['x-netlify-scheduler'] === 'true' // If using Netlify scheduled functions

    // Allow if admin secret is correct OR if it's an internal scheduled call (we might not check secret for scheduler if implicit, but let's stick to secret for now if possible, or just open for now as this is a background worker)
    // For now, we enforce admin secret for manual calls. 
    if (!isScheduled && adminSecret !== process.env.ADMIN_SECRET) {
        return { statusCode: 401, body: 'Unauthorized' }
    }

    const supabase = createAdminClient()
    const LIMIT = 5 // Process a small batch to avoid timeouts

    // 2. Fetch Queued Items
    const { data: queueItems, error: queueError } = await supabase
        .from('auto_apply_queue')
        .select(`
            *,
            jobs (*),
            user_personas (*)
        `)
        .eq('status', 'pending')
        .limit(LIMIT)

    if (queueError) {
        console.error('Failed to fetch queue:', queueError)
        return { statusCode: 500, body: JSON.stringify({ error: queueError }) }
    }

    if (!queueItems || queueItems.length === 0) {
        return { statusCode: 200, body: JSON.stringify({ message: 'No pending items' }) }
    }

    const results = []

    // 3. Process Loop
    for (const item of queueItems) {
        const jobId = item.job_id
        const userId = item.user_id
        const ruleId = item.rule_id
        const logId = item.id // Using queue ID as correlation or creating new logs? plan says update queue status + write logs.

        console.log(`Processing queue item ${item.id} for user ${userId} job ${jobId}`)

        try {
            // A. Fetch necessary data
            // Fetch User Profile for Tier
            const { data: profile } = await supabase.from('profiles').select('tier').eq('id', userId).single()
            const userTier = (profile?.tier as any) || 'free'

            // Fetch Resume
            // Use persona's resume_id, or fallback to something?
            // The item has user_personas associated.
            const persona = item.user_personas as any
            const resumeId = persona?.resume_id

            if (!resumeId) {
                throw new Error('No resume associated with persona')
            }

            const { data: resume, error: resumeError } = await supabase
                .from('resumes')
                .select(`*, experiences(*), education(*), skills(*)`)
                .eq('id', resumeId)
                .single()

            if (resumeError || !resume) {
                throw new Error('Failed to fetch resume data')
            }

            // Format Data
            const job = item.jobs as any
            const jobDescription = job.description || ''
            const jobTitle = job.title || 'the role'
            const companyName = job.company || 'the company'

            const resumeText = formatResumeForAI(resume, resume.experiences || [], resume.education || [], resume.skills || [])
            const personaContext = persona?.base_prompt || '' // Any persona specific instructions

            // B. Run AI Tasks
            const artifacts = []

            // Task 1: Keyword Extraction (from Job Description)
            // Goal: Find keywords to emphasize
            const keywordRes = await runAI({
                task: 'keyword_extraction',
                input: `Extract top 10 keywords/skills from this job description:\n${jobDescription}`,
                userId,
                tier: userTier
            })

            let keywords = ''
            if (keywordRes.ok && keywordRes.output) {
                // If structured, it might be JSON. If text, just text. 
                // keyword_extraction task spec says "requires_json: true". runAI normalizes to object.
                // Assuming output is { keywords: string[] } or similar, but let's handle whatever runAI gives.
                // Actually, runAI's legacy/standard tasks might typically return an object if defined as JSON.
                // Let's assume we get a string or object.
                keywords = typeof keywordRes.output === 'string' ? keywordRes.output : JSON.stringify(keywordRes.output)

                artifacts.push({
                    job_id: jobId,
                    user_id: userId,
                    persona_id: persona.id,
                    artifact_type: 'keywords',
                    content: keywords,
                    format: 'json',
                    ai_trace_id: keywordRes.trace_id
                })
            }

            // Task 2: Resume Bullet Rewrite OR Targeted Highlights
            // Let's generate "targeted_highlights" for now to use in cover letter or resume customization
            const bulletRes = await runAI({
                task: 'resume_bullet_rewrite', // Re-using this task or creating a "match_explanation"? 
                // Let's use 'job_match_explanation' might be better for "why I fit", or just ask bullet rewriter to summarize fit.
                // Plan says: "resume_bullet_rewrite for selected bullets OR generate 'targeted highlights'"
                // Let's ask to rewrite the summary/highlights specifically.
                input: JSON.stringify({
                    resume_text: resumeText,
                    job_description: jobDescription,
                    instruction: "Identify 3-5 key achievements from the resume that best match this job description."
                }),
                userId,
                tier: userTier
            })

            let highlights = ''
            if (bulletRes.ok && bulletRes.output) {
                highlights = typeof bulletRes.output === 'string' ? bulletRes.output : JSON.stringify(bulletRes.output)
                artifacts.push({
                    job_id: jobId,
                    user_id: userId,
                    persona_id: persona.id,
                    artifact_type: 'targeted_highlights',
                    content: highlights,
                    format: 'text',
                    ai_trace_id: bulletRes.trace_id
                })
            }

            // Task 3: Cover Letter Generation
            // Tier-gated logic is handled inside runAI via clamping, but we can also decide here if we skip it for free users?
            // "cover_letter_generate (tier-gated: high for premium, standard for free/pro)" -> handled by runAI config.

            const coverLetterInput = `
                Job Title: ${jobTitle}
                Company: ${companyName}
                Job Description: ${jobDescription}
                
                Candidate Resume: ${resumeText}
                
                Candidate Persona/Voice: ${personaContext}
                
                Key Highlights to include: ${highlights}
                
                Instructions: Write a professional cover letter.
            `

            const clRes = await runAI({
                task: 'cover_letter_generate',
                input: coverLetterInput,
                userId,
                tier: userTier
            })

            let coverLetterContent = ''
            let status = 'requires_review' // Default to review needed unless confident

            if (clRes.ok && clRes.output) {
                coverLetterContent = typeof clRes.output === 'string' ? clRes.output : JSON.stringify(clRes.output)

                // Heuristic Checks
                const validLength = coverLetterContent.length > 200 && coverLetterContent.length < 5000
                const hasCompany = coverLetterContent.toLowerCase().includes(companyName.toLowerCase())
                const notHallucinated = !coverLetterContent.includes('[') // Check for placeholders like [Your Name]

                if (validLength && hasCompany && notHallucinated) {
                    status = 'ready_to_submit'
                }

                artifacts.push({
                    job_id: jobId,
                    user_id: userId,
                    persona_id: persona.id,
                    artifact_type: 'cover_letter',
                    content: coverLetterContent,
                    format: 'markdown',
                    ai_trace_id: clRes.trace_id
                })
            }

            // C. Store Artifacts
            if (artifacts.length > 0) {
                const { error: artError } = await supabase
                    .from('job_application_artifacts')
                    .insert(artifacts)

                if (artError) console.error('Error saving artifacts', artError)
            }

            // D. Update Status
            await supabase
                .from('auto_apply_queue')
                .update({
                    status: status,
                    processed_at: new Date().toISOString()
                })
                .eq('id', item.id)

            // E. Logs
            await supabase
                .from('auto_apply_logs')
                .insert({
                    id: crypto.randomUUID(), // Assuming auto-gen, but if not we generate. log table has id as string?
                    user_id: userId,
                    job_id: jobId,
                    rule_id: ruleId,
                    persona_id: persona.id,
                    status: status,
                    // artifacts: JSON.stringify(artifacts.map(a => a.artifact_type)), // Just summarily log types?
                    // auto_apply_logs schema says artifacts is Json | null.
                    artifacts: artifacts.map(a => ({ type: a.artifact_type, trace: a.ai_trace_id })),
                    created_at: new Date().toISOString()
                })

            results.push({ id: item.id, status: 'success', outcome: status })

        } catch (err: any) {
            console.error(`Error processing item ${item.id}:`, err)

            // Mark as requires_review or error
            await supabase
                .from('auto_apply_queue')
                .update({
                    status: 'requires_review', // Fail safe
                    metadata: { error: err.message },
                    processed_at: new Date().toISOString()
                })
                .eq('id', item.id)

            // Log error
            await supabase
                .from('auto_apply_logs')
                .insert({
                    user_id: userId,
                    job_id: jobId,
                    rule_id: ruleId,
                    persona_id: item.persona_id, // can use item.persona_id directly
                    status: 'failed',
                    error_message: err.message,
                    created_at: new Date().toISOString()
                })

            results.push({ id: item.id, status: 'error', error: err.message })
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ processed: results.length, results })
    }
}
