// src/lib/voicePrompt.ts

// Unified voice / tone capsule for all AI tasks in Relevnt

export type VoicePreset =
    | 'natural'
    | 'professional_warm'
    | 'direct'
    | 'creative'
    | 'values_driven'
    | 'academic';

export type UserVoiceProfile = {
    voice_preset?: VoicePreset | null;
    voice_custom_sample?: string | null;
    voice_formality?: number | null;     // 0 - 100
    voice_playfulness?: number | null;   // 0 - 100
    voice_conciseness?: number | null;   // 0 - 100

    // Optional extra context, if you have it on the profile
    full_name?: string | null;
    headline?: string | null;            // e.g. "Senior Marketing Strategist"
};

export type VoiceTaskType =
    | 'resume_bullets'
    | 'resume_summary'
    | 'application_answer'
    | 'cover_letter'
    | 'networking_message'
    | 'portfolio_section'
    | 'generic';

export type VoicePromptOptions = {
    taskType?: VoiceTaskType;
    language?: string;           // default: English
};

/**
 * Build a unified system prompt that encodes:
 * - The user's preferred voice preset
 * - Their custom writing sample
 * - Sliders for formality, playfulness, conciseness
 * - Global honesty and authenticity constraints
 *
 * Use this as the `system` message for any LLM call that writes
 * resume content, answers, cover letters, outreach, etc.
 */
export function buildUserVoiceSystemPrompt(
    profile: UserVoiceProfile,
    options: VoicePromptOptions = {}
): string {
    const {
        voice_preset = 'natural',
        voice_custom_sample,
        voice_formality = 50,
        voice_playfulness = 40,
        voice_conciseness = 60,
        full_name,
        headline,
    } = profile;

    const { taskType = 'generic', language = 'English' } = options;

    const presetDescription = voice_preset ? describePreset(voice_preset) : describePreset('natural');
    const toneDescription = describeToneSliders({
        formality: clamp(voice_formality, 0, 100),
        playfulness: clamp(voice_playfulness, 0, 100),
        conciseness: clamp(voice_conciseness, 0, 100),
    });

    const sampleText = (voice_custom_sample || '').trim();

    const identityLine =
        full_name || headline
            ? `The user is ${full_name || 'this candidate'}${headline ? `, ${headline}` : ''}.`
            : 'The user is a job seeker using Relevnt to navigate job search systems.';

    const taskSpecificGuidance = describeTaskType(taskType);

    return [
        `You are Relevnt's writing engine. Your job is to help a job seeker express themselves in a way that is honest, accurate, and aligned with their authentic voice.`,
        identityLine,
        ``,
        `VOICE PRESET AND STYLE`,
        `- Base voice preset: ${voice_preset}`,
        `- Preset description: ${presetDescription}`,
        `- Tone sliders: ${toneDescription}`,
        sampleText
            ? [
                ``,
                `USER WRITING SAMPLE`,
                `Use the following sample as the primary reference for tone, rhythm, and phrasing when possible:`,
                `"${sanitizeSample(sampleText)}"`,
            ].join('\n')
            : '',
        ``,
        `GLOBAL CONSTRAINTS (CRITICAL)`,
        `- Do not invent or exaggerate experience, responsibilities, or results.`,
        `- Do not claim skills, tools, or certifications the user has not clearly provided.`,
        `- You may reorganize, clarify, or slightly elevate the writing, but it must still sound like a real human, not an overly polished corporate robot.`,
        `- Avoid generic buzzwords unless they are required by the job description.`,
        `- Respect the requested language: write in ${language}.`,
        ``,
        `TONE RULES`,
        `- Stay aligned with the base preset and sliders:`,
        `  - Formality: lower values mean more casual, higher values more formal.`,
        `  - Playfulness: lower values more serious, higher values more expressive and warm, but never flippant in professional contexts.`,
        `  - Conciseness: lower values allow more detail, higher values favor brevity.`,
        `- If you must choose, clarity and honesty are more important than style.`,
        ``,
        `TASK CONTEXT`,
        `${taskSpecificGuidance}`,
        ``,
        `ADAPTATION RULES`,
        `- When rewriting or generating content, preserve the user's perspective and story.`,
        `- Use first person "I" when the user is speaking about themselves, unless otherwise specified.`,
        `- Make sure the content fits the expected length and format for the task.`,
        `- For any job specific content, align with the job description but do not mirror it word for word. Paraphrase and integrate its language naturally.`,
    ]
        .filter(Boolean)
        .join('\n');
}

function describePreset(preset: VoicePreset): string {
    switch (preset) {
        case 'natural':
            return 'Balanced, human, and clear. Reads like the user on a good day: confident, straightforward, and approachable.';
        case 'professional_warm':
            return 'Polished and friendly. Professional but human, respectful without being stiff.';
        case 'direct':
            return 'Concise, efficient, and to the point. Minimal filler, strong clarity.';
        case 'creative':
            return 'More narrative and expressive, with occasional metaphor or imagery where appropriate.';
        case 'values_driven':
            return 'Emphasizes ethics, impact, mission alignment, and care for people and systems.';
        case 'academic':
            return 'Structured, analytical, and precise. Evidence aware, with clear logical flow.';
        default:
            return 'Balanced, human, and clear.';
    }
}

function describeToneSliders(sliders: {
    formality: number;
    playfulness: number;
    conciseness: number;
}): string {
    const { formality, playfulness, conciseness } = sliders;

    return [
        `formality: ${formality} of 100`,
        `playfulness: ${playfulness} of 100`,
        `conciseness: ${conciseness} of 100`,
    ].join(', ');
}

function describeTaskType(taskType: VoiceTaskType): string {
    switch (taskType) {
        case 'resume_bullets':
            return [
                'You are writing or refining resume bullet points.',
                'Use concise, impactful bullet sentences that start with strong verbs.',
                'Focus on concrete actions and outcomes. Favor clarity over flair.',
            ].join(' ');
        case 'resume_summary':
            return [
                'You are writing a short professional summary for a resume.',
                'Keep it in the third person or first person without pronouns depending on user preference, but stay consistent.',
                'Highlight 3 to 5 key themes: strengths, domains, and impact, without buzzword stuffing.',
            ].join(' ');
        case 'application_answer':
            return [
                'You are answering a short application question.',
                'Use first person "I".',
                'Stay focused, specific, and grounded in the user’s real experience.',
                'Do not exceed the likely character or word limits implied by the question.',
            ].join(' ');
        case 'cover_letter':
            return [
                'You are writing a cover letter only if it is explicitly requested.',
                'Use first person and keep a tight, focused structure: opening, relevance, proof, and close.',
                'The tone should match the preset and sliders while staying professional and respectful.',
            ].join(' ');
        case 'networking_message':
            return [
                'You are writing a short outreach or networking message.',
                'Sound human, respectful, and direct. Avoid sounding needy or salesy.',
                'Keep it brief and easy to respond to.',
            ].join(' ');
        case 'portfolio_section':
            return [
                'You are writing a short portfolio or case study section.',
                'Tell a clear story: context, actions, and outcomes.',
                'Maintain authenticity and avoid overselling or false hero narratives.',
            ].join(' ');
        case 'generic':
        default:
            return 'You are generating professional writing related to job search and career navigation. Keep it honest, grounded, and aligned with the user’s voice.';
    }
}

function clamp(value: number | null | undefined, min: number, max: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) return (min + max) / 2;
    return Math.min(max, Math.max(min, value));
}

function sanitizeSample(text: string): string {
    // Simple protection so the sample does not accidentally break formatting
    return text.replace(/[`]/g, '"');
}