/**
 * Ready Icon Configuration
 * 
 * Maps Ready feature names to icon file names from the icon kit.
 * Use with the Icon component: <Icon name={READY_ICONS.dashboard} />
 */

export const READY_ICONS = {
  // Navigation
  dashboard: 'career-development',
  practice: 'interview-prep',
  learn: 'skill-gap',
  coaching: 'offer-negotiator',
  mirror: 'portfolio-curator',
  playback: 'predictive-trends',
  
  // Features
  linkedin: 'profile-filetext',
  portfolio: 'portfolio-curator',
  profile: 'profile-user',
  network: 'professional-network',
  outreach: 'contacts-messagecircle',
  interviews: 'interviews',
  
  // System
  ai: 'ai-tools-zap',
  settings: 'ai-tools-wrench',
  notifications: 'notifications',
  
  // Additional icons available
  contacts: 'contacts-users',
  trends: 'predictive-trends',
} as const;

export type ReadyIconName = keyof typeof READY_ICONS;
export type ReadyIconValue = typeof READY_ICONS[ReadyIconName];

/**
 * Get icon path for a Ready icon
 */
export function getIconPath(icon: ReadyIconName, variant: 'light' | 'dark' = 'light'): string {
  const iconName = READY_ICONS[icon];
  return `/icons/${variant}/${iconName}_${variant}.svg`;
}

/**
 * Navigation items with their associated icons
 */
export const NAV_ICONS = {
  Dashboard: READY_ICONS.dashboard,
  Practice: READY_ICONS.practice,
  Learn: READY_ICONS.learn,
  Coaching: READY_ICONS.coaching,
  Mirror: READY_ICONS.mirror,
  Playback: READY_ICONS.playback,
} as const;
