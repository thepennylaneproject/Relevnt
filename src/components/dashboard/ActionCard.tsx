import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, IconName } from '../ui/Icon'
import { Button } from '../ui/Button'

interface ActionCardProps {
  /** The icon to display */
  icon: IconName
  /** Card title */
  title: string
  /** Card description */
  description: string
  /** CTA button text */
  cta: string
  /** Link target for CTA */
  ctaLink: string
  /** Optional: button variant (default: 'secondary') */
  ctaVariant?: 'primary' | 'secondary' | 'ghost'
  /** Optional CSS classes */
  className?: string
}

/**
 * ActionCard — A supporting/secondary action option
 *
 * Used for "while you wait" actions, skill-building, or
 * optional next steps. Smaller visual weight than PrimaryActionCard.
 *
 * Example:
 * ```jsx
 * <ActionCard
 *   icon="microphone"
 *   title="Practice Interviews"
 *   description="Stay sharp while waiting for responses"
 *   cta="Practice now"
 *   ctaLink="/interview-prep"
 * />
 * ```
 */
export function ActionCard({
  icon,
  title,
  description,
  cta,
  ctaLink,
  ctaVariant = 'secondary',
  className,
}: ActionCardProps) {
  const navigate = useNavigate()
  return (
    <div className={`action-card ${className || ''}`}>
      <div className="action-card__header">
        <div className="action-card__icon">
          <Icon name={icon} size="md" />
        </div>
      </div>

      <div className="action-card__content">
        <h3 className="action-card__title">{title}</h3>
        <p className="action-card__description">{description}</p>
      </div>

      <div className="action-card__footer">
        <Button
          type="button"
          variant={ctaVariant}
          size="sm"
          onClick={() => navigate(ctaLink)}
        >
          {cta}
        </Button>
      </div>
    </div>
  )
}
