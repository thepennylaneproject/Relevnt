import React from 'react'
import { Icon } from '../ui/Icon'
import type { CompanySentimentTag } from '../../hooks/useCompanySentiment'

export interface CompanySentimentBadgeProps {
  tag: CompanySentimentTag
  size?: 'sm' | 'md'
  className?: string
}

/**
 * Badge component to display company responsiveness sentiment
 */
export function CompanySentimentBadge({ 
  tag, 
  size = 'sm',
  className = '' 
}: CompanySentimentBadgeProps) {
  const config = getTagConfig(tag)

  const sizeStyles = {
    sm: {
      fontSize: '11px',
      padding: '3px 8px',
      iconSize: 'xs' as const,
    },
    md: {
      fontSize: '13px',
      padding: '5px 12px',
      iconSize: 'sm' as const,
    },
  }

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: sizeStyles[size].padding,
    fontSize: sizeStyles[size].fontSize,
    fontWeight: 600,
    borderRadius: '6px',
    background: config.background,
    color: config.color,
    border: `1px solid ${config.borderColor}`,
    whiteSpace: 'nowrap',
  }

  return (
    <span className={`company-sentiment-badge ${className}`} style={style}>
      <Icon name={config.icon} size={sizeStyles[size].iconSize} hideAccent />
      <span>{config.label}</span>
    </span>
  )
}

/**
 * Get visual configuration for each sentiment tag
 */
function getTagConfig(tag: CompanySentimentTag) {
  switch (tag) {
    case 'fast':
      return {
        label: 'Fast Responder',
        icon: 'zap' as const,
        background: 'var(--color-success-bg)',
        color: 'var(--color-success)',
        borderColor: 'var(--color-success)',
      }
    case 'average':
      return {
        label: 'Average Response',
        icon: 'pocket-watch' as const,
        background: 'var(--color-info-bg)',
        color: 'var(--color-info)',
        borderColor: 'var(--color-info)',
      }
    case 'slow':
      return {
        label: 'Slow Responder',
        icon: 'alert-triangle' as const,
        background: 'var(--color-warning-bg)',
        color: 'var(--color-warning)',
        borderColor: 'var(--color-warning)',
      }
    case 'unresponsive':
      return {
        label: 'Unresponsive',
        icon: 'x' as const,
        background: 'var(--color-error-bg)',
        color: 'var(--color-ink-tertiary)',
        borderColor: 'var(--color-graphite-faint)',
      }
  }
}

export default CompanySentimentBadge
