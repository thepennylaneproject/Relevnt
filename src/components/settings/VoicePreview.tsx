import React from 'react'

interface VoicePreviewProps {
    formality: number
    playfulness: number
    conciseness: number
}

/**
 * VoicePreview Component
 * 
 * Shows example sentences that demonstrate how voice settings affect tone.
 * Helps users calibrate their voice settings.
 */
export function VoicePreview({ formality, playfulness, conciseness }: VoicePreviewProps) {
    // Generate context-appropriate samples based on sliders
    const getSample = (): string => {
        // Determine tone descriptors
        const isFormal = formality > 60
        const isCasual = formality < 40
        const isPlayful = playfulness > 60
        const isSerious = playfulness < 40
        const isConcise = conciseness > 60
        const isDetailed = conciseness < 40

        // Build sample sentence based on combinations
        if (isFormal && isSerious && isConcise) {
            return "I led product development initiatives that increased revenue by 25%."
        } else if (isFormal && isSerious && isDetailed) {
            return "I led product development initiatives across three major projects, implementing data-driven strategies that increased revenue by 25% and improved customer retention through systematic feature prioritization."
        } else if (isFormal && isPlayful && isConcise) {
            return "I spearheaded exciting product work that helped boost revenue by 25%."
        } else if (isFormal && isPlayful && isDetailed) {
            return "I had the opportunity to spearhead some really exciting product development work, leading cross-functional teams to deliver innovative features that delighted users and helped boost revenue by 25% through thoughtful, data-driven decision-making."
        } else if (isCasual && isSerious && isConcise) {
            return "Led product development. Increased revenue 25%."
        } else if (isCasual && isSerious && isDetailed) {
            return "I led product development for three major projects, working closely with engineering and design teams to ship features that users loved. We increased revenue by 25% by focusing on what actually moved the needle."
        } else if (isCasual && isPlayful && isConcise) {
            return "Built some great products and grew revenue by 25%."
        } else if (isCasual && isPlayful && isDetailed) {
            return "I got to work on some really cool product initiatives, collaborating with amazing teammates to build features that users genuinely loved. We ended up growing revenue by about 25% by staying laser-focused on what mattered most to our customers."
        } else {
            // Balanced/middle range
            return "I led product development initiatives, working with cross-functional teams to deliver features that increased revenue by 25%."
        }
    }

    const getSecondSample = (): string => {
        const isFormal = formality > 60
        const isCasual = formality < 40
        const isPlayful = playfulness > 60
        const isConcise = conciseness > 60

        if (isFormal && isConcise) {
            return "Expertise in strategic planning and stakeholder management."
        } else if (isCasual && isConcise) {
            return "Experienced in planning and working with stakeholders."
        } else if (isPlayful) {
            return "I love diving into complex challenges and bringing people together to find creative solutions."
        } else {
            return "I have strong experience in strategic planning and stakeholder collaboration."
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.label}>Preview</span>
                <span style={styles.hint}>How your voice settings sound</span>
            </div>

            <div style={styles.samples}>
                <div style={styles.sample}>
                    <p style={styles.sampleText}>"{getSample()}"</p>
                </div>
                <div style={styles.sample}>
                    <p style={styles.sampleText}>"{getSecondSample()}"</p>
                </div>
            </div>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: '16px',
        backgroundColor: 'var(--color-bg-alt)',
        border: '1px solid var(--color-graphite-faint)',
        borderRadius: '8px',
        marginTop: '16px',
    },

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
    },

    label: {
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--color-accent)',
    },

    hint: {
        fontSize: '12px',
        color: 'var(--color-ink-tertiary)',
    },

    samples: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },

    sample: {
        padding: '12px',
        backgroundColor: 'var(--color-surface)',
        borderLeft: '3px solid var(--color-accent)',
        borderRadius: '4px',
    },

    sampleText: {
        margin: 0,
        fontSize: '14px',
        lineHeight: '1.6',
        color: 'var(--color-ink)',
        fontStyle: 'italic',
    },
}
