import React from 'react'

type IconProps = {
  size?: number
  strokeWidth?: number
  color?: string
}

const base = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const stroke = (color?: string) => color || '#C7A56A'
const sw = (strokeWidth?: number) => strokeWidth || 2

const Placeholder: React.FC<IconProps> = ({ size = 24, strokeWidth, color }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" {...base} stroke={stroke(color)} strokeWidth={sw(strokeWidth)}>
    <rect x="6" y="6" width="20" height="20" rx="4" />
    <path d="M10 16h12M16 10v12" />
  </svg>
)

export const DashboardIcon: React.FC<IconProps> = (p) => (
  <svg width={p.size || 24} height={p.size || 24} viewBox="0 0 32 32" {...base} stroke={stroke(p.color)} strokeWidth={sw(p.strokeWidth)}>
    <path d="M6 18h8v8H6zM18 6h8v8h-8zM6 6h8v8H6zM18 18h8v8h-8z" />
    <path d="M6 18l8 8M18 6l8 8" opacity="0.4" />
  </svg>
)

export const JobsIcon: React.FC<IconProps> = (p) => (
  <svg width={p.size || 24} height={p.size || 24} viewBox="0 0 32 32" {...base} stroke={stroke(p.color)} strokeWidth={sw(p.strokeWidth)}>
    <rect x="6" y="10" width="20" height="14" rx="4" />
    <path d="M12 10V8a4 4 0 0 1 8 0v2" />
    <path d="M6 16h20" />
  </svg>
)

export const ApplicationsIcon: React.FC<IconProps> = (p) => (
  <svg width={p.size || 24} height={p.size || 24} viewBox="0 0 32 32" {...base} stroke={stroke(p.color)} strokeWidth={sw(p.strokeWidth)}>
    <rect x="7" y="6" width="18" height="20" rx="3" />
    <path d="M11 10h10M11 14h6M11 18h4" />
    <path d="M17 22l2 2 5-5" />
  </svg>
)

export const ResumeIcon: React.FC<IconProps> = (p) => (
  <svg width={p.size || 24} height={p.size || 24} viewBox="0 0 32 32" {...base} stroke={stroke(p.color)} strokeWidth={sw(p.strokeWidth)}>
    <rect x="8" y="4" width="16" height="24" rx="3" />
    <path d="M12 10h8M12 14h8M12 18h6" />
  </svg>
)

export const CoursesIcon: React.FC<IconProps> = (p) => (
  <svg width={p.size || 24} height={p.size || 24} viewBox="0 0 32 32" {...base} stroke={stroke(p.color)} strokeWidth={sw(p.strokeWidth)}>
    <path d="M4 10l12-4 12 4-12 4z" />
    <path d="M8 12v8l8 3 8-3v-8" />
    <path d="M12 14l8 3" opacity="0.5" />
  </svg>
)

export const VoiceToneIcon: React.FC<IconProps> = (p) => (
  <svg width={p.size || 24} height={p.size || 24} viewBox="0 0 32 32" {...base} stroke={stroke(p.color)} strokeWidth={sw(p.strokeWidth)}>
    <path d="M12 8v8a4 4 0 1 0 8 0V8a4 4 0 1 0-8 0z" />
    <path d="M8 14v2a8 8 0 0 0 16 0v-2" />
    <path d="M16 24v3" />
  </svg>
)

export const SettingsIcon: React.FC<IconProps> = (p) => (
  <svg width={p.size || 24} height={p.size || 24} viewBox="0 0 32 32" {...base} stroke={stroke(p.color)} strokeWidth={sw(p.strokeWidth)}>
    <path d="M14 4h4l1 3 3 1v4l-3 1-1 3h-4l-1-3-3-1v-4l3-1z" />
    <circle cx="16" cy="16" r="4" />
  </svg>
)

export const ProfileIcon: React.FC<IconProps> = (p) => (
  <svg width={p.size || 24} height={p.size || 24} viewBox="0 0 32 32" {...base} stroke={stroke(p.color)} strokeWidth={sw(p.strokeWidth)}>
    <circle cx="16" cy="12" r="5" />
    <path d="M8 26c1-4 5-6 8-6s7 2 8 6" />
  </svg>
)

// Fallback export for any other icons requested
export const PlaceholderIcon = Placeholder
