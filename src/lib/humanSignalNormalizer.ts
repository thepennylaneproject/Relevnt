// src/lib/humanSignalNormalizer.ts
// Human Signal Normalization Engine for Relevnt
// Ensures AI-generated documents read as authentically human-authored

// ============================================================================
// TYPES
// ============================================================================

/**
 * Document types requiring normalization.
 * Maps to specific rule profiles for each writing surface.
 */
export type NormalizableDocType =
    | 'resume'
    | 'cover_letter'
    | 'application_answer'
    | 'networking_message'
    | 'linkedin_about'
    | 'career_narrative';

/**
 * Normalization intensity levels
 * - off: No normalization applied
 * - lite: Entropy + anti-formula + directness only (good for short messages)
 * - full: All rules including voice drift and micro-imprecision
 */
export type NormalizationMode = 'off' | 'lite' | 'full';

/**
 * Warning severity levels for quality checks
 */
export type WarningSeverity = 'info' | 'warn' | 'high';

/**
 * Quality check warning with structured code for tracing
 */
export interface HumanSignalWarning {
    code: string;
    message: string;
    severity: WarningSeverity;
    match?: string; // The offending text if applicable
}

// ============================================================================
// DETECTOR BAIT PHRASES
// ============================================================================

/**
 * Common AI-generated phrases that trigger suspicion.
 * High-precision list for deterministic checking.
 */
const DETECTOR_BAIT_PHRASES: readonly string[] = [
    // Enthusiasm theater
    'i am excited to apply',
    'i am thrilled to',
    'i look forward to',
    'i am eager to',
    'i am passionate about',
    'i would be honored to',
    // Corporate fluff
    'dynamic team',
    'fast-paced environment',
    'hit the ground running',
    'leverage my skills',
    'synergy',
    'think outside the box',
    'move the needle',
    'results-driven',
    'detail-oriented professional',
    // AI-specific tells
    'in conclusion',
    'in summary',
    'this demonstrates my',
    'my proven track record',
    'uniquely positioned',
    'unparalleled',
];

/**
 * Patterns suggesting over-optimized structure
 */
const STRUCTURAL_TELLS: readonly RegExp[] = [
    // Triple parallel bullets (same verb structure)
    /^(Led|Managed|Developed|Implemented|Created|Built|Designed|Spearheaded|Orchestrated|Drove)/gim,
    // Excessive metric stacking
    /\d+%.*\d+%.*\d+%/g,
    // Formulaic sentence patterns
    /^As a \w+ with \d+ years/i,
];

// ============================================================================
// CORE PROMPT BUILDERS
// ============================================================================

/**
 * Global writing principles that apply to all document types.
 * These form the foundation of human signal normalization.
 */
function buildGlobalPrinciples(): string {
    return `
1. ENTROPY OVER ELEGANCE
   - Vary sentence lengths deliberately (mix short punchy with longer contextual)
   - Uneven bullet density across sections is natural
   - Never use identical verb structures in consecutive bullets
   - Asymmetrical emphasis is more human than balance

2. INTENT ROTATION
   Rotate the purpose of sentences. Mix:
   - Declarative (what happened)
   - Contextual (why it happened)
   - Explanatory (how it worked)
   - Reflective (what changed or mattered)
   No section should be purely declarative.

3. DIRECTNESS
   - Answer questions directly, then add context
   - Avoid motivational clichés and enthusiasm theater
   - A slightly blunt but sincere statement beats a polished one
   - Some implications can stay unstated

4. ANTI-OPTIMIZATION
   Actively resist these AI tells:
   - Even keyword distribution
   - Repeated rephrasing of the same skill
   - Fully parallel bullet structures
   - Overly resolved conclusions
   - Stacking multiple metrics in one sentence
`.trim();
}

/**
 * Additional rules for full normalization mode.
 * Includes voice drift and micro-imprecision guidance.
 */
function buildAdvancedPrinciples(): string {
    return `
5. MICRO-IMPRECISION (when truthful)
   - Prefer ranges over exact numbers when data allows
   - Use time-relative language: "over time", "eventually", "by the end"
   - Precision should feel earned, not automatic

6. VOICE DRIFT
   Voice may subtly shift based on:
   - Recency of the experience (recent = clearer, older = leaner)
   - Emotional distance from the work
   - Confidence gained over time
   Perfect consistency across sections is unnatural.
`.trim();
}

/**
 * Document-specific rules for resumes
 */
function buildResumeRules(): string {
    return `
RESUME BULLETS
- Each role should mix: short factual bullets, medium explanatory bullets, and optionally one longer contextual bullet
- No two consecutive bullets may share sentence length, verb structure, or metric density
- Metrics are allowed but not mandatory; they should not appear in every bullet
- Avoid "achievement stacking" (listing win after win without context)

PROFESSIONAL SUMMARY
- Avoid polished summary paragraphs
- Prefer: fragmented statements, sparse bullets, or one grounded line
- The summary should feel like identity, not branding
`.trim();
}

/**
 * Document-specific rules for cover letters
 */
function buildCoverLetterRules(): string {
    return `
COVER LETTER STRUCTURE
Do NOT follow the classic formula. Instead:
- Open with context or motivation (not enthusiasm statements)
- Acknowledge friction or reality where relevant
- End with grounded intent, not "I look forward to..."

TONE
- Conversational, not casual
- Confident, not performative
- Honest about constraints, not defensive
- Short paragraphs and sentence fragments are acceptable
`.trim();
}

/**
 * Document-specific rules for application questions
 */
function buildApplicationAnswerRules(): string {
    return `
APPLICATION QUESTIONS
These are heavily scrutinized. Rules:
- Answer the question directly first
- Then add context or reflection
- Avoid future-fantasy language
- Responses should feel: written quickly, thoughtfully, without trying to impress
`.trim();
}

/**
 * Rules for networking messages (lite by default)
 */
function buildNetworkingRules(): string {
    return `
NETWORKING MESSAGES
- Sound human, respectful, and direct
- Avoid sounding needy, salesy, or like a template
- Keep it brief and easy to respond to
- No formulaic openings or closings
`.trim();
}

/**
 * Rules for LinkedIn About section
 */
function buildLinkedInAboutRules(): string {
    return `
LINKEDIN ABOUT SECTION
- Write narrative content, not a resume summary
- Allow informal tone and first-person voice
- Avoid: buzzwords, self-congratulation, mission statements
- Can include fragments, questions, or conversational asides
`.trim();
}

/**
 * Rules for career narratives
 */
function buildCareerNarrativeRules(): string {
    return `
CAREER NARRATIVES
- Avoid polished mini-essays (major AI detector bait)
- Prefer: fragmented statements, sparse structure
- Tell a real story with texture, not a highlight reel
- Imperfection and specificity signal authenticity
`.trim();
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Get default normalization mode for a document type.
 * Networking defaults to lite; most others to full.
 */
export function getDefaultMode(docType: NormalizableDocType): NormalizationMode {
    switch (docType) {
        case 'networking_message':
            return 'lite';
        default:
            return 'full';
    }
}

/**
 * Map a VoiceTaskType to NormalizableDocType.
 * Returns null with a warning for unknown types.
 */
export function mapTaskToDocType(
    taskType: string | undefined
): { docType: NormalizableDocType | null; warning?: string } {
    switch (taskType) {
        case 'resume_bullets':
        case 'resume_summary':
            return { docType: 'resume' };
        case 'cover_letter':
            return { docType: 'cover_letter' };
        case 'application_answer':
            return { docType: 'application_answer' };
        case 'networking_message':
            return { docType: 'networking_message' };
        case 'portfolio_section':
            return { docType: 'linkedin_about' }; // Similar rules apply
        case 'generic':
            // Safe fallback with warning
            return {
                docType: 'application_answer',
                warning: `Unknown taskType "${taskType}" mapped to application_answer fallback`,
            };
        default:
            if (taskType) {
                return {
                    docType: 'application_answer',
                    warning: `Unknown taskType "${taskType}" mapped to application_answer fallback`,
                };
            }
            return { docType: null };
    }
}

/**
 * Build the human signal normalization prompt block.
 * 
 * @param docType - The type of document being generated
 * @param mode - Normalization intensity (defaults based on docType)
 * @returns Prompt text to inject into system message
 */
export function buildHumanSignalPrompt(
    docType: NormalizableDocType,
    mode?: NormalizationMode
): string {
    const effectiveMode = mode ?? getDefaultMode(docType);

    if (effectiveMode === 'off') {
        return '';
    }

    const sections: string[] = [];

    // Global principles (always included for lite and full)
    sections.push(buildGlobalPrinciples());

    // Advanced principles (full mode only)
    if (effectiveMode === 'full') {
        sections.push(buildAdvancedPrinciples());
    }

    // Document-specific rules
    switch (docType) {
        case 'resume':
            sections.push(buildResumeRules());
            break;
        case 'cover_letter':
            sections.push(buildCoverLetterRules());
            break;
        case 'application_answer':
            sections.push(buildApplicationAnswerRules());
            break;
        case 'networking_message':
            sections.push(buildNetworkingRules());
            break;
        case 'linkedin_about':
            sections.push(buildLinkedInAboutRules());
            break;
        case 'career_narrative':
            sections.push(buildCareerNarrativeRules());
            break;
    }

    // Soft label to avoid model overfitting on capitalized headers
    return `Writing constraints (important):\n\n${sections.join('\n\n')}`;
}

// ============================================================================
// QUALITY CHECKING
// ============================================================================

/**
 * Check text for human signal violations.
 * Returns warnings with codes - never blocks generation.
 * 
 * @param text - The generated text to check
 * @param docType - Document type for context-specific checks
 * @returns Array of warnings (empty if clean)
 */
export function checkHumanSignal(
    text: string,
    docType: NormalizableDocType
): HumanSignalWarning[] {
    const warnings: HumanSignalWarning[] = [];
    const lowerText = text.toLowerCase();

    // Check detector bait phrases
    for (const phrase of DETECTOR_BAIT_PHRASES) {
        if (lowerText.includes(phrase)) {
            warnings.push({
                code: 'HS001_DETECTOR_BAIT',
                message: `Contains common AI-flagged phrase: "${phrase}"`,
                severity: 'high',
                match: phrase,
            });
        }
    }

    // Check structural tells
    const lines = text.split('\n').filter(l => l.trim());
    
    // Check for parallel bullet structures (3+ bullets starting with same verb)
    const bulletStarts = lines
        .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
        .map(l => l.replace(/^[-•]\s*/, '').split(' ')[0]?.toLowerCase());
    
    const verbCounts = new Map<string, number>();
    for (const verb of bulletStarts) {
        if (verb) {
            verbCounts.set(verb, (verbCounts.get(verb) || 0) + 1);
        }
    }
    
    for (const [verb, count] of verbCounts) {
        if (count >= 3) {
            warnings.push({
                code: 'HS002_PARALLEL_BULLETS',
                message: `${count} bullets start with "${verb}" - consider varying structure`,
                severity: 'warn',
                match: verb,
            });
        }
    }

    // Check for metric stacking
    const metricMatches = text.match(/\d+%/g);
    if (metricMatches && metricMatches.length >= 3) {
        // Check if they're in the same sentence
        const sentences = text.split(/[.!?]+/);
        for (const sentence of sentences) {
            const sentenceMetrics = sentence.match(/\d+%/g);
            if (sentenceMetrics && sentenceMetrics.length >= 3) {
                warnings.push({
                    code: 'HS003_METRIC_STACKING',
                    message: 'Multiple metrics in single sentence may seem over-optimized',
                    severity: 'info',
                    match: sentence.trim().substring(0, 50) + '...',
                });
            }
        }
    }

    // Check for uniform sentence lengths (cover letters and narratives)
    if (docType === 'cover_letter' || docType === 'career_narrative') {
        const sentenceLengths = text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map(s => s.split(/\s+/).length);
        
        if (sentenceLengths.length >= 4) {
            const avg = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
            const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / sentenceLengths.length;
            const stdDev = Math.sqrt(variance);
            
            // Low variance in sentence length suggests AI uniformity
            if (stdDev < 3) {
                warnings.push({
                    code: 'HS004_UNIFORM_LENGTH',
                    message: 'Sentence lengths are very uniform - consider more variation',
                    severity: 'info',
                });
            }
        }
    }

    // Check for formulaic closings
    if (docType === 'cover_letter' || docType === 'networking_message') {
        if (lowerText.includes('i look forward to hearing from you') ||
            lowerText.includes('thank you for your time and consideration') ||
            lowerText.includes('i would welcome the opportunity')) {
            warnings.push({
                code: 'HS005_FORMULAIC_CLOSING',
                message: 'Formulaic closing detected - consider a more grounded ending',
                severity: 'warn',
            });
        }
    }

    return warnings;
}

/**
 * Format warnings for logging/tracing
 */
export function formatWarnings(warnings: HumanSignalWarning[]): string {
    if (warnings.length === 0) return 'No human signal warnings';
    
    return warnings
        .map(w => `[${w.severity.toUpperCase()}] ${w.code}: ${w.message}`)
        .join('\n');
}
