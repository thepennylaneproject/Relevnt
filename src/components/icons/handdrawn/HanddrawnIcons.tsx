import React from 'react'

type IconProps = {
  size?: number
  strokeWidth?: number
  color?: string
}

const base = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const HandResumeIcon: React.FC<IconProps> = ({ size = 36, strokeWidth = 2, color = '#C7A56A' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" {...base} stroke={color} strokeWidth={strokeWidth}>
    <rect x="12" y="6" width="24" height="36" rx="4" />
    <path d="M18 14h12M18 20h12M18 26h8" />
    <path d="M22 34l-4 4" />
  </svg>
)

export const HandMatchIcon: React.FC<IconProps> = ({ size = 36, strokeWidth = 2, color = '#C7A56A' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" {...base} stroke={color} strokeWidth={strokeWidth}>
    <circle cx="18" cy="18" r="10" />
    <path d="M26 26l10 10" />
    <path d="M14 18l4 4 8-8" />
  </svg>
)

export const HandApplicationIcon: React.FC<IconProps> = ({ size = 36, strokeWidth = 2, color = '#C7A56A' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" {...base} stroke={color} strokeWidth={strokeWidth}>
    <rect x="10" y="10" width="28" height="28" rx="6" />
    <path d="M16 24h10M16 30h8" />
    <path d="M30 18v12l6-4z" />
  </svg>
)

export const HandSparkIcon: React.FC<IconProps> = ({ size = 32, strokeWidth = 2, color = '#C7A56A' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" {...base} stroke={color} strokeWidth={strokeWidth}>
    <path d="M24 6l3 10 9 3-9 3-3 10-3-10-9-3 9-3z" />
  </svg>
)
