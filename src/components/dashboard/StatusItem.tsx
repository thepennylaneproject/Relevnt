import React from 'react'
import { Icon, IconName } from '../ui/Icon'

interface StatusItemProps {
  /** Journey stage icon: seeds, compass, candle, flower, stars */
  icon: IconName
  /** The main value/metric */
  value: number | string
  /** Label describing what this metric is */
  label: string
  /** Optional description of the value */
  description?: string
  /** Optional: make the value color conditional (success if > 0) */
  colorizeValue?: boolean
}

/**
 * StatusItem — A single metric in the user's job search status
 *
 * Part of the StatusSection, showing journey progress
 * with journey-themed icons (seeds, compass, candle, flower).
 *
 * Example:
 * ```jsx
 * <StatusItem
 *   icon="seeds"
 *   value={12}
 *   label="Discovered"
 *   description="roles explored"
 *   colorizeValue={true}
 * />
 * ```
 */
export function StatusItem({
  icon,
  value,
  label,
  description,
  colorizeValue = false,
}: StatusItemProps) {
  return (
    <div className="status-item">
      <div className="status-item__icon">
        <Icon name={icon} size="md" />
      </div>
      <div className="status-item__content">
        <div className="status-item__label">{label}</div>
        <div
          className={`status-item__value ${
            colorizeValue && Number(value) === 0 ? 'is-empty' : ''
          }`}
        >
          {value}
        </div>
        {description && (
          <div className="status-item__description">{description}</div>
        )}
      </div>
    </div>
  )
}
