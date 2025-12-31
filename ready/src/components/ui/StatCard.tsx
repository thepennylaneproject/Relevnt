import React from 'react'

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
  variant?: 'default' | 'ready' | 'warning' | 'primary'
  className?: string
}

/**
 * StatCard - Display key metrics with optional trend indicator
 * 
 * Used for readiness scores, practice counts, skill progress, etc.
 */
export function StatCard({
  label,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  variant = 'default',
  className = '',
}: StatCardProps) {
  const variantClasses = {
    default: 'stat-card--default',
    ready: 'stat-card--ready',
    warning: 'stat-card--warning',
    primary: 'stat-card--primary',
  }

  const trendColors = {
    up: 'var(--color-success)',
    down: 'var(--color-error)',
    neutral: 'var(--color-text-muted)',
  }

  return (
    <div className={`stat-card ${variantClasses[variant]} ${className}`}>
      {icon && <div className="stat-card__icon">{icon}</div>}
      <div className="stat-card__content">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__value">{value}</span>
        {subtitle && <span className="stat-card__subtitle">{subtitle}</span>}
        {trend && trendValue && (
          <span 
            className="stat-card__trend"
            style={{ color: trendColors[trend] }}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
    </div>
  )
}

export default StatCard
