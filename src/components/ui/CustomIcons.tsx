/**
 * CUSTOM ICON DEFINITIONS
 * 12 Hand-drawn luxury icons for Relevnt
 *
 * Design System:
 * - Stroke width: 1.5-2px for premium feel
 * - Color: Ink (#1a1a1a), Emerald (#013E30)
 * - Size: 24x24 viewBox (scales to any size)
 * - Style: Slightly organic, hand-drawn quality without being sketchy
 */

export interface CustomIconProps {
  size?: number | string
  color?: 'ink' | 'emerald' | 'ivory' | 'gray'
  className?: string
  title?: string
}

// Color map matching design system
const colorMap: Record<string, string> = {
  ink: '#1a1a1a',
  emerald: '#013E30',
  ivory: '#f5f1e8',
  gray: '#8a8a8a',
}

/**
 * Briefcase icon - for job listings and applications
 * Hand-drawn luxury briefcase with subtle depth
 */
export const BriefcaseIcon = ({ size = 24, color = 'ink', className = '' }: CustomIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colorMap[color]}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 3H15C15.5304 3 16.0391 3.21071 16.4142 3.58579C16.7893 3.96086 17 4.46957 17 5V6H7V5C7 4.46957 7.21071 3.96086 7.58579 3.58579C7.96086 3.21071 8.46957 3 9 3Z" />
    <path d="M3 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V18C23 18.5304 22.7893 19.0391 22.4142 19.4142C22.0391 19.7893 21.5304 20 21 20H3C2.46957 20 1.96086 19.7893 1.58579 19.4142C1.21071 19.0391 1 18.5304 1 18V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6Z" />
    <path d="M9 10V14" stroke={colorMap[color]} strokeWidth="1.75" />
    <path d="M15 10V14" stroke={colorMap[color]} strokeWidth="1.75" />
  </svg>
)

/**
 * Paper Airplane icon - for applications and messaging
 * Elegant folded paper with dynamic motion
 */
export const PaperAirplaneIcon = ({ size = 24, color = 'ink', className = '' }: CustomIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colorMap[color]}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 2L2 8.5L13 12L2 15.5L22 22L22 2Z" />
    <path d="M2 8.5L13 12L2 15.5" stroke={colorMap[color]} strokeWidth="1.75" />
  </svg>
)

/**
 * Lighthouse icon - for admin and navigation
 * Classic lighthouse symbolizing guidance and oversight
 */
export const LighthouseIcon = ({ size = 24, color = 'ink', className = '' }: CustomIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colorMap[color]}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2V4" />
    <circle cx="12" cy="4" r="3" fill={colorMap[color]} opacity="0.6" />
    <path d="M10 8H14V14H10Z" />
    <path d="M8 14H16L14 20H10Z" />
    <path d="M12 20V22" />
    <path d="M7 10L4 13" stroke={colorMap[color]} strokeWidth="1.5" />
    <path d="M17 10L20 13" stroke={colorMap[color]} strokeWidth="1.5" />
  </svg>
)

/**
 * Microphone icon - for interviews and voice features
 * Elegant microphone for communication
 */
export const MicrophoneIcon = ({ size = 24, color = 'ink', className = '' }: CustomIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colorMap[color]}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 1C10.3431 1 9 2.34315 9 4V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V4C15 2.34315 13.6569 1 12 1Z" />
    <path d="M8 12C8 15.3137 9.97918 18.1614 12.7071 19.1421" />
    <path d="M16 12C16 15.3137 14.0208 18.1614 11.2929 19.1421" />
    <path d="M12 19V23" />
    <path d="M7 23H17" />
  </svg>
)

/**
 * Compass icon - for search and navigation
 * Classic compass rose symbolizing direction
 */
export const CompassIcon = ({ size = 24, color = 'ink', className = '' }: CustomIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colorMap[color]}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2V4" stroke={colorMap[color]} strokeWidth="1.75" />
    <path d="M12 20V22" stroke={colorMap[color]} strokeWidth="1.75" />
    <path d="M2 12H4" stroke={colorMap[color]} strokeWidth="1.75" />
    <path d="M20 12H22" stroke={colorMap[color]} strokeWidth="1.75" />
    <path d="M12 5L15 13L13 15L5 12Z" fill={colorMap[color]} opacity="0.7" />
  </svg>
)

/**
 * Check Circle icon - for success and completion
 * Elegant checkmark in circle
 */
export const CheckCircleIcon = ({ size = 24, color = 'ink', className = '' }: CustomIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colorMap[color]}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12L11 15L16 9" />
  </svg>
)

/**
 * Alert Circle icon - for warnings and alerts
 * Exclamation point in circle
 */
export const AlertCircleIcon = ({ size = 24, color = 'ink', className = '' }: CustomIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colorMap[color]}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8V13" />
    <circle cx="12" cy="17" r="0.5" fill={colorMap[color]} />
  </svg>
)

/**
 * Refresh icon - for sync and ingestion
 * Circular refresh arrows
 */
export const RefreshIcon = ({ size = 24, color = 'ink', className = '' }: CustomIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colorMap[color]}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 2V8H15" />
    <path d="M3 22V16H9" />
    <path d="M19.64 8.05C18.6 5.42 16.01 3.5 13 3.5C9.58 3.5 6.74 5.64 6.13 8.45" />
    <path d="M4.36 15.95C5.4 18.58 7.99 20.5 11 20.5C14.42 20.5 17.26 18.36 17.87 15.55" />
  </svg>
)

/**
 * Trending Up icon - for analytics and growth
 * Ascending line graph
 */
export const TrendingUpIcon = ({ size = 24, color = 'ink', className = '' }: CustomIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colorMap[color]}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
)

/**
 * Zap icon - for energy and features
 * Lightning bolt
 */
export const ZapIcon = ({ size = 24, color = 'ink', className = '' }: CustomIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colorMap[color]}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

/**
 * Book icon - for learning and knowledge
 * Open book
 */
export const BookIcon = ({ size = 24, color = 'ink', className = '' }: CustomIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colorMap[color]}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    <path d="M9 7H17" stroke={colorMap[color]} strokeWidth="1.5" />
    <path d="M9 11H17" stroke={colorMap[color]} strokeWidth="1.5" />
  </svg>
)

/**
 * Settings icon - for configuration
 * Gear/cog icon
 */
export const SettingsIcon = ({ size = 24, color = 'ink', className = '' }: CustomIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colorMap[color]}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1V3" stroke={colorMap[color]} strokeWidth="1.75" />
    <path d="M12 21V23" stroke={colorMap[color]} strokeWidth="1.75" />
    <path d="M4.22 4.22L5.64 5.64" stroke={colorMap[color]} strokeWidth="1.75" />
    <path d="M18.36 18.36L19.78 19.78" stroke={colorMap[color]} strokeWidth="1.75" />
    <path d="M1 12H3" stroke={colorMap[color]} strokeWidth="1.75" />
    <path d="M21 12H23" stroke={colorMap[color]} strokeWidth="1.75" />
    <path d="M4.22 19.78L5.64 18.36" stroke={colorMap[color]} strokeWidth="1.75" />
    <path d="M18.36 5.64L19.78 4.22" stroke={colorMap[color]} strokeWidth="1.75" />
  </svg>
)

/**
 * Heart icon - for wellness and care
 * Elegant heart shape
 */
export const HeartIcon = ({ size = 24, color = 'ink', className = '' }: CustomIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={colorMap[color]}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
  </svg>
)

export type CustomIconName =
  | 'briefcase'
  | 'paper-airplane'
  | 'lighthouse'
  | 'microphone'
  | 'compass'
  | 'check-circle'
  | 'alert-circle'
  | 'refresh'
  | 'trending-up'
  | 'zap'
  | 'book'
  | 'settings'
  | 'heart'

export const iconMap: Record<CustomIconName, React.FC<CustomIconProps>> = {
  briefcase: BriefcaseIcon,
  'paper-airplane': PaperAirplaneIcon,
  lighthouse: LighthouseIcon,
  microphone: MicrophoneIcon,
  compass: CompassIcon,
  'check-circle': CheckCircleIcon,
  'alert-circle': AlertCircleIcon,
  refresh: RefreshIcon,
  'trending-up': TrendingUpIcon,
  zap: ZapIcon,
  book: BookIcon,
  settings: SettingsIcon,
  heart: HeartIcon,
}
