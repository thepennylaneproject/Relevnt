// src/components/ResumeBuilder/BulletGenerator.tsx
// AI-powered bullet point generator for experience items

import React, { useState } from 'react'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import { useAITask } from '../../hooks/useAITask'

// ============================================================================
// TYPES
// ============================================================================

interface Props {
    jobTitle: string
    company: string
    existingBullets?: string
    onAddBullet: (bullet: string) => void
}

interface GeneratedBullet {
    id: string
    text: string
    strength: 'strong' | 'good' | 'needs-work'
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BulletGenerator: React.FC<Props> = ({
    jobTitle,
    company,
    existingBullets = '',
    onAddBullet,
}) => {
    const { execute, loading } = useAITask()
    const [suggestions, setSuggestions] = useState<GeneratedBullet[]>([])
    const [isOpen, setIsOpen] = useState(false)

    const handleGenerate = async () => {
        if (!jobTitle.trim()) return

        setIsOpen(true)

        try {
            const result = await execute('generate-bullets', {
                jobTitle,
                company,
                existingBullets,
                count: 3,
            })

            if (result?.success) {
                const bullets = (result as any).bullets ||
                    (result as any).data?.bullets ||
                    []

                const mapped: GeneratedBullet[] = bullets.map((b: any, idx: number) => ({
                    id: `bullet-${idx}-${Date.now()}`,
                    text: typeof b === 'string' ? b : b.text || b.bullet || '',
                    strength: b.strength || 'good',
                }))

                setSuggestions(mapped)
            }
        } catch (err) {
            console.error('Bullet generation failed:', err)
            // Fallback suggestions based on common patterns
            setSuggestions([
                {
                    id: 'fallback-1',
                    text: `Led cross-functional initiatives as ${jobTitle} at ${company}, driving measurable improvements in key metrics`,
                    strength: 'good',
                },
                {
                    id: 'fallback-2',
                    text: `Collaborated with stakeholders to deliver projects on time and within budget`,
                    strength: 'needs-work',
                },
            ])
        }
    }

    const handleAddBullet = (bullet: GeneratedBullet) => {
        onAddBullet(bullet.text)
        setSuggestions(prev => prev.filter(b => b.id !== bullet.id))
    }

    const getStrengthBadge = (strength: GeneratedBullet['strength']) => {
        switch (strength) {
            case 'strong':
                return <span className="bullet-strength bullet-strength--strong">Strong</span>
            case 'good':
                return <span className="bullet-strength bullet-strength--good">Good</span>
            default:
                return <span className="bullet-strength bullet-strength--needs-work">Template</span>
        }
    }

    return (
        <div className="bullet-generator">
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerate}
                disabled={loading || !jobTitle.trim()}
            >
                {loading ? (
                    <span className="ai-improve-spinner" />
                ) : (
                    <>
                        <Icon name="stars" size="sm" />
                        Generate Bullets
                    </>
                )}
            </Button>

            {isOpen && suggestions.length > 0 && (
                <div className="bullet-suggestions">
                    <div className="bullet-suggestions-header">
                        <span className="text-xs font-semibold">AI Suggestions</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setIsOpen(false)
                                setSuggestions([])
                            }}
                        >
                            ✕
                        </Button>
                    </div>
                    <div className="bullet-suggestions-list">
                        {suggestions.map((bullet) => (
                            <div key={bullet.id} className="bullet-suggestion-item">
                                <div className="bullet-suggestion-content">
                                    {getStrengthBadge(bullet.strength)}
                                    <p className="text-xs">{bullet.text}</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleAddBullet(bullet)}
                                >
                                    Add
                                </Button>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs muted" style={{ marginTop: 8 }}>
                        💡 Tip: Add numbers to make these bullets stronger
                    </p>
                </div>
            )}
        </div>
    )
}

export default BulletGenerator
