/**
 * CustomIcon - Unified icon component wrapper
 * Maps lucide-react icon names to custom SVG icons
 * Provides backward compatibility while supporting custom icons
 */

import React from 'react'
import {
  BriefcaseIcon,
  PaperAirplaneIcon,
  LighthouseIcon,
  MicrophoneIcon,
  CompassIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshIcon,
  TrendingUpIcon,
  ZapIcon,
  BookIcon,
  SettingsIcon,
  HeartIcon,
  type CustomIconProps,
  type CustomIconName,
  iconMap,
} from './CustomIcons'

/**
 * Map lucide-react icon names to custom icon names
 * This allows gradual migration from lucide-react to custom icons
 */
const lucideToCustomIconMap: Record<string, CustomIconName | undefined> = {
  // Application & Job
  briefcase: 'briefcase',
  'send': 'paper-airplane',

  // Admin & Navigation
  lighthouse: 'lighthouse',
  'compass': 'compass',

  // Communication
  microphone: 'microphone',

  // Status & Feedback
  'check-circle': 'check-circle',
  'alert-circle': 'alert-circle',
  'checkCircle': 'check-circle',
  'alertCircle': 'alert-circle',

  // Actions
  'refresh-cw': 'refresh',
  'rotate-cw': 'refresh',
  refresh: 'refresh',

  // Analytics
  'trending-up': 'trending-up',
  'trendingUp': 'trending-up',

  // Feature Icons
  zap: 'zap',
  'book-open': 'book',
  book: 'book',

  // Settings
  settings: 'settings',

  // Wellness
  heart: 'heart',

  // Activity - for which we don't have a direct match, we'll use compass
  activity: 'compass',

  // Play - for which we don't have a direct match, we'll use zap
  play: 'zap',

  // Clock - for which we don't have a direct match, we'll use compass
  clock: 'compass',
}

export interface CustomIconWrapperProps extends Omit<CustomIconProps, 'color'> {
  /** Icon name - supports both custom names and lucide-react names */
  name: CustomIconName | string
  /** Color variant - defaults to 'ink' */
  color?: 'ink' | 'emerald' | 'ivory' | 'gray'
  /** Alternative to color, can accept any CSS color */
  style?: React.CSSProperties
  /** Lucide-react icon prop name (for backward compatibility) */
  type?: string
}

/**
 * CustomIcon component
 * Provides a unified interface for using custom SVG icons throughout the app
 *
 * @example
 * <CustomIcon name="briefcase" size={24} color="emerald" />
 * <CustomIcon name="check-circle" />
 * <CustomIcon name="activity" className="some-class" />
 */
export const CustomIcon: React.FC<CustomIconWrapperProps> = ({
  name,
  size = 24,
  color = 'ink',
  className,
  title,
  style,
}) => {
  // Try to map lucide-react name to custom icon name
  const customName = lucideToCustomIconMap[name as string] || (name as CustomIconName)

  // Get the icon component from the map
  const IconComponent = iconMap[customName]

  if (!IconComponent) {
    // Fallback if icon not found - render a question mark or compass
    console.warn(`Icon "${name}" not found in custom icon library, using fallback`)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color === 'emerald' ? '#013E30' : color === 'ivory' ? '#f5f1e8' : color === 'gray' ? '#8a8a8a' : '#1a1a1a'}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2V4" />
        <path d="M12 20V22" />
        <path d="M2 12H4" />
        <path d="M20 12H22" />
        <path d="M12 5L15 13L13 15L5 12Z" />
      </svg>
    )
  }

  return (
    <IconComponent
      size={size}
      color={color}
      className={className}
      title={title}
    />
  )
}

export default CustomIcon
