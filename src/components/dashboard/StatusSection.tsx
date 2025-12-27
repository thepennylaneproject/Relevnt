import React from 'react'
import { StatusItem } from './StatusItem'
import { Icon, IconName } from '../ui/Icon'

interface StatusItemConfig {
  icon: IconName
  value: number | string
  label: string
  description?: string
  colorizeValue?: boolean
}

interface StatusSectionProps {
  /** Array of status items to display */
  items: StatusItemConfig[]
  /** Optional section title */
  title?: string
  /** Optional section heading icon */
  titleIcon?: IconName
  /** Optional additional CSS classes */
  className?: string
}

/**
 * StatusSection — Shows user's journey progress at a glance
 *
 * Displays key metrics about the user's job search in a calm, informational way.
 * Uses journey-themed icons (seeds → compass → candle → flower → stars)
 * to guide the eye through the progression.
 *
 * Example:
 * ```jsx
 * <StatusSection
 *   title="Where you are in your search"
 *   items={[
 *     { icon: 'seeds', value: 12, label: 'Discovered', description: 'roles explored' },
 *     { icon: 'compass', value: 5, label: 'Applied to', description: 'applications sent' },
 *     { icon: 'candle', value: 7, label: 'Avg days to response', description: 'benchmark' },
 *     { icon: 'flower', value: 1, label: 'In interviews', description: 'active' },
 *   ]}
 * />
 * ```
 */
export function StatusSection({
  items,
  title,
  titleIcon,
  className,
}: StatusSectionProps) {
  return (
    <section className={`status-section ${className || ''}`}>
      {title && (
        <div className="status-section__header">
          {titleIcon && (
            <div className="status-section__title-icon">
              <Icon name={titleIcon} size="md" />
            </div>
          )}
          <h2 className="status-section__title">{title}</h2>
        </div>
      )}
      <div className="status-section__grid">
        {items.map((item, idx) => (
          <StatusItem
            key={`${item.label}-${idx}`}
            icon={item.icon}
            value={item.value}
            label={item.label}
            description={item.description}
            colorizeValue={item.colorizeValue}
          />
        ))}
      </div>
    </section>
  )
}
