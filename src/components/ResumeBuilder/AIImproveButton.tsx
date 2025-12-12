// src/components/ResumeBuilder/AIImproveButton.tsx
// Inline AI improvement button for any text field

import React, { useState } from 'react'
import { Icon } from '../ui/Icon'
import { useAITask } from '../../hooks/useAITask'

// ============================================================================
// TYPES
// ============================================================================

type ImprovementContext =
    | 'summary'
    | 'headline'
    | 'bullet-point'
    | 'skill-group'
    | 'job-title'
    | 'company-description'

interface Props {
    text: string
    context: ImprovementContext
    onImprove: (improvedText: string) => void
    disabled?: boolean
    className?: string
}

// ============================================================================
// CONTEXT PROMPTS
// ============================================================================

const CONTEXT_HINTS: Record<ImprovementContext, string> = {
    'summary': 'professional resume summary that highlights key achievements and value proposition',
    'headline': 'concise professional headline that captures expertise and role',
    'bullet-point': 'achievement-focused resume bullet point using strong action verbs and quantified results',
    'skill-group': 'skill category label that is ATS-friendly and industry-standard',
    'job-title': 'professional job title that is industry-standard and ATS-optimized',
    'company-description': 'brief company context that adds credibility',
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AIImproveButton: React.FC<Props> = ({
    text,
    context,
    onImprove,
    disabled = false,
    className = '',
}) => {
    const { execute, loading } = useAITask()
    const [showPreview, setShowPreview] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)

    const handleImprove = async () => {
        if (!text.trim() || loading) return

        try {
            const result = await execute('rewrite-text', {
                text,
                context: `Improve this ${CONTEXT_HINTS[context]}. Keep it professional and concise.`,
            })

            if (result?.success) {
                const improved = (result as any).rewritten ||
                    (result as any).data?.rewritten ||
                    (result as any).text ||
                    null

                if (improved) {
                    setPreview(improved)
                    setShowPreview(true)
                }
            }
        } catch (err) {
            console.error('AI improvement failed:', err)
        }
    }

    const handleAccept = () => {
        if (preview) {
            onImprove(preview)
            setShowPreview(false)
            setPreview(null)
        }
    }

    const handleReject = () => {
        setShowPreview(false)
        setPreview(null)
    }

    if (!text.trim()) {
        return null
    }

    return (
        <div className={`ai-improve-container ${className}`}>
            <button
                type="button"
                onClick={handleImprove}
                disabled={disabled || loading}
                className="ai-improve-button"
                title="Improve with AI"
            >
                {loading ? (
                    <span className="ai-improve-spinner" />
                ) : (
                    <Icon name="stars" size="sm" />
                )}
            </button>

            {showPreview && preview && (
                <div className="ai-improve-preview">
                    <div className="ai-improve-preview-header">
                        <Icon name="stars" size="sm" />
                        <span className="text-xs font-semibold">AI Suggestion</span>
                    </div>
                    <p className="ai-improve-preview-text text-xs">{preview}</p>
                    <div className="ai-improve-preview-actions">
                        <button
                            type="button"
                            onClick={handleAccept}
                            className="primary-button button-xs"
                        >
                            Accept
                        </button>
                        <button
                            type="button"
                            onClick={handleReject}
                            className="ghost-button button-xs"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AIImproveButton
