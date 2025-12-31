import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, IconName } from '../ui/Icon'
import { Button } from '../ui/Button'

interface PrimaryActionCardProps {
  /** The icon to display (journey stage) */
  icon: IconName
  /** Icon size (default: lg) */
  iconSize?: 'md' | 'lg' | 'xl'
  /** The primary action heading (e.g., "Your next move:") */
  heading: string
  /** The action title/task (e.g., "Apply to 2–3 roles today") */
  title: string
  /** Why this action matters + context */
  description: string
  /** CTA button text */
  cta: string
  /** Link target for CTA button */
  ctaLink: string
  /** Optional: make button large/prominent (default: true) */
  ctaLarge?: boolean
  /** Optional CSS classes */
  className?: string
}

/**
 * PrimaryActionCard — The focal point of the dashboard
 *
 * Shows the single most important action the user should take,
 * with full context and clear reasoning. Visually dominant with:
 * - Large icon (journey-themed)
 * - Clear heading hierarchy
 * - Contextual description explaining why
 * - Large, prominent CTA button
 *
 * Example:
 * ```jsx
 * <PrimaryActionCard
 *   icon="compass"
 *   heading="Your next move:"
 *   title="Apply to 2–3 roles today"
 *   description="You've applied to 3 roles. The average time to first interview is 7 days. Keep the momentum."
 *   cta="Find roles"
 *   ctaLink="/jobs"
 * />
 * ```
 */
export function PrimaryActionCard({
  icon,
  iconSize = 'lg',
  heading,
  title,
  description,
  cta,
  ctaLink,
  ctaLarge = true,
  className,
}: PrimaryActionCardProps) {
  const navigate = useNavigate()
  return (
    <div className={`primary-action-card ${className || ''}`}>
      <div className="primary-action-card__icon">
        <Icon name={icon} size={iconSize} />
      </div>

      <div className="primary-action-card__content">
        <div className="primary-action-card__heading">{heading}</div>
        <h2 className="primary-action-card__title">{title}</h2>
        <p className="primary-action-card__description">{description}</p>
      </div>

      <div className="primary-action-card__footer">
        <Button
          type="button"
          variant="primary"
          size={ctaLarge ? 'lg' : 'md'}
          onClick={() => navigate(ctaLink)}
        >
          {cta}
          <Icon name="chevron-right" size="sm" />
        </Button>
      </div>
    </div>
  )
}
