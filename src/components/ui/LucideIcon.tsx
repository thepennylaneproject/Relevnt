import React from 'react'
import { LucideIcon as LucideIconType } from 'lucide-react'

interface LucideIconProps {
  icon: LucideIconType
  size?: number | string
  color?: 'ink' | 'emerald' | 'ivory' | 'gray'
  className?: string
}

const colorMap = {
  ink: '#1a1a1a',
  emerald: '#2d8f6f',
  ivory: '#f5f1e8',
  gray: '#8a8a8a',
}

/**
 * Wrapper for lucide-react icons with design system colors
 * Applies Ink/Ivory/Emerald color scheme consistently
 */
export function LucideIcon({
  icon: Icon,
  size = 24,
  color = 'ink',
  className = '',
}: LucideIconProps) {
  return (
    <Icon
      size={size}
      color={colorMap[color]}
      className={className}
      strokeWidth={1.5}
    />
  )
}
