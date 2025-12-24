import React, { ReactNode } from 'react'
import '@/styles/textures.css'

export type TextureType = 'paper-grain' | 'canvas-weave' | 'watercolor' | 'ink-speckle' | 'hero' | 'card' | 'button' | 'accent'
export type TextureOpacity = 'subtle' | 'prominent' | 'faint'

interface TexturedBgProps {
  texture?: TextureType
  opacity?: TextureOpacity
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

/**
 * Wrapper component to apply texture overlays to any section
 * Provides visual richness without color complexity
 *
 * Usage:
 *   <TexturedBg texture="watercolor">
 *     <h1>Welcome</h1>
 *   </TexturedBg>
 *
 *   <TexturedBg texture="paper-grain" opacity="subtle">
 *     <Card>...</Card>
 *   </TexturedBg>
 */
export function TexturedBg({
  texture = 'paper-grain',
  opacity = 'prominent',
  children,
  className = '',
  style,
}: TexturedBgProps) {
  const textureClass = `textured-bg--${texture}`
  const opacityClass = `textured-bg--${opacity}`

  return (
    <div
      className={`textured-bg ${textureClass} ${opacityClass} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

/**
 * Convenience hook for accessing texture classes without wrapper
 * Useful when you need to apply texture to an existing element
 */
export function useTextureClass(texture: TextureType = 'paper-grain', opacity: TextureOpacity = 'prominent'): string {
  return `textured-bg textured-bg--${texture} textured-bg--${opacity}`
}

/**
 * Hero Section with watercolor texture
 * Pre-configured for maximum impact
 */
export function TexturedHero({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <TexturedBg
      texture="hero"
      opacity="prominent"
      className={`py-12 px-6 md:py-16 md:px-8 ${className}`}
    >
      {children}
    </TexturedBg>
  )
}

/**
 * Card wrapper with subtle paper grain
 * Ideal for content cards, boxes, containers
 */
export function TexturedCard({
  children,
  opacity = 'subtle',
  className = '',
}: {
  children: ReactNode
  opacity?: TextureOpacity
  className?: string
}) {
  return (
    <TexturedBg
      texture="card"
      opacity={opacity}
      className={`p-4 md:p-6 rounded-lg border border-border ${className}`}
    >
      {children}
    </TexturedBg>
  )
}

/**
 * Accent section with ink speckle
 * Used for calls to action, highlights, important info
 */
export function TexturedAccent({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <TexturedBg
      texture="accent"
      opacity="faint"
      className={`p-4 md:p-6 bg-emerald/5 rounded-lg ${className}`}
    >
      {children}
    </TexturedBg>
  )
}
