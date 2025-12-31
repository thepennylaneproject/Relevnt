import React from 'react'

interface FeatureCardProps {
  title: string
  description: string
  icon?: React.ReactNode
  variant?: 'A' | 'B' | 'C'
  status?: 'ready' | 'in-progress' | 'not-started'
  onClick?: () => void
  className?: string
}

/**
 * FeatureCard - Highlight Ready's core features
 * 
 * Variants:
 * - A: Standard card with icon left
 * - B: Centered icon, stacked text
 * - C: Full-width with background accent
 */
export function FeatureCard({
  title,
  description,
  icon,
  variant = 'A',
  status,
  onClick,
  className = '',
}: FeatureCardProps) {
  const variantClass = `rdy-feature-card--variant-${variant.toLowerCase()}`
  const statusClass = status ? `rdy-feature-card--${status}` : ''

  return (
    <div
      className={`rdy-feature-card ${variantClass} ${statusClass} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {icon && <div className="rdy-feature-card__icon">{icon}</div>}
      <div className="rdy-feature-card__content">
        <h3 className="rdy-feature-card__title">{title}</h3>
        <p className="rdy-feature-card__description">{description}</p>
      </div>
      {status && (
        <span className="rdy-feature-card__status">
          {status === 'ready' && '✓ Ready'}
          {status === 'in-progress' && '⋯ In Progress'}
          {status === 'not-started' && '○ Not Started'}
        </span>
      )}
    </div>
  )
}

export default FeatureCard
